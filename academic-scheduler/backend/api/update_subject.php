<?php
// API endpoint: update subject
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

    $id = isset($data->id) ? intval($data->id) : 0;
    $subject_name = trim($data->name ?? '');
    $hours = isset($data->hours) ? (float)$data->hours : null;

    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid subject id']);
        exit;
    }

    // Build update query dynamically
    $fields = [];
    $types = '';
    $values = [];
    if ($subject_name !== '') { $fields[] = 'subject_name = ?'; $types .= 's'; $values[] = $subject_name; }
    if (!is_null($hours)) { $fields[] = 'default_hours = ?'; $types .= 'd'; $values[] = $hours; }

    if (count($fields) === 0) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    $sql = "UPDATE subjects SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

    // bind params
    $types .= 'i';
    $values[] = $id;
    $stmt->bind_param($types, ...$values);

    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
        exit;
    }

    // If the name changed, regenerate subject_code
    if ($subject_name !== '') {
        $parts = preg_split('/\s+/', $subject_name);
        $acronym = '';
        foreach (array_slice($parts, 0, 3) as $p) {
            $acronym .= strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $p), 0, 1));
        }
        if ($acronym === '') $acronym = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $subject_name), 0, 3));
        $code = sprintf('%s-%d', $acronym, 100 + $id);
        $upd = $conn->prepare("UPDATE subjects SET subject_code = ? WHERE id = ?");
        if ($upd) { $upd->bind_param('si', $code, $id); $upd->execute(); $upd->close(); }
    }

    // Return updated row
    $res = $conn->query("SELECT id, subject_name, subject_code, default_hours, created_at FROM subjects WHERE id = " . intval($id) . " LIMIT 1");
    $subject = $res ? $res->fetch_assoc() : null;
    if ($subject) {
        $subject['name'] = $subject['subject_name'];
        $subject['hours'] = $subject['default_hours'];
        $subject['code'] = $subject['subject_code'];
    }

    echo json_encode(['success' => true, 'subject' => $subject]);

} catch (Throwable $e) {
    error_log('update_subject error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
