<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $result = $conn->query("SELECT MAX(user_id) as max_id FROM staff");
    $row = $result->fetch_assoc();
    $max_id = $row['max_id'] ?? 0;
    $next_id = $max_id + 1;
    
    echo json_encode([
        'success' => true,
        'next_staff_id' => $next_id,
        'max_staff_id' => $max_id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
