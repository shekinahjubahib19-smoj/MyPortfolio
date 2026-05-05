<?php
// API endpoint: create subject
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "ok"]);
    exit;
}

try {
    include __DIR__ . '/../config/db.php';

    $raw = file_get_contents('php://input');
    $data = json_decode($raw);
    if (!$data) throw new Exception('Invalid or missing JSON body');

    $subject_name = trim($data->name ?? '');
    $hours = isset($data->hours) ? (float)$data->hours : 1;

    if ($subject_name === '') {
        echo json_encode(['success' => false, 'message' => 'Subject name is required']);
        exit;
    }

    // Insert using actual column names in the database. include a placeholder subject_code
    // in case the column is NOT NULL with no default.
    $placeholder_code = '';
    $query = "INSERT INTO subjects (subject_name, default_hours, subject_code, created_at) VALUES (?, ?, ?, NOW())";
    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('sds', $subject_name, $hours, $placeholder_code);

    if ($stmt->execute()) {
        $id = $stmt->insert_id;

        // Generate a subject_code (e.g., ESL-101) and persist it
        $parts = preg_split('/\s+/', $subject_name);
        $acronym = '';
        if (count($parts) > 0) {
            foreach (array_slice($parts, 0, 3) as $p) {
                $acronym .= strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $p), 0, 1));
            }
        }
        if ($acronym === '') {
            $acronym = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $subject_name), 0, 3));
        }
        $code = sprintf('%s-%d', $acronym, 100 + $id);

        $upd = $conn->prepare("UPDATE subjects SET subject_code = ? WHERE id = ?");
        if ($upd) {
            $upd->bind_param('si', $code, $id);
            $upd->execute();
            $upd->close();
        }

        // Fetch the inserted row to return full subject data (mapped keys)
        $res = $conn->query("SELECT id, subject_name, subject_code, default_hours, created_at FROM subjects WHERE id = " . intval($id) . " LIMIT 1");
        $subject = $res ? $res->fetch_assoc() : null;
        if ($subject) {
            // normalize keys for frontend
            $subject['name'] = $subject['subject_name'];
            $subject['hours'] = $subject['default_hours'];
            $subject['code'] = $subject['subject_code'];
        }
        echo json_encode(['success' => true, 'id' => $id, 'subject' => $subject, 'message' => 'Subject created']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Insert failed: ' . $stmt->error]);
    }

} catch (Throwable $e) {
    error_log('create_subject error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
