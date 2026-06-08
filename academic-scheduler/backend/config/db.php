<?php
// CORS headers FIRST — so even error responses include them
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Central DB connection — load .env from the backend root
if (!function_exists('loadEnv')) {
    function loadEnv($path) {
        if (!file_exists($path)) return false;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) < 2) continue;
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
        return true;
    }
}

loadEnv(__DIR__ . '/../.env');

if (
    empty($_ENV['DB_HOST']) ||
    empty($_ENV['DB_USER']) ||
    empty($_ENV['DB_NAME'])
) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server misconfiguration: missing database environment variables.']);
    error_log('Missing DB env vars in config/db.php');
    exit;
}

$conn = new mysqli(
    $_ENV['DB_HOST'],
    $_ENV['DB_USER'],
    $_ENV['DB_PASS'] ?? '',
    $_ENV['DB_NAME'],
    intval($_ENV['DB_PORT'] ?? '3306')
);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Check your .env settings on the server.']);
    error_log('DB connect error: ' . $conn->connect_error);
    exit;
}