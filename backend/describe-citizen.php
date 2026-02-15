<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

$result = $conn->query("DESCRIBE citizen");
$columns = [];
while($row = $result->fetch_assoc()) {
    $columns[] = $row;
}

echo json_encode(['columns' => $columns]);
?>
