<?php
// API endpoint: list subjects
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../error.log');

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
    include __DIR__ . '/../config/db.php';

    $res = $conn->query("SELECT id, subject_name, subject_code, default_hours, level, created_at FROM subjects ORDER BY id DESC LIMIT 500");
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        // Map DB columns to normalized keys and generate code if missing
        $id = (int)$r['id'];
        $name = trim($r['subject_name'] ?? '');
        $hours = isset($r['default_hours']) ? $r['default_hours'] : null;
        $r['name'] = $name;
        $r['hours'] = $hours;
        $r['code'] = $r['subject_code'] ?? null;
        $r['level'] = $r['level'] ?? '';
        
        // Generate human-readable code like ESL-101 if absent
        // Create acronym from up to 3 words
        $parts = preg_split('/\s+/', $name);
        $acronym = '';
        if (count($parts) > 0) {
            foreach (array_slice($parts, 0, 3) as $p) {
                $acronym .= strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $p), 0, 1));
            }
        }
        if ($acronym === '') {
            // fallback to first three letters
            $acronym = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 3));
        }
        // numeric suffix: 100 + id to start from 101
        $code = sprintf('%s-%d', $acronym, 100 + $id);
        if (empty($r['code'])) $r['code'] = $code;
        $rows[] = $r;
    }

    echo json_encode(['success' => true, 'count' => count($rows), 'subjects' => $rows]);

} catch (Throwable $e) {
    error_log('list_subjects error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
