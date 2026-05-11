<?php
// Idempotent migration runner: adds `level` column to `subjects` if missing.
// Run in browser: http://localhost/Portfolio/academic-scheduler/backend/migrations/run_add_level.php
// Or run via PHP CLI: php backend/migrations/run_add_level.php

error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/../config/db.php';

    $dbName = $_ENV['DB_NAME'] ?? null;
    if (!$dbName) throw new Exception('DB_NAME not set in environment');

    // Check if column exists
    $sql = "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'level'";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('s', $dbName);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $exists = intval($row['cnt']) > 0;

    if ($exists) {
        echo json_encode(['success' => true, 'message' => 'Column `level` already exists']);
        exit;
    }

    // Add column
    $alter = "ALTER TABLE subjects ADD COLUMN level VARCHAR(50) AFTER subject_code";
    if ($conn->query($alter) === TRUE) {
        echo json_encode(['success' => true, 'message' => 'Column `level` added']);
        exit;
    }

    throw new Exception('Alter failed: ' . $conn->error);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
