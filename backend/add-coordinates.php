<?php
require_once 'db_config.php';

// Add latitude/longitude columns to complaint table if they don't exist
$alterTable = "ALTER TABLE complaint 
    ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
    ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL";

if ($conn->query($alterTable)) {
    echo "✓ Columns added successfully<br>";
} else {
    if (strpos($conn->error, 'Duplicate column') === false) {
        echo "Error: " . $conn->error . "<br>";
    } else {
        echo "✓ Columns already exist<br>";
    }
}

// Zone coordinates mapping (approximate Dhaka city locations)
$zoneCoords = [
    'Notun Bazar' => [23.7976, 90.3981],
    'Mirpur Zone' => [23.8103, 90.4125],
    'Dhanmondi Zone' => [23.7641, 90.3668],
    'Gulshan–Banani Zone' => [23.7965, 90.4167],
    'Mohammadpur Zone' => [23.7465, 90.3876]
];

// Update existing complaints with coordinates based on zone
foreach ($zoneCoords as $zone => $coords) {
    $lat = $coords[0];
    $lng = $coords[1];
    $updateSQL = "UPDATE complaint SET latitude = ?, longitude = ? 
                   WHERE location LIKE ? AND latitude IS NULL";
    
    $stmt = $conn->prepare($updateSQL);
    $pattern = "%$zone%";
    $stmt->bind_param('dds', $lat, $lng, $pattern);
    
    if ($stmt->execute()) {
        echo "✓ Updated complaints for: $zone<br>";
    } else {
        echo "Error updating $zone: " . $stmt->error . "<br>";
    }
    $stmt->close();
}

echo "<br>✅ Coordinates migration complete!";
$conn->close();
?>
