<?php
// NOTE: CORS headers are already set in login.php before this file is included.
// Only handle preflight OPTIONS here if needed.

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Clear any buffered output before sending the response body
ob_start();

try {
    require_once __DIR__ . '/../config/db.php';
    require_once __DIR__ . '/../models/User.php';

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in auth: ' . $stray);
        echo json_encode(['success' => false, 'message' => 'Missing body']);
        exit;
    }

    $username = $data['username'] ?? null;
    $password = $data['password'] ?? null;

    if (!$username || !$password) {
        $stray = ob_get_clean();
        if (!empty($stray)) error_log('Stray output in auth: ' . $stray);
        echo json_encode(['success' => false, 'message' => 'username and password required']);
        exit;
    }

    $userModel = new UserModel($conn);
    $user = $userModel->findByUsername($username);

    $stray = ob_get_clean();
    if (!empty($stray)) error_log('Stray output in auth: ' . $stray);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    if (password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'is_profile_complete' => (bool)$user['is_profile_complete'],
            'must_change_password' => (bool)$user['must_change_password'],
        ]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid password']);
    }

} catch (Throwable $e) {
    $stray = ob_get_clean();
    error_log('Auth error: ' . $e->getMessage() . "\nOutput:\n" . $stray);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}