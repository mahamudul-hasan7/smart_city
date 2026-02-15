<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'smart_city');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

// Check connection
if ($conn->connect_error) {
    // Don't use die() as it might output before headers
    // Just set the error, let calling script handle it
    $conn = null;
}

// Set charset to utf8 if connection is successful
if ($conn && !$conn->connect_error) {
    $conn->set_charset("utf8");
}
?>
