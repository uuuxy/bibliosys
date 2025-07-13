const crypto = require('crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Der Klassenname ist 'BiblioDatabase', passend zu Ihrer server.js
class BiblioDatabase {
  pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bibliosys50k',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0
    });
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ MySQL Verbindung erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ MySQL Verbindungsfehler:', error.message);
      return false;
    }
  }

  // === AUTH & BENUTZERVERWALTUNG ===

  async getUserByUsername(username) {
    const query = "SELECT id, username, password_hash, full_name, role, is_active FROM users WHERE username = ?";
    const [users] = await this.pool.execute(query, [username]);
    return users[0] || null;
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async getAllUsers() {
    const query = "SELECT id, username, full_name, role, is_active, last_login FROM users ORDER BY username";
    const [users] = await this.pool.execute(query);
    return users;
  }

  async addUser(userData) {
    const { username, password, full_name, role } = userData;
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const query = "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)";
    const [result] = await this.pool.execute(query, [username, password_hash, full_name, role]);
    return { id: result.insertId, ...userData };
  }

  async updateUser(id, userData) {
    const { full_name, role, is_active } = userData;
    const query = "UPDATE users SET full_name = ?, role = ?, is_active = ? WHERE id = ?";
    await this.pool.execute(query, [full_name, role, is_active, id]);
    return { success: true };
  }

  async deleteUser(id) {
    if (id === 1) throw new Error('Der Haupt-Administrator kann nicht gelöscht werden.');
    await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  }

  // === BUCH-FUNKTIONEN ===

  async searchBooks(searchTerm, filters = {}) {
    let query = `
      SELECT b.*, s.name as borrower_name
      FROM books b
      LEFT JOIN lendings l ON b.barcode = l.book_barcode AND l.status = 'active'
      LEFT JOIN students s ON l.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (searchTerm) {
        query += " AND (b.title LIKE ? OR b.author LIKE ? OR b.barcode LIKE ?)";
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }
    if (filters.categoryId) {
        query += " AND b.category_id = ?";
        params.push(filters.categoryId);
    }
    query += " ORDER BY b.title LIMIT 200";
    const [books] = await this.pool.execute(query, params);
    return { books };
  }
  
  async getBookByBarcode(barcode) {
    const [books] = await this.pool.execute("SELECT * FROM books WHERE barcode = ?", [barcode]);
    return books[0] || null;
  }

  async getBookByIsbn(isbn) {
    const query = "SELECT * FROM books WHERE isbn = ? LIMIT 1";
    const [books] = await this.pool.execute(query, [isbn]);
    return books[0] || null;
  }

  async addBook(bookData) {
    const { title, author, isbn, signature, category_id = 1 } = bookData;
    const barcode = `B-${String(Date.now()).slice(-5)}`;
    const query = `
      INSERT INTO books (barcode, title, author, isbn, signature, category_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'available')
    `;
    await this.pool.execute(query, [barcode, title, author, isbn, signature, category_id]);
    return { barcode, ...bookData };
  }

  async updateBook(barcode, bookData) {
    const { title, author, isbn, signature } = bookData;
    const query = `
      UPDATE books SET title = ?, author = ?, isbn = ?, signature = ?
      WHERE barcode = ?
    `;
    await this.pool.execute(query, [title, author, isbn, signature, barcode]);
    return { success: true };
  }

  async updateBookCover(barcode, coverUrl) {
    const query = "UPDATE books SET cover_url = ? WHERE barcode = ?";
    await this.pool.execute(query, [coverUrl, barcode]);
    return { success: true };
  }

  async deleteBook(barcode) {
    const [lendings] = await this.pool.execute("SELECT id FROM lendings WHERE book_barcode = ? AND status = 'active'", [barcode]);
    if (lendings.length > 0) throw new Error('Buch ist ausgeliehen und kann nicht gelöscht werden.');
    await this.pool.execute('DELETE FROM books WHERE barcode = ?', [barcode]);
    return { success: true };
  }

  async bulkDeleteBooks(barcodes) {
    if (!barcodes || barcodes.length === 0) return { affectedRows: 0 };
    const placeholders = barcodes.map(() => '?').join(',');
    const checkLendingsQuery = `SELECT COUNT(*) as count FROM lendings WHERE book_barcode IN (${placeholders}) AND status = 'active'`;
    const [lendings] = await this.pool.execute(checkLendingsQuery, barcodes);
    if (lendings[0].count > 0) {
      throw new Error('Eines oder mehrere der ausgewählten Bücher sind noch ausgeliehen.');
    }
    const deleteQuery = `DELETE FROM books WHERE barcode IN (${placeholders})`;
    const [result] = await this.pool.execute(deleteQuery, barcodes);
    return result;
  }

  // === SCHÜLER-FUNKTIONEN ===

  async getStudentById(studentId) {
    const studentQuery = "SELECT * FROM students WHERE id = ?";
    const [studentRows] = await this.pool.execute(studentQuery, [studentId]);
    if (studentRows.length === 0) return null;
    const student = studentRows[0];
    const lendingsQuery = `
      SELECT b.barcode, b.title, b.cover_url, l.due_date, (l.due_date < CURDATE()) as is_overdue
      FROM lendings l
      JOIN books b ON l.book_barcode = b.barcode
      WHERE l.student_id = ? AND l.status = 'active'
      ORDER BY l.due_date ASC
    `;
    const [lendings] = await this.pool.execute(lendingsQuery, [studentId]);
    student.borrowed_books = lendings;
    return student;
  }

  async addStudent(studentData) {
    const { id, name, class: studentClass } = studentData;
    const query = "INSERT INTO students (id, name, class) VALUES (?, ?, ?)";
    await this.pool.execute(query, [id, name, studentClass]);
    return { ...studentData };
  }

  async updateStudent(id, studentData) {
    const { name, class: studentClass } = studentData;
    const query = "UPDATE students SET name = ?, class = ? WHERE id = ?";
    await this.pool.execute(query, [name, studentClass, id]);
    return { success: true };
  }
  
  async updateStudentPhoto(studentId, photoUrl) {
    const query = "UPDATE students SET photo_url = ? WHERE id = ?";
    await this.pool.execute(query, [photoUrl, studentId]);
    return { success: true };
  }

  async deleteStudent(id) {
    const [lendings] = await this.pool.execute("SELECT id FROM lendings WHERE student_id = ? AND status = 'active'",[id]);
    if (lendings.length > 0) throw new Error('Schüler hat noch Bücher ausgeliehen.');
    await this.pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return { success: true };
  }

  async bulkInsertStudents(students) {
    if (!students || students.length === 0) return { affectedRows: 0 };
    const query = 'INSERT IGNORE INTO students (id, name, class) VALUES ?';
    const values = students.map(s => [s.id, s.name, s.class]);
    const [result] = await this.pool.query(query, [values]);
    return result;
  }

  async getUniqueClasses() {
    const query = "SELECT DISTINCT class FROM students ORDER BY class ASC";
    const [classes] = await this.pool.execute(query);
    return classes.map(c => c.class);
  }

  async getStudentsByClass(className) {
    const query = "SELECT * FROM students WHERE class = ? ORDER BY name ASC";
    const [students] = await this.pool.execute(query, [className]);
    return students;
  }

  // === AUSLEIHE & VERLÄNGERUNG ===

  async getActiveLendingByBook(barcode) {
    const query = "SELECT * FROM lendings WHERE book_barcode = ? AND status = 'active' LIMIT 1";
    const [lendings] = await this.pool.execute(query, [barcode]);
    return lendings[0] || null;
  }

  async getOverdueLendings() {
    const query = `
      SELECT l.id as lending_id, l.due_date, b.barcode, b.title, b.cover_url, 
             s.id as student_id, s.name as student_name, s.class as student_class
      FROM lendings l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN students s ON l.student_id = s.id
      WHERE l.status = 'active' AND l.due_date < CURDATE()
      ORDER BY l.due_date ASC
    `;
    const [lendings] = await this.pool.execute(query);
    return lendings;
  }

  async getActiveLendingsByFilter(filters = {}) {
    let query = `
      SELECT l.id as lending_id, l.due_date, b.barcode, b.title, b.signature, s.name as student_name
      FROM lendings l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN students s ON l.student_id = s.id
      WHERE l.status = 'active'
    `;
    const params = [];
    if (filters.signature) {
      query += " AND b.signature = ?";
      params.push(filters.signature);
    }
    if (filters.categoryId) {
      query += " AND b.category_id = ?";
      params.push(filters.categoryId);
    }
    query += " ORDER BY l.due_date ASC";
    const [lendings] = await this.pool.execute(query, params);
    return lendings;
  }

  async extendLendingsByIds(lendingIds, days) {
    if (!lendingIds || lendingIds.length === 0) return { affectedRows: 0 };
    const placeholders = lendingIds.map(() => '?').join(',');
    const query = `UPDATE lendings SET due_date = DATE_ADD(CURDATE(), INTERVAL ? DAY) WHERE id IN (${placeholders})`;
    const params = [days, ...lendingIds];
    const [result] = await this.pool.execute(query, params);
    return result;
  }

  // === ANBIETER & BESTELLWESEN ===

  async getAllSuppliers() {
    const query = "SELECT * FROM suppliers ORDER BY name ASC";
    const [suppliers] = await this.pool.execute(query);
    return suppliers;
  }

  async addSupplier(supplierData) {
    const { name, contact_person, email, phone, notes } = supplierData;
    const query = "INSERT INTO suppliers (name, contact_person, email, phone, notes) VALUES (?, ?, ?, ?, ?)";
    const [result] = await this.pool.execute(query, [name, contact_person, email, phone, notes]);
    return { id: result.insertId, ...supplierData };
  }

  async updateSupplier(id, supplierData) {
    const { name, contact_person, email, phone, notes } = supplierData;
    const query = "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, notes = ? WHERE id = ?";
    await this.pool.execute(query, [name, contact_person, email, phone, notes, id]);
    return { success: true };
  }

  async deleteSupplier(id) {
    const query = "DELETE FROM suppliers WHERE id = ?";
    await this.pool.execute(query, [id]);
    return { success: true };
  }

  // ERSETZT: createOrder optimiert für Bulk-Insert und Zählerhandling
  async createOrder(orderData) {
    const connection = await this.pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Hole den Start-Zähler EINMAL und sperre die Zeile
        const [[counterRow]] = await connection.execute("SELECT counter_value FROM app_counters WHERE counter_key = 'next_book_id' FOR UPDATE");
        let nextId = counterRow.counter_value;
        
        // 2. Erstelle die Hauptbestellung
        const publicToken = crypto.randomUUID();
        const orderQuery = "INSERT INTO orders (order_date, supplier_id, public_token, status) VALUES (?, ?, ?, 'ordered')";
        const [orderResult] = await connection.execute(orderQuery, [orderData.order_date, orderData.supplier_id, publicToken]);
        const newOrderId = orderResult.insertId;

        // 3. Bereite die Bestellelemente für einen einzigen großen Insert vor
        const orderItemsValues = [];
        const generatedIds = [];
        for (const item of orderData.items) {
            for (let i = 0; i < item.quantity; i++) {
                const libraryBarcodeId = `buch-${nextId}`;
                generatedIds.push(libraryBarcodeId);
                orderItemsValues.push([newOrderId, item.isbn, item.title, item.author, libraryBarcodeId]);
                nextId++; // Inkrementiere den Zähler im Code
            }
        }
        
        // 4. Führe den Bulk-Insert für alle Artikel durch
        if (orderItemsValues.length > 0) {
            const itemsQuery = "INSERT INTO order_items (order_id, isbn, title, author, library_barcode_id) VALUES ?";
            await connection.query(itemsQuery, [orderItemsValues]);
        }

        // 5. Aktualisiere den Zähler in der Datenbank EINMAL am Ende
        await connection.execute("UPDATE app_counters SET counter_value = ? WHERE counter_key = 'next_book_id'", [nextId]);
        
        // 6. Schließe die Transaktion ab
        await connection.commit();
        
        return { success: true, orderId: newOrderId, generatedIds, publicToken };

    } catch (error) {
        await connection.rollback();
        console.error("Fehler beim Erstellen der Bestellung in der Datenbank:", error);
        throw new Error("Die Bestellung konnte aufgrund eines Datenbankfehlers nicht erstellt werden.");
    } finally {
        connection.release();
    }
  }

  async getOrderByToken(token) {
      const orderQuery = "SELECT order_id, order_date, supplier_id FROM orders WHERE public_token = ?";
      const [orders] = await this.pool.execute(orderQuery, [token]);
      if (orders.length === 0) {
          return null;
      }
      const order = orders[0];
      const itemsQuery = "SELECT title, author, isbn, library_barcode_id FROM order_items WHERE order_id = ?";
      const [items] = await this.pool.execute(itemsQuery, [order.order_id]);
      return { ...order, items: items };
  }
  
  // getNextBookCounter wird nicht mehr benötigt und entfernt

  // === KATEGORIEN ===

  async getAllCategories() {
    const query = `
      SELECT c.id, c.name, COUNT(b.barcode) as total_books,
             SUM(CASE WHEN b.status = 'available' OR b.status = 'verfügbar' THEN 1 ELSE 0 END) as available_books
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;
    const [categories] = await this.pool.execute(query);
    return categories;
  }

  async close() {
    await this.pool.end();
    console.log('🔌 MySQL Verbindung geschlossen');
  }

  // === SCHNELLRÜCKNAHME ===

  async performQuickReturn(bookBarcode, returnedByUserId) {
    const connection = await this.pool.getConnection();
    try {
        await connection.beginTransaction();
        const [lendings] = await connection.execute( "SELECT * FROM lendings WHERE book_barcode = ? AND status = 'active' LIMIT 1", [bookBarcode] );
        if (lendings.length === 0) { throw new Error('Dieses Buch ist aktuell nicht ausgeliehen.'); }
        const lending = lendings[0];
        await connection.execute( "UPDATE lendings SET status = 'returned', return_date = NOW(), returned_by = ? WHERE id = ?", [returnedByUserId, lending.id] );
        await connection.execute( "UPDATE books SET status = 'available' WHERE barcode = ?", [bookBarcode] );
        const [bookDetails] = await connection.execute("SELECT title FROM books WHERE barcode = ?", [bookBarcode]);
        const [studentDetails] = await connection.execute("SELECT name FROM students WHERE id = ?", [lending.student_id]);
        await connection.commit();
        return { lending_id: lending.id, book_title: bookDetails[0].title, student_name: studentDetails[0].name };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
  }

  async undoQuickReturn(lendingId) {
    const connection = await this.pool.getConnection();
    try {
        await connection.beginTransaction();
        const [lendings] = await connection.execute("SELECT * FROM lendings WHERE id = ?", [lendingId]);
        if (lendings.length === 0) throw new Error('Ausleihvorgang nicht gefunden.');
        const lending = lendings[0];
        await connection.execute( "UPDATE lendings SET status = 'active', return_date = NULL, returned_by = NULL WHERE id = ?", [lendingId] );
        await connection.execute( "UPDATE books SET status = 'lent' WHERE barcode = ?", [lending.book_barcode] );
        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
  }

  // === SCHÜLER-SYNCHRONISATION ===

  async analyzeStudentSync(studentsFromFile) {
    const [dbStudents] = await this.pool.execute("SELECT id, name, class FROM students WHERE status = 'active'");
    const dbStudentMap = new Map(dbStudents.map(s => [s.id, s]));
    const fileStudentMap = new Map(studentsFromFile.map(s => [s.id, s]));
    const toCreate = [];
    const toUpdate = [];
    const toDeactivate = [];
    for (const [fileId, fileStudent] of fileStudentMap.entries()) {
      const dbStudent = dbStudentMap.get(fileId);
      if (!dbStudent) {
        toCreate.push(fileStudent);
      } else {
        if (dbStudent.name !== fileStudent.name || dbStudent.class !== fileStudent.class) {
          toUpdate.push({ ...fileStudent, oldData: { name: dbStudent.name, class: dbStudent.class } });
        }
        dbStudentMap.delete(fileId);
      }
    }
    for (const [dbId, dbStudent] of dbStudentMap.entries()) {
      toDeactivate.push(dbStudent);
    }
    return { toCreate, toUpdate, toDeactivate };
  }

  async executeStudentSync(changes) {
    const { toCreate, toUpdate, toDeactivate } = changes;
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      if (toCreate.length > 0) {
        const createQuery = 'INSERT INTO students (id, name, class) VALUES ?';
        const createValues = toCreate.map(s => [s.id, s.name, s.class]);
        await connection.query(createQuery, [createValues]);
      }
      if (toUpdate.length > 0) {
        for (const student of toUpdate) {
          await connection.execute("UPDATE students SET name = ?, class = ? WHERE id = ?", [student.name, student.class, student.id]);
        }
      }
      if (toDeactivate.length > 0) {
        const deactivateIds = toDeactivate.map(s => s.id);
        const placeholders = deactivateIds.map(() => '?').join(',');
        await connection.execute(`UPDATE students SET status = 'graduated' WHERE id IN (${placeholders})`, deactivateIds);
      }
      await connection.commit();
      return { created: toCreate.length, updated: toUpdate.length, deactivated: toDeactivate.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // === AUSLEIHEN-IMPORT ===

  async bulkImportLendings(lendings) {
    if (!lendings || lendings.length === 0) {
      return { created: 0, updated: 0 };
    }
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      let createdCount = 0;
      let updatedCount = 0;
      for (const lending of lendings) {
        const { student_id, book_barcode, due_date } = lending;
        const insertLendingQuery = `INSERT INTO lendings (student_id, book_barcode, due_date, status) VALUES (?, ?, ?, 'active')`;
        await connection.execute(insertLendingQuery, [student_id, book_barcode, due_date]);
        createdCount++;
        const updateBookQuery = "UPDATE books SET status = 'lent' WHERE barcode = ?";
        const [updateResult] = await connection.execute(updateBookQuery, [book_barcode]);
        if (updateResult.affectedRows > 0) {
          updatedCount++;
        }
      }
      await connection.commit();
      return { created: createdCount, updated: updatedCount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // === INVENTUR ===

  async performInventoryCheck(scannedBarcodes) {
    const [allDbBooks] = await this.pool.execute("SELECT barcode, title, author, status FROM books");
    const dbBookMap = new Map(allDbBooks.map(b => [b.barcode, b]));
    const scannedSet = new Set(scannedBarcodes);
    const found_correctly = [];
    const missing_in_reality = [];
    const found_unexpectedly = [];
    for (const dbBook of allDbBooks) {
      const wasScanned = scannedSet.has(dbBook.barcode);
      const isAvailableInDb = dbBook.status === 'available' || dbBook.status === 'verfügbar';
      if (wasScanned && isAvailableInDb) {
        found_correctly.push(dbBook);
      } else if (!wasScanned && isAvailableInDb) {
        missing_in_reality.push(dbBook);
      } else if (wasScanned && !isAvailableInDb) {
        found_unexpectedly.push(dbBook);
      }
      if(wasScanned) {
        scannedSet.delete(dbBook.barcode);
      }
    }
    const unknown_barcodes = Array.from(scannedSet);
    return { found_correctly, missing_in_reality, found_unexpectedly, unknown_barcodes };
  }

  // === APP-EINSTELLUNGEN ===

  async getSetting(key) {
    const query = "SELECT setting_value FROM app_settings WHERE setting_key = ?";
    const [rows] = await this.pool.execute(query, [key]);
    if (rows.length > 0) {
        let val = rows[0].setting_value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
        }
        return val;
    }
    if (key === 'id_card_layout') {
        return {
            photoPosition: 'left',
            fields: [
                { key: 'name', label: 'Name', visible: true },
                { key: 'class', label: 'Klasse', visible: true },
                { key: 'id', label: 'Schüler-ID', visible: true },
            ]
        };
    }
    return null;
  }

  async saveSetting(key, value) {
    const query = `
        INSERT INTO app_settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    const jsonValue = JSON.stringify(value);
    await this.pool.execute(query, [key, jsonValue]);
    return { success: true };
  }
}

// Die Klasse wird mit module.exports exportiert, damit 'require' in server.js funktioniert.
module.exports = BiblioDatabase;
