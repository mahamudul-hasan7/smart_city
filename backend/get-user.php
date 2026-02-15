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
    
    $email = $_GET['email'] ?? '';
    
    if (empty($email)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'message' => 'Email required']));
    }
    
    // Pull canonical user from `user` table (holds user_id and email)
    $sql = "SELECT user_id, name, email FROM user WHERE email = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        exit(json_encode(['success' => false, 'message' => 'User not found']));
    }
    
    $user = $result->fetch_assoc();
    $user_id = intval($user['user_id']);
    
    // Get complaints count from complaint table (uses citizen_id)
    $sql_complaints = "SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(current_status) = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN LOWER(current_status) IN ('in progress','in_progress') THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN LOWER(current_status) = 'resolved' THEN 1 ELSE 0 END) as resolved
        FROM complaint WHERE citizen_id = ?";
    
    $stmt = $conn->prepare($sql_complaints);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $complaints_result = $stmt->get_result();
    $complaints_stats = $complaints_result->fetch_assoc();
    
    http_response_code(200);
    exit(json_encode([
        'success' => true,
        'user' => [
            'id' => $user_id,
            'name' => $user['name'],
            'email' => $user['email']
        ],
        'complaints' => [
            'total' => $complaints_stats['total'] ?? 0,
            'pending' => $complaints_stats['pending'] ?? 0,
            'in_progress' => $complaints_stats['in_progress'] ?? 0,
            'resolved' => $complaints_stats['resolved'] ?? 0
        ]
    ]));
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Server error']));
}
?>
