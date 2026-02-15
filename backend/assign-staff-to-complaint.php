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
$staff_id = isset($input['staff_id']) ? intval($input['staff_id']) : null;
$complaint_id = isset($input['complaint_id']) ? intval($input['complaint_id']) : null;
$notes = isset($input['notes']) ? trim($input['notes']) : null;

if (!$staff_id || !$complaint_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: staff_id, complaint_id']);
    exit();
}

try {
    // Verify staff exists
    $staffStmt = $conn->prepare('SELECT user_id FROM Staff WHERE user_id = ? LIMIT 1');
    $staffStmt->bind_param('i', $staff_id);
    $staffStmt->execute();
    if ($staffStmt->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Staff member not found']);
        exit();
    }

    // Verify complaint exists
    $complaintStmt = $conn->prepare('SELECT complaint_id FROM Complaint WHERE complaint_id = ? LIMIT 1');
    $complaintStmt->bind_param('i', $complaint_id);
    $complaintStmt->execute();
    if ($complaintStmt->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit();
    }

    // Insert assignment
    $stmt = $conn->prepare('INSERT INTO StaffAssignment (staff_id, complaint_id, notes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE notes = ?');
    $stmt->bind_param('iiss', $staff_id, $complaint_id, $notes, $notes);

    if (!$stmt->execute()) {
        if (strpos($stmt->error, 'Duplicate') !== false) {
            echo json_encode(['success' => false, 'message' => 'Staff member already assigned to this complaint']);
        } else {
            throw new Exception('Insert failed: ' . $stmt->error);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Staff assigned to complaint successfully',
            'assignment_id' => $conn->insert_id
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
