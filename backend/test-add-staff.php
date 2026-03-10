<?php
// Simple test file to check if add-staff.php is accessible
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$testData = [
    'staff_id' => '202700',
    'full_name' => 'Test Staff',
    'designation' => 'Test Officer',
    'department' => 'Road & Transport',
    'zone' => 'Mirpur',
    'status' => 'Active',
    'phone' => '01999999999',
    'email' => 'test@city.gov'
];

echo "<h2>Testing add-staff.php</h2>";
echo "<pre>";

// Test 1: Check if file exists
if (file_exists(__DIR__ . '/add-staff.php')) {
    echo "✓ add-staff.php file exists\n";
} else {
    echo "✗ add-staff.php file NOT found\n";
}

// Test 2: Check db_config
if (file_exists(__DIR__ . '/db_config.php')) {
    echo "✓ db_config.php file exists\n";
} else {
    echo "✗ db_config.php file NOT found\n";
}

// Test 3: Test database connection
try {
    require_once __DIR__ . '/db_config.php';
    if (isset($conn) && !$conn->connect_error) {
        echo "✓ Database connection successful\n";
    } else {
        echo "✗ Database connection failed\n";
    }
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}

echo "\n";
echo "Test Data:\n";
echo json_encode($testData, JSON_PRETTY_PRINT);

echo "\n\n";
echo "To test the API, use this JavaScript code in browser console:\n";
echo "----------------------------------------\n";
echo "fetch('/Smart_City/backend/add-staff.php', {\n";
echo "  method: 'POST',\n";
echo "  headers: { 'Content-Type': 'application/json' },\n";
echo "  body: JSON.stringify(" . json_encode($testData) . ")\n";
echo "})\n";
echo ".then(r => r.text())\n";
echo ".then(console.log)\n";
echo ".catch(console.error);\n";

echo "</pre>";
?>
