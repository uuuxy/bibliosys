const express = require('express');
const cors = require('cors');
const http = require('http');
const BiblioDatabase = require('./database.js');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const db = new BiblioDatabase();

app.use(cors());
app.use(express.json());

// Temporäres Session-Management (bleibt vorerst In-Memory)
const userSessions = new Map();
const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// === AUTHENTIFIZIERUNG (JETZT MIT DATENBANK) ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.getUserByUsername(username);

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, error: 'Benutzer nicht gefunden oder inaktiv.' });
        }

        const passwordIsValid = await db.verifyPassword(password, user.password_hash);

        if (!passwordIsValid) {
            return res.status(401).json({ success: false, error: 'Ungültiges Passwort.' });
        }

        const sessionId = generateSessionId();
        // Passwort-Hash nicht in der Session speichern!
        const userForSession = { id: user.id, username: user.username, fullName: user.full_name, role: user.role };
        userSessions.set(sessionId, { user: userForSession });

        res.json({ success: true, sessionId, user: userForSession });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server-Fehler beim Login.' });
    }
});

// Middleware zur Überprüfung der Admin-Rechte
const requireAdmin = (req, res, next) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    const session = userSessions.get(sessionId);
    if (session && session.user && session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Keine Admin-Berechtigung.' });
    }
};


// === NEU: API-ENDPUNKTE FÜR BENUTZERVERWALTUNG ===
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


// === VORHANDENE API-ENDPUNKTE (Bücher, Schüler, etc.) ===
// ... (alle anderen Endpunkte für /api/books, /api/students etc. bleiben hier unverändert)
app.get('/api/books/search/:term', async (req, res) => {
    try {
        const result = await db.searchBooks(req.params.term);
        res.json({ success: true, books: result.books });
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
});
// ... (restliche Endpunkte) ...

// Eine Konfiguration für multer erstellen, die die Datei im Speicher hält
const upload = multer({ storage: multer.memoryStorage() });

// NEUER ENDPUNKT für den Import
app.post('/api/students/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }

        // Die Excel-Datei aus dem Buffer lesen
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Das Arbeitsblatt in ein JSON-Objekt umwandeln
        // WICHTIG: Die Spalten in Ihrer Excel-Datei müssen "id", "name", und "class" heißen.
        const students = xlsx.utils.sheet_to_json(sheet);

        if (students.length === 0) {
            return res.status(400).json({ success: false, error: 'Die Datei enthält keine Schülerdaten.' });
        }

        // Die Daten in die Datenbank einfügen
        const result = await db.bulkInsertStudents(students);

        res.json({ 
            success: true, 
            message: `${result.affectedRows} von ${students.length} Schülern erfolgreich importiert.` 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Fehler beim Verarbeiten der Datei: ' + error.message });
    }
});

// NEUER ENDPUNKT zum Abrufen und Speichern von Buch-Covers
app.post('/api/books/:barcode/fetch-cover', async (req, res) => {
    try {
        const { barcode } = req.params;
        
        // 1. Finde das Buch in unserer Datenbank, um die ISBN zu bekommen
        const book = await db.getBookByBarcode(barcode);
        if (!book || !book.isbn) {
            return res.status(404).json({ success: false, error: 'Kein Buch mit diesem Barcode oder ohne ISBN gefunden.' });
        }

        // 2. Frage die Google Books API mit der ISBN an
        const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`;
        const googleResponse = await axios.get(googleApiUrl);

        const bookData = googleResponse.data.items?.[0]?.volumeInfo;
        const imageUrl = bookData?.imageLinks?.thumbnail || bookData?.imageLinks?.smallThumbnail;

        if (!imageUrl) {
            return res.status(404).json({ success: false, error: 'Kein Cover bei Google Books gefunden.' });
        }

        // 3. Lade das Bild herunter
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

        // 4. Speichere das Bild auf unserem Server
        const coverDir = 'public/uploads/book_covers';
        fs.mkdirSync(coverDir, { recursive: true }); // Erstellt Ordner, falls nicht vorhanden
        const fileExtension = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const imagePath = path.join(coverDir, `${barcode}${fileExtension}`);
        
        const writer = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 5. Speichere den Pfad zum Bild in unserer Datenbank
        const coverUrl = `/${imagePath.replace(/\\/g, "/").replace('public/', '')}`;
        await db.updateBookCover(barcode, coverUrl);

        res.json({ success: true, message: 'Cover erfolgreich heruntergeladen und gespeichert.', coverUrl });

    } catch (error) {
        console.error("Cover-Fetch-Fehler:", error);
        res.status(500).json({ success: false, error: 'Fehler beim Herunterladen des Covers.' });
    }
});

// NEUER ENDPUNKT für Bulk-Löschung
app.delete('/api/books/batch', async (req, res) => {
    try {
        const { barcodes } = req.body;
        if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
            return res.status(400).json({ success: false, error: 'Ein Array von Barcodes ist erforderlich.' });
        }
        const result = await db.bulkDeleteBooks(barcodes);
        res.json({ success: true, message: `${result.affectedRows} Bücher erfolgreich gelöscht.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// NEUER ENDPUNKT für die Universal-Suche
app.get('/api/universal-search/:term', async (req, res) => {
    try {
        const { term } = req.params;

        // 1. Ist es eine Schüler-ID?
        const studentById = await db.getStudentById(term);
        if (studentById) {
            return res.json({ success: true, type: 'student_details', data: studentById });
        }

        // 2. Ist es ein Buch-Barcode?
        const bookByBarcode = await db.getBookByBarcode(term);
        if (bookByBarcode) {
            // Wenn das Buch ausgeliehen ist, finde den Schüler
            if (bookByBarcode.status === 'lent' || bookByBarcode.status === 'ausgeliehen') {
                const lending = await db.getActiveLendingByBook(term);
                if (lending) {
                    const studentWithBook = await db.getStudentById(lending.student_id);
                    return res.json({ success: true, type: 'student_details', data: studentWithBook });
                }
            }
            // Wenn das Buch verfügbar ist, gib die Buchdetails zurück
            return res.json({ success: true, type: 'book_details', data: bookByBarcode });
        }

        // 3. Wenn nichts davon zutrifft, suche nach Schülernamen
        const studentsByName = await db.searchStudents(term);
        if (studentsByName && studentsByName.students.length > 0) {
            return res.json({ success: true, type: 'student_list', data: studentsByName.students });
        }

        // 4. Nichts gefunden
        return res.status(404).json({ success: false, error: 'Kein Schüler oder Buch gefunden.' });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server-Fehler bei der Suche: ' + error.message });
    }
});

// Server starten
const PORT = 3000;
server.listen(PORT, async () => {
    console.log(`🚀 BiblioSys-Server (mit MySQL) läuft auf http://localhost:${PORT}`);
    await db.testConnection();
});
