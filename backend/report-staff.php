<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Get staff with assignment and complaint status counts
    $query = "
        SELECT 
            s.user_id,
            CONCAT(COALESCE(s.first_name, ''), CASE WHEN s.last_name IS NULL OR s.last_name = '' THEN '' ELSE ' ' END, COALESCE(s.last_name, '')) as full_name,
            s.designation,
            COUNT(DISTINCT sa.assignment_id) as total_assigned,
            SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'pending')) = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
            SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'pending')) = 'in progress' THEN 1 ELSE 0 END) as in_progress_count
        FROM staff s
        LEFT JOIN staffassignment sa ON s.user_id = sa.staff_id
        LEFT JOIN complaint c ON sa.complaint_id = c.complaint_id
        LEFT JOIN (
            SELECT cs1.complaint_id, cs1.status_name
            FROM complaint_status cs1
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_status_id
                FROM complaint_status
                GROUP BY complaint_id
            ) latest ON latest.latest_status_id = cs1.status_id
        ) cs_latest ON c.complaint_id = cs_latest.complaint_id
        WHERE s.status IN ('Active', 'On Duty')
        GROUP BY s.user_id, s.first_name, s.last_name, s.designation
        ORDER BY total_assigned DESC, full_name ASC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $staff = [];
    
    while ($row = $result->fetch_assoc()) {
        $staff[] = [
            'staff_id' => $row['user_id'],
            'name' => $row['full_name'],
            'designation' => $row['designation'],
            'assigned' => (int)($row['total_assigned'] ?? 0),
            'resolved' => (int)($row['resolved_count'] ?? 0),
            'in_progress' => (int)($row['in_progress_count'] ?? 0)
        ];
    }
    
    echo json_encode([
        'success' => true,
        'staff' => $staff,
        'count' => count($staff)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'error_detail' => $e->getMessage()
    ]);
}

$conn->close();
?>
