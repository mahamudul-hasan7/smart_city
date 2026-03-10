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

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    $complaint_id = isset($input['complaint_id']) ? intval($input['complaint_id']) : 0;
    $new_status = isset($input['status']) ? trim($input['status']) : '';
    $notes = isset($input['notes']) ? trim($input['notes']) : '';
    $stage = isset($input['stage']) ? trim($input['stage']) : '';
    $progress_percent = isset($input['progress_percent']) ? intval($input['progress_percent']) : null;
    $staff_id = isset($input['staff_id']) ? intval($input['staff_id']) : 0;
    
    // Validate
    if (!$complaint_id || !$new_status) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }
    
    $allowed_statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Cancelled', 'On Hold'];
    if (!in_array($new_status, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }
    
    // Check if complaint exists
    $check = $conn->query("SELECT complaint_id FROM complaint WHERE complaint_id = $complaint_id");
    if ($check->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit();
    }

    $old_status = 'Pending';
    $oldStatusSql = "SELECT status_name FROM complaint_status WHERE complaint_id = ? ORDER BY status_date DESC, status_id DESC LIMIT 1";
    $oldStmt = $conn->prepare($oldStatusSql);
    if ($oldStmt) {
        $oldStmt->bind_param('i', $complaint_id);
        $oldStmt->execute();
        $oldResult = $oldStmt->get_result();
        if ($oldResult && $oldResult->num_rows > 0) {
            $oldRow = $oldResult->fetch_assoc();
            $old_status = $oldRow['status_name'] ?? 'Pending';
        }
        $oldStmt->close();
    }

    // Transition guards
    $old_lower = strtolower($old_status);
    $new_lower = strtolower($new_status);
    if ($old_lower === 'resolved') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint is resolved; further updates are not allowed']);
        exit();
    }
    if ($old_lower === 'rejected') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint is rejected; further updates are not allowed']);
        exit();
    }
    if ($old_lower === 'in progress') {
        if (!in_array($new_lower, ['cancelled', 'resolved'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'From In Progress, only Cancelled or Resolved is allowed']);
            exit();
        }
    }
    
    // Log status update to complaint_status (source of truth)
    // Build remarks with optional stage/progress
    $remarks = $notes;
    if (!empty($stage) || is_numeric($progress_percent)) {
        $parts = [];
        if (!empty($stage)) { $parts[] = "Stage: $stage"; }
        if (is_numeric($progress_percent)) { $parts[] = "Progress: $progress_percent%"; }
        $prefix = implode(' | ', $parts);
        $remarks = trim($prefix . (empty($notes) ? '' : " | Note: $notes"));
    }

    $log_query = "INSERT INTO complaint_status (complaint_id, status_name, remarks, updated_by, status_date)
                  VALUES (?, ?, ?, ?, NOW())";
    $log_stmt = $conn->prepare($log_query);
    
    if ($log_stmt) {
        $log_stmt->bind_param("isss", $complaint_id, $new_status, $remarks, $updated_by_str);
        $updated_by_str = "Staff ID: " . $staff_id;
        $log_stmt->execute();
        $log_stmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Complaint status updated successfully',
        'complaint_id' => $complaint_id,
        'old_status' => $old_status,
        'new_status' => $new_status
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
