<?php
require_once __DIR__ . '/cors-headers.php';
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Total complaints
    $total = $conn->query("SELECT COUNT(*) as count FROM complaint")->fetch_assoc()['count'];
    
    // Pending complaints
    $pending = $conn->query("SELECT COUNT(*) as count FROM complaint WHERE LOWER(status) = 'pending'")->fetch_assoc()['count'];
    
    // In Progress
    $in_progress = $conn->query("SELECT COUNT(*) as count FROM complaint WHERE LOWER(status) = 'in progress'")->fetch_assoc()['count'];
    
    // Resolved
    $resolved = $conn->query("SELECT COUNT(*) as count FROM complaint WHERE LOWER(status) = 'resolved'")->fetch_assoc()['count'];
    
    // Rejected / Cancelled
    $rejected = $conn->query("SELECT COUNT(*) as count FROM complaint WHERE LOWER(status) IN ('rejected','cancelled')")->fetch_assoc()['count'];
    
    // Total Citizens
    $total_citizens = $conn->query("SELECT COUNT(*) as count FROM citizen")->fetch_assoc()['count'];
    
    // Total Users (from user table - includes all roles)
    $total_users = $conn->query("SELECT COUNT(*) as count FROM user")->fetch_assoc()['count'];
    
    // Total Staff
    $total_staff = $conn->query("SELECT COUNT(*) as count FROM staff")->fetch_assoc()['count'];
    
    // Recent complaints (last 10) with assignment data
    $recent_query = "SELECT 
                c.complaint_id,
                c.category,
                c.location,
                c.status,
                c.created_date,
                sa.department_id,
                sa.staff_id
        FROM complaint c
        LEFT JOIN staffassignment sa ON c.complaint_id = sa.complaint_id
        ORDER BY COALESCE(c.created_date, '1970-01-01') DESC
        LIMIT 10";
    
    $recent_result = $conn->query($recent_query);
    if (!$recent_result) {
        throw new Exception('Failed to load recent complaints: ' . $conn->error);
    }
    $recent_complaints = [];
    while ($row = $recent_result->fetch_assoc()) {
        $statusLabel = ucfirst(strtolower($row['status'] ?? 'pending'));
        $recent_complaints[] = [
            'id' => 'SC-' . $row['complaint_id'],
            'category' => $row['category'] ?? 'N/A',
            'area' => $row['location'] ?? 'N/A',
            'status' => $statusLabel,
            'dept_id' => $row['department_id'],
            'department' => $row['department_id'] ? 'Assigned' : 'Not Assigned',
            'staff_id' => $row['staff_id'],
            'staff_name' => null
        ];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total' => (int)$total,
            'pending' => (int)$pending,
            'in_progress' => (int)$in_progress,
            'resolved' => (int)$resolved,
            'rejected' => (int)$rejected,
            'total_citizens' => (int)$total_citizens,
            'total_users' => (int)$total_users,
            'total_staff' => (int)$total_staff
        ],
        'recent_complaints' => $recent_complaints
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
