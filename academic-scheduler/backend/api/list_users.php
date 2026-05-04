<?php
// API endpoint: list users
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

try {
    include __DIR__ . '/../db.php';
    $res = $conn->query("SELECT id, username, role, is_profile_complete, created_at FROM users ORDER BY id DESC LIMIT 100");
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = $r;
    }
    echo json_encode(['success' => true, 'count' => count($rows), 'users' => $rows]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
