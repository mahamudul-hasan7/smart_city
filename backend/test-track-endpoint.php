<?php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        exit(json_encode(['error' => 'Database connection failed']));
    }
    
    // Get a test user_id (from citizen table)
    $result = $conn->query("SELECT user_id FROM citizen LIMIT 1");
    $row = $result->fetch_assoc();
    $test_user_id = $row['user_id'] ?? 1;
    
    // Check what's in complaint table
    $result = $conn->query("SELECT COUNT(*) as total FROM complaint");
    $row = $result->fetch_assoc();
    $total_complaints = $row['total'] ?? 0;
    
    // Get complaints for this user
    $stmt = $conn->prepare("SELECT 
        c.complaint_id,
        c.user_id,
        c.description,
        c.category,
        c.location,
        COALESCE(cs_latest.status_name, 'Pending') as current_status,
        c.created_date
        FROM complaint 
        c
        LEFT JOIN (
            SELECT cs1.complaint_id, cs1.status_name
            FROM complaint_status cs1
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_status_id
                FROM complaint_status
                GROUP BY complaint_id
            ) latest ON latest.latest_status_id = cs1.status_id
        ) cs_latest ON c.complaint_id = cs_latest.complaint_id
        WHERE c.user_id = ?
        LIMIT 10");
    $stmt->bind_param('i', $test_user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $user_complaints = [];
    while ($r = $res->fetch_assoc()) {
        $user_complaints[] = $r;
    }
    
    echo json_encode([
        'test_user_id' => $test_user_id,
        'total_complaints_in_db' => $total_complaints,
        'complaints_for_user' => count($user_complaints),
        'sample' => $user_complaints
    ], JSON_PRETTY_PRINT);
    
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['error' => $e->getMessage()]));
}
?>
