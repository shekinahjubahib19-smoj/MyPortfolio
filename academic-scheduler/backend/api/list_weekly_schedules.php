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

  $teacher_profile_id = isset($_GET['teacher_profile_id']) ? intval($_GET['teacher_profile_id']) : 0;
  $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

  $where = [];
  $types = '';
  $params = [];

  if ($teacher_profile_id > 0) {
    $where[] = 'ws.teacher_profile_id = ?';
    $types .= 'i';
    $params[] = $teacher_profile_id;
  }
  if ($student_id > 0) {
    $where[] = 'ws.student_id = ?';
    $types .= 'i';
    $params[] = $student_id;
  }

  $sql = "SELECT ws.*, tp.teacher_code, tp.first_name AS teacher_first_name, tp.last_name AS teacher_last_name,
                 s.subject_name, s.subject_code, st.student_code, st.first_name AS student_first_name, st.last_name AS student_last_name
          FROM weekly_schedules ws
          JOIN teacher_profiles tp ON tp.id = ws.teacher_profile_id
          JOIN subjects s ON s.id = ws.subject_id
          LEFT JOIN students st ON st.id = ws.student_id";
  if (count($where) > 0) $sql .= " WHERE " . implode(' AND ', $where);
  $sql .= " ORDER BY ws.day_of_week, ws.start_time";

  if (count($params) > 0) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
  } else {
    $res = $conn->query($sql);
  }

  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  echo json_encode(["success" => true, "schedules" => $rows]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
