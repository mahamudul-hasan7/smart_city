<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    $complaint_id = isset($_GET['complaint_id']) ? intval($_GET['complaint_id']) : 0;
    
    if (!$complaint_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID required']);
        exit();
    }
    
    // Get status history from complaint_status table
    $query = "SELECT 
                cs.status_id,
                cs.complaint_id,
                cs.status_name,
                cs.remarks,
                cs.status_date,
                cs.updated_by
              FROM complaint_status cs
              WHERE cs.complaint_id = ?
              ORDER BY cs.status_date ASC";
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param("i", $complaint_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = [
            'status_id' => $row['status_id'],
            'status' => $row['status_name'],
            'notes' => $row['remarks'] ?? '',
            'updated_date' => $row['status_date'],
            'updated_by' => $row['updated_by'] ?? 'System'
        ];
    }
    
    $stmt->close();
    
    // If no history, get at least submission date
    if (empty($history)) {
        $initial = $conn->query("SELECT current_status, submitted_date FROM complaint WHERE complaint_id = $complaint_id");
        if ($initial && $initial->num_rows > 0) {
            $row = $initial->fetch_assoc();
            $history[] = [
                'status' => $row['current_status'] ?? 'Pending',
                'notes' => 'Complaint submitted',
                'updated_date' => $row['submitted_date'],
                'updated_by' => 'Citizen'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'complaint_id' => $complaint_id,
        'history' => $history,
        'count' => count($history)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
