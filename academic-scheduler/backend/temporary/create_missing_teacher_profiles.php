<?php
// Safe idempotent script to create/update specific teacher profiles.
// Usage (browser): /backend/temporary/create_missing_teacher_profiles.php
// This will create or update profiles for teacher2 and teacher3 as requested.

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error.log');

header('Content-Type: application/json; charset=utf-8');

try {
    include __DIR__ . '/../db.php';

    $toCreate = [
        // username => [teacher_code, first_name, last_name, max_hours]
        'teacher2' => ['2026002', 'Mesac', 'Miones', 8.00],
        'teacher3' => ['2026003', 'Narmie', 'Miones', 8.00],
    ];

    $out = [];
    foreach ($toCreate as $username => $vals) {
        list($code, $fname, $lname, $maxh) = $vals;
        // find user
        $stmt = $conn->prepare('SELECT id, username FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $u = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$u) {
            $out[$username] = ['ok' => false, 'message' => 'user not found'];
            continue;
        }
        $user_id = (int)$u['id'];

        // check existing profile
        $pstmt = $conn->prepare('SELECT id FROM teacher_profiles WHERE user_id = ? LIMIT 1');
        $pstmt->bind_param('i', $user_id);
        $pstmt->execute();
        $prow = $pstmt->get_result()->fetch_assoc();
        $pstmt->close();

        if ($prow) {
            $profile_id = (int)$prow['id'];
            $up = $conn->prepare('UPDATE teacher_profiles SET teacher_code = ?, first_name = ?, last_name = ?, max_hours_per_day = ? WHERE id = ?');
            $up->bind_param('ssddi', $code, $fname, $lname, $maxh, $profile_id);
            $ok = $up->execute();
            $up->close();
            // mark user profile complete
            $uup = $conn->prepare('UPDATE users SET is_profile_complete = 1 WHERE id = ?');
            $uup->bind_param('i', $user_id); $uup->execute(); $uup->close();
            $out[$username] = ['ok' => (bool)$ok, 'action' => 'updated'];
        } else {
            $ins = $conn->prepare('INSERT INTO teacher_profiles (user_id, teacher_code, teacher_email, first_name, last_name, max_hours_per_day, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
            $email = null;
            $ins->bind_param('issssd', $user_id, $code, $email, $fname, $lname, $maxh);
            $ok = $ins->execute();
            $ins->close();
            // mark user profile complete
            $uup = $conn->prepare('UPDATE users SET is_profile_complete = 1 WHERE id = ?');
            $uup->bind_param('i', $user_id); $uup->execute(); $uup->close();
            $out[$username] = ['ok' => (bool)$ok, 'action' => 'inserted'];
        }
    }

    echo json_encode(['success' => true, 'results' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('create_missing_teacher_profiles error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
