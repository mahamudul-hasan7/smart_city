<?php
// Test script to delete unassigned complaints
echo "Testing deletion of unassigned complaints...\n\n";

$url = 'http://localhost/Smart_City/backend/delete-unassigned-complaints.php';

$headers = @get_headers($url);
if (!$headers || strpos($headers[0], '404') !== false) {
    echo "⚠ Skipped: endpoint not found ($url)\n";
    exit;
}

$response = file_get_contents($url);
$result = json_decode($response, true);

if (is_array($result) && !empty($result['success'])) {
    echo "✓ Success: " . $result['message'] . "\n";
    echo "✓ Deleted Count: " . $result['deleted_count'] . " complaints\n";
} else {
    $message = is_array($result) ? ($result['message'] ?? 'Unknown error') : 'Invalid response';
    echo "✗ Error: " . $message . "\n";
}
?>
