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

  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  $id = isset($data['id']) ? intval($data['id']) : 0;

  if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "Missing id"]);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM weekly_schedules WHERE id = ?");
  $stmt->bind_param('i', $id);
  if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Schedule deleted"]);
  } else {
    echo json_encode(["success" => false, "message" => "Delete failed: " . $conn->error]);
  }

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
