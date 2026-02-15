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

$input = json_decode(file_get_contents('php://input'), true);
$user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
$status = isset($input['status']) ? trim($input['status']) : null;

$valid_statuses = ['Active', 'On Duty', 'On Leave'];

if (!$user_id || !$status || !in_array($status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or missing fields: user_id, status']);
    exit();
}

try {
    // Verify staff exists
    $staffStmt = $conn->prepare('SELECT user_id FROM Staff WHERE user_id = ? LIMIT 1');
    $staffStmt->bind_param('i', $user_id);
    $staffStmt->execute();
    if ($staffStmt->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Staff member not found']);
        exit();
    }

    // Update staff status
    $stmt = $conn->prepare('UPDATE Staff SET status = ? WHERE user_id = ?');
    $stmt->bind_param('si', $status, $user_id);

    if (!$stmt->execute()) {
        throw new Exception('Update failed: ' . $stmt->error);
    }

    echo json_encode(['success' => true, 'message' => 'Status updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
