<?php
// Clean output buffer
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit();
}

// Include database config
require_once __DIR__ . '/db_config.php';

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Validate JSON
    if (json_last_error() !== JSON_ERROR_NONE) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit();
    }
    
    // Get and validate fields
    $staff_id = isset($data['staff_id']) ? trim($data['staff_id']) : '';
    $full_name = isset($data['full_name']) ? trim($data['full_name']) : '';
    $designation = isset($data['designation']) ? trim($data['designation']) : '';
    $department = isset($data['department']) ? trim($data['department']) : '';
    $zone = isset($data['zone']) ? trim($data['zone']) : '';
    $status = isset($data['status']) ? trim($data['status']) : 'Active';
    $phone = isset($data['phone']) ? trim($data['phone']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    
    // Validation
    if (empty($staff_id)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Staff ID is required']);
        exit();
    }
    
    if (empty($full_name)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Full name is required']);
        exit();
    }
    
    if (empty($zone)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Zone is required']);
        exit();
    }
    
    // Trim and normalize zone name
    $zone = trim($zone);
    $zone_lower = strtolower($zone);
    
    // Get zone_id - Use case-insensitive search
    // First try exact match, then case-insensitive
    $stmt = $conn->prepare("SELECT zone_id, name FROM zone WHERE name = ? OR LOWER(name) = ?");
    if (!$stmt) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit();
    }
    
    $stmt->bind_param('ss', $zone, $zone_lower);
    $stmt->execute();
    $result = $stmt->get_result();
    // Check if zone exists
    if ($result->num_rows === 0) {
        // Debug: Get all available zones
        $all_zones_query = $conn->query("SELECT zone_id, name FROM zone ORDER BY name");
        $available_zones = [];
        if ($all_zones_query) {
            while ($row = $all_zones_query->fetch_assoc()) {
                $available_zones[] = [
                    'zone_id' => $row['zone_id'],
                    'name' => $row['name']
                ];
            }
        }
        
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid zone selected: "' . $zone . '"',
            'selected_zone' => $zone,
            'available_zones' => $available_zones,
            'hint' => 'Please select from available zones listed above'
        ]);
        exit();
    }
    
    $zone_row = $result->fetch_assoc();
    $zone_id = $zone_row['zone_id'];
    
    // Get next user_id from staff_id (which should already be the next ID)
    $user_id = (int) $staff_id;
    
    if ($user_id <= 0) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid Staff ID']);
        exit();
    }
    
    // If user_id already exists, find next available one
    while (true) {
        $stmt = $conn->prepare("SELECT user_id FROM user WHERE user_id = ?");
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) break;
        $user_id++;
    }
    $staff_id = (string) $user_id;
    
    // Split name
    $name_parts = explode(' ', $full_name, 2);
    $first_name = $name_parts[0];
    $last_name = isset($name_parts[1]) ? $name_parts[1] : '';

    $dept_id = null;
    if (!empty($department)) {
        $deptLookup = $conn->prepare("SELECT dept_id FROM department WHERE name = ? LIMIT 1");
        if ($deptLookup) {
            $deptLookup->bind_param('s', $department);
            $deptLookup->execute();
            $deptResult = $deptLookup->get_result();
            if ($deptResult && $deptResult->num_rows > 0) {
                $dept_id = (int)$deptResult->fetch_assoc()['dept_id'];
            }
            $deptLookup->close();
        }
    }
    
    // Hash password
    $password = password_hash('staff123', PASSWORD_BCRYPT);
    
    // Start transaction
    $conn->begin_transaction();
    
    // Insert into user
    $stmt = $conn->prepare("INSERT INTO user (user_id, name, email, password, phone_no, role, status) VALUES (?, ?, ?, ?, ?, 'Staff', ?)");
    $stmt->bind_param('isssss', $user_id, $full_name, $email, $password, $phone, $status);
    
    if (!$stmt->execute()) {
        $conn->rollback();
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create user: ' . $stmt->error]);
        exit();
    }
    
    // Insert into staff
    $stmt = $conn->prepare("INSERT INTO staff (user_id, first_name, last_name, designation, joining_date, status, phone_no, zone_id, dept_id) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)");
    $stmt->bind_param('isssssii', $user_id, $first_name, $last_name, $designation, $status, $phone, $zone_id, $dept_id);
    
    if (!$stmt->execute()) {
        $conn->rollback();
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create staff: ' . $stmt->error]);
        exit();
    }
    
    // Commit
    $conn->commit();
    
    // Success response
    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Staff added successfully',
        'data' => [
            'user_id' => $user_id,
            'staff_id' => $staff_id,
            'name' => $full_name
        ]
    ]);
    
} catch (Exception $e) {
    if (isset($conn) && $conn->in_transaction) {
        $conn->rollback();
    }
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

if (isset($conn)) {
    $conn->close();
}
?>
