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
if (!isset($data['zone_id']) || empty($data['zone_id'])) {
  echo json_encode(['success' => false, 'message' => 'Missing zone_id']);
  exit();
}

$zone_id = intval($data['zone_id']);

try {
  $conn->begin_transaction();
  // Delete from zone table
  $stmt = $conn->prepare("DELETE FROM zone WHERE zone_id = ?");
  $stmt->bind_param("i", $zone_id);
  $stmt->execute();
  $conn->commit();
  echo json_encode(['success' => true, 'message' => 'Zone deleted successfully']);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(['success' => false, 'message' => 'Error deleting zone: ' . $e->getMessage()]);
}

$conn->close();
?>
