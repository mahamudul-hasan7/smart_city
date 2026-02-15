<?php
// Normalize status values in complaint table
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'smart_city');

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]));
}

try {
    // Map numeric/invalid status to proper text values
    $statusMap = [
        '1' => 'pending',
        '2' => 'in progress',
        '3' => 'resolved',
        '4' => 'rejected',
        '5' => 'pending'
    ];
    
    $updates = [];
    
    // Get all complaints
    $result = $conn->query("SELECT complaint_id, status FROM complaint");
    
    while ($row = $result->fetch_assoc()) {
        $currentStatus = strtolower(trim($row['status']));
        $newStatus = null;
        
        // Check if it's a number
        if (isset($statusMap[$currentStatus])) {
            $newStatus = $statusMap[$currentStatus];
        }
        // Check if it's already a valid status
        elseif (!in_array($currentStatus, ['pending', 'in progress', 'resolved', 'rejected'])) {
            $newStatus = 'pending'; // Default to pending for unknown values
        }
        
        if ($newStatus) {
            $complaintId = $row['complaint_id'];
            $conn->query("UPDATE complaint SET status = '$newStatus' WHERE complaint_id = $complaintId");
            $updates[] = [
                'id' => $complaintId,
                'old' => $currentStatus,
                'new' => $newStatus
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Status normalized successfully',
        'updated_count' => count($updates),
        'updates' => $updates
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>
