<?php
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit();
}

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
        exit();
    }
    
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $street = trim($data['street'] ?? '');
    $area = trim($data['area'] ?? '');
    $city = trim($data['city'] ?? '');
    
    if (empty($name)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Department name is required']);
        exit();
    }
    
    // Get next dept_id from frontend (already calculated)
    $dept_id = isset($data['dept_id']) ? (int) $data['dept_id'] : 0;
    
    if ($dept_id <= 0) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid Department ID']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO Department (dept_id, name, email, phone_no, office_street, office_city, office_area) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('issssss', $dept_id, $name, $email, $phone, $street, $city, $area);
    
    if ($stmt->execute()) {
        ob_clean();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Department added successfully',
            'data' => ['dept_id' => $dept_id, 'name' => $name]
        ]);
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to add department: ' . $stmt->error]);
    }
    
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
