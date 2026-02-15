<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    $input = json_decode(file_get_contents('php://input'), true);
    
    $admin_id = trim($input['admin_id'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($admin_id) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Admin ID and password required']);
        exit();
    }
    
    // Check in Users table for admin role
    $stmt = $conn->prepare("SELECT user_id, name, email, password, role FROM Users WHERE user_id = ? AND role = 'Admin'");
    $stmt->bind_param('s', $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Fallback: Check hardcoded admin credentials
        if ($admin_id === 'admin' && $password === 'admin123') {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => ['id' => 'admin', 'name' => 'Administrator']
            ]);
            exit();
        }
        
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid Admin ID or password']);
        exit();
    }
    
    $admin = $result->fetch_assoc();
    
    // Verify password
    if (password_verify($password, $admin['password'])) {
        session_start();
        $_SESSION['admin_id'] = $admin['user_id'];
        $_SESSION['admin_name'] = $admin['name'];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $admin['user_id'],
                'name' => $admin['name'],
                'email' => $admin['email']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid password']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
