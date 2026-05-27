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
  $q = "SELECT co.*, s.name as subject_name FROM class_offerings co LEFT JOIN subjects s ON s.id = co.subject_id ORDER BY co.id";
  $res = $conn->query($q);
  $rows = [];
  while ($r = $res->fetch_assoc()) $rows[] = $r;
  echo json_encode(["success"=>true, "class_offerings"=>$rows]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["success"=>false, "message"=>$e->getMessage()]);
}

?>
