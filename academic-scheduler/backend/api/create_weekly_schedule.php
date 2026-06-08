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
  if (!$data) throw new Exception('Invalid JSON body');

  $teacher_profile_id = isset($data['teacher_profile_id']) ? intval($data['teacher_profile_id']) : 0;
  $subject_id = isset($data['subject_id']) ? intval($data['subject_id']) : 0;
  $student_id = isset($data['student_id']) ? intval($data['student_id']) : null;
  $day_of_week = trim($data['day_of_week'] ?? '');
  $start_time = trim($data['start_time'] ?? '');
  $end_time = trim($data['end_time'] ?? '');
  $zoom_id = trim($data['zoom_id'] ?? '');
  // accept either 'zoom_pass' or 'zoom_password' from client
  $zoom_password = trim($data['zoom_pass'] ?? $data['zoom_password'] ?? '');
  $room_name = trim($data['room_name'] ?? '');
  $room_id = isset($data['room_id']) ? intval($data['room_id']) : null;
  $start_date = trim($data['start_date'] ?? '');
  $end_date = trim($data['end_date'] ?? '');
  $weeks = isset($data['weeks']) ? intval($data['weeks']) : 1;

  if ($teacher_profile_id <= 0 || $subject_id <= 0 || $day_of_week === '' || $start_time === '' || $end_time === '') {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
  }

  // Validate subject assignment for teacher
  $chk = $conn->prepare("SELECT COUNT(*) AS c FROM teacher_subjects WHERE teacher_profile_id = ? AND subject_id = ?");
  $chk->bind_param('ii', $teacher_profile_id, $subject_id);
  $chk->execute();
  $chkRow = $chk->get_result()->fetch_assoc();
  if (intval($chkRow['c']) === 0) {
    echo json_encode(["success" => false, "message" => "Teacher is not assigned to this subject"]);
    exit;
  }

  // Validate time ordering and compute minutes (compute in PHP using DateTime)
  try {
    $sdt = new DateTime($start_time);
    $edt = new DateTime($end_time);
    $minutes = intval(($edt->getTimestamp() - $sdt->getTimestamp()) / 60);
  } catch (Throwable $t) {
    echo json_encode(["success" => false, "message" => "Invalid time format"]);
    exit;
  }
  if ($minutes <= 0) {
    echo json_encode(["success" => false, "message" => "End time must be after start time"]);
    exit;
  }

  // Check overlap for teacher on that day
  $overlap = $conn->prepare(
    "SELECT COUNT(*) AS c FROM weekly_schedules
     WHERE teacher_profile_id = ? AND day_of_week = ?
       AND start_time < ? AND end_time > ?"
  );
  $overlap->bind_param('isss', $teacher_profile_id, $day_of_week, $end_time, $start_time);
  $overlap->execute();
  $ovRow = $overlap->get_result()->fetch_assoc();
  if (intval($ovRow['c']) > 0) {
    echo json_encode(["success" => false, "message" => "Schedule overlaps with an existing slot"]);
    exit;
  }

  // If a student is provided, ensure the student is not already scheduled at the same time (across any teacher)
  if (!empty($student_id)) {
    $studentOverlap = $conn->prepare(
      "SELECT COUNT(*) AS c FROM weekly_schedules
       WHERE student_id = ? AND day_of_week = ?
         AND start_time < ? AND end_time > ?"
    );
    $studentOverlap->bind_param('isss', $student_id, $day_of_week, $end_time, $start_time);
    $studentOverlap->execute();
    $stRow = $studentOverlap->get_result()->fetch_assoc();
    if (intval($stRow['c']) > 0) {
      echo json_encode(["success" => false, "message" => "Student is already scheduled at this time"]);
      exit;
    }
  }

  // Check max hours per day
  $maxStmt = $conn->prepare("SELECT max_hours_per_day FROM teacher_profiles WHERE id = ? LIMIT 1");
  $maxStmt->bind_param('i', $teacher_profile_id);
  $maxStmt->execute();
  $maxRow = $maxStmt->get_result()->fetch_assoc();
  $maxHours = $maxRow ? floatval($maxRow['max_hours_per_day']) : 8.0;

  // Sum existing scheduled minutes for that day using TIME_TO_SEC to avoid TIMESTAMPDIFF issues with TIME columns
  $sumStmt = $conn->prepare(
    "SELECT COALESCE(SUM((TIME_TO_SEC(end_time) - TIME_TO_SEC(start_time)) / 60), 0) AS total_minutes
     FROM weekly_schedules WHERE teacher_profile_id = ? AND day_of_week = ?"
  );
  $sumStmt->bind_param('is', $teacher_profile_id, $day_of_week);
  $sumStmt->execute();
  $sumRow = $sumStmt->get_result()->fetch_assoc();
  $totalMinutes = intval(round(floatval($sumRow['total_minutes'])));
  if (($totalMinutes + $minutes) > ($maxHours * 60)) {
    echo json_encode([
      "success" => false,
      "message" => "Exceeds teacher's max hours per day",
      "debug" => [
        "max_hours_per_day" => $maxHours,
        "existing_total_minutes" => $totalMinutes,
        "attempted_minutes" => $minutes,
        "existing_total_hours" => round($totalMinutes / 60, 2)
      ]
    ]);
    exit;
  }

  $ins = $conn->prepare(
    "INSERT INTO weekly_schedules
      (teacher_profile_id, subject_id, student_id, day_of_week, start_time, end_time,
       mode, weeks, zoom_id, zoom_password, room_id, room_name, start_date, end_date, created_at)
     VALUES (?, ?, NULLIF(?, 0), ?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, NULLIF(?, ''), NULLIF(?, ''), NOW())"
  );
  // compute start_date/end_date if start_date provided but end_date missing
  if ($start_date !== '') {
    try {
      $sd = new DateTime($start_date);
      if ($end_date === '' && $weeks > 0) {
        $daysToAdd = max(0, ($weeks - 1) * 7);
        $ed = clone $sd;
        if ($daysToAdd > 0) $ed->modify("+{$daysToAdd} days");
        $end_date = $ed->format('Y-m-d');
      }
    } catch (Throwable $t) {
      $start_date = '';
      $end_date = '';
    }
  }

  // defaults for non-allocation fields (mode, room_id)
  $mode = isset($data['mode']) ? trim($data['mode']) : 'online';
  $room_id_val = isset($data['room_id']) && intval($data['room_id']) > 0 ? intval($data['room_id']) : 0;
  // ensure zoom fields satisfy chk_ws_mode_fields: zoom_id must NOT be null for online mode
  $zoom_id = trim($data['zoom_id'] ?? '') ?: 'TBA';
  $zoom_password = trim($data['zoom_password'] ?? '');
  $room_name = trim($data['room_name'] ?? '');

  $types = 'iiissssississs';
  $ins->bind_param(
    $types,
    $teacher_profile_id,
    $subject_id,
    $student_id,
    $day_of_week,
    $start_time,
    $end_time,
    $mode,
    $weeks,
    $zoom_id,
    $zoom_password,
    $room_id_val,
    $room_name,
    $start_date,
    $end_date
  );
  if ($ins->execute()) {
    echo json_encode(["success" => true, "id" => $ins->insert_id, "message" => "Schedule created"]);
  } else {
    echo json_encode(["success" => false, "message" => "Insert failed: " . $conn->error]);
  }

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
