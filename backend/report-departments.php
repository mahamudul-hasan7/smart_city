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
            SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') IN ('Rejected', 'Cancelled') THEN 1 ELSE 0 END) as rejected,
            ROUND(AVG(DATEDIFF(NOW(), c.created_date))) as avg_days_to_resolve
        FROM department d
        LEFT JOIN staff s ON d.dept_id = s.dept_id
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
        WHERE d.dept_id IS NOT NULL
          AND LOWER(d.name) NOT IN ('unassigned', 'unassigned department', 'no department', '')
        GROUP BY d.dept_id, d.name
        HAVING COUNT(c.complaint_id) > 0
        ORDER BY total_complaints DESC
    ";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
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
            'avg_days' => (int)($row['avg_days_to_resolve'] ?? 0)
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
