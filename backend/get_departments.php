<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root"; // Your database username
$password = "";     // Your database password
$dbname = "smart_city";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$sql = "SELECT id, name FROM departments";
$result = $conn->query($sql);

$departments = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $departments[] = $row;
    }
}

echo json_encode($departments);

$conn->close();
?>