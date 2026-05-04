<?php
// Use cURL extension to POST the payload and print response
$payload = file_get_contents(__DIR__ . '/test_payload.json');
$ch = curl_init('http://localhost/Portfolio/academic-scheduler/backend/register_user.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
$res = curl_exec($ch);
if ($res === false) {
    echo json_encode(['error' => curl_error($ch)]);
} else {
    echo $res;
}
curl_close($ch);
