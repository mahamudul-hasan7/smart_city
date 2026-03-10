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
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
    
    if (empty($user_id)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'message' => 'User ID required']));
    }
    
    // Use the actual complaint table structure
    $sql = "SELECT c.complaint_id as id, c.title, c.category, c.location,
            COALESCE(cs_latest.status_name, 'Pending') as status,
            c.created_date
            FROM complaint c
            LEFT JOIN (
                SELECT cs1.complaint_id, cs1.status_name
                FROM complaint_status cs1
                INNER JOIN (
                    SELECT complaint_id, MAX(status_id) AS latest_status_id
                    FROM complaint_status
                    GROUP BY complaint_id
                ) latest ON latest.latest_status_id = cs1.status_id
            ) cs_latest ON c.complaint_id = cs_latest.complaint_id
            WHERE c.user_id = ? ORDER BY c.created_date DESC";
    
    // Add LIMIT if provided
    if ($limit !== null && $limit > 0) {
        $sql .= " LIMIT " . $limit;
    }
    
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
