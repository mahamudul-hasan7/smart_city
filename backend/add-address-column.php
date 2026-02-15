<?php
// Migration: Add address column to signup table if it doesn't exist
$conn = new mysqli('localhost', 'root', '', 'smart_city');

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Check if address column exists
$result = $conn->query("SHOW COLUMNS FROM signup LIKE 'address'");

if ($result->num_rows === 0) {
    // Add address column
    $sql = "ALTER TABLE signup ADD COLUMN address VARCHAR(255) DEFAULT '' AFTER dob";
    if ($conn->query($sql) === TRUE) {
        echo "Address column added successfully!";
    } else {
        echo "Error adding column: " . $conn->error;
    }
} else {
    echo "Address column already exists!";
}

$conn->close();
?>
