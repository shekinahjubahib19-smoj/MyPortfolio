<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

ob_start();

try {
    include __DIR__ . '/../config/db.php';

    $query = "SELECT id, student_code, first_name, last_name, current_level, enrollment_status, created_at FROM students ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->execute();
    $result = $stmt->get_result();
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }

    $stray = ob_get_clean();
    if (!empty($stray)) {
        error_log('Stray output in list_students.php: ' . $stray);
    }
    echo json_encode(["success" => true, "students" => $students]);

} catch (Throwable $e) {
    $out = ob_get_clean();
    error_log('List students error: ' . $e->getMessage() . "\nOutput:\n" . $out);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage(), "debug_output" => $out]);
}

?>
