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
            COALESCE(u.name, CONCAT('User-', c.user_id)) as citizen_name,
            COALESCE(cs_latest.status_name, 'Pending') as status,
            c.category as category,
            z.name as zone,
            c.description,
            c.created_date as submitted_date,
            cs_rejected.remarks as reason
        FROM complaint c
        LEFT JOIN user u ON c.user_id = u.user_id
        LEFT JOIN staffassignment sa ON c.complaint_id = sa.complaint_id
        LEFT JOIN staff s ON sa.staff_id = s.user_id
        LEFT JOIN zone z ON s.zone_id = z.zone_id
        LEFT JOIN (
            SELECT cs1.complaint_id, cs1.status_name
            FROM complaint_status cs1
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_status_id
                FROM complaint_status
                GROUP BY complaint_id
            ) latest ON latest.latest_status_id = cs1.status_id
        ) cs_latest ON c.complaint_id = cs_latest.complaint_id
        LEFT JOIN (
            SELECT cs2.complaint_id, cs2.remarks
            FROM complaint_status cs2
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_rejected_status_id
                FROM complaint_status
                WHERE status_name IN ('Rejected', 'Cancelled')
                GROUP BY complaint_id
            ) rejected_latest ON rejected_latest.latest_rejected_status_id = cs2.status_id
        ) cs_rejected ON c.complaint_id = cs_rejected.complaint_id
        WHERE COALESCE(cs_latest.status_name, 'Pending') IN ('Rejected', 'Cancelled')
        ORDER BY c.created_date DESC
    ";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
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
