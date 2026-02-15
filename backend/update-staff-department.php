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
$dept_id = isset($input['dept_id']) ? intval($input['dept_id']) : null;

if (!$user_id || !$dept_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: user_id, dept_id']);
    exit();
}

try {
    // Ensure dept_id column exists on Staff
    $colCheck = $conn->query("SHOW COLUMNS FROM Staff LIKE 'dept_id'");
    if ($colCheck && $colCheck->num_rows === 0) {
        $conn->query("ALTER TABLE Staff ADD COLUMN dept_id INT NULL");
        // Add FK constraint if it is not already present; ignore errors if it exists
        @$conn->query("ALTER TABLE Staff ADD CONSTRAINT fk_staff_department FOREIGN KEY (dept_id) REFERENCES Department(dept_id)");
    }

    // Validate department exists
    $deptStmt = $conn->prepare('SELECT dept_id FROM Department WHERE dept_id = ? LIMIT 1');
    $deptStmt->bind_param('i', $dept_id);
    $deptStmt->execute();
    $deptResult = $deptStmt->get_result();
    if ($deptResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Department not found']);
        exit();
    }

    // Update staff department
    $stmt = $conn->prepare('UPDATE Staff SET dept_id = ? WHERE user_id = ?');
    $stmt->bind_param('ii', $dept_id, $user_id);

    if (!$stmt->execute()) {
        throw new Exception('Update failed: ' . $stmt->error);
    }

    echo json_encode(['success' => true, 'message' => 'Department updated']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
