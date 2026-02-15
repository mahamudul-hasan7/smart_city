<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Database connection error: ' . $conn->connect_error]));
    }
    
    $user_id = intval($_GET['user_id'] ?? 0);
    
    if ($user_id <= 0) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'message' => 'Invalid user ID']));
    }
    
    $sql = "SELECT complaint_id AS id, title, category, location,
            status, created_date
            FROM complaint WHERE user_id = ? ORDER BY created_date DESC";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Query prepare error: ' . $conn->error]));
    }
    
    $stmt->bind_param('i', $user_id);
    
    if (!$stmt->execute()) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Query execute error: ' . $stmt->error]));
    }
    
    $result = $stmt->get_result();
    $complaints = [];
    
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'complaints' => $complaints,
        'count' => count($complaints)
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]));
}
?>
