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
    // Try lowercase first (as shown in phpMyAdmin), fallback to uppercase
    $query = "SELECT 
        zone_id,
        CONCAT('Z-', zone_id) as id,
        name,
        city_name as city,
        area_description as area,
        'Active' as status
    FROM zone
    ORDER BY zone_id";
    
    $result = $conn->query($query);
    $zones = [];
    
    while ($row = $result->fetch_assoc()) {
        $zones[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'city' => $row['city'] ?? 'Dhaka',
            'area' => $row['area'] ?? $row['name'],
            'status' => $row['status']
        ];
    }
    
    $active_count = count($zones);
    
    echo json_encode([
        'success' => true,
        'zones' => $zones,
        'stats' => [
            'total' => count($zones),
            'active' => $active_count,
            'inactive' => 0
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
