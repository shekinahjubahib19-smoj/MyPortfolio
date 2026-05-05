<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    // Load env and attempt connection via existing db.php
    include __DIR__ . '/../../db.php';

    $info = [
        'ok' => true,
        'db_host' => $_ENV['DB_HOST'] ?? null,
        'db_port' => $_ENV['DB_PORT'] ?? null,
        'db_user' => $_ENV['DB_USER'] ?? null,
        'db_name' => $_ENV['DB_NAME'] ?? null,
        'server_info' => mysqli_get_server_info($conn),
    ];

    echo json_encode($info);
} catch (Throwable $e) {
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}

?>
