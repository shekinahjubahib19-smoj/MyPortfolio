<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json');

try {
    include __DIR__ . '/../../db.php';
    $info = [
        'connected' => true,
        'host' => $_ENV['DB_HOST'] ?? null,
        'user' => $_ENV['DB_USER'] ?? null,
        'pass_set' => isset($_ENV['DB_PASS']),
        'name' => $_ENV['DB_NAME'] ?? null,
        'port' => $_ENV['DB_PORT'] ?? null,
    ];
    echo json_encode($info);
} catch (Throwable $e) {
    $env = $_ENV;
    if (isset($env['DB_PASS'])) $env['DB_PASS'] = '***';
    echo json_encode([
        'connected' => false,
        'error' => $e->getMessage(),
        'env' => $env,
    ]);
}

?>
