<?php
/**
 * BiblioSys API Endpoints
 * Secure API with authentication, input validation, and comprehensive security
 */

require_once 'config.php';

// Start session
session_start();

// Set security headers
$nonce = generateCSPNonce();
setSecurityHeaders($nonce);

// Set JSON content type
header('Content-Type: application/json');

// CSRF Token Management
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Rate Limiting
function checkRateLimit($key, $limit = LOGIN_RATE_LIMIT, $window = LOGIN_RATE_WINDOW) {
    $currentTime = time();
    $windowStart = $currentTime - $window;
    
    // Clean up old entries
    if (!isset($_SESSION['rate_limits'])) {
        $_SESSION['rate_limits'] = [];
    }
    
    if (!isset($_SESSION['rate_limits'][$key])) {
        $_SESSION['rate_limits'][$key] = [];
    }
    
    // Remove old attempts
    $_SESSION['rate_limits'][$key] = array_filter(
        $_SESSION['rate_limits'][$key], 
        function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        }
    );
    
    // Check if limit exceeded
    if (count($_SESSION['rate_limits'][$key]) >= $limit) {
        return false;
    }
    
    // Add current attempt
    $_SESSION['rate_limits'][$key][] = $currentTime;
    return true;
}

// Input Validation and Sanitization
function validateInput($data, $rules) {
    $errors = [];
    $sanitized = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        
        // Check required fields
        if ($rule['required'] && empty($value)) {
            $errors[] = "$field is required";
            continue;
        }
        
        if (!empty($value)) {
            // Sanitize input
            $value = trim($value);
            
            // Type validation
            switch ($rule['type']) {
                case 'string':
                    $value = filter_var($value, FILTER_SANITIZE_STRING);
                    if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
                        $errors[] = "$field must be max {$rule['max_length']} characters";
                    }
                    if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
                        $errors[] = "$field must be min {$rule['min_length']} characters";
                    }
                    break;
                    
                case 'email':
                    $value = filter_var($value, FILTER_SANITIZE_EMAIL);
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = "$field must be a valid email";
                    }
                    break;
                    
                case 'int':
                    $value = filter_var($value, FILTER_VALIDATE_INT);
                    if ($value === false) {
                        $errors[] = "$field must be a valid integer";
                    }
                    break;
                    
                case 'float':
                    $value = filter_var($value, FILTER_VALIDATE_FLOAT);
                    if ($value === false) {
                        $errors[] = "$field must be a valid number";
                    }
                    break;
                    
                case 'alphanumeric':
                    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $value)) {
                        $errors[] = "$field must contain only alphanumeric characters, underscores, and hyphens";
                    }
                    break;
                    
                case 'isbn':
                    $value = preg_replace('/[^0-9X]/', '', $value);
                    if (!preg_match('/^[0-9]{9}[0-9X]$|^[0-9]{13}$/', $value)) {
                        $errors[] = "$field must be a valid ISBN";
                    }
                    break;
            }
            
            // Pattern validation
            if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
                $errors[] = "$field format is invalid";
            }
        }
        
        $sanitized[$field] = $value;
    }
    
    return ['errors' => $errors, 'data' => $sanitized];
}

// Safe output encoding
function safeOutput($data) {
    if (is_array($data)) {
        return array_map('safeOutput', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

// Authentication Functions
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    try {
        $pdo = getDatabaseConnection();
        $stmt = $pdo->prepare("SELECT id, username, email, role, last_login FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        logSecurityEvent('database_error', ['error' => $e->getMessage()]);
        return null;
    }
}

function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }
    return $user;
}

function requireRole($allowedRoles) {
    $user = requireAuth();
    if (!in_array($user['role'], (array)$allowedRoles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Insufficient permissions']);
        exit;
    }
    return $user;
}

// Handle Login
function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return ['success' => false, 'message' => 'Method not allowed'];
    }
    
    // Rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit("login_$clientIP")) {
        logSecurityEvent('login_rate_limit_exceeded', ['ip' => $clientIP]);
        http_response_code(429);
        return ['success' => false, 'message' => 'Too many login attempts. Please try again later.'];
    }
    
    // Validate input
    $validation = validateInput($_POST, [
        'username' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'password' => ['required' => true, 'type' => 'string', 'max_length' => 255],
        'csrf_token' => ['required' => true, 'type' => 'string']
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    // Validate CSRF token
    if (!validateCSRFToken($validation['data']['csrf_token'])) {
        logSecurityEvent('csrf_validation_failed', ['ip' => $clientIP]);
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        // Check if user exists and is active
        $stmt = $pdo->prepare("
            SELECT id, username, password_hash, role, failed_login_attempts, locked_until 
            FROM users 
            WHERE username = ? AND is_active = 1
        ");
        $stmt->execute([$validation['data']['username']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            logSecurityEvent('login_failed', ['username' => $validation['data']['username'], 'reason' => 'user_not_found']);
            return ['success' => false, 'message' => 'Invalid username or password'];
        }
        
        // Check if account is locked
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            logSecurityEvent('login_failed', ['username' => $validation['data']['username'], 'reason' => 'account_locked']);
            return ['success' => false, 'message' => 'Account is temporarily locked'];
        }
        
        // Verify password
        if (!verifyPassword($validation['data']['password'], $user['password_hash'])) {
            // Increment failed attempts
            $stmt = $pdo->prepare("UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Lock account after 5 failed attempts
            if ($user['failed_login_attempts'] >= 4) {
                $lockUntil = date('Y-m-d H:i:s', time() + 1800); // 30 minutes
                $stmt = $pdo->prepare("UPDATE users SET locked_until = ? WHERE id = ?");
                $stmt->execute([$lockUntil, $user['id']]);
            }
            
            logSecurityEvent('login_failed', ['username' => $validation['data']['username'], 'reason' => 'invalid_password']);
            return ['success' => false, 'message' => 'Invalid username or password'];
        }
        
        // Successful login
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        
        // Reset failed attempts and update last login
        $stmt = $pdo->prepare("
            UPDATE users 
            SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        
        // Create session record
        $sessionId = session_id();
        $stmt = $pdo->prepare("
            INSERT INTO sessions (session_id, user_id, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            last_activity = NOW(), expires_at = ?
        ");
        $expiresAt = date('Y-m-d H:i:s', time() + 1800);
        $stmt->execute([
            $sessionId,
            $user['id'],
            $clientIP,
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $expiresAt,
            $expiresAt
        ]);
        
        // Generate new CSRF token
        unset($_SESSION['csrf_token']);
        $newToken = generateCSRFToken();
        
        logSecurityEvent('login_successful', ['username' => $validation['data']['username']]);
        
        return [
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ],
            'csrf_token' => $newToken
        ];
        
    } catch (PDOException $e) {
        logSecurityEvent('login_database_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'System error occurred'];
    }
}

// Handle Logout
function handleLogout() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return ['success' => false, 'message' => 'Method not allowed'];
    }
    
    $user = getCurrentUser();
    if ($user) {
        try {
            $pdo = getDatabaseConnection();
            
            // Remove session from database
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE session_id = ?");
            $stmt->execute([session_id()]);
            
            logSecurityEvent('logout_successful', ['username' => $user['username']]);
        } catch (PDOException $e) {
            logSecurityEvent('logout_database_error', ['error' => $e->getMessage()]);
        }
    }
    
    // Clear session
    $_SESSION = [];
    session_destroy();
    
    return ['success' => true, 'message' => 'Logout successful'];
}

// Handle Check Session
function handleCheckSession() {
    $user = getCurrentUser();
    
    if (!$user) {
        return ['success' => false, 'message' => 'Not authenticated'];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        // Update session activity
        $stmt = $pdo->prepare("
            UPDATE sessions 
            SET last_activity = NOW(), expires_at = ? 
            WHERE session_id = ? AND user_id = ?
        ");
        $expiresAt = date('Y-m-d H:i:s', time() + 1800);
        $stmt->execute([$expiresAt, session_id(), $user['id']]);
        
        // Get user permissions/capabilities based on role
        $permissions = [];
        switch ($user['role']) {
            case 'admin':
                $permissions = ['manage_users', 'manage_students', 'manage_books', 'manage_lending', 'view_reports'];
                break;
            case 'librarian':
                $permissions = ['manage_students', 'manage_books', 'manage_lending', 'view_reports'];
                break;
            case 'user':
                $permissions = ['view_students', 'view_books', 'view_lending'];
                break;
        }
        
        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'permissions' => $permissions,
                'last_login' => $user['last_login']
            ],
            'csrf_token' => generateCSRFToken()
        ];
        
    } catch (PDOException $e) {
        logSecurityEvent('session_check_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Session validation failed'];
    }
}

// Student Management
function handleStudents() {
    $user = requireAuth();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            return getStudents();
        case 'POST':
            requireRole(['admin', 'librarian']);
            return createStudent();
        case 'PUT':
            requireRole(['admin', 'librarian']);
            return updateStudent();
        case 'DELETE':
            requireRole(['admin', 'librarian']);
            return deleteStudent();
        default:
            http_response_code(405);
            return ['success' => false, 'message' => 'Method not allowed'];
    }
}

function getStudents() {
    try {
        $pdo = getDatabaseConnection();
        
        $search = $_GET['search'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $whereClause = "WHERE is_active = 1";
        $params = [];
        
        if ($search) {
            $whereClause .= " AND (student_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            $searchParam = "%$search%";
            $params = [$searchParam, $searchParam, $searchParam, $searchParam];
        }
        
        // Get total count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students $whereClause");
        $stmt->execute($params);
        $totalCount = $stmt->fetchColumn();
        
        // Get students
        $stmt = $pdo->prepare("
            SELECT id, student_id, first_name, last_name, email, phone, class, created_at, updated_at
            FROM students 
            $whereClause 
            ORDER BY last_name, first_name 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([...$params, $limit, $offset]);
        $students = $stmt->fetchAll();
        
        return [
            'success' => true,
            'data' => safeOutput($students),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalCount,
                'pages' => ceil($totalCount / $limit)
            ]
        ];
        
    } catch (PDOException $e) {
        logSecurityEvent('students_fetch_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error fetching students'];
    }
}

function createStudent() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'student_id' => ['required' => true, 'type' => 'alphanumeric', 'max_length' => 20],
        'first_name' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'last_name' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'email' => ['required' => true, 'type' => 'email', 'max_length' => 100],
        'phone' => ['required' => false, 'type' => 'string', 'max_length' => 20],
        'class' => ['required' => true, 'type' => 'string', 'max_length' => 20]
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO students (student_id, first_name, last_name, email, phone, class)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $validation['data']['student_id'],
            $validation['data']['first_name'],
            $validation['data']['last_name'],
            $validation['data']['email'],
            $validation['data']['phone'],
            $validation['data']['class']
        ]);
        
        $studentId = $pdo->lastInsertId();
        
        logSecurityEvent('student_created', ['student_id' => $validation['data']['student_id']]);
        
        return [
            'success' => true,
            'message' => 'Student created successfully',
            'student_id' => $studentId
        ];
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            return ['success' => false, 'message' => 'Student ID or email already exists'];
        }
        logSecurityEvent('student_creation_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error creating student'];
    }
}

function updateStudent() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'id' => ['required' => true, 'type' => 'int'],
        'student_id' => ['required' => true, 'type' => 'alphanumeric', 'max_length' => 20],
        'first_name' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'last_name' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'email' => ['required' => true, 'type' => 'email', 'max_length' => 100],
        'phone' => ['required' => false, 'type' => 'string', 'max_length' => 20],
        'class' => ['required' => true, 'type' => 'string', 'max_length' => 20]
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        $stmt = $pdo->prepare("
            UPDATE students 
            SET student_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, class = ?
            WHERE id = ? AND is_active = 1
        ");
        
        $stmt->execute([
            $validation['data']['student_id'],
            $validation['data']['first_name'],
            $validation['data']['last_name'],
            $validation['data']['email'],
            $validation['data']['phone'],
            $validation['data']['class'],
            $validation['data']['id']
        ]);
        
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'message' => 'Student not found'];
        }
        
        logSecurityEvent('student_updated', ['student_id' => $validation['data']['id']]);
        
        return ['success' => true, 'message' => 'Student updated successfully'];
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            return ['success' => false, 'message' => 'Student ID or email already exists'];
        }
        logSecurityEvent('student_update_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error updating student'];
    }
}

function deleteStudent() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'id' => ['required' => true, 'type' => 'int']
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        // Soft delete - just mark as inactive
        $stmt = $pdo->prepare("UPDATE students SET is_active = 0 WHERE id = ?");
        $stmt->execute([$validation['data']['id']]);
        
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'message' => 'Student not found'];
        }
        
        logSecurityEvent('student_deleted', ['student_id' => $validation['data']['id']]);
        
        return ['success' => true, 'message' => 'Student deleted successfully'];
        
    } catch (PDOException $e) {
        logSecurityEvent('student_deletion_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error deleting student'];
    }
}

// Book Management (similar pattern to students)
function handleBooks() {
    $user = requireAuth();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            return getBooks();
        case 'POST':
            requireRole(['admin', 'librarian']);
            return createBook();
        case 'PUT':
            requireRole(['admin', 'librarian']);
            return updateBook();
        case 'DELETE':
            requireRole(['admin', 'librarian']);
            return deleteBook();
        default:
            http_response_code(405);
            return ['success' => false, 'message' => 'Method not allowed'];
    }
}

function getBooks() {
    try {
        $pdo = getDatabaseConnection();
        
        $search = $_GET['search'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $whereClause = "WHERE is_active = 1";
        $params = [];
        
        if ($search) {
            $whereClause .= " AND (isbn LIKE ? OR title LIKE ? OR author LIKE ? OR category LIKE ?)";
            $searchParam = "%$search%";
            $params = [$searchParam, $searchParam, $searchParam, $searchParam];
        }
        
        // Get total count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM books $whereClause");
        $stmt->execute($params);
        $totalCount = $stmt->fetchColumn();
        
        // Get books
        $stmt = $pdo->prepare("
            SELECT id, isbn, title, author, publisher, publication_year, category, 
                   total_copies, available_copies, created_at, updated_at
            FROM books 
            $whereClause 
            ORDER BY title 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([...$params, $limit, $offset]);
        $books = $stmt->fetchAll();
        
        return [
            'success' => true,
            'data' => safeOutput($books),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalCount,
                'pages' => ceil($totalCount / $limit)
            ]
        ];
        
    } catch (PDOException $e) {
        logSecurityEvent('books_fetch_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error fetching books'];
    }
}

function createBook() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'isbn' => ['required' => true, 'type' => 'isbn', 'max_length' => 20],
        'title' => ['required' => true, 'type' => 'string', 'max_length' => 200],
        'author' => ['required' => true, 'type' => 'string', 'max_length' => 100],
        'publisher' => ['required' => false, 'type' => 'string', 'max_length' => 100],
        'publication_year' => ['required' => false, 'type' => 'int'],
        'category' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'total_copies' => ['required' => true, 'type' => 'int']
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO books (isbn, title, author, publisher, publication_year, category, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $totalCopies = $validation['data']['total_copies'];
        
        $stmt->execute([
            $validation['data']['isbn'],
            $validation['data']['title'],
            $validation['data']['author'],
            $validation['data']['publisher'],
            $validation['data']['publication_year'],
            $validation['data']['category'],
            $totalCopies,
            $totalCopies
        ]);
        
        $bookId = $pdo->lastInsertId();
        
        logSecurityEvent('book_created', ['isbn' => $validation['data']['isbn']]);
        
        return [
            'success' => true,
            'message' => 'Book created successfully',
            'book_id' => $bookId
        ];
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            return ['success' => false, 'message' => 'ISBN already exists'];
        }
        logSecurityEvent('book_creation_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error creating book'];
    }
}

function updateBook() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'id' => ['required' => true, 'type' => 'int'],
        'isbn' => ['required' => true, 'type' => 'isbn', 'max_length' => 20],
        'title' => ['required' => true, 'type' => 'string', 'max_length' => 200],
        'author' => ['required' => true, 'type' => 'string', 'max_length' => 100],
        'publisher' => ['required' => false, 'type' => 'string', 'max_length' => 100],
        'publication_year' => ['required' => false, 'type' => 'int'],
        'category' => ['required' => true, 'type' => 'string', 'max_length' => 50],
        'total_copies' => ['required' => true, 'type' => 'int']
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        // Get current available copies
        $stmt = $pdo->prepare("SELECT available_copies FROM books WHERE id = ? AND is_active = 1");
        $stmt->execute([$validation['data']['id']]);
        $currentBook = $stmt->fetch();
        
        if (!$currentBook) {
            return ['success' => false, 'message' => 'Book not found'];
        }
        
        // Calculate new available copies
        $newAvailableCopies = $currentBook['available_copies'] + 
                             ($validation['data']['total_copies'] - $currentBook['available_copies']);
        
        if ($newAvailableCopies < 0) {
            return ['success' => false, 'message' => 'Cannot reduce total copies below borrowed copies'];
        }
        
        $stmt = $pdo->prepare("
            UPDATE books 
            SET isbn = ?, title = ?, author = ?, publisher = ?, publication_year = ?, 
                category = ?, total_copies = ?, available_copies = ?
            WHERE id = ? AND is_active = 1
        ");
        
        $stmt->execute([
            $validation['data']['isbn'],
            $validation['data']['title'],
            $validation['data']['author'],
            $validation['data']['publisher'],
            $validation['data']['publication_year'],
            $validation['data']['category'],
            $validation['data']['total_copies'],
            $newAvailableCopies,
            $validation['data']['id']
        ]);
        
        logSecurityEvent('book_updated', ['book_id' => $validation['data']['id']]);
        
        return ['success' => true, 'message' => 'Book updated successfully'];
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            return ['success' => false, 'message' => 'ISBN already exists'];
        }
        logSecurityEvent('book_update_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error updating book'];
    }
}

function deleteBook() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'id' => ['required' => true, 'type' => 'int']
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        // Check if book has active loans
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM lending WHERE book_id = ? AND status = 'borrowed'");
        $stmt->execute([$validation['data']['id']]);
        $activeLoanCount = $stmt->fetchColumn();
        
        if ($activeLoanCount > 0) {
            return ['success' => false, 'message' => 'Cannot delete book with active loans'];
        }
        
        // Soft delete - just mark as inactive
        $stmt = $pdo->prepare("UPDATE books SET is_active = 0 WHERE id = ?");
        $stmt->execute([$validation['data']['id']]);
        
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'message' => 'Book not found'];
        }
        
        logSecurityEvent('book_deleted', ['book_id' => $validation['data']['id']]);
        
        return ['success' => true, 'message' => 'Book deleted successfully'];
        
    } catch (PDOException $e) {
        logSecurityEvent('book_deletion_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error deleting book'];
    }
}

// Lending Management
function handleLending() {
    $user = requireAuth();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            return getLending();
        case 'POST':
            requireRole(['admin', 'librarian']);
            return createLending();
        case 'PUT':
            requireRole(['admin', 'librarian']);
            return returnBook();
        default:
            http_response_code(405);
            return ['success' => false, 'message' => 'Method not allowed'];
    }
}

function getLending() {
    try {
        $pdo = getDatabaseConnection();
        
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $whereClause = "WHERE 1=1";
        $params = [];
        
        if ($search) {
            $whereClause .= " AND (s.student_id LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR b.title LIKE ?)";
            $searchParam = "%$search%";
            $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
        }
        
        if ($status) {
            $whereClause .= " AND l.status = ?";
            $params[] = $status;
        }
        
        // Get total count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM lending l 
            JOIN students s ON l.student_id = s.id 
            JOIN books b ON l.book_id = b.id 
            $whereClause
        ");
        $stmt->execute($params);
        $totalCount = $stmt->fetchColumn();
        
        // Get lending records
        $stmt = $pdo->prepare("
            SELECT l.id, l.borrowed_at, l.due_date, l.returned_at, l.status, l.notes,
                   s.student_id, s.first_name, s.last_name,
                   b.title, b.author, b.isbn,
                   u.username as returned_by_username
            FROM lending l
            JOIN students s ON l.student_id = s.id
            JOIN books b ON l.book_id = b.id
            LEFT JOIN users u ON l.returned_by = u.id
            $whereClause
            ORDER BY l.borrowed_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([...$params, $limit, $offset]);
        $lending = $stmt->fetchAll();
        
        return [
            'success' => true,
            'data' => safeOutput($lending),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalCount,
                'pages' => ceil($totalCount / $limit)
            ]
        ];
        
    } catch (PDOException $e) {
        logSecurityEvent('lending_fetch_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error fetching lending records'];
    }
}

function createLending() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'student_id' => ['required' => true, 'type' => 'int'],
        'book_id' => ['required' => true, 'type' => 'int'],
        'due_date' => ['required' => true, 'type' => 'string'], // Will validate as date
        'notes' => ['required' => false, 'type' => 'string', 'max_length' => 500]
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    // Validate due date
    $dueDate = DateTime::createFromFormat('Y-m-d', $validation['data']['due_date']);
    if (!$dueDate || $dueDate->format('Y-m-d') !== $validation['data']['due_date']) {
        return ['success' => false, 'message' => 'Invalid due date format'];
    }
    
    if ($dueDate <= new DateTime()) {
        return ['success' => false, 'message' => 'Due date must be in the future'];
    }
    
    try {
        $pdo = getDatabaseConnection();
        $pdo->beginTransaction();
        
        // Check if book is available
        $stmt = $pdo->prepare("SELECT available_copies FROM books WHERE id = ? AND is_active = 1");
        $stmt->execute([$validation['data']['book_id']]);
        $book = $stmt->fetch();
        
        if (!$book) {
            $pdo->rollback();
            return ['success' => false, 'message' => 'Book not found'];
        }
        
        if ($book['available_copies'] <= 0) {
            $pdo->rollback();
            return ['success' => false, 'message' => 'No copies available'];
        }
        
        // Check if student exists
        $stmt = $pdo->prepare("SELECT id FROM students WHERE id = ? AND is_active = 1");
        $stmt->execute([$validation['data']['student_id']]);
        if (!$stmt->fetch()) {
            $pdo->rollback();
            return ['success' => false, 'message' => 'Student not found'];
        }
        
        // Check if student already has this book
        $stmt = $pdo->prepare("
            SELECT id FROM lending 
            WHERE student_id = ? AND book_id = ? AND status = 'borrowed'
        ");
        $stmt->execute([$validation['data']['student_id'], $validation['data']['book_id']]);
        if ($stmt->fetch()) {
            $pdo->rollback();
            return ['success' => false, 'message' => 'Student already has this book'];
        }
        
        // Create lending record
        $stmt = $pdo->prepare("
            INSERT INTO lending (student_id, book_id, due_date, notes)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $validation['data']['student_id'],
            $validation['data']['book_id'],
            $validation['data']['due_date'],
            $validation['data']['notes']
        ]);
        
        $lendingId = $pdo->lastInsertId();
        
        // Update book available copies
        $stmt = $pdo->prepare("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?");
        $stmt->execute([$validation['data']['book_id']]);
        
        $pdo->commit();
        
        logSecurityEvent('book_borrowed', [
            'lending_id' => $lendingId,
            'student_id' => $validation['data']['student_id'],
            'book_id' => $validation['data']['book_id']
        ]);
        
        return [
            'success' => true,
            'message' => 'Book borrowed successfully',
            'lending_id' => $lendingId
        ];
        
    } catch (PDOException $e) {
        $pdo->rollback();
        logSecurityEvent('lending_creation_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error creating lending record'];
    }
}

function returnBook() {
    // Validate CSRF token
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        return ['success' => false, 'message' => 'Security validation failed'];
    }
    
    $validation = validateInput($_POST, [
        'lending_id' => ['required' => true, 'type' => 'int'],
        'notes' => ['required' => false, 'type' => 'string', 'max_length' => 500]
    ]);
    
    if (!empty($validation['errors'])) {
        return ['success' => false, 'message' => 'Invalid input', 'errors' => $validation['errors']];
    }
    
    try {
        $pdo = getDatabaseConnection();
        $pdo->beginTransaction();
        
        // Get lending record
        $stmt = $pdo->prepare("
            SELECT l.id, l.book_id, l.student_id, l.status 
            FROM lending l 
            WHERE l.id = ? AND l.status = 'borrowed'
        ");
        $stmt->execute([$validation['data']['lending_id']]);
        $lending = $stmt->fetch();
        
        if (!$lending) {
            $pdo->rollback();
            return ['success' => false, 'message' => 'Lending record not found or already returned'];
        }
        
        // Update lending record
        $stmt = $pdo->prepare("
            UPDATE lending 
            SET returned_at = NOW(), returned_by = ?, status = 'returned', notes = CONCAT(COALESCE(notes, ''), ?)
            WHERE id = ?
        ");
        $returnNote = $validation['data']['notes'] ? "\nReturned: " . $validation['data']['notes'] : '';
        $stmt->execute([
            $_SESSION['user_id'],
            $returnNote,
            $validation['data']['lending_id']
        ]);
        
        // Update book available copies
        $stmt = $pdo->prepare("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?");
        $stmt->execute([$lending['book_id']]);
        
        $pdo->commit();
        
        logSecurityEvent('book_returned', [
            'lending_id' => $validation['data']['lending_id'],
            'student_id' => $lending['student_id'],
            'book_id' => $lending['book_id']
        ]);
        
        return ['success' => true, 'message' => 'Book returned successfully'];
        
    } catch (PDOException $e) {
        $pdo->rollback();
        logSecurityEvent('book_return_error', ['error' => $e->getMessage()]);
        return ['success' => false, 'message' => 'Error returning book'];
    }
}

// Main request handler
try {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'login':
            $result = handleLogin();
            break;
        case 'logout':
            $result = handleLogout();
            break;
        case 'check_session':
            $result = handleCheckSession();
            break;
        case 'students':
            $result = handleStudents();
            break;
        case 'books':
            $result = handleBooks();
            break;
        case 'lending':
            $result = handleLending();
            break;
        case 'csrf_token':
            $result = ['success' => true, 'csrf_token' => generateCSRFToken()];
            break;
        default:
            http_response_code(404);
            $result = ['success' => false, 'message' => 'Action not found'];
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    logSecurityEvent('api_error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}
?>