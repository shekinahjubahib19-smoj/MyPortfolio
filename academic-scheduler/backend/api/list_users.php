<?php
// API endpoint: list users
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

try {
    include __DIR__ . '/../db.php';
    $res = $conn->query("SELECT id, username, role, is_profile_complete, created_at FROM users ORDER BY id DESC LIMIT 100");
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $user = [
            'id' => $r['id'],
            'username' => $r['username'],
            'role' => $r['role'],
            'is_profile_complete' => (bool)$r['is_profile_complete'],
            'created_at' => $r['created_at'],
            'profile' => null,
        ];

        if (strtoupper($r['role']) === 'TEACHER') {
            // load teacher profile
            $stmt = $conn->prepare("SELECT id, teacher_code, first_name, last_name, max_hours_per_day, total_rendered_hours FROM teacher_profiles WHERE user_id = ? LIMIT 1");
            if ($stmt) {
                $stmt->bind_param('i', $r['id']);
                $stmt->execute();
                $pr = $stmt->get_result()->fetch_assoc();
                if ($pr) {
                    // load subjects for this teacher
                    $subStmt = $conn->prepare("SELECT s.id, s.subject_name, s.subject_code, s.default_hours FROM teacher_subjects ts JOIN subjects s ON ts.subject_id = s.id WHERE ts.teacher_profile_id = ? ORDER BY s.subject_name");
                    $subjects = [];
                    if ($subStmt) {
                        $subStmt->bind_param('i', $pr['id']);
                        $subStmt->execute();
                        $sres = $subStmt->get_result();
                        while ($srow = $sres->fetch_assoc()) {
                            $subjects[] = [
                                'id' => $srow['id'],
                                'name' => $srow['subject_name'],
                                'code' => $srow['subject_code'],
                                'hours' => $srow['default_hours'],
                            ];
                        }
                        $subStmt->close();
                    }

                    $user['profile'] = [
                        'teacher_code' => $pr['teacher_code'],
                        'first_name' => $pr['first_name'],
                        'last_name' => $pr['last_name'],
                        'max_hours_per_day' => $pr['max_hours_per_day'],
                        'total_rendered_hours' => $pr['total_rendered_hours'],
                        'subjects' => $subjects,
                    ];
                }
                $stmt->close();
            }
        }

        $rows[] = $user;
    }

    echo json_encode(['success' => true, 'count' => count($rows), 'users' => $rows]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
