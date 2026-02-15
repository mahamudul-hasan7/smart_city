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
$required = ['complaint_id', 'user_id', 'title', 'description', 'category', 'location'];
foreach ($required as $field) {
  if (!isset($data[$field]) || ($field !== 'location' && empty($data[$field]))) {
    echo json_encode(['success' => false, 'message' => "Missing: $field"]);
    exit();
  }
}

$complaint_id = intval($data['complaint_id']);
$user_id = intval($data['user_id']);
$title = $data['title'];
$description = $data['description'];
$category = $data['category'];
$location = $data['location'];

// Validate inputs
if (strlen($title) < 5) {
  echo json_encode(['success' => false, 'message' => 'Title must be at least 5 characters']);
  exit();
}

if (strlen($description) < 10) {
  echo json_encode(['success' => false, 'message' => 'Description must be at least 10 characters']);
  exit();
}

try {
  // Check if complaint exists and belongs to user
  $stmt = $conn->prepare("SELECT status FROM Complaint WHERE id = ? AND citizen_id = ?");
  $stmt->bind_param("ii", $complaint_id, $user_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found or does not belong to you']);
    exit();
  }
  
  $complaint = $result->fetch_assoc();
  
  // Check if status is pending
  if ($complaint['status'] !== 'Pending') {
    echo json_encode(['success' => false, 'message' => 'Only pending complaints can be edited']);
    exit();
  }
  
  // Update complaint
  $stmt = $conn->prepare("UPDATE Complaint SET title = ?, description = ?, category = ?, location = ? WHERE id = ? AND citizen_id = ?");
  $stmt->bind_param("ssssii", $title, $description, $category, $location, $complaint_id, $user_id);
  
  if ($stmt->execute()) {
    echo json_encode([
      'success' => true,
      'message' => 'Complaint updated successfully',
      'complaint_id' => $complaint_id
    ]);
  } else {
    echo json_encode([
      'success' => false,
      'message' => 'Failed to update complaint: ' . $conn->error
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
