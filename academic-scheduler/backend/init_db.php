<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load simple .env parser
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

loadEnv(__DIR__ . '/.env');

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';
$port = $_ENV['DB_PORT'] ?? 3306;
$dbName = $_ENV['DB_NAME'] ?? 'academic_scheduler';

try {
    // connect without specifying database so we can create it
    $conn = new mysqli($host, $user, $pass, '', (int)$port);
    if ($conn->connect_error) throw new Exception('Connect error: ' . $conn->connect_error);

    // create database if missing
    if (!$conn->query("CREATE DATABASE IF NOT EXISTS `" . $conn->real_escape_string($dbName) . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")) {
        throw new Exception('Create DB failed: ' . $conn->error);
    }

    // select database
    if (!$conn->select_db($dbName)) throw new Exception('Select DB failed: ' . $conn->error);

    // create users table
    $createUsers = "CREATE TABLE IF NOT EXISTS `users` (
      `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      `username` VARCHAR(191) NOT NULL UNIQUE,
      `password_hash` VARCHAR(255) NOT NULL,
      `role` VARCHAR(32) NOT NULL DEFAULT 'TEACHER',
      `is_profile_complete` TINYINT(1) NOT NULL DEFAULT 0,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    if (!$conn->query($createUsers)) {
        throw new Exception('Create users table failed: ' . $conn->error);
    }

    echo json_encode(['ok' => true, 'message' => 'Database and users table ready', 'db' => $dbName]);
    $conn->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

?>
