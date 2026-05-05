<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/User.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Missing body']);
    exit;
}

$username = $data['username'] ?? null;
$password = $data['password'] ?? null;

if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'username and password required']);
    exit;
}

$userModel = new UserModel($conn);
$user = $userModel->findByUsername($username);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

if (password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => true, 'user' => [
        'id' => $user['id'], 'username' => $user['username'], 'role' => $user['role'], 'is_profile_complete' => (bool)$user['is_profile_complete']
    ]]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
}

?>
