<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

$result = $conn->query("SELECT user_id, name, email, role FROM Users WHERE role = 'Admin'");

$admins = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $admins[] = $row;
    }
}

echo json_encode([
    'admin_count' => count($admins),
    'admins' => $admins
]);
