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
            s.full_name,
            s.designation,
            COUNT(DISTINCT sa.assignment_id) as total_assigned,
            SUM(CASE WHEN LOWER(c.status) = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
            SUM(CASE WHEN LOWER(c.status) = 'in progress' THEN 1 ELSE 0 END) as in_progress_count
        FROM staff s
        LEFT JOIN staffassignment sa ON s.user_id = sa.staff_id
        LEFT JOIN complaint c ON sa.complaint_id = c.complaint_id
        WHERE s.status IN ('Active', 'On Duty')
        GROUP BY s.user_id, s.full_name, s.designation
        ORDER BY total_assigned DESC, s.full_name ASC
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
