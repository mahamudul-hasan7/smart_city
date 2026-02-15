<?php
require_once 'db_config.php';

echo "Testing get-complaints query...\n\n";

$sql = "SELECT complaint_id as id, title, category, location, status, created_date 
        FROM complaint WHERE user_id = 2323 ORDER BY created_date DESC";

$result = $conn->query($sql);

if (!$result) {
    echo "Error: " . $conn->error . "\n";
} else {
    echo "Success! Rows: " . $result->num_rows . "\n";
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            print_r($row);
        }
    }
}

$conn->close();
?>
