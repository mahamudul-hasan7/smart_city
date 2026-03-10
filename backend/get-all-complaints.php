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
    $status_filter = $_GET['status'] ?? '';
    $zone_filter = $_GET['zone'] ?? '';
    
    // Build base query with assignment data
    $query = "SELECT 
        c.complaint_id,
        c.user_id,
        c.title,
        c.description,
        c.category,
        c.location,
        COALESCE(cs_latest.status_name, 'Pending') as status,
        c.created_date,
        c.latitude,
        c.longitude,
        s.dept_id as department_id,
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
    WHERE 1=1";
    
    if (!empty($status_filter)) {
        $safeStatus = $conn->real_escape_string($status_filter);
        $query .= " AND LOWER(COALESCE(cs_latest.status_name, 'Pending')) = LOWER('$safeStatus')";
    }
    
    if (!empty($zone_filter)) {
        $safeZone = $conn->real_escape_string($zone_filter);
        // Best-effort match zone within location text
        $query .= " AND c.location LIKE '%$safeZone%'";
    }
    
    $query .= " ORDER BY COALESCE(c.created_date, '1970-01-01') DESC";
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    $complaints = [];
    
    while ($row = $result->fetch_assoc()) {
        $complaints[] = [
            'complaintId' => $row['complaint_id'],
            'id' => 'SC-' . $row['complaint_id'],
            'userId' => $row['user_id'] ?? null,
            'citizen' => 'N/A',
            'category' => $row['category'] ?? 'N/A',
            'zone' => $row['location'] ?? 'N/A',
            'location' => $row['location'] ?? 'N/A',
            'status' => $row['status'] ?? 'Pending',
            'description' => $row['description'] ?? '',
            'date' => $row['created_date'] ?? '',
            'created_date' => $row['created_date'] ?? '',
            'latitude' => $row['latitude'] ?? null,
            'longitude' => $row['longitude'] ?? null,
            'lat' => $row['latitude'] ?? null,
            'lng' => $row['longitude'] ?? null,
            'dept_id' => $row['department_id'],
            'staff_id' => $row['staff_id']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'complaints' => $complaints,
        'count' => count($complaints)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
