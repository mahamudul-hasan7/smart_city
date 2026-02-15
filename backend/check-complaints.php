<?php
require_once __DIR__ . '/db_config.php';

echo "Database Connection: " . ($conn->connect_error ? "FAILED - " . $conn->connect_error : "SUCCESS") . "\n\n";

$result = $conn->query("SELECT COUNT(*) as count FROM complaint");
if ($result) {
    $row = $result->fetch_assoc();
    echo "Total complaints: " . $row['count'] . "\n\n";
} else {
    echo "Error counting complaints: " . $conn->error . "\n\n";
}

$result = $conn->query("SELECT * FROM complaint LIMIT 5");
if ($result) {
    echo "Sample complaints:\n";
    while ($row = $result->fetch_assoc()) {
        print_r($row);
        echo "\n";
    }
} else {
    echo "Error fetching complaints: " . $conn->error . "\n";
}

$conn->close();
?>
