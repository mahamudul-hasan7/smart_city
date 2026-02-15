<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

// Simulate the assignment
$complaint_id = 27;
$department_id = 1;
$staff_id = null;

try {
    // Check if staffassignment table has the record
    $check = $conn->query("SELECT * FROM staffassignment WHERE complaint_id = $complaint_id AND department_id = $department_id");
    
    if ($check->num_rows > 0) {
        // Update existing
        $conn->query("UPDATE staffassignment SET staff_id = NULL WHERE complaint_id = $complaint_id");
        echo json_encode(['success' => true, 'message' => 'Updated existing assignment']);
    } else {
        // Insert new
        $conn->query("INSERT INTO staffassignment (complaint_id, department_id, staff_id, assigned_date, remarks) VALUES ($complaint_id, $department_id, NULL, NOW(), 'Test')");
        echo json_encode(['success' => true, 'message' => 'Created new assignment']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
