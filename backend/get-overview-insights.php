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
    // 1. Status breakdown for chart
    $statusQuery = "SELECT 
        COALESCE(cs_latest.status_name, 'Pending') AS status,
        COUNT(*) as count
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id
    GROUP BY COALESCE(cs_latest.status_name, 'Pending')";
    
    $statusResult = $conn->query($statusQuery);
    if (!$statusResult) {
        throw new Exception('Status query failed: ' . $conn->error);
    }
    $statusData = [];
    while ($row = $statusResult->fetch_assoc()) {
        $statusData[] = [
            'status' => $row['status'],
            'count' => (int)$row['count']
        ];
    }
    
    // 2. Highest problem areas (zones)
    $areaQuery = "SELECT 
        c.location as zone,
        COUNT(c.complaint_id) as total_complaints,
        SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN COALESCE(cs_latest.status_name, 'Pending') = 'Pending' THEN 1 ELSE 0 END) as pending
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id
    GROUP BY c.location
    ORDER BY total_complaints DESC
    LIMIT 5";
    
    $areaResult = $conn->query($areaQuery);
    $topAreas = [];
    while ($row = $areaResult->fetch_assoc()) {
        $topAreas[] = [
            'zone' => $row['zone'] ?? 'Unknown',
            'complaints' => (int)$row['total_complaints'],
            'resolved' => (int)$row['resolved'],
            'pending' => (int)$row['pending'],
            'resolution_rate' => $row['total_complaints'] > 0 ? round(($row['resolved'] / $row['total_complaints']) * 100, 1) : 0
        ];
    }
    
    // 3. Category distribution (top issues)
    $categoryQuery = "SELECT 
        category,
        COUNT(*) as count
    FROM complaint
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5";
    
    $categoryResult = $conn->query($categoryQuery);
    $topCategories = [];
    while ($row = $categoryResult->fetch_assoc()) {
        $topCategories[] = [
            'category' => $row['category'] ?? 'N/A',
            'count' => (int)$row['count']
        ];
    }
    
    // 4. Key metrics
    $totalQuery = "SELECT COUNT(*) as count FROM complaint";
    $total = $conn->query($totalQuery)->fetch_assoc()['count'];
    
    $resolvedQuery = "SELECT COUNT(*) as count
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id
    WHERE COALESCE(cs_latest.status_name, 'Pending') = 'Resolved'";
    $resolved = $conn->query($resolvedQuery)->fetch_assoc()['count'];
    
    $pendingQuery = "SELECT COUNT(*) as count
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id
    WHERE COALESCE(cs_latest.status_name, 'Pending') = 'Pending'";
    $pending = $conn->query($pendingQuery)->fetch_assoc()['count'];
    
    $avgDaysQuery = "SELECT 
        AVG(DATEDIFF(CURDATE(), created_date)) as avg_days
    FROM complaint c
    LEFT JOIN (
        SELECT cs1.complaint_id, cs1.status_name
        FROM complaint_status cs1
        INNER JOIN (
            SELECT complaint_id, MAX(status_id) AS latest_status_id
            FROM complaint_status
            GROUP BY complaint_id
        ) latest ON latest.latest_status_id = cs1.status_id
    ) cs_latest ON c.complaint_id = cs_latest.complaint_id
    WHERE COALESCE(cs_latest.status_name, 'Pending') = 'Resolved'";
    
    $avgDaysRow = $conn->query($avgDaysQuery)->fetch_assoc();
    $avgDays = $avgDaysRow['avg_days'] ? round($avgDaysRow['avg_days'], 1) : 0;
    
    echo json_encode([
        'success' => true,
        'metrics' => [
            'total' => (int)$total,
            'resolved' => (int)$resolved,
            'pending' => (int)$pending,
            'resolution_rate' => $total > 0 ? round(($resolved / $total) * 100, 1) : 0,
            'avg_resolution_days' => $avgDays
        ],
        'status_breakdown' => $statusData,
        'top_problem_areas' => $topAreas,
        'top_categories' => $topCategories
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
