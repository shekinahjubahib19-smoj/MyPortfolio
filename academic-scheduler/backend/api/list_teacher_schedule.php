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

  $teacher_id = isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : 0;
  if ($teacher_id <= 0) {
    echo json_encode(["success" => false, "message" => "Missing teacher_id"]);
    exit;
  }

  $stmt = $conn->prepare(
    "SELECT ssa.*, st.student_code, st.first_name, st.last_name,
            t.name AS teacher_name, ts.day_of_week, ts.slot_index, ts.label
     FROM student_schedule_assignments ssa
     JOIN students st ON st.id = ssa.student_id
     JOIN teachers t ON t.id = ssa.teacher_id
     JOIN time_slots ts ON ts.id = ssa.timeslot_id
     WHERE ssa.teacher_id = ?
     ORDER BY ts.day_of_week, ts.slot_index"
  );
  if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
  $stmt->bind_param('i', $teacher_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;

  echo json_encode(["success" => true, "schedule" => $rows]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(["success"=>true]); exit; }

try {
  include __DIR__ . '/../config/db.php';

  $teacherId = isset($_GET['teacher_id']) ? (int)$_GET['teacher_id'] : 0;
  if ($teacherId <= 0) {
    http_response_code(400);
    echo json_encode(["success"=>false, "message"=>"teacher_id is required"]);
    exit;
  }

  $stmt = $conn->prepare(
    "SELECT ssa.id, ssa.student_id, ssa.timeslot_id, ssa.teacher_id,
            st.student_code, st.first_name, st.last_name, st.current_level,
            t.name AS teacher_name,
            ts.day_of_week, ts.slot_index, ts.label AS timeslot_label
     FROM student_schedule_assignments ssa
     JOIN students st ON st.id = ssa.student_id
     JOIN teachers t ON t.id = ssa.teacher_id
     JOIN time_slots ts ON ts.id = ssa.timeslot_id
     WHERE ssa.teacher_id = ?
     ORDER BY ts.day_of_week, ts.slot_index, st.last_name, st.first_name"
  );
  $stmt->bind_param('i', $teacherId);
  $stmt->execute();
  $result = $stmt->get_result();

  $schedule = [];
  while ($row = $result->fetch_assoc()) $schedule[] = $row;
  $stmt->close();

  echo json_encode(["success"=>true, "schedule"=>$schedule]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success"=>false, "message"=>$e->getMessage()]);
}
?>