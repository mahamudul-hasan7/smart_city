<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$response = ['success' => false, 'message' => 'Error'];

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        $response['message'] = 'Database error';
        exit(json_encode($response));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($input['name'] ?? '');
    $nid = trim($input['nid'] ?? '');
    $dob = trim($input['dob'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $confirm = $input['confirm'] ?? '';
    
    $errors = [];
    
    if (strlen($name) < 3) $errors['name'] = 'Name too short';
    if (strlen($nid) < 6) $errors['nid'] = 'Invalid NID';
    if (empty($dob)) $errors['dob'] = 'DOB required';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Invalid email';
    if (strlen($password) < 6) $errors['password'] = 'Password too short';
    if ($password !== $confirm) $errors['confirm'] = 'Passwords mismatch';
    
    if (!empty($errors)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'errors' => $errors]));
    }
    
    // Uniqueness checks on canonical tables
    $sql = "SELECT user_id FROM user WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        exit(json_encode(['success' => false, 'errors' => ['email' => 'Email exists']]));
    }
    
    $sql = "SELECT user_id FROM citizen WHERE nid = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $nid);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        exit(json_encode(['success' => false, 'errors' => ['nid' => 'NID exists']]));
    }
    
    $hashed = password_hash($password, PASSWORD_BCRYPT);
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // 1) Insert into user table (user_id is AUTO_INCREMENT now)
        $role = 'Citizen';
        $status = 'Active';
        $sql = "INSERT INTO user (name, email, password, phone_no, role, status) VALUES (?, ?, ?, '', ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssss', $name, $email, $hashed, $role, $status);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to insert into user table');
        }
        
        $user_id = $conn->insert_id;
        
        // 2) Insert into citizen table (normalized schema)
        $sql = "INSERT INTO citizen (user_id, nid, dob) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('iss', $user_id, $nid, $dob);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to insert into citizen table: ' . $stmt->error);
        }
        
        // Commit transaction
        $conn->commit();
        
        http_response_code(201);
        exit(json_encode([
            'success' => true, 
            'message' => 'Registration successful',
            'user_id' => $user_id
        ]));
        
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Failed to register: ' . $e->getMessage()]));
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Server error']));
}
?>
