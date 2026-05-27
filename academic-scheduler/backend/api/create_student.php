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

    $student_code = trim($data->student_code ?? '');
    $first_name = trim($data->first_name ?? '');
    $last_name = trim($data->last_name ?? '');
    $current_level = trim($data->current_level ?? '');
    $enrollment_status = trim($data->enrollment_status ?? 'Active');

    if ($student_code === '' || $first_name === '' || $last_name === '') {
        echo json_encode(["success" => false, "message" => "Student code, first name and last name are required."]);
        exit;
    }

    // Prevent duplicate student code
    $checkQ = "SELECT id FROM students WHERE student_code = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkQ);
    if (!$checkStmt) throw new Exception('Prepare failed: ' . $conn->error);
    $checkStmt->bind_param('s', $student_code);
    $checkStmt->execute();
    $checkRes = $checkStmt->get_result();
    if ($checkRes->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Student code already exists."]);
        exit;
    }

    $query = "INSERT INTO students (student_code, first_name, last_name, current_level, enrollment_status, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('sssss', $student_code, $first_name, $last_name, $current_level, $enrollment_status);

    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stray = ob_get_clean();
        if (!empty($stray)) {
            error_log('Stray output in create_student.php: ' . $stray);
        }
        echo json_encode(["success" => true, "id" => $id, "message" => "Student created"]);
    } else {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in create_student.php (error path): ' . $stray);
        echo json_encode(["success" => false, "message" => "Insert failed: " . $conn->error]);
    }

} catch (Throwable $e) {
    $out = ob_get_clean();
    error_log('Create student error: ' . $e->getMessage() . "\nOutput:\n" . $out);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage(), "debug_output" => $out]);
}

?>
