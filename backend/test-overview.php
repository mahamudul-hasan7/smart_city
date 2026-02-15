<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "Testing get-overview-insights.php\n";
echo "=" . str_repeat("=", 50) . "\n\n";

$url = 'http://localhost/Smart_City/backend/get-overview-insights.php';
echo "URL: $url\n\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n\n";
echo "Response:\n";
echo $response;
?>
