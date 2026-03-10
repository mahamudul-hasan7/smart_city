<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$data    = json_decode(file_get_contents('php://input'), true);
$dept_id = isset($data['dept_id']) ? (int)$data['dept_id'] : 0;

if ($dept_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid department ID.']);
    exit();
}

$stmt = $conn->prepare("DELETE FROM Department WHERE dept_id = ?");
$stmt->bind_param('i', $dept_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Department deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Department not found.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
