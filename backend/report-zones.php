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
            z.zone_id,
            z.name as zone_name,
            COUNT(c.complaint_id) as total_complaints,
            SUM(CASE WHEN c.current_status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN c.current_status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN c.current_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN c.current_status = 'Rejected' THEN 1 ELSE 0 END) as rejected
        FROM zone z
        LEFT JOIN complaint c ON z.zone_id = c.zone_id
        GROUP BY z.zone_id, z.name
        ORDER BY total_complaints DESC
    ";
    
    $result = $conn->query($query);
    $zones = [];
    
    while ($row = $result->fetch_assoc()) {
        $zones[] = [
            'zone_id' => $row['zone_id'],
            'name' => $row['zone_name'],
            'total' => (int)$row['total_complaints'],
            'resolved' => (int)$row['resolved'],
            'pending' => (int)$row['pending'],
            'in_progress' => (int)$row['in_progress'],
            'rejected' => (int)$row['rejected']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'zones' => $zones
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
