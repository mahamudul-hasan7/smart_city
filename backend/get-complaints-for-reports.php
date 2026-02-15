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

try {
    $query = "SELECT 
        c.complaint_id,
        c.category as type,
        c.description,
        c.status as current_status,
        c.created_date as submitted_date,
        c.user_id,
        c.location,
        sa.department_id,
        sa.staff_id,
        d.name as dept_name,
        s.full_name as staff_name
    FROM complaint c
    LEFT JOIN staffassignment sa ON c.complaint_id = sa.complaint_id
    LEFT JOIN department d ON sa.department_id = d.dept_id
    LEFT JOIN staff s ON sa.staff_id = s.user_id
    ORDER BY c.created_date DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = [
            'complaint_id' => $row['complaint_id'],
            'type' => $row['type'] ?? 'Other',
            'description' => $row['description'] ?? '',
            'current_status' => $row['current_status'] ?? 'Pending',
            'submitted_date' => $row['submitted_date'] ?? date('Y-m-d'),
            'user_id' => $row['user_id'],
            'location' => $row['location'] ?? 'Unknown',
            'area' => $row['location'] ?? 'Unknown',
            'dept_id' => $row['department_id'],
            'dept_name' => $row['dept_name'] ?? 'Unassigned',
            'department' => $row['dept_name'] ?? 'Unassigned',
            'staff_id' => $row['staff_id'],
            'assigned_to' => $row['staff_name'] ?? null
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'complaints' => $complaints,
        'count' => count($complaints)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
