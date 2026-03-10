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
    
    // Status counters from latest complaint_status rows
    $statusCountsQuery = "SELECT
        SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'Pending')) = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'Pending')) = 'in progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'Pending')) = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN LOWER(COALESCE(cs_latest.status_name, 'Pending')) IN ('rejected', 'cancelled') THEN 1 ELSE 0 END) AS rejected
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id";
    $statusCounts = $conn->query($statusCountsQuery)->fetch_assoc();
    $pending = $statusCounts['pending'] ?? 0;
    $in_progress = $statusCounts['in_progress'] ?? 0;
    $resolved = $statusCounts['resolved'] ?? 0;
    $rejected = $statusCounts['rejected'] ?? 0;
    
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
                COALESCE(cs_latest.status_name, 'Pending') AS status,
                c.created_date,
                s.dept_id AS department_id,
                sa.staff_id
        FROM complaint c
        LEFT JOIN staffassignment sa ON c.complaint_id = sa.complaint_id
        LEFT JOIN staff s ON sa.staff_id = s.user_id
        LEFT JOIN (
            SELECT cs1.complaint_id, cs1.status_name
            FROM complaint_status cs1
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_status_id
                FROM complaint_status
                GROUP BY complaint_id
            ) latest ON latest.latest_status_id = cs1.status_id
        ) cs_latest ON c.complaint_id = cs_latest.complaint_id
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
