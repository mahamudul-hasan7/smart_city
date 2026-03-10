<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

// Simulate the assignment
$complaint_id = 27;
$staff_id = 3;

try {
    // Check if complaint exists
    $complaintCheck = $conn->query("SELECT complaint_id FROM complaint WHERE complaint_id = $complaint_id");
    if (!$complaintCheck || $complaintCheck->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit();
    }

    // Check if assignment exists for complaint
    $check = $conn->query("SELECT assignment_id FROM staffassignment WHERE complaint_id = $complaint_id LIMIT 1");
    
    if ($check->num_rows > 0) {
        $row = $check->fetch_assoc();
        $assignment_id = (int)$row['assignment_id'];
        // Update existing
        $conn->query("UPDATE staffassignment SET staff_id = $staff_id, notes = 'Test update' WHERE assignment_id = $assignment_id");
        echo json_encode(['success' => true, 'message' => 'Updated existing assignment', 'assignment_id' => $assignment_id]);
    } else {
        // Insert new
        $conn->query("INSERT INTO staffassignment (complaint_id, staff_id, assigned_date, status, notes) VALUES ($complaint_id, $staff_id, NOW(), 'Assigned', 'Test insert')");
        echo json_encode(['success' => true, 'message' => 'Created new assignment']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
