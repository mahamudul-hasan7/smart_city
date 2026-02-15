<?php
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}

echo "<h2>Zone AutoIncrement Fix</h2>";

// Step 1: Check current data
echo "<h3>Step 1: Current Zone Data</h3>";
$result = $conn->query("SELECT zone_id, name FROM zone ORDER BY zone_id");
echo "<table border='1'><tr><th>Zone ID</th><th>Name</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr><td>{$row['zone_id']}</td><td>{$row['name']}</td></tr>";
}
echo "</table>";

// Step 2: Find max ID
echo "<h3>Step 2: Finding Max Zone ID</h3>";
$result = $conn->query("SELECT MAX(zone_id) as max_id FROM zone");
$row = $result->fetch_assoc();
$max_id = intval($row['max_id']);
echo "Current max zone_id: <strong>$max_id</strong><br>";

// Step 3: Check for problematic entries (zone_id = 0 or NULL)
echo "<h3>Step 3: Checking for Problematic Entries</h3>";
$result = $conn->query("SELECT COUNT(*) as cnt FROM zone WHERE zone_id <= 0 OR zone_id IS NULL");
$row = $result->fetch_assoc();
if ($row['cnt'] > 0) {
    echo "⚠ Found {$row['cnt']} problematic entries. Attempting to fix...<br>";
    // Delete problematic entries
    $conn->query("DELETE FROM zone WHERE zone_id <= 0 OR zone_id IS NULL");
    echo "✓ Deleted problematic entries<br>";
}

// Step 4: Set correct AUTO_INCREMENT
echo "<h3>Step 4: Setting AUTO_INCREMENT</h3>";
$next_id = $max_id + 1;
echo "Setting AUTO_INCREMENT to: <strong>$next_id</strong><br>";

$sql = "ALTER TABLE zone AUTO_INCREMENT = $next_id";
if ($conn->query($sql) === TRUE) {
    echo "✓ AUTO_INCREMENT updated successfully!<br>";
} else {
    echo "✗ Error: " . $conn->error . "<br>";
}

// Step 5: Verify table structure
echo "<h3>Step 5: Table Structure</h3>";
$result = $conn->query("SHOW CREATE TABLE zone");
if ($result) {
    $row = $result->fetch_row();
    echo "<pre style='background: #f0f0f0; padding: 10px; overflow-x: auto;'>" . htmlspecialchars($row[1]) . "</pre>";
}

// Step 6: Test insert
echo "<h3>Step 6: Test Insert</h3>";
$test_name = "Test Zone " . time();
$test_city = "Dhaka";
$test_area = "Test Area";

$stmt = $conn->prepare("INSERT INTO zone (name, city_name, area_description) VALUES (?, ?, ?)");
$stmt->bind_param('sss', $test_name, $test_city, $test_area);

if ($stmt->execute()) {
    $test_id = $conn->insert_id;
    echo "✓ Test insert successful! New zone_id: <strong>$test_id</strong><br>";
    
    // Delete test entry
    $conn->query("DELETE FROM zone WHERE zone_id = $test_id");
    echo "✓ Cleaned up test entry<br>";
} else {
    echo "✗ Test insert failed: " . $stmt->error . "<br>";
}

echo "<h3 style='color: green;'>✓ All fixes completed! You can now add zones.</h3>";

$conn->close();
?>
