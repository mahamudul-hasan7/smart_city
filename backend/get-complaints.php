<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Database error']));
    }
    
    $user_id = $_GET['user_id'] ?? 0;
    
    if (empty($user_id)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'message' => 'User ID required']));
    }
    
    // Use the actual complaint table structure
    $sql = "SELECT complaint_id as id, title, category, location, 
            status, created_date
            FROM complaint WHERE user_id = ? ORDER BY created_date DESC";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        exit(json_encode([
            'success' => false, 
            'message' => 'Failed to prepare SQL statement: ' . $conn->error,
            'complaints' => []
        ]));
    }
    
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    
    http_response_code(200);
    exit(json_encode([
        'success' => true,
        'complaints' => $complaints,
        'count' => count($complaints)
    ]));
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'complaints' => []
    ]));
}
?>
