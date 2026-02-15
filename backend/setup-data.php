<?php
// Generate bcrypt hashes and insert data

$conn = new mysqli('localhost', 'root', '', 'smart_city');

if ($conn->connect_error) {
    die('Connection error: ' . $conn->connect_error);
}

// Password for all test accounts
$password = "123456";
$hash = password_hash($password, PASSWORD_BCRYPT);

// Insert users
$users = [
    ['Ahmed Hassan', '1234567890', '2000-05-15', 'ahmed@gmail.com'],
    ['Fatima Rahman', '0987654321', '1998-03-22', 'fatima@gmail.com'],
    ['Mohammad Khan', '1122334455', '1995-07-10', 'khan@gmail.com']
];

foreach ($users as $user) {
    $stmt = $conn->prepare("INSERT INTO signup (name, nid, dob, email, password) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('sssss', $user[0], $user[1], $user[2], $user[3], $hash);
    $stmt->execute();
    echo "Inserted: {$user[3]}\n";
}

// Insert complaints
$complaints = [
    [1, 'Broken Road', 'The road near central market has multiple potholes', 'Infrastructure', 'Central Market', 'pending', '2026-01-20'],
    [1, 'Water Leakage', 'Water pipe leaking from main line', 'Water', 'Residential Block A', 'in_progress', '2026-01-18'],
    [2, 'Garbage Not Collected', 'Waste not collected for 3 days', 'Sanitation', 'Park Road', 'resolved', '2026-01-15'],
    [2, 'Street Light Down', 'Street light not working', 'Electricity', 'North Street', 'pending', '2026-01-19'],
    [3, 'Traffic Signal Issue', 'Traffic signal stuck at green', 'Traffic', 'Main Junction', 'in_progress', '2026-01-17']
];

foreach ($complaints as $c) {
    $stmt = $conn->prepare("INSERT INTO complaint (user_id, title, description, category, location, status, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('issssss', $c[0], $c[1], $c[2], $c[3], $c[4], $c[5], $c[6]);
    $stmt->execute();
    echo "Complaint inserted: {$c[1]}\n";
}

echo "\nAll data inserted successfully!\n";
echo "Test password: 123456\n";

$conn->close();
?>
