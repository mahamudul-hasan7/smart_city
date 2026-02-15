<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$result = [
    'php_working' => true,
    'db_config_exists' => false,
    'db_connected' => false,
    'message' => ''
];

// Check if db_config.php exists
if (file_exists(__DIR__ . '/db_config.php')) {
    $result['db_config_exists'] = true;
    
    try {
        require_once __DIR__ . '/db_config.php';
        
        if (isset($conn) && !$conn->connect_error) {
            $result['db_connected'] = true;
            $result['message'] = 'All connections working!';
            
            // Test query
            $test_query = "SELECT COUNT(*) as count FROM Zone";
            $test_result = $conn->query($test_query);
            if ($test_result) {
                $row = $test_result->fetch_assoc();
                $result['zone_count'] = $row['count'];
            }
        } else {
            $result['message'] = 'Database connection failed: ' . ($conn->connect_error ?? 'Unknown error');
        }
    } catch (Exception $e) {
        $result['message'] = 'Error: ' . $e->getMessage();
    }
} else {
    $result['message'] = 'db_config.php file not found';
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
