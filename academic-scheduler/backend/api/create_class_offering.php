<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(["success"=>true]); exit; }
try {
  include __DIR__ . '/../config/db.php';
  $raw = file_get_contents('php://input');
  $data = json_decode($raw);
  if (!$data) throw new Exception('Missing JSON body');
  $subject_id = intval($data->subject_id ?? 0);
  $level = $conn->real_escape_string($data->level ?? '');
  $weekly_sessions = intval($data->weekly_sessions ?? 1);
  $session_slots = intval($data->session_slots ?? 1);
  $pref = $data->preferred_teacher_id ? intval($data->preferred_teacher_id) : null;

  if (!$subject_id) throw new Exception('subject_id required');

  $stmt = $conn->prepare("INSERT INTO class_offerings (subject_id, level, weekly_sessions, session_slots, preferred_teacher_id) VALUES (?, ?, ?, ?, ?)");
  $stmt->bind_param('isiii', $subject_id, $level, $weekly_sessions, $session_slots, $pref);
  if ($stmt->execute()) {
    echo json_encode(["success"=>true, "id"=>$stmt->insert_id]);
  } else {
    echo json_encode(["success"=>false, "message"=>$conn->error]);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success"=>false, "message"=>$e->getMessage()]);
}

?>
