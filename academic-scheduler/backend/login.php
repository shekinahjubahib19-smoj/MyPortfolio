<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Handle preflight OPTIONS request — return 200 without body
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/controllers/auth.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
