<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

require 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['success' => false, 'message' => 'Invalid request method']);
  exit();
}

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['user_id']) || empty($data['user_id'])) {
  echo json_encode(['success' => false, 'message' => 'Missing user_id']);
  exit();
}

$user_id = intval($data['user_id']);

try {
  // Start transaction
  $conn->begin_transaction();


  // Delete staff from staff table
  $stmt = $conn->prepare("DELETE FROM staff WHERE user_id = ?");
  $stmt->bind_param("i", $user_id);
  $stmt->execute();

  // Delete user from user table
  $stmt = $conn->prepare("DELETE FROM user WHERE user_id = ?");
  $stmt->bind_param("i", $user_id);
  $stmt->execute();

  $conn->commit();
  echo json_encode(['success' => true, 'message' => 'Staff deleted successfully']);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(['success' => false, 'message' => 'Error deleting staff: ' . $e->getMessage()]);
}

$conn->close();
?>
