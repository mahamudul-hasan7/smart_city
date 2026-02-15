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
    $city = trim($data['city'] ?? 'Dhaka');
    $area_description = trim($data['area_description'] ?? '');
    $zone_id = isset($data['zone_id']) ? intval($data['zone_id']) : 0;
    
    if (empty($name)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Zone name is required']);
        exit();
    }
    
    // If zone_id not provided, get next available one
    if ($zone_id <= 0) {
        $result = $conn->query("SELECT MAX(zone_id) as max_id FROM zone");
        $row = $result->fetch_assoc();
        $max_id = intval($row['max_id'] ?? 0);
        $zone_id = $max_id + 1;
    }
    
    if ($zone_id <= 0) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid Zone ID']);
        exit();
    }
    
    // Check if zone already exists
    $check = $conn->prepare("SELECT zone_id FROM zone WHERE name = ?");
    $check->bind_param('s', $name);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        ob_clean();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Zone already exists']);
        exit();
    }
    
    // Insert with explicit zone_id
    $stmt = $conn->prepare("INSERT INTO zone (zone_id, name, city_name, area_description) VALUES (?, ?, ?, ?)");
    
    if (!$stmt) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit();
    }
    
    $stmt->bind_param('isss', $zone_id, $name, $city, $area_description);
    
    if ($stmt->execute()) {
        ob_clean();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Zone added successfully',
            'data' => ['zone_id' => $zone_id, 'name' => $name]
        ]);
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to add zone: ' . $stmt->error]);
    }
    
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
