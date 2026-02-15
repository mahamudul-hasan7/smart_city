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
            c.complaint_id,
            CONCAT('SC-', c.complaint_id) as id,
            cit.full_name as citizen_name,
            c.current_status as status,
            c.type as category,
            z.name as zone,
            c.description,
            c.submitted_date,
            cs.remarks as reason
        FROM complaint c
        LEFT JOIN citizen cit ON c.citizen_id = cit.user_id
        LEFT JOIN zone z ON c.zone_id = z.zone_id
        LEFT JOIN complaint_status cs ON c.complaint_id = cs.complaint_id AND cs.status_name IN ('Rejected', 'Cancelled')
        WHERE c.current_status IN ('Rejected', 'Cancelled')
        ORDER BY c.submitted_date DESC
    ";
    
    $result = $conn->query($query);
    $rejected = [];
    
    while ($row = $result->fetch_assoc()) {
        $rejected[] = [
            'id' => $row['id'],
            'citizen' => $row['citizen_name'],
            'status' => $row['status'],
            'category' => $row['category'],
            'zone' => $row['zone'],
            'description' => $row['description'],
            'date' => $row['submitted_date'],
            'reason' => $row['reason'] ?? 'N/A'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'rejected_cancelled' => $rejected,
        'total' => count($rejected)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
