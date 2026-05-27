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

    $raw = file_get_contents('php://input');
    $data = json_decode($raw);
    if (!$data) throw new Exception('Invalid or missing JSON body');

    $id = $data->id ?? null;
    if (!$id) {
        echo json_encode(["success" => false, "message" => "Missing student id"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in delete_student.php: ' . $stray);
        echo json_encode(["success" => true, "message" => "Student deleted"]);
    } else {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in delete_student.php (error path): ' . $stray);
        echo json_encode(["success" => false, "message" => "Delete failed: " . $conn->error]);
    }

} catch (Throwable $e) {
    $out = ob_get_clean();
    error_log('Delete student error: ' . $e->getMessage() . "\nOutput:\n" . $out);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage(), "debug_output" => $out]);
}

?>
