<?php
// Simple test to check if PHP is returning proper JSON
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$testData = [
    'success' => true,
    'message' => 'PHP is working correctly',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET'
];

ob_clean();
echo json_encode($testData, JSON_PRETTY_PRINT);
?>
