<?php
// Update complaint assignment and status
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit();
}

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit();
    }

    $complaint_id = $data['complaint_id'] ?? null;
    $staff_id = $data['staff_id'] ?? null;
    $status = $data['status'] ?? null;
    $remarks = $data['remarks'] ?? null;

    // Validate required fields
    if (!$complaint_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required field: complaint_id']);
        exit();
    }

    // Validate status if provided
    $valid_statuses = ['Pending', 'In Progress', 'On Hold', 'Resolved', 'Rejected'];
    if ($status && !in_array($status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status value']);
        exit();
    }

    // Start transaction
    $conn->begin_transaction();

    $checkComplaintStmt = $conn->prepare("SELECT complaint_id FROM complaint WHERE complaint_id = ? LIMIT 1");
    if (!$checkComplaintStmt) {
        throw new Exception('Failed to prepare complaint check: ' . $conn->error);
    }
    $checkComplaintStmt->bind_param('i', $complaint_id);
    $checkComplaintStmt->execute();
    $complaintResult = $checkComplaintStmt->get_result();
    if (!$complaintResult || $complaintResult->num_rows === 0) {
        throw new Exception('Complaint not found');
    }
    $checkComplaintStmt->close();

    // If status is being updated, log to complaint_status table
    if ($status) {
        $log_sql = "INSERT INTO complaint_status (complaint_id, status_name, remarks, updated_by, status_date) 
                    VALUES (?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($log_sql);
        if (!$stmt) {
            throw new Exception('Failed to prepare status log statement: ' . $conn->error);
        }
        
        $updated_by = $staff_id ? 'Staff-' . $staff_id : 'Admin';
        $stmt->bind_param('isss', $complaint_id, $status, $remarks, $updated_by);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to log status change: ' . $stmt->error);
        }
        $stmt->close();
    }
    
    // Only create/update assignment if staff_id is provided
    if ($staff_id) {
        // Check if assignment exists for this complaint
        $check_sql = "SELECT assignment_id FROM staffassignment WHERE complaint_id = ?";
        $stmt = $conn->prepare($check_sql);
        if (!$stmt) {
            throw new Exception('Failed to check assignment: ' . $conn->error);
        }
        $stmt->bind_param('i', $complaint_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result && $result->num_rows > 0;
        $stmt->close();

        if ($exists) {
            // Update existing assignment
            $update_assign_sql = "UPDATE staffassignment 
                                 SET staff_id = ?, notes = ?
                                 WHERE complaint_id = ?";
            $stmt = $conn->prepare($update_assign_sql);
            if (!$stmt) {
                throw new Exception('Failed to prepare assignment update: ' . $conn->error);
            }
            $stmt->bind_param('isi', $staff_id, $remarks, $complaint_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update assignment: ' . $stmt->error);
            }
            $stmt->close();
        } else {
            // Insert new assignment
            $assign_sql = "INSERT INTO staffassignment (staff_id, complaint_id, assigned_date, status, notes) 
                           VALUES (?, ?, NOW(), 'Assigned', ?)";
            $stmt = $conn->prepare($assign_sql);
            if (!$stmt) {
                throw new Exception('Failed to prepare assignment insert: ' . $conn->error);
            }
            $stmt->bind_param('iis', $staff_id, $complaint_id, $remarks);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to create assignment: ' . $stmt->error);
            }
            $stmt->close();
        }
    }

    // Commit transaction
    $conn->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Complaint assignment and status updated successfully',
        'complaint_id' => $complaint_id,
        'status' => $status
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating assignment: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
