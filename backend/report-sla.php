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
    // Overall SLA metrics
    $query = "
        SELECT 
            COUNT(*) as total,
            ROUND(AVG(DATEDIFF(NOW(), created_date))) as avg_response_time,
            MAX(DATEDIFF(NOW(), created_date)) as max_time_days,
            SUM(CASE WHEN DATEDIFF(NOW(), created_date) > 7 AND status != 'Resolved' THEN 1 ELSE 0 END) as sla_breached
        FROM complaint
    ";
    
    $result = $conn->query($query);
    $sla_overall = $result->fetch_assoc();
    
    // Department-wise SLA
    $query = "
        SELECT 
            d.name as department,
            COUNT(c.complaint_id) as total_complaints,
            ROUND(AVG(DATEDIFF(NOW(), c.created_date))) as avg_resolution_time,
            SUM(CASE WHEN c.current_status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN DATEDIFF(NOW(), c.created_date) > 7 AND c.current_status != 'Resolved' THEN 1 ELSE 0 END) as overdue
        FROM department d
        LEFT JOIN staffassignment sa ON d.dept_id = sa.department_id
        LEFT JOIN complaint c ON sa.complaint_id = c.complaint_id
        GROUP BY d.dept_id, d.name
        HAVING total_complaints > 0
        ORDER BY avg_resolution_time DESC
    ";
    
    $result = $conn->query($query);
    $sla_depts = [];
    
    while ($row = $result->fetch_assoc()) {
        $sla_depts[] = [
            'department' => $row['department'],
            'avg_time_days' => (int)$row['avg_resolution_time'],
            'resolved' => (int)$row['resolved'],
            'overdue' => (int)$row['overdue']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'overall' => [
            'total_complaints' => (int)$sla_overall['total'],
            'avg_response_days' => (int)$sla_overall['avg_response_time'],
            'max_days_pending' => (int)$sla_overall['max_time_days'],
            'sla_breached' => (int)$sla_overall['sla_breached']
        ],
        'by_department' => $sla_depts
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
