<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  echo json_encode(['success' => false, 'message' => 'Invalid request method']);
  exit();
}

// Get parameters
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
  echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
  exit();
}

try {
  // Ensure login_history table exists (defensive)
  $conn->query("CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(64),
    device_info VARCHAR(255),
    INDEX idx_user_login (user_id, login_time)
  ) ENGINE=InnoDB");

  $stmt = $conn->prepare("SELECT login_time, ip_address, device_info FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 20");
  $stmt->bind_param('i', $user_id);
  $stmt->execute();
  $res = $stmt->get_result();
  
  $logins = [];
  while ($row = $res->fetch_assoc()) {
    $logins[] = [
      'login_time' => $row['login_time'],
      'ip_address' => $row['ip_address'] ?? 'N/A',
      'device' => $row['device_info'] ?? 'Unknown'
    ];
  }
  $stmt->close();

  echo json_encode([
    'success' => true,
    'logins' => $logins
  ]);

} catch (Exception $e) {
  echo json_encode([
    'success' => false,
    'message' => 'Error: ' . $e->getMessage()
  ]);
}

$conn->close();
?>
