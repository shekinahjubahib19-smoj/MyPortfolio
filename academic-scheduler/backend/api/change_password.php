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

try {
  include __DIR__ . '/../config/db.php';

  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);

  if (!$data) {
    throw new Exception('Invalid or missing JSON body');
  }

  $user_id = $data['user_id'] ?? null;
  $current_password = $data['current_password'] ?? null;
  $new_password = $data['new_password'] ?? null;

  if (!$user_id || !$current_password || !$new_password) {
    throw new Exception('Missing required fields');
  }

  $stmt = $conn->prepare('SELECT id, password_hash FROM users WHERE id = ? LIMIT 1');
  if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
  $stmt->bind_param('i', $user_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $user = $res->fetch_assoc();

  if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
  }

  if (!password_verify($current_password, $user['password_hash'])) {
    echo json_encode(["success" => false, "message" => "Current password is incorrect"]);
    exit;
  }

  $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
  $update = $conn->prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?');
  if (!$update) throw new Exception('Prepare failed: ' . $conn->error);
  $update->bind_param('si', $new_hash, $user_id);

  if ($update->execute()) {
    echo json_encode(["success" => true, "message" => "Password updated"]); 
  } else {
    echo json_encode(["success" => false, "message" => "Failed to update password"]);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
