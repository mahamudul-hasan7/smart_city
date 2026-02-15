<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : null;

if (!$staff_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing staff_id parameter']);
    exit();
}

try {
    $stmt = $conn->prepare('
        SELECT 
            a.assignment_id,
            a.complaint_id,
            a.assigned_date,
            a.status,
            a.notes,
            c.description,
            c.current_status,
            c.type,
            c.priority_level,
            z.name as zone_name
        FROM StaffAssignment a
        JOIN Complaint c ON a.complaint_id = c.complaint_id
        LEFT JOIN Zone z ON c.zone_id = z.zone_id
        WHERE a.staff_id = ?
        ORDER BY a.assigned_date DESC
    ');
    
    $stmt->bind_param('i', $staff_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $assignments = [];
    while ($row = $result->fetch_assoc()) {
        $assignments[] = [
            'assignment_id' => $row['assignment_id'],
            'complaint_id' => $row['complaint_id'],
            'assigned_date' => $row['assigned_date'],
            'status' => $row['status'],
            'notes' => $row['notes'],
            'complaint_description' => $row['description'],
            'complaint_status' => $row['current_status'],
            'complaint_type' => $row['type'],
            'complaint_priority' => $row['priority_level'],
            'zone' => $row['zone_name']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'assignments' => $assignments,
        'count' => count($assignments)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
