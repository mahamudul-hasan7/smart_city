<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $sql = "CREATE TABLE IF NOT EXISTS StaffAssignment (
        assignment_id INT PRIMARY KEY AUTO_INCREMENT,
        staff_id INT NOT NULL,
        complaint_id INT NOT NULL,
        assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Assigned',
        notes TEXT,
        FOREIGN KEY (staff_id) REFERENCES Staff(user_id) ON DELETE CASCADE,
        FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (staff_id, complaint_id),
        INDEX idx_staff (staff_id),
        INDEX idx_complaint (complaint_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'StaffAssignment table created successfully'
        ]);
    } else {
        throw new Exception('Failed to create table: ' . $conn->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
