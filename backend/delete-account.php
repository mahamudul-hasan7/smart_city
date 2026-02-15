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
$required = ['user_id', 'password'];
foreach ($required as $field) {
  if (!isset($data[$field]) || empty($data[$field])) {
    echo json_encode(['success' => false, 'message' => "Missing: $field"]);
    exit();
  }
}

$user_id = intval($data['user_id']);
$password = $data['password'];

try {
  // Verify user password first
  $stmt = $conn->prepare("SELECT password FROM user WHERE user_id = ?");
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit();
  }
  
  $user = $result->fetch_assoc();
  
  // Verify password (check both plain and hashed)
  if ($user['password'] !== $password && !password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
    exit();
  }

  // Start transaction
  $conn->begin_transaction();

  try {
    // Delete user data from citizen table
    $stmt = $conn->prepare("DELETE FROM citizen WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    // Delete all complaints associated with user
    $stmt = $conn->prepare("DELETE FROM Complaint WHERE citizen_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    // Delete user from user table
    $stmt = $conn->prepare("DELETE FROM user WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    // Commit transaction
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Account deleted successfully']);
  } catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error deleting account: ' . $e->getMessage()]);
  }

} catch (Exception $e) {
  echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
  exit();
}

$conn->close();
?>
