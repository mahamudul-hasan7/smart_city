<?php
header('Content-Type: application/json');

try {
    $conn = new mysqli('localhost', 'root', '', 'smart_city');
    
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
    }
    
    echo json_encode(['success' => true, 'message' => 'Database connected successfully']);
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
