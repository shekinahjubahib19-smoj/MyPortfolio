<?php
$payload = file_get_contents(__DIR__ . '/test_payload.json');
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $payload,
        'ignore_errors' => true,
    ],
];
$context = stream_context_create($opts);
$url = 'http://localhost/Portfolio/academic-scheduler/backend/register_user.php';
$res = file_get_contents($url, false, $context);
if ($res === false) {
    echo json_encode(['error' => 'Request failed', 'details' => $http_response_header ?? null]);
} else {
    echo $res;
}
