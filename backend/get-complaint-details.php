<?php
// Get complaint details for modal
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $complaint_id = $_GET['complaint_id'] ?? null;
    
    if (!$complaint_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing complaint_id']);
        exit();
    }

    $sql = "SELECT c.complaint_id, c.type, c.description, c.current_status, c.dept_id, d.dept_name, c.submitted_date
            FROM complaint c
            LEFT JOIN department d ON c.dept_id = d.dept_id
            WHERE c.complaint_id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }
    
    $stmt->bind_param('i', $complaint_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit();
    }
    
    $complaint = $result->fetch_assoc();
    $stmt->close();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'complaint' => $complaint
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching complaint: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
