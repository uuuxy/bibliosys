<?php
/**
 * BiblioSys Installation Script
 * Secure database setup with proper error handling
 */

require_once 'config.php';

// Set security headers
setSecurityHeaders();

// Only allow installation if not already installed
if (file_exists('.installed')) {
    die('BiblioSys is already installed. Delete .installed file to reinstall.');
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Validate configuration
        $configErrors = validateConfig();
        if (!empty($configErrors)) {
            throw new Exception('Configuration errors: ' . implode(', ', $configErrors));
        }
        
        // Create database connection
        $pdo = getDatabaseConnection();
        
        // Create users table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role ENUM('admin', 'librarian', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                failed_login_attempts INT DEFAULT 0,
                locked_until TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        ");
        
        // Create students table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                class VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        ");
        
        // Create books table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                isbn VARCHAR(20) UNIQUE NOT NULL,
                title VARCHAR(200) NOT NULL,
                author VARCHAR(100) NOT NULL,
                publisher VARCHAR(100),
                publication_year INT,
                category VARCHAR(50),
                total_copies INT DEFAULT 1,
                available_copies INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        ");
        
        // Create lending table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS lending (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                book_id INT NOT NULL,
                borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                due_date DATE NOT NULL,
                returned_at TIMESTAMP NULL,
                returned_by INT NULL,
                status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY (returned_by) REFERENCES users(id) ON DELETE SET NULL
            )
        ");
        
        // Create sessions table for session management
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) PRIMARY KEY,
                user_id INT NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        // Create security_logs table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS security_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                user_id INT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ");
        
        // Create default admin user
        $adminUsername = $_POST['admin_username'] ?? 'admin';
        $adminPassword = $_POST['admin_password'] ?? '';
        $adminEmail = $_POST['admin_email'] ?? 'admin@bibliosys.local';
        
        if (empty($adminPassword)) {
            throw new Exception('Admin password is required');
        }
        
        if (strlen($adminPassword) < 8) {
            throw new Exception('Admin password must be at least 8 characters long');
        }
        
        $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password_hash, email, role) 
            VALUES (?, ?, ?, 'admin')
        ");
        $stmt->execute([$adminUsername, $passwordHash, $adminEmail]);
        
        // Create sample data
        if (isset($_POST['create_sample_data'])) {
            // Sample students
            $sampleStudents = [
                ['STU001', 'John', 'Doe', 'john.doe@school.edu', '123-456-7890', 'Grade 10'],
                ['STU002', 'Jane', 'Smith', 'jane.smith@school.edu', '123-456-7891', 'Grade 11'],
                ['STU003', 'Bob', 'Johnson', 'bob.johnson@school.edu', '123-456-7892', 'Grade 9']
            ];
            
            $stmt = $pdo->prepare("
                INSERT INTO students (student_id, first_name, last_name, email, phone, class) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($sampleStudents as $student) {
                $stmt->execute($student);
            }
            
            // Sample books
            $sampleBooks = [
                ['978-0-123456-78-9', 'Introduction to Computer Science', 'Dr. Alice Brown', 'Tech Publications', 2023, 'Computer Science', 5, 5],
                ['978-0-123456-79-0', 'Modern Literature', 'Prof. Charlie Davis', 'Literary Press', 2022, 'Literature', 3, 3],
                ['978-0-123456-80-6', 'Advanced Mathematics', 'Dr. Diana Wilson', 'Math Publishers', 2023, 'Mathematics', 4, 4]
            ];
            
            $stmt = $pdo->prepare("
                INSERT INTO books (isbn, title, author, publisher, publication_year, category, total_copies, available_copies) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($sampleBooks as $book) {
                $stmt->execute($book);
            }
        }
        
        // Mark installation as complete
        file_put_contents('.installed', date('Y-m-d H:i:s'));
        
        $message = 'BiblioSys has been successfully installed!';
        
        // Log successful installation
        logSecurityEvent('installation_completed', [
            'admin_username' => $adminUsername,
            'sample_data' => isset($_POST['create_sample_data'])
        ]);
        
    } catch (Exception $e) {
        $error = 'Installation failed: ' . $e->getMessage();
        logSecurityEvent('installation_failed', ['error' => $e->getMessage()]);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BiblioSys Installation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <style>
        .install-container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #007bff;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="install-container">
            <div class="logo">
                <h1>📚 BiblioSys</h1>
                <p class="text-muted">School Library Management System</p>
            </div>
            
            <?php if ($message): ?>
                <div class="alert alert-success">
                    <?php echo htmlspecialchars($message); ?>
                    <br><br>
                    <a href="index.html" class="btn btn-primary">Go to Application</a>
                </div>
            <?php elseif ($error): ?>
                <div class="alert alert-danger">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            
            <?php if (!$message): ?>
                <form method="POST" action="">
                    <div class="mb-3">
                        <label for="admin_username" class="form-label">Admin Username</label>
                        <input type="text" class="form-control" id="admin_username" name="admin_username" value="admin" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="admin_password" class="form-label">Admin Password</label>
                        <input type="password" class="form-control" id="admin_password" name="admin_password" required>
                        <div class="form-text">Password must be at least 8 characters long</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="admin_email" class="form-label">Admin Email</label>
                        <input type="email" class="form-control" id="admin_email" name="admin_email" value="admin@bibliosys.local" required>
                    </div>
                    
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="create_sample_data" name="create_sample_data" checked>
                        <label class="form-check-label" for="create_sample_data">
                            Create sample data (students and books)
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-100">Install BiblioSys</button>
                </form>
                
                <div class="mt-4">
                    <h5>Prerequisites:</h5>
                    <ul>
                        <li>PHP 7.4 or higher</li>
                        <li>MySQL 5.7 or higher</li>
                        <li>PDO MySQL extension</li>
                        <li>Configured .env file</li>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
</body>
</html>