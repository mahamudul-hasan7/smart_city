<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

try {
    $conn = new mysqli('localhost', 'root', '', 'smart_city');
    
    if ($conn->connect_error) {
        http_response_code(500);
        exit(json_encode(['success' => false, 'message' => 'Database error']));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    $errors = [];
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Invalid email';
    }
    
    if (empty($password)) {
        $errors['password'] = 'Password required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'errors' => $errors]));
    }
    
    // Find user record and password directly from user table
    $sql = "SELECT user_id, name, email, password FROM user WHERE email = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        exit(json_encode(['success' => false, 'errors' => ['email' => 'Email not found']]));
    }
    
    $userRow = $result->fetch_assoc();
    
    // Verify password
    if (!password_verify($password, $userRow['password'])) {
        http_response_code(401);
        exit(json_encode(['success' => false, 'errors' => ['password' => 'Incorrect password']]));
    }
    
    $user_id = intval($userRow['user_id']);
    $user_name = $userRow['name'];
    $user_email = $userRow['email'];
    
    // Login successful - create session
    session_start();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_email'] = $user_email;
    $_SESSION['user_name'] = $user_name;

    // Login metadata history has been removed by requirement.
    
    http_response_code(200);
    exit(json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user_id,
            'name' => $user_name,
            'email' => $user_email
        ]
    ]));
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Server error']));
}
?>
