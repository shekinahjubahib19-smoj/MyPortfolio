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
    $data = json_decode($raw, true);
    if (!$data) throw new Exception('Invalid JSON');

    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    if ($user_id <= 0) throw new Exception('Missing user_id');

    $teacher_code = trim($data['teacher_code'] ?? '');
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');
    $max_hours = isset($data['max_hours_per_day']) ? (float)$data['max_hours_per_day'] : null;
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

    // Check if profile exists
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
        $upd = $conn->prepare("UPDATE teacher_profiles SET teacher_code = ?, first_name = ?, last_name = ?, max_hours_per_day = ?, day_off = ? WHERE id = ?");
        if (!$upd) throw new Exception('Prepare failed: ' . $conn->error);
        $upd->bind_param('sssdsi', $teacher_code, $first_name, $last_name, $max_hours, $day_off_str, $profile_id);
        $upd->execute();
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
        $ins = $conn->prepare("INSERT INTO teacher_profiles (user_id, teacher_code, first_name, last_name, max_hours_per_day, day_off, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        if (!$ins) throw new Exception('Prepare failed: ' . $conn->error);
        $ins->bind_param('isssds', $user_id, $teacher_code, $first_name, $last_name, $max_hours, $day_off_str);
        $ins->execute();
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
        if ($del) { $del->bind_param('i', $profile_id); $del->execute(); $del->close(); }

        if (count($subjects) > 0) {
            $insSub = $conn->prepare("INSERT INTO teacher_subjects (teacher_profile_id, subject_id, created_at) VALUES (?, ?, NOW())");
            if (!$insSub) throw new Exception('Prepare teacher_subjects insert failed: ' . $conn->error);
            foreach ($subjects as $subId) {
                $sid = intval($subId);
                if ($sid <= 0) continue;
                $insSub->bind_param('ii', $profile_id, $sid);
                $insSub->execute();
            }
            $insSub->close();
        }

        $conn->commit();
    } catch (Throwable $te) {
        $conn->rollback();
        throw $te;
    }

    // fetch updated profile and subjects
    $pstmt = $conn->prepare("SELECT id, teacher_code, first_name, last_name, max_hours_per_day, total_rendered_hours, day_off FROM teacher_profiles WHERE id = ? LIMIT 1");
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
