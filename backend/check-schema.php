<?php
$conn = new mysqli('localhost', 'root', '', 'smart_city');
$result = $conn->query('DESCRIBE signup');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
?>
