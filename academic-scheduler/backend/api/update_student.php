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
    $student_code = trim($data->student_code ?? '');
    $first_name = trim($data->first_name ?? '');
    $last_name = trim($data->last_name ?? '');
    $email = trim($data->email ?? '');
    $current_level = trim($data->current_level ?? '');
    $enrollment_status = trim($data->enrollment_status ?? 'Active');

    if (!$id) {
        echo json_encode(["success" => false, "message" => "Missing student id"]);
        exit;
    }

    if ($student_code === '' || $first_name === '' || $last_name === '') {
        echo json_encode(["success" => false, "message" => "Student code, first name and last name are required."]);
        exit;
    }

    // Check if student exists
    $checkQ = "SELECT id FROM students WHERE id = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkQ);
    if (!$checkStmt) throw new Exception('Prepare failed: ' . $conn->error);
    $checkStmt->bind_param('i', $id);
    $checkStmt->execute();
    $checkRes = $checkStmt->get_result();
    if ($checkRes->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Student not found."]);
        exit;
    }

    // Prevent changing to a student_code that exists on other record
    $dupQ = "SELECT id FROM students WHERE student_code = ? AND id <> ? LIMIT 1";
    $dupStmt = $conn->prepare($dupQ);
    if (!$dupStmt) throw new Exception('Prepare failed: ' . $conn->error);
    $dupStmt->bind_param('si', $student_code, $id);
    $dupStmt->execute();
    $dupRes = $dupStmt->get_result();
    if ($dupRes->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Student code already in use by another student."]);
        exit;
    }

        // include email column
        // ensure column exists (in case running against older DB schema)
        $colCheck = $conn->prepare("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'email'");
        if ($colCheck) {
            $colCheck->execute();
            $cc = $colCheck->get_result()->fetch_assoc();
            if (intval($cc['c']) === 0) {
                $conn->query("ALTER TABLE students ADD COLUMN email VARCHAR(255) DEFAULT NULL");
            }
            $colCheck->close();
        }

        $query = "UPDATE students SET student_code = ?, first_name = ?, last_name = ?, email = ?, current_level = ?, enrollment_status = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
        $stmt->bind_param('ssssssi', $student_code, $first_name, $last_name, $email, $current_level, $enrollment_status, $id);

    if ($stmt->execute()) {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in update_student.php: ' . $stray);
        echo json_encode(["success" => true, "message" => "Student updated"]);
    } else {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in update_student.php (error path): ' . $stray);
        echo json_encode(["success" => false, "message" => "Update failed: " . $conn->error]);
    }

} catch (Throwable $e) {
    $out = ob_get_clean();
    error_log('Update student error: ' . $e->getMessage() . "\nOutput:\n" . $out);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage(), "debug_output" => $out]);
}

?>
