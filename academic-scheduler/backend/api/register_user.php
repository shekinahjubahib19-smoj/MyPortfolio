<?php
// API endpoint: register user
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

ob_start();

try {
    include __DIR__ . '/../db.php';

    $raw = file_get_contents("php://input");
    $data = json_decode($raw);

    if (!$data) {
        throw new Exception('Invalid or missing JSON body');
    }

    $username = $data->username ?? null;
    $password = $data->password ?? null;
    $role = $data->role ?? 'TEACHER';

    if (!$username || !$password) {
        throw new Exception('Username and password are required');
    }

    $checkQuery = "SELECT id FROM users WHERE username = ?";
    $checkStmt = $conn->prepare($checkQuery);
    if (!$checkStmt) throw new Exception('Prepare failed: ' . $conn->error);
    $checkStmt->bind_param("s", $username);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Username already taken."]);
        exit;
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $query = "INSERT INTO users (username, password_hash, role, is_profile_complete) VALUES (?, ?, ?, 0)";
    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param("sss", $username, $hashed_password, $role);

    if ($stmt->execute()) {
        $stray = ob_get_clean();
        if (!empty($stray)) {
            error_log('Stray output in register_user.php: ' . $stray);
        }
        echo json_encode(["success" => true, "message" => "User registered successfully!"]);
    } else {
        $stray = ob_get_clean();
        if (!empty($stray)) {
            error_log('Stray output in register_user.php (error path): ' . $stray);
        }
        echo json_encode(["success" => false, "message" => "Registration failed: " . $conn->error]);
    }

} catch (Throwable $e) {
    $out = ob_get_clean();
    error_log('Register error: ' . $e->getMessage() . "\nOutput:\n" . $out);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage(), "debug_output" => $out]);
}

?>
