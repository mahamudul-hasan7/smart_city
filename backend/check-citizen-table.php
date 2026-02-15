<?php
require_once 'db_config.php';

// Check if citizen table exists
$result = $conn->query("SHOW TABLES LIKE 'citizen'");
if ($result->num_rows > 0) {
    echo "Citizen table EXISTS\n";
    $desc = $conn->query("DESCRIBE citizen");
    while ($row = $desc->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "Citizen table DOES NOT EXIST\n";
}

$conn->close();
?>
