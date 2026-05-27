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
  $q = "SELECT id, day_of_week, slot_index, label FROM time_slots ORDER BY day_of_week, slot_index";
  $res = $conn->query($q);
  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  echo json_encode(["success"=>true, "time_slots"=>$rows]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success"=>false, "message"=>$e->getMessage()]);
}

?>
