<?php
// Simple Zone AutoIncrement Fix
while (ob_get_level()) ob_end_clean();
ob_start();

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    die('<h2 style="color: red;">❌ Database Connection Failed: ' . $conn->connect_error . '</h2>');
}

echo '<style>';
echo 'body { font-family: Arial, sans-serif; background: #0a1428; color: #fff; padding: 20px; }';
echo '.success { color: #00ff88; }';
echo '.error { color: #ff4444; }';
echo '.info { color: #00d4ff; }';
echo 'table { border-collapse: collapse; margin: 20px 0; background: #1a1f2e; }';
echo 'th, td { border: 1px solid #00d4ff; padding: 10px; text-align: left; }';
echo 'th { background: #00d4ff; color: #000; }';
echo '</style>';

echo '<h1>🔧 Zone Table AutoIncrement Fix</h1>';

// Step 1: Check current zones
echo '<h2 class="info">Step 1: Current Zone Data</h2>';
$result = $conn->query("SELECT zone_id, name FROM zone ORDER BY zone_id");
if ($result && $result->num_rows > 0) {
    echo '<table>';
    echo '<tr><th>Zone ID</th><th>Name</th></tr>';
    while ($row = $result->fetch_assoc()) {
        echo '<tr><td>' . $row['zone_id'] . '</td><td>' . $row['name'] . '</td></tr>';
    }
    echo '</table>';
    echo '<p class="success">✓ Found ' . $result->num_rows . ' zones</p>';
} else {
    echo '<p class="error">✗ No zones found</p>';
}

// Step 2: Find max zone_id
echo '<h2 class="info">Step 2: Determine Next ID</h2>';
$result = $conn->query("SELECT MAX(zone_id) as max_id FROM zone");
$row = $result->fetch_assoc();
$max_id = intval($row['max_id'] ?? 0);
$next_id = $max_id + 1;

echo '<p>Maximum zone_id: <strong class="success">' . $max_id . '</strong></p>';
echo '<p>Next zone_id will be: <strong class="success">' . $next_id . '</strong></p>';

// Step 3: Delete problematic entries if any
echo '<h2 class="info">Step 3: Clean Problematic Entries</h2>';
$result = $conn->query("SELECT COUNT(*) as cnt FROM zone WHERE zone_id <= 0 OR zone_id IS NULL");
$row = $result->fetch_assoc();
$bad_count = intval($row['cnt'] ?? 0);

if ($bad_count > 0) {
    if ($conn->query("DELETE FROM zone WHERE zone_id <= 0 OR zone_id IS NULL")) {
        echo '<p class="success">✓ Deleted ' . $bad_count . ' problematic entries</p>';
    } else {
        echo '<p class="error">✗ Failed to delete problematic entries: ' . $conn->error . '</p>';
    }
} else {
    echo '<p class="success">✓ No problematic entries found</p>';
}

// Step 4: Set AUTO_INCREMENT
echo '<h2 class="info">Step 4: Update AUTO_INCREMENT</h2>';
$sql = "ALTER TABLE zone AUTO_INCREMENT = " . $next_id;
if ($conn->query($sql)) {
    echo '<p class="success">✓ AUTO_INCREMENT set to: ' . $next_id . '</p>';
} else {
    echo '<p class="error">✗ Failed to set AUTO_INCREMENT: ' . $conn->error . '</p>';
}

// Step 5: Verify
echo '<h2 class="info">Step 5: Verify Table Structure</h2>';
$result = $conn->query("SHOW CREATE TABLE zone");
if ($result) {
    $row = $result->fetch_row();
    echo '<pre style="background: #1a1f2e; border: 1px solid #00d4ff; padding: 15px; overflow-x: auto;">' . 
         htmlspecialchars($row[1]) . 
         '</pre>';
}

// Step 6: Test insert
echo '<h2 class="info">Step 6: Test Insert</h2>';
$test_name = "Test Zone - " . date('Y-m-d H:i:s');
$test_city = "Dhaka";
$test_area = "Test Area";

$stmt = $conn->prepare("INSERT INTO zone (name, city_name, area_description) VALUES (?, ?, ?)");
$stmt->bind_param('sss', $test_name, $test_city, $test_area);

if ($stmt->execute()) {
    $test_id = $conn->insert_id;
    echo '<p class="success">✓ Test insert successful! Generated zone_id: <strong>' . $test_id . '</strong></p>';
    
    // Delete test entry
    if ($conn->query("DELETE FROM zone WHERE zone_id = " . $test_id)) {
        echo '<p class="success">✓ Test entry cleaned up</p>';
    }
} else {
    echo '<p class="error">✗ Test insert failed: ' . $stmt->error . '</p>';
}

// Final message
echo '<h2 style="color: #00ff88;">✅ Fix Complete!</h2>';
echo '<p>Your Zone table is now ready for auto-generation. You can now add zones with auto-generated IDs.</p>';

$conn->close();
?>
