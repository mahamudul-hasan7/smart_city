<?php
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'smart_city');

if ($conn->connect_error) {
    echo json_encode(['error' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}

// Check if address column exists
$result = $conn->query("SHOW COLUMNS FROM signup LIKE 'address'");

if ($result->num_rows === 0) {
    // Add address column if it doesn't exist
    $sql = "ALTER TABLE signup ADD COLUMN address VARCHAR(500) DEFAULT ''";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'Address column added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error adding column: ' . $conn->error]);
    }
} else {
    echo json_encode(['status' => 'success', 'message' => 'Address column already exists']);
}

$conn->close();
?>
