<?php
// Seed sample teachers and students for scheduler demo
error_reporting(E_ALL);
ini_set('display_errors', '1');
include __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $out = ['teachers' => [], 'students' => []];

  // Seed teachers if none
  $tres = $conn->query("SELECT COUNT(*) as c FROM teachers");
  $tcount = $tres->fetch_assoc()['c'];
  if ($tcount == 0) {
    $teachers = [
      ['name' => 'Alice Teacher', 'max_weekly_hours' => 20],
      ['name' => 'Bob Teacher', 'max_weekly_hours' => 20],
      ['name' => 'Carlos Teacher', 'max_weekly_hours' => 20],
    ];
    $ins = $conn->prepare("INSERT INTO teachers (name, max_weekly_hours, is_active, created_at) VALUES (?, ?, 1, NOW())");
    foreach ($teachers as $t) {
      $ins->bind_param('si', $t['name'], $t['max_weekly_hours']);
      $ins->execute();
      $out['teachers'][] = ['id' => $ins->insert_id, 'name' => $t['name']];
    }
    $ins->close();
  } else {
    $res = $conn->query("SELECT id, name FROM teachers LIMIT 50");
    while ($r = $res->fetch_assoc()) $out['teachers'][] = $r;
  }

  // Seed students if none
  $sres = $conn->query("SELECT COUNT(*) as c FROM students");
  $scount = $sres->fetch_assoc()['c'];
  if ($scount == 0) {
    $students = [
      ['code' => 'S1001', 'first' => 'Maya', 'last' => 'Dean', 'level' => 'Beginner'],
      ['code' => 'S1002', 'first' => 'Noah', 'last' => 'Lee', 'level' => 'Beginner'],
      ['code' => 'S1003', 'first' => 'Sara', 'last' => 'Khan', 'level' => 'Intermediate'],
      ['code' => 'S1004', 'first' => 'Tom', 'last' => 'Adey', 'level' => 'Intermediate'],
      ['code' => 'S1005', 'first' => 'Lina', 'last' => 'Park', 'level' => 'Advanced'],
    ];
    $ins = $conn->prepare("INSERT INTO students (student_code, first_name, last_name, current_level, enrollment_status, created_at) VALUES (?, ?, ?, ?, 'Active', NOW())");
    foreach ($students as $s) {
      $ins->bind_param('ssss', $s['code'], $s['first'], $s['last'], $s['level']);
      $ins->execute();
      $out['students'][] = ['id' => $ins->insert_id, 'student_code' => $s['code'], 'first' => $s['first']];
    }
    $ins->close();
  } else {
    $res = $conn->query("SELECT id, student_code, first_name, last_name FROM students LIMIT 50");
    while ($r = $res->fetch_assoc()) $out['students'][] = $r;
  }

  echo json_encode(['success' => true, 'result' => $out]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
