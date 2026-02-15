<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Database error']));
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $user_id = $_GET['user_id'] ?? 0;
        
        if (empty($user_id)) {
            http_response_code(400);
            exit(json_encode(['success' => false, 'message' => 'User ID required']));
        }
        
        // Pull info from user table and join with citizen table
        $sql = "SELECT u.user_id, u.name, u.email, u.phone_no, 
                       c.nid, c.dob, c.street, c.area, c.city, c.gender
                FROM user u
                LEFT JOIN citizen c ON u.user_id = c.user_id
                WHERE u.user_id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            exit(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
        }
        
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(404);
            exit(json_encode(['success' => false, 'message' => 'User not found']));
        }
        
        $row = $result->fetch_assoc();
        
        // Build address from parts
        $address = '';
        if ($row['street'] || $row['area'] || $row['city']) {
            $parts = array_filter([$row['street'], $row['area'], $row['city']]);
            $address = implode(', ', $parts);
        }
        
        http_response_code(200);
        exit(json_encode([
            'success' => true,
            'user' => [
                'id' => intval($row['user_id']),
                'name' => $row['name'] ?? '',
                'email' => $row['email'] ?? '',
                'phone' => $row['phone_no'] ?? '',
                'nid' => $row['nid'] ?? '',
                'dob' => $row['dob'] ?? '',
                'gender' => $row['gender'] ?? '',
                'address' => $address
            ]
        ]));
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = $input['user_id'] ?? 0;
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $address = trim($input['address'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $nid = trim($input['nid'] ?? '');
        $dob = trim($input['dob'] ?? '');
        $gender = trim($input['gender'] ?? '');
        
        if (empty($user_id) || empty($name) || empty($email)) {
            http_response_code(400);
            exit(json_encode(['success' => false, 'message' => 'Missing required fields']));
        }
        
        // Parse address into components (street, area, city)
        $parts = array_map('trim', explode(',', $address));
        $street = '';
        $area = '';
        $city = '';
        
        if (isset($parts[0])) $street = $parts[0];
        if (isset($parts[1])) $area = $parts[1];
        if (isset($parts[2])) $city = $parts[2];
        
        // Update user table (name, email, phone)
        $sql = "UPDATE user SET name = ?, email = ?, phone_no = ? WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssi', $name, $email, $phone, $user_id);
        if (!$stmt->execute()) {
            http_response_code(500);
            exit(json_encode(['success' => false, 'message' => 'Update failed (user)']));
        }
        
        // Update citizen table (street, area, city, nid, dob, gender)
        $sql = "UPDATE citizen SET street = ?, area = ?, city = ?, nid = ?, dob = ?, gender = ? WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ssssssi', $street, $area, $city, $nid, $dob, $gender, $user_id);
        $stmt->execute();
        
        http_response_code(200);
        exit(json_encode(['success' => true, 'message' => 'Profile updated']));
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Server error']));
}
?>
