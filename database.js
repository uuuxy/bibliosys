const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Import bcrypt
require('dotenv').config();

class BiblioDatabase {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
    console.log('🔗 MySQL Pool erstellt');
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

  // === Buch-Funktionen (unverändert) ===
  async searchBooks(searchTerm) {
    const query = `
      SELECT b.*, s.name as borrower_name
      FROM books b
      LEFT JOIN lendings l ON b.barcode = l.book_barcode AND l.status = 'active'
      LEFT JOIN students s ON l.student_id = s.id
      WHERE b.title LIKE ? OR b.author LIKE ? OR b.barcode LIKE ?
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    const [books] = await this.pool.execute(query, [searchPattern, searchPattern, searchPattern]);
    return { books };
  }
  
  async getBookByBarcode(barcode) {
    const [books] = await this.pool.execute("SELECT * FROM books WHERE barcode = ?", [barcode]);
    return books[0] || null;
  }

  // ... (addBook, updateBook, deleteBook etc. bleiben hier)
  async addBook(bookData) {
    // NEU: signature aus den Daten holen
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
    // NEU: signature aus den Daten holen
    const { title, author, isbn, signature } = bookData;
    const query = `
      UPDATE books SET title = ?, author = ?, isbn = ?, signature = ?
      WHERE barcode = ?
    `;
    await this.pool.execute(query, [title, author, isbn, signature, barcode]);
    return { success: true };
  }

  async deleteBook(barcode) {
    const [lendings] = await this.pool.execute("SELECT id FROM lendings WHERE book_barcode = ? AND status = 'active'", [barcode]);
    if (lendings.length > 0) throw new Error('Buch ist ausgeliehen und kann nicht gelöscht werden.');
    await this.pool.execute('DELETE FROM books WHERE barcode = ?', [barcode]);
    return { success: true };
  }

  // NEUE FUNKTION
  async bulkDeleteBooks(barcodes) {
    if (!barcodes || barcodes.length === 0) {
      return { affectedRows: 0 };
    }
    
    const placeholders = barcodes.map(() => '?').join(','); // Erzeugt ?,?,?

    // Zuerst prüfen, ob eines der Bücher ausgeliehen ist
    const checkLendingsQuery = `SELECT COUNT(*) as count FROM lendings WHERE book_barcode IN (${placeholders}) AND status = 'active'`;
    const [lendings] = await this.pool.execute(checkLendingsQuery, barcodes);

    if (lendings[0].count > 0) {
      throw new Error('Eines oder mehrere der ausgewählten Bücher sind noch ausgeliehen und können nicht gelöscht werden.');
    }

    // Wenn keine Bücher ausgeliehen sind, löschen
    const deleteQuery = `DELETE FROM books WHERE barcode IN (${placeholders})`;
    const [result] = await this.pool.execute(deleteQuery, barcodes);
    
    return result;
  }

  // NEUE FUNKTION
  async updateBookCover(barcode, coverUrl) {
    const query = "UPDATE books SET cover_url = ? WHERE barcode = ?";
    await this.pool.execute(query, [coverUrl, barcode]);
    return { success: true };
  }


  // === Schüler-Funktionen (unverändert) ===
  async getStudentById(studentId) {
    // 1. Grundlegende Schülerdaten abrufen
    const studentQuery = "SELECT * FROM students WHERE id = ?";
    const [studentRows] = await this.pool.execute(studentQuery, [studentId]);
    
    if (studentRows.length === 0) {
      return null;
    }
    const student = studentRows[0];

    // 2. Alle aktiven Ausleihen für diesen Schüler abrufen
    const lendingsQuery = `
      SELECT 
        b.barcode,
        b.title,
        b.cover_url,
        l.due_date,
        (l.due_date < CURDATE()) as is_overdue
      FROM lendings l
      JOIN books b ON l.book_barcode = b.barcode
      WHERE l.student_id = ? AND l.status = 'active'
      ORDER BY l.due_date ASC
    `;
    const [lendings] = await this.pool.execute(lendingsQuery, [studentId]);

    // 3. Die Ausleihen zum Schüler-Objekt hinzufügen
    student.borrowed_books = lendings;

    return student;
  }
  // ... (addStudent, updateStudent, deleteStudent etc. bleiben hier)
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

  async deleteStudent(id) {
     const [lendings] = await this.pool.execute("SELECT id FROM lendings WHERE student_id = ? AND status = 'active'",[id]);
    if (lendings.length > 0) throw new Error('Schüler hat noch Bücher ausgeliehen.');
    await this.pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return { success: true };
  }

  async bulkInsertStudents(students) {
    if (!students || students.length === 0) {
      return { affectedRows: 0 };
    }
    // INSERT IGNORE sorgt dafür, dass Schüler mit einer bereits existierenden ID übersprungen werden,
    // anstatt einen Fehler zu verursachen.
    const query = 'INSERT IGNORE INTO students (id, name, class) VALUES ?';
    
    // Die Daten in das richtige Format für die Query umwandeln: [[id1, name1, class1], [id2, name2, class2]]
    const values = students.map(s => [s.id, s.name, s.class]);

    const [result] = await this.pool.query(query, [values]);
    return result;
  }


  // === Transaktions-Funktionen (unverändert) ===
  async performTransaction(studentId, bookBarcode, action) {
    // ... (unveränderte Logik)
  }

  // === NEU: Benutzerverwaltungs-Funktionen ===

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
    // Optional: Passwort-Änderung implementieren
    return { success: true };
  }

  async deleteUser(id) {
    // Sicherheitshalber den Haupt-Admin nicht löschen lassen
    if (id === 1) {
      throw new Error('Der Haupt-Administrator kann nicht gelöscht werden.');
    }
    await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  }

  async getAllCategories() {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        COUNT(b.barcode) as total_books,
        SUM(CASE WHEN b.status = 'available' OR b.status = 'verfügbar' THEN 1 ELSE 0 END) as available_books
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;
    const [categories] = await this.pool.execute(query);
    return categories;
  }

  // === Bestellungs-Funktionen ===
  async createOrder(orderData, items) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const orderQuery = 'INSERT INTO orders (order_number, order_date, supplier, status) VALUES (?, ?, ?, ?)';
      const [orderRes] = await conn.execute(orderQuery, [orderData.order_number, orderData.order_date, orderData.supplier, orderData.status || 'offen']);
      const orderId = orderRes.insertId;
      const itemQuery = 'INSERT INTO order_items (order_id, book_title, quantity, price, status) VALUES (?, ?, ?, ?, ?)';

      for (const item of items) {
        await conn.execute(itemQuery, [orderId, item.book_title, item.quantity, item.price, item.status || 'bestellt']);
      }

      await conn.commit();
      return { success: true, orderId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getOrders() {
    const [orders] = await this.pool.execute('SELECT * FROM orders ORDER BY order_date DESC, id DESC');
    return orders;
  }

  async getOrderById(orderId) {
    const [orders] = await this.pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orders[0]) return null;
    const [items] = await this.pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    orders[0].items = items;
    return orders[0];
  }

  async updateOrder(orderId, orderData) {
    const query = 'UPDATE orders SET order_number=?, order_date=?, supplier=?, status=? WHERE id=?';
    await this.pool.execute(query, [orderData.order_number, orderData.order_date, orderData.supplier, orderData.status, orderId]);
    return { success: true };
  }

  async deleteOrder(orderId) {
    await this.pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    return { success: true };
  }

  async close() {
    await this.pool.end();
    console.log('🔌 MySQL Verbindung geschlossen');
  }
}

module.exports = BiblioDatabase;
