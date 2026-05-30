<?php
// Admin helper: convert empty-string teacher_email to NULL to avoid UNIQUE '' collisions
// Safe include of backend/db.php (parent directory)
$dbPath = realpath(__DIR__ . '/../db.php');
if (!$dbPath || !file_exists($dbPath)) {
    echo "Error: backend/db.php not found at expected path: " . (__DIR__ . '/../db.php') . "\n";
    exit(1);
}
include_once $dbPath;

if (!isset($conn) || !$conn) {
    echo "Error: database connection not available after including db.php\n";
    exit(1);
}

$cnt = 0;
$res = $conn->query("UPDATE teacher_profiles SET teacher_email = NULL WHERE teacher_email = ''");
if ($res === false) {
    echo "Error executing update: " . $conn->error . "\n";
    exit(1);
}
$cnt = $conn->affected_rows;
echo "Converted empty teacher_email to NULL. Rows affected: " . $cnt . "\n";
?>