<?php
require_once 'db_config.php';

$testData = [
    'name' => 'Test User',
    'nid' => '123456789',
    'dob' => '1990-01-01',
    'email' => 'test@example.com',
    'password' => 'password123',
    'confirm' => 'password123'
];

echo "Testing register endpoint...\n\n";
echo "Test Data: " . json_encode($testData) . "\n\n";

$ch = curl_init('http://localhost/Smart_City/backend/register.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n";

$conn->close();
?>
