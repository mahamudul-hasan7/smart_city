<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// Get all zones
$result = $conn->query("SELECT zone_id, name, city_name FROM Zone ORDER BY name");

$zones = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $zones[] = [
            'zone_id' => $row['zone_id'],
            'name' => $row['name'],
            'city' => $row['city_name']
        ];
    }
}

echo json_encode([
    'success' => true,
    'zones' => $zones,
    'count' => count($zones)
], JSON_PRETTY_PRINT);

$conn->close();
?>
