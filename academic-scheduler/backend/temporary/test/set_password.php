<?php
// Dev helper: set a user's password_hash to a new password.
// WARNING: This is a development helper. Remove it after use.
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

loadEnv(__DIR__ . '/.env');

try {
    $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';
    $port = $_ENV['DB_PORT'] ?? 3306;
    $dbName = $_ENV['DB_NAME'] ?? '';

    $conn = new mysqli($host, $user, $pass, $dbName, (int)$port);
    if ($conn->connect_error) throw new Exception('Connect error: ' . $conn->connect_error);

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!$data) {
        $data = [
            'username' => $_GET['username'] ?? null,
            'password' => $_GET['password'] ?? null,
        ];
    }

    $username = $data['username'] ?? null;
    $password = $data['password'] ?? null;

    if (!$username || !$password) {
        throw new Exception('Missing username or password. Use JSON POST {"username":"...","password":"..."}');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET password_hash = ? WHERE username = ?');
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('ss', $hash, $username);
    if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

    if ($stmt->affected_rows > 0) {
        echo json_encode(['ok' => true, 'message' => 'Password updated for ' . $username]);
    } else {
        echo json_encode(['ok' => false, 'message' => 'No rows updated — user may not exist']);
    }

    $stmt->close();
    $conn->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

?>
