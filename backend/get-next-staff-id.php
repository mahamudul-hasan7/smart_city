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
    // Get max user_id from both user and staff tables to avoid conflicts
    $result = $conn->query("SELECT GREATEST(COALESCE((SELECT MAX(user_id) FROM user), 0), COALESCE((SELECT MAX(user_id) FROM staff), 0)) as max_id");
    $row = $result->fetch_assoc();
    $max_id = $row['max_id'] ?? 0;
    $next_id = $max_id + 1;

    // Keep incrementing until we find an ID not in user table
    while (true) {
        $check = $conn->prepare("SELECT user_id FROM user WHERE user_id = ?");
        $check->bind_param('i', $next_id);
        $check->execute();
        $check_result = $check->get_result();
        if ($check_result->num_rows === 0) break;
        $next_id++;
    }
    
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
