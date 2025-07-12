// --- 1. IMPORTE ---
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');
// KORRIGIERT: Importiert die Klasse 'BiblioDatabase' aus Ihrer finalen database.js
const BiblioDatabase = require('./database.js');

// --- 2. INITIALISIERUNG ---
const app = express();
const server = http.createServer(app);
// KORRIGIERT: Verwendet den korrekten Klassennamen 'BiblioDatabase'
const db = new BiblioDatabase();
const PORT = 3000;

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === MULTER KONFIGURATION (Ihre vollständige Konfiguration) ===
const excelUpload = multer({ storage: multer.memoryStorage() });
const studentPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/uploads/student_photos';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const studentId = req.params.id;
    const fileExt = path.extname(file.originalname);
    const uniqueSuffix = Date.now();
    cb(null, `${studentId}-${uniqueSuffix}${fileExt}`);
  }
});
const photoUpload = multer({ storage: studentPhotoStorage });


// === AUTH & SESSION (Ihre vollständige Konfiguration) ===
const userSessions = new Map();
const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);


// =============================================================
// ACHTUNG: TEST-MIDDLEWARE! Nur für Entwicklung!
// Diese Middleware setzt IMMER einen Dummy-Admin-User als eingeloggt.
// UNBEDINGT ENTFERNEN, bevor das System produktiv genutzt wird!
// =============================================================
app.use((req, res, next) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 'dev-session';
    if (!userSessions.has(sessionId)) {
        userSessions.set(sessionId, {
            user: {
                id: 9999,
                username: 'devuser',
                fullName: 'Dev User',
                role: 'admin',
            }
        });
    }
    req.headers.authorization = 'Bearer ' + sessionId;
    next();
});
// =============================================================
// ENDE TEST-MIDDLEWARE
// =============================================================

const requireAdmin = (req, res, next) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    const session = userSessions.get(sessionId);
    if (session && session.user && session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Keine Admin-Berechtigung.' });
    }
};

// --- 4. API-ENDPUNKTE (Alle Ihre Routen) ---

// === ÖFFENTLICHE ROUTEN ===
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login-Request body:', req.body);
        const { username, password } = req.body;
        const user = await db.getUserByUsername(username);
        if (!user || !user.is_active) return res.status(401).json({ success: false, error: 'Benutzer nicht gefunden oder inaktiv.' });
        const passwordIsValid = await db.verifyPassword(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ success: false, error: 'Ungültiges Passwort.' });
        const sessionId = generateSessionId();
        const userForSession = { id: user.id, username: user.username, fullName: user.full_name, role: user.role };
        userSessions.set(sessionId, { user: userForSession });
        res.json({ success: true, sessionId, user: userForSession });
    } catch (error) { 
        console.error('Login-Fehler:', error);
        res.status(500).json({ success: false, error: 'Server-Fehler beim Login.' }); 
    }
});

app.get('/api/public/order/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const orderData = await db.getOrderByToken(token);
        if (!orderData) {
            return res.status(404).json({ success: false, error: 'Bestellung nicht gefunden.' });
        }
        res.json({ success: true, data: orderData });
    } catch (error) {
        console.error('API-Fehler beim Abrufen der öffentlichen Bestellung:', error);
        res.status(500).json({ success: false, error: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});

// === GESCHÜTZTE ROUTEN ===

// BENUTZERVERWALTUNG
app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json({ success: true, users });
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});
app.post('/api/users', requireAdmin, async (req, res) => {
    try {
        const newUser = await db.addUser(req.body);
        res.json({ success: true, user: newUser });
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});
app.put('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.updateUser(req.params.id, req.body);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const result = await db.deleteUser(req.params.id);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});

// BÜCHER & KATEGORIEN
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.getAllCategories();
        res.json({ success: true, categories });
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});
app.get('/api/books/search', async (req, res) => {
    const searchTerm = '';
    const filters = { categoryId: req.query.categoryId };
    const result = await db.searchBooks(searchTerm, filters);
    res.json({ success: true, books: result.books });
});
app.get('/api/books/search/:term', async (req, res) => {
    const searchTerm = req.params.term || '';
    const filters = { categoryId: req.query.categoryId };
    const result = await db.searchBooks(searchTerm, filters);
    res.json({ success: true, books: result.books });
});
app.post('/api/books/:barcode/fetch-cover', async (req, res) => {
    try {
        const { barcode } = req.params;
        const book = await db.getBookByBarcode(barcode);
        if (!book || !book.isbn) return res.status(404).json({ success: false, error: 'Kein Buch mit diesem Barcode oder ohne ISBN gefunden.' });
        const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`;
        const googleResponse = await axios.get(googleApiUrl);
        const bookData = googleResponse.data.items?.[0]?.volumeInfo;
        const imageUrl = bookData?.imageLinks?.thumbnail || bookData?.imageLinks?.smallThumbnail;
        if (!imageUrl) return res.status(404).json({ success: false, error: 'Kein Cover bei Google Books gefunden.' });
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
        const coverDir = 'public/uploads/book_covers';
        fs.mkdirSync(coverDir, { recursive: true });
        const fileExtension = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const imagePath = path.join(coverDir, `${barcode}${fileExtension}`);
        const writer = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        const coverUrl = `/${imagePath.replace(/\\/g, "/").replace('public/', '')}`;
        await db.updateBookCover(barcode, coverUrl);
        res.json({ success: true, message: 'Cover erfolgreich heruntergeladen und gespeichert.', coverUrl });
    } catch (error) { res.status(500).json({ success: false, error: 'Fehler beim Herunterladen des Covers.' }); }
});
app.delete('/api/books/batch', async (req, res) => {
    try {
        const { barcodes } = req.body;
        if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) return res.status(400).json({ success: false, error: 'Ein Array von Barcodes ist erforderlich.' });
        const result = await db.bulkDeleteBooks(barcodes);
        res.json({ success: true, message: `${result.affectedRows} Bücher erfolgreich gelöscht.` });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// SCHÜLER
app.post('/api/students/:id/photo', photoUpload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Keine Bild-Datei hochgeladen.' });
        const studentId = req.params.id;
        const photoUrl = `/${req.file.path.replace(/\\/g, "/").replace('public/', '')}`;
        await db.updateStudentPhoto(studentId, photoUrl);
        res.json({ success: true, message: 'Foto erfolgreich hochgeladen.', photoUrl });
    } catch (error) { res.status(500).json({ success: false, error: 'Fehler beim Speichern des Fotos: ' + error.message }); }
});
app.post('/api/students/import', excelUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const students = xlsx.utils.sheet_to_json(sheet);
        if (students.length === 0) return res.status(400).json({ success: false, error: 'Die Datei enthält keine Schülerdaten.' });
        const result = await db.bulkInsertStudents(students);
        res.json({ success: true, message: `${result.affectedRows} von ${students.length} Schülern erfolgreich importiert.` });
    } catch (error) { res.status(500).json({ success: false, error: 'Fehler beim Verarbeiten der Datei: ' + error.message }); }
});
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await db.getUniqueClasses();
        res.json({ success: true, classes });
    } catch (error) { 
        res.status(500).json({ success: false, error: error.message });
    }
});
app.get('/api/students/class/:className', async (req, res) => {
    try {
        const students = await db.getStudentsByClass(req.params.className);
        res.json({ success: true, students });
    } catch (error) { 
        res.status(500).json({ success: false, error: error.message });
    }
});

// UNIVERSAL-SUCHE & VERLÄNGERUNG
app.get('/api/universal-search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const studentById = await db.getStudentById(term);
        if (studentById) return res.json({ success: true, type: 'student_details', data: studentById });
        const bookByBarcode = await db.getBookByBarcode(term);
        if (bookByBarcode) {
            if (bookByBarcode.status === 'lent' || bookByBarcode.status === 'ausgeliehen') {
                const lending = await db.getActiveLendingByBook(term);
                if (lending) {
                    const studentWithBook = await db.getStudentById(lending.student_id);
                    return res.json({ success: true, type: 'student_details', data: studentWithBook });
                }
            }
            return res.json({ success: true, type: 'book_details', data: bookByBarcode });
        }
        const studentsByName = await db.searchStudents(term);
        if (studentsByName && studentsByName.students.length > 0) {
            return res.json({ success: true, type: 'student_list', data: studentsByName.students });
        }
        return res.status(404).json({ success: false, error: 'Kein Schüler oder Buch gefunden.' });
    } catch (error) { res.status(500).json({ success: false, error: 'Server-Fehler bei der Suche: ' + error.message }); }
});
app.post('/api/lending/filterable', async (req, res) => {
    try {
        const lendings = await db.getActiveLendingsByFilter(req.body);
        res.json({ success: true, lendings });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.post('/api/lending/extend-batch', async (req, res) => {
    try {
        const { lendingIds, days } = req.body;
        if (!lendingIds || !days) return res.status(400).json({ success: false, error: 'Ausleih-IDs und Tage sind erforderlich.' });
        const result = await db.extendLendingsByIds(lendingIds, days);
        res.json({ success: true, message: `${result.affectedRows} Bücher erfolgreich verlängert.` });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// BESTELLWESEN
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return res.status(400).json({ success: false, error: 'Ungültige Bestelldaten.' });
        }
        const result = await db.createOrder(orderData);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('API-Fehler beim Erstellen der Bestellung:', error);
        res.status(500).json({ success: false, error: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await db.getAllSuppliers();
        res.json({ success: true, suppliers });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.post('/api/suppliers', async (req, res) => {
    try {
        const newSupplier = await db.addSupplier(req.body);
        res.json({ success: true, supplier: newSupplier });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const result = await db.updateSupplier(req.params.id, req.body);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const result = await db.deleteSupplier(req.params.id);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.get('/api/book-info/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        const localBook = await db.getBookByIsbn(isbn);
        if (localBook) return res.json({ success: true, source: 'local', data: localBook, message: 'Dieses Buch existiert bereits in Ihrer Bibliothek.' });
        const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
        const googleResponse = await axios.get(googleApiUrl);
        const bookData = googleResponse.data.items?.[0]?.volumeInfo;
        if (!bookData) return res.status(404).json({ success: false, error: 'Keine Informationen für diese ISBN gefunden.' });
        const result = {
            title: bookData.title || '',
            author: bookData.authors ? bookData.authors.join(', ') : '',
            publication_year: bookData.publishedDate ? parseInt(bookData.publishedDate.substring(0, 4)) : null,
        };
        return res.json({ success: true, source: 'google', data: result });
    } catch (error) { res.status(500).json({ success: false, error: 'Fehler bei der Abfrage der Buch-Informationen.' }); }
});
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.getOrders();
        res.json({ success: true, orders });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (order) res.json({ success: true, order });
        else res.status(404).json({ success: false, error: 'Bestellung nicht gefunden.' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
app.post('/api/order-items/:id/receive', async (req, res) => {
    try {
        const orderItemId = req.params.id;
        const result = await db.receiveDelivery(orderItemId);
        res.json({ success: true, message: `${result.createdBooks} Bücher erfolgreich ins System eingepflegt.` });
    } catch (error) { res.status(500).json({ success: false, error: 'Fehler bei der Lieferungsfreischaltung: ' + error.message }); }
});
app.get('/api/order-items/:id/barcodes', async (req, res) => {
    try {
        const books = await db.getBooksByOrderItemId(req.params.id);
        res.json({ success: true, books });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// EINSTELLUNGEN
app.get('/api/settings/:key', async (req, res) => {
    try {
        const value = await db.getSetting(req.params.key);
        res.json({ success: true, value });
    } catch (error) { 
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await db.saveSetting(key, value);
        res.json(result);
    } catch (error) { 
        res.status(500).json({ success: false, error: error.message });
    }
});

// SCHNELLRÜCKNAHME
app.post('/api/lending/quick-return', async (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    const session = userSessions.get(sessionId);
    if (!session || !session.user) {
        return res.status(401).json({ success: false, error: 'Nicht angemeldet.' });
    }
    try {
        const { barcode } = req.body;
        const result = await db.performQuickReturn(barcode, session.user.id);
        res.json({ 
            success: true, 
            ...result,
            librarian_name: session.user.fullName
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
app.post('/api/lending/undo-return', async (req, res) => {
    try {
        const { lendingId } = req.body;
        const result = await db.undoQuickReturn(lendingId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// SCHÜLER-SYNCHRONISATION
app.post('/api/students/sync-preview', excelUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const studentsFromFile = xlsx.utils.sheet_to_json(sheet);
        if (studentsFromFile.length === 0) {
            return res.status(400).json({ success: false, error: 'Die Datei enthält keine Schülerdaten.' });
        }
        const changes = await db.analyzeStudentSync(studentsFromFile);
        res.json({ success: true, changes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Fehler beim Analysieren der Datei: ' + error.message });
    }
});
app.post('/api/students/sync-execute', async (req, res) => {
    try {
        const { changes } = req.body;
        if (!changes) {
            return res.status(400).json({ success: false, error: 'Keine Änderungsdaten erhalten.' });
        }
        const result = await db.executeStudentSync(changes);
        res.json({ success: true, message: 'Schülerdaten erfolgreich synchronisiert.', result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Fehler bei der Synchronisation: ' + error.message });
    }
});

// AUSLEIHEN-IMPORT
app.post('/api/lending/import', excelUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = 'Ausleihen';
        if (!workbook.SheetNames.includes(sheetName)) {
            return res.status(400).json({ success: false, error: "Das Tabellenblatt 'Ausleihen' wurde in der Datei nicht gefunden." });
        }
        const sheet = workbook.Sheets[sheetName];
        const lendingsData = xlsx.utils.sheet_to_json(sheet);
        if (lendingsData.length === 0) {
            return res.status(400).json({ success: false, error: 'Das Tabellenblatt "Ausleihen" enthält keine Daten.' });
        }
        const result = await db.bulkImportLendings(lendingsData);
        res.json({ 
            success: true, 
            message: `${result.created} Ausleihvorgänge erfolgreich importiert und ${result.updated} Bücher als 'ausgeliehen' markiert.` 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Fehler beim Verarbeiten der Datei: ' + error.message });
    }
});

// INVENTUR
app.post('/api/inventory/check', async (req, res) => {
    try {
        const { barcodes } = req.body;
        if (!barcodes || !Array.isArray(barcodes)) {
            return res.status(400).json({ success: false, error: 'Ein Array von Barcodes ist erforderlich.' });
        }
        const report = await db.performInventoryCheck(barcodes);
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Fehler bei der Inventurprüfung: ' + error.message });
    }
});


// --- 5. SERVER START ---
server.listen(PORT, async () => {
    console.log(`🚀 BiblioSys-Server (mit MySQL) läuft auf http://localhost:${PORT}`);
    await db.testConnection();
});
