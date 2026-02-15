<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Include config
require 'db_config.php';

// Check method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['success' => false, 'message' => 'Invalid request method']);
  exit();
}

// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$required = ['user_id', 'current_password', 'new_password'];
foreach ($required as $field) {
  if (!isset($data[$field]) || empty($data[$field])) {
    echo json_encode(['success' => false, 'message' => "Missing: $field"]);
    exit();
  }
}

$user_id = intval($data['user_id']);
$current_password = $data['current_password'];
$new_password = $data['new_password'];

try {
  // Get user from database
  $stmt = $conn->prepare("SELECT password FROM user WHERE user_id = ?");
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit();
  }
  
  $user = $result->fetch_assoc();
  
  // Verify current password
  if (!password_verify($current_password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit();
  }
  
  // Hash new password
  $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
  
  // Update password
  $stmt = $conn->prepare("UPDATE user SET password = ? WHERE user_id = ?");
  $stmt->bind_param("si", $hashed_password, $user_id);
  
  if ($stmt->execute()) {
    echo json_encode([
      'success' => true,
      'message' => 'Password updated successfully'
    ]);
  } else {
    echo json_encode([
      'success' => false,
      'message' => 'Failed to update password: ' . $conn->error
    ]);
  }
  
  $stmt->close();
} catch (Exception $e) {
  echo json_encode([
    'success' => false,
    'message' => 'Error: ' . $e->getMessage()
  ]);
}

$conn->close();
?>
