<?php
// Get list of departments for dropdown
require_once __DIR__ . '/cors-headers.php';
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $sql = "SELECT dept_id, name FROM Department ORDER BY name ASC";
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $departments = [];
    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'id' => $row['dept_id'],
            'name' => $row['name']
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'departments' => $departments
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching departments: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
