<?php
// API endpoint: create or update teacher profile and their subjects
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

try {
    include __DIR__ . '/../db.php';

    $raw = file_get_contents('php://input');
    // Debug: log incoming raw payload for troubleshooting
    @file_put_contents(__DIR__ . '/../error.log', "\n--- update_teacher_profile incoming: " . date('c') . "\n" . $raw . "\n", FILE_APPEND);
    $data = json_decode($raw, true);
    @file_put_contents(__DIR__ . '/../error.log', "parsed_json: " . json_encode($data) . "\n", FILE_APPEND);
    if (!$data) throw new Exception('Invalid JSON');

    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    if ($user_id <= 0) throw new Exception('Missing user_id');

    // determine user role to decide where to store profile (admin vs teacher)
    $roleStmt = $conn->prepare("SELECT role, username FROM users WHERE id = ? LIMIT 1");
    if (!$roleStmt) throw new Exception('Failed to prepare role query: ' . $conn->error);
    $roleStmt->bind_param('i', $user_id);
    $roleStmt->execute();
    $roleRes = $roleStmt->get_result();
    $userRow = $roleRes->fetch_assoc();
    $roleStmt->close();
    $userRole = $userRow['role'] ?? 'TEACHER';
    $currentUsername = $userRow['username'] ?? null;

    $teacher_code = trim($data['teacher_code'] ?? '');
    $teacher_email = trim($data['teacher_email'] ?? '');
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');
    // accept optional username update
    $new_username = isset($data['username']) ? trim($data['username']) : null;
    if ($new_username !== null && $new_username !== '') {
        // check uniqueness
        $chk = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
        if ($chk) {
            $chk->bind_param('si', $new_username, $user_id);
            $chk->execute();
            $cres = $chk->get_result();
            if ($cres && $cres->fetch_assoc()) {
                throw new Exception('Username already taken');
            }
            $chk->close();
        }
        // update username
        $upu = $conn->prepare("UPDATE users SET username = ? WHERE id = ?");
        if ($upu) {
            $upu->bind_param('si', $new_username, $user_id);
            $ok = $upu->execute();
            if (!$ok) {
                $err = $upu->error ?: $conn->error;
                @file_put_contents(__DIR__ . '/../error.log', "USERNAME UPDATE ERROR: " . $err . "\n", FILE_APPEND);
                throw new Exception('Failed to update username: ' . $err);
            }
            $upu->close();
            // reflect change for caller
            $currentUsername = $new_username;
        }
    }
    // normalize numeric fields to avoid bind_param type issues
    $max_hours = isset($data['max_hours_per_day']) ? (float)$data['max_hours_per_day'] : 0.0;
    // accept day_offs as array or day_off as string
    $day_offs = [];
    if (isset($data['day_offs']) && is_array($data['day_offs'])) {
        $day_offs = array_map('trim', $data['day_offs']);
    } elseif (isset($data['day_off'])) {
        // could be comma-separated or single
        $raw = trim($data['day_off']);
        if ($raw !== '') $day_offs = array_map('trim', explode(',', $raw));
    }
    $day_off_str = count($day_offs) > 0 ? implode(',', $day_offs) : null;
    $subjects = isset($data['subjects']) && is_array($data['subjects']) ? $data['subjects'] : [];

    // If user is ADMIN, use admin_profile table (simple fields)
    if (strtoupper($userRole) === 'ADMIN') {
        $stmt = $conn->prepare("SELECT id FROM admin_profile WHERE user_id = ? LIMIT 1");
        if (!$stmt) {
            // ensure admin_profile exists
            $conn->query("CREATE TABLE IF NOT EXISTS admin_profile (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                admin_code VARCHAR(64) DEFAULT NULL,
                first_name VARCHAR(50) DEFAULT NULL,
                last_name VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB");
            $stmt = $conn->prepare("SELECT id FROM admin_profile WHERE user_id = ? LIMIT 1");
            if (!$stmt) throw new Exception('Failed to prepare admin_profile select: ' . $conn->error);
        }
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $profile = $res->fetch_assoc();
        $stmt->close();

        if ($profile) {
            $profile_id = (int)$profile['id'];
            $upd = $conn->prepare("UPDATE admin_profile SET admin_code = ?, first_name = ?, last_name = ? WHERE id = ?");
            if (!$upd) throw new Exception('Prepare failed: ' . $conn->error);
            $admin_code = $teacher_code; // reuse field name
            $upd->bind_param('sssi', $admin_code, $first_name, $last_name, $profile_id);
            $ok = $upd->execute();
            if (!$ok) { $err = $upd->error ?: $conn->error; @file_put_contents(__DIR__ . '/../error.log', "ADMIN UPDATE ERROR: " . $err . "\n", FILE_APPEND); throw new Exception('Failed to update admin profile: ' . $err); }
            $upd->close();
        } else {
            $ins = $conn->prepare("INSERT INTO admin_profile (user_id, admin_code, first_name, last_name, created_at) VALUES (?, ?, ?, ?, NOW())");
            if (!$ins) throw new Exception('Prepare failed: ' . $conn->error);
            $admin_code = $teacher_code;
            $ins->bind_param('isss', $user_id, $admin_code, $first_name, $last_name);
            $ok = $ins->execute();
            if (!$ok) { $err = $ins->error ?: $conn->error; @file_put_contents(__DIR__ . '/../error.log', "ADMIN INSERT ERROR: " . $err . "\n", FILE_APPEND); throw new Exception('Failed to insert admin profile: ' . $err); }
            $profile_id = $ins->insert_id;
            $ins->close();
        }

        // mark user profile complete
        $uup = $conn->prepare("UPDATE users SET is_profile_complete = 1 WHERE id = ?");
        if ($uup) { $uup->bind_param('i', $user_id); $uup->execute(); $uup->close(); }

        // fetch admin profile
        $pstmt = $conn->prepare("SELECT id, admin_code, first_name, last_name, created_at FROM admin_profile WHERE id = ? LIMIT 1");
        $pstmt->bind_param('i', $profile_id);
        $pstmt->execute();
        $prow = $pstmt->get_result()->fetch_assoc();
        $pstmt->close();

        echo json_encode(['success' => true, 'profile' => ['admin' => $prow]]);
        exit;
    }

    // Default: teacher profile flow
    $stmt = $conn->prepare("SELECT id FROM teacher_profiles WHERE user_id = ? LIMIT 1");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $profile = $res->fetch_assoc();
    $stmt->close();

    if ($profile) {
        $profile_id = (int)$profile['id'];
        // ensure day_off column exists
        $colCheck = $conn->prepare("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_profiles' AND COLUMN_NAME = 'day_off'");
        if ($colCheck) {
            $colCheck->execute();
            $cc = $colCheck->get_result()->fetch_assoc();
            if (intval($cc['c']) === 0) {
                $conn->query("ALTER TABLE teacher_profiles ADD COLUMN day_off VARCHAR(64) DEFAULT NULL");
            }
            $colCheck->close();
        }
        // update
        // use NULLIF to convert empty string to NULL for teacher_email (allows multiple NULLs despite UNIQUE index)
        $upd = $conn->prepare("UPDATE teacher_profiles SET teacher_code = ?, teacher_email = NULLIF(?, ''), first_name = ?, last_name = ?, max_hours_per_day = ?, day_off = ? WHERE id = ?");
        if (!$upd) throw new Exception('Prepare failed: ' . $conn->error);
        // ensure day_off_str is a string (bind_param accepts null but keep consistent)
        $day_off_str_local = $day_off_str === null ? '' : $day_off_str;
        $upd->bind_param('ssssdsi', $teacher_code, $teacher_email, $first_name, $last_name, $max_hours, $day_off_str_local, $profile_id);
        $ok = $upd->execute();
        @file_put_contents(__DIR__ . '/../error.log', "UPDATE EXECUTE OK=" . ($ok ? '1' : '0') . " affected_rows=" . $upd->affected_rows . "\n", FILE_APPEND);
        if (!$ok) {
            $err = $upd->error ?: $conn->error;
            @file_put_contents(__DIR__ . '/../error.log', "UPDATE ERROR: " . $err . "\n", FILE_APPEND);
            throw new Exception('Failed to update teacher profile: ' . $err);
        }
        $upd->close();
    } else {
        // insert
        // ensure day_off column exists before insert
        $colCheck = $conn->prepare("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_profiles' AND COLUMN_NAME = 'day_off'");
        if ($colCheck) {
            $colCheck->execute();
            $cc = $colCheck->get_result()->fetch_assoc();
            if (intval($cc['c']) === 0) {
                $conn->query("ALTER TABLE teacher_profiles ADD COLUMN day_off VARCHAR(64) DEFAULT NULL");
            }
            $colCheck->close();
        }
        // use NULLIF for teacher_email so empty emails are stored as NULL
        $ins = $conn->prepare("INSERT INTO teacher_profiles (user_id, teacher_code, teacher_email, first_name, last_name, max_hours_per_day, day_off, created_at) VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, NOW())");
        if (!$ins) throw new Exception('Prepare failed: ' . $conn->error);
        $day_off_str_local = $day_off_str === null ? '' : $day_off_str;
        $ins->bind_param('issssds', $user_id, $teacher_code, $teacher_email, $first_name, $last_name, $max_hours, $day_off_str_local);
        $ok = $ins->execute();
        @file_put_contents(__DIR__ . '/../error.log', "INSERT EXECUTE OK=" . ($ok ? '1' : '0') . " affected_rows=" . $ins->affected_rows . " insert_id=" . $ins->insert_id . "\n", FILE_APPEND);
        if (!$ok) {
            $err = $ins->error ?: $conn->error;
            @file_put_contents(__DIR__ . '/../error.log', "INSERT ERROR: " . $err . "\n", FILE_APPEND);
            throw new Exception('Failed to insert teacher profile: ' . $err);
        }
        $profile_id = $ins->insert_id;
        $ins->close();
    }
    // mark the user as having completed profile
    $uup = $conn->prepare("UPDATE users SET is_profile_complete = 1 WHERE id = ?");
    if ($uup) { $uup->bind_param('i', $user_id); $uup->execute(); $uup->close(); }

    // update teacher_subjects atomically: replace existing with provided list
    // use transaction so profile and subjects stay consistent
    $conn->begin_transaction();
    try {
        $del = $conn->prepare("DELETE FROM teacher_subjects WHERE teacher_profile_id = ?");
        if ($del) { $del->bind_param('i', $profile_id); $del->execute(); if ($del->error) @file_put_contents(__DIR__ . '/../error.log', "DELETE SUBJECTS ERROR: " . $del->error . "\n", FILE_APPEND); $del->close(); }

        if (count($subjects) > 0) {
            $insSub = $conn->prepare("INSERT INTO teacher_subjects (teacher_profile_id, subject_id, created_at) VALUES (?, ?, NOW())");
            if (!$insSub) {
                @file_put_contents(__DIR__ . '/../error.log', "Prepare teacher_subjects insert failed: " . $conn->error . "\n", FILE_APPEND);
                throw new Exception('Prepare teacher_subjects insert failed: ' . $conn->error);
            }
            foreach ($subjects as $subId) {
                $sid = intval($subId);
                if ($sid <= 0) continue;
                $insSub->bind_param('ii', $profile_id, $sid);
                $insSub->execute();
                if ($insSub->error) @file_put_contents(__DIR__ . '/../error.log', "INSERT SUBJECT ERROR: " . $insSub->error . " (sid=" . $sid . ")\n", FILE_APPEND);
            }
            $insSub->close();
        }

        $conn->commit();
    } catch (Throwable $te) {
        $conn->rollback();
        throw $te;
    }

    // fetch updated profile and subjects
    $pstmt = $conn->prepare("SELECT id, teacher_code, teacher_email, first_name, last_name, max_hours_per_day, total_rendered_hours, day_off FROM teacher_profiles WHERE id = ? LIMIT 1");
    $pstmt->bind_param('i', $profile_id);
    $pstmt->execute();
    $prow = $pstmt->get_result()->fetch_assoc();
    $pstmt->close();

    $subjectsList = [];
    $sstmt = $conn->prepare("SELECT s.id, s.subject_name, s.subject_code, s.default_hours FROM teacher_subjects ts JOIN subjects s ON ts.subject_id = s.id WHERE ts.teacher_profile_id = ? ORDER BY s.subject_name");
    if ($sstmt) {
        $sstmt->bind_param('i', $profile_id);
        $sstmt->execute();
        $sres = $sstmt->get_result();
        while ($r = $sres->fetch_assoc()) {
            $subjectsList[] = ['id' => $r['id'], 'name' => $r['subject_name'], 'code' => $r['subject_code'], 'hours' => $r['default_hours']];
        }
        $sstmt->close();
    }

    $response = [
        'profile' => $prow,
        'subjects' => $subjectsList,
    ];

    echo json_encode(['success' => true, 'profile' => $response]);

} catch (Throwable $e) {
    error_log('update_teacher_profile error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
