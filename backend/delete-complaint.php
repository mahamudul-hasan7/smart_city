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

$data         = json_decode(file_get_contents('php://input'), true);
$complaint_id = isset($data['complaint_id']) ? (int)$data['complaint_id'] : 0;

if ($complaint_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid complaint ID.']);
    exit();
}

// Delete related status history first (foreign key safety)
$conn->query("DELETE FROM complaint_status WHERE complaint_id = $complaint_id");

$stmt = $conn->prepare("DELETE FROM complaint WHERE complaint_id = ?");
$stmt->bind_param('i', $complaint_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Complaint deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Complaint not found.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
