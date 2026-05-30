<?php
header("Content-Type: application/json; charset=utf-8");
try {
    include __DIR__ . '/../db.php';
    $q = trim($_GET['q'] ?? '');
    if ($q !== '') {
        // try to match by username or id
        if (ctype_digit($q)) {
            $stmt = $conn->prepare("SELECT u.id AS user_id, u.username, u.role, tp.* FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id WHERE u.id = ? LIMIT 1");
            $stmt->bind_param('i', $q);
        } else {
            $like = "%" . $q . "%";
            $stmt = $conn->prepare("SELECT u.id AS user_id, u.username, u.role, tp.* FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id WHERE u.username LIKE ? LIMIT 20");
            $stmt->bind_param('s', $like);
        }
    } else {
        $stmt = $conn->prepare("SELECT u.id AS user_id, u.username, u.role, tp.* FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id ORDER BY u.id DESC LIMIT 200");
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $out = [];
    while ($r = $res->fetch_assoc()) {
        $out[] = $r;
    }
    echo json_encode(['success' => true, 'count' => count($out), 'rows' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
