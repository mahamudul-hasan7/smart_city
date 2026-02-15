<?php
// Test script to delete unassigned complaints
echo "Testing deletion of unassigned complaints...\n\n";

$response = file_get_contents('http://localhost/Smart_City/backend/delete-unassigned-complaints.php');
$result = json_decode($response, true);

if ($result['success']) {
    echo "✓ Success: " . $result['message'] . "\n";
    echo "✓ Deleted Count: " . $result['deleted_count'] . " complaints\n";
} else {
    echo "✗ Error: " . $result['message'] . "\n";
}
?>
