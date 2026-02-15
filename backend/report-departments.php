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
    $query = "
        SELECT 
            d.dept_id,
            d.name as department_name,
            COUNT(c.complaint_id) as total_complaints,
            SUM(CASE WHEN c.current_status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN c.current_status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN c.current_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN c.current_status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            ROUND(AVG(DATEDIFF(NOW(), c.submitted_date))) as avg_days_to_resolve
        FROM department d
        LEFT JOIN complaint c ON d.dept_id = c.dept_id AND c.dept_id IS NOT NULL
        WHERE d.dept_id IS NOT NULL AND LOWER(d.name) NOT IN ('unassigned', 'unassigned department', 'no department', '')
        GROUP BY d.dept_id, d.name
        HAVING COUNT(c.complaint_id) > 0
        ORDER BY total_complaints DESC
    ";
    
    $result = $conn->query($query);
    $departments = [];
    
    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'dept_id' => $row['dept_id'],
            'name' => $row['department_name'],
            'total' => (int)$row['total_complaints'],
            'resolved' => (int)$row['resolved'],
            'pending' => (int)$row['pending'],
            'in_progress' => (int)$row['in_progress'],
            'rejected' => (int)$row['rejected'],
            'avg_days' => (int)$row['avg_days_to_resolve']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'departments' => $departments
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
