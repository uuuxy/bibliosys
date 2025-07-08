<?php
/**
 * BiblioSys Configuration
 * Secure configuration management with environment variable support
 */

// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/.env')) {
    $envFile = file_get_contents(__DIR__ . '/.env');
    $lines = explode("\n", $envFile);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            if (!empty($key) && !isset($_ENV[$key])) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Database Configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'bibliosys');
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'bibliosys_user');
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '');

// Security Configuration
define('SESSION_SECRET', $_ENV['SESSION_SECRET'] ?? getenv('SESSION_SECRET') ?: 'change-this-secret-key');
define('CSRF_SECRET', $_ENV['CSRF_SECRET'] ?? getenv('CSRF_SECRET') ?: 'change-this-csrf-secret');
define('CSP_NONCE_SECRET', $_ENV['CSP_NONCE_SECRET'] ?? getenv('CSP_NONCE_SECRET') ?: 'change-this-nonce-secret');

// Application Settings
define('APP_DEBUG', filter_var($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN));
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');
define('APP_NAME', $_ENV['APP_NAME'] ?? getenv('APP_NAME') ?: 'BiblioSys');

// Security Settings
define('LOGIN_RATE_LIMIT', (int)($_ENV['LOGIN_RATE_LIMIT'] ?? getenv('LOGIN_RATE_LIMIT') ?: 5));
define('LOGIN_RATE_WINDOW', (int)($_ENV['LOGIN_RATE_WINDOW'] ?? getenv('LOGIN_RATE_WINDOW') ?: 900)); // 15 minutes

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', 1800); // 30 minutes
ini_set('session.name', 'BIBLIOSYS_SESSION');

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('UTC');

// Security Headers
function setSecurityHeaders($nonce = null) {
    // Prevent XSS
    header('X-XSS-Protection: 1; mode=block');
    
    // Prevent clickjacking
    header('X-Frame-Options: DENY');
    
    // Prevent MIME type sniffing
    header('X-Content-Type-Options: nosniff');
    
    // Referrer policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Content Security Policy
    $csp = "default-src 'self'; ";
    $csp .= "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; ";
    $csp .= "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; ";
    $csp .= "font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; ";
    $csp .= "img-src 'self' data:; ";
    $csp .= "connect-src 'self'; ";
    
    if ($nonce) {
        $csp = str_replace("'unsafe-inline'", "'nonce-$nonce'", $csp);
    }
    
    header("Content-Security-Policy: $csp");
    
    // HSTS (only if HTTPS)
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

// Generate CSP nonce
function generateCSPNonce() {
    return base64_encode(random_bytes(16));
}

// Configuration validation
function validateConfig() {
    $errors = [];
    
    // Check database configuration
    if (empty(DB_HOST) || empty(DB_NAME) || empty(DB_USER)) {
        $errors[] = 'Database configuration is incomplete';
    }
    
    // Check security secrets
    if (SESSION_SECRET === 'change-this-secret-key') {
        $errors[] = 'SESSION_SECRET must be changed in production';
    }
    
    if (CSRF_SECRET === 'change-this-csrf-secret') {
        $errors[] = 'CSRF_SECRET must be changed in production';
    }
    
    if (CSP_NONCE_SECRET === 'change-this-nonce-secret') {
        $errors[] = 'CSP_NONCE_SECRET must be changed in production';
    }
    
    // Check if running in production without debug
    if (APP_ENV === 'production' && APP_DEBUG) {
        $errors[] = 'Debug mode should be disabled in production';
    }
    
    return $errors;
}

// Log security events
function logSecurityEvent($event, $details = []) {
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $logEntry = [
        'timestamp' => $timestamp,
        'event' => $event,
        'ip' => $ip,
        'user_agent' => $userAgent,
        'details' => $details
    ];
    
    // In production, you might want to log to a file or database
    if (APP_DEBUG) {
        error_log('SECURITY: ' . json_encode($logEntry));
    }
}

// Database connection with error handling
function getDatabaseConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (APP_DEBUG) {
                throw new Exception('Database connection failed: ' . $e->getMessage());
            } else {
                throw new Exception('Database connection failed');
            }
        }
    }
    
    return $pdo;
}

// Validate configuration on load
$configErrors = validateConfig();
if (!empty($configErrors) && APP_ENV === 'production') {
    logSecurityEvent('config_validation_failed', $configErrors);
}
?>