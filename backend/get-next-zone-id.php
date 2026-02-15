<?php
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $result = $conn->query("SELECT MAX(zone_id) as max_id FROM zone");
    
    if (!$result) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
        exit();
    }
    
    $row = $result->fetch_assoc();
    $max_id = $row['max_id'] ?? 0;
    $next_id = $max_id + 1;
    
    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'next_zone_id' => $next_id,
        'max_zone_id' => $max_id
    ]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
