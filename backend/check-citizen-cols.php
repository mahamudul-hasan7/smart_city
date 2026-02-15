<?php
require_once 'db_config.php';

echo "Citizen table columns:\n";
$result = $conn->query('DESCRIBE citizen');
while($row = $result->fetch_assoc()) {
    echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
}

$conn->close();
?>
