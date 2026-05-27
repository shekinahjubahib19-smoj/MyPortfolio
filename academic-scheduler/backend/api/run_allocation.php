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

  // Student-centric greedy allocator (proof-of-concept):
  // - For each active student, assign one timeslot per week to a teacher.
  // - Ensures teachers are not double-booked per timeslot and balances load by assigning least-loaded teacher.

  // Fetch students (active)
  $sRes = $conn->query("SELECT * FROM students WHERE enrollment_status = 'Active' ORDER BY id");
  $students = [];
  while ($r = $sRes->fetch_assoc()) $students[] = $r;

  // Fetch teachers
  $tRes = $conn->query("SELECT * FROM teachers WHERE is_active = 1");
  $teachers = [];
  while ($r = $tRes->fetch_assoc()) { $r['assigned'] = 0; $teachers[$r['id']] = $r; }

  // Fetch time slots
  $tsRes = $conn->query("SELECT * FROM time_slots ORDER BY day_of_week, slot_index");
  $timeSlots = [];
  while ($r = $tsRes->fetch_assoc()) $timeSlots[$r['id']] = $r;

  // Clear existing student-centered assignments (non-destructive option could be added later)
  $conn->query("TRUNCATE TABLE student_schedule_assignments");

  // Keep track of booked teacher-timeslot pairs to prevent double-booking
  $booked = [];

  foreach ($students as $student) {
    // pick the least-loaded teacher order
    uasort($teachers, function($a,$b){ return $a['assigned'] <=> $b['assigned']; });
    $assigned = false;
    foreach ($teachers as $tid => $t) {
      // find first timeslot where this teacher is not booked
      foreach ($timeSlots as $tsId => $ts) {
        $key = $tid . '_' . $tsId;
        if (isset($booked[$key])) continue; // teacher busy
        // insert assignment for student
        $stmt = $conn->prepare("INSERT INTO student_schedule_assignments (student_id, timeslot_id, teacher_id) VALUES (?, ?, ?)");
        $stmt->bind_param('iii', $student['id'], $tsId, $tid);
        if ($stmt->execute()) {
          $teachers[$tid]['assigned']++;
          $booked[$key] = true;
          $assigned = true;
          break 2; // move to next student
        }
      }
    }
    // if not assigned, student remains unassigned (could be reported)
  }

  // Return student assignments
  $res = $conn->query("SELECT ssa.*, st.student_code, st.first_name, st.last_name, t.name as teacher_name, ts.day_of_week, ts.slot_index FROM student_schedule_assignments ssa JOIN students st ON st.id = ssa.student_id JOIN teachers t ON t.id = ssa.teacher_id JOIN time_slots ts ON ts.id = ssa.timeslot_id ORDER BY ts.day_of_week, ts.slot_index");
  $out = [];
  while ($r = $res->fetch_assoc()) $out[] = $r;
  echo json_encode(["success"=>true, "assignments"=>$out]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success"=>false, "message"=>$e->getMessage()]);
}

?>
