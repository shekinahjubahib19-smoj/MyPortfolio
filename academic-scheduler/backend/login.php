<?php
// Keep the public API entry but delegate to controller
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

require_once __DIR__ . '/controllers/auth.php';
?>