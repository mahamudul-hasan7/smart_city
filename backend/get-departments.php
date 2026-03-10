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
        dept_id,
        CONCAT('DPT-', LPAD(dept_id, 2, '0')) as id,
        name,
        email,
        phone_no,
        office_street as street,
        office_area as area,
        office_city as city
    FROM Department
    ORDER BY dept_id";
    
    $result = $conn->query($query);
    $departments = [];
    
    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'rawId' => (int)$row['dept_id'],
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'] ?? 'N/A',
            'phone' => $row['phone_no'] ?? 'N/A',
            'street' => $row['street'] ?? 'N/A',
            'area' => $row['area'] ?? 'N/A',
            'city' => $row['city'] ?? 'N/A'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'departments' => $departments,
        'count' => count($departments)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
