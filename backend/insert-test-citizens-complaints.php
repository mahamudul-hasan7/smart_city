<?php
require_once 'db_config.php';

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html>
<head>
    <title>Insert Test Data</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 5px; }
        .success { color: green; padding: 10px; margin: 5px 0; border-left: 4px solid green; background: #f0f8f0; }
        .error { color: red; padding: 10px; margin: 5px 0; border-left: 4px solid red; background: #f8f0f0; }
        .warning { color: orange; padding: 10px; margin: 5px 0; border-left: 4px solid orange; background: #f8f4f0; }
        .info { color: blue; padding: 10px; margin: 5px 0; border-left: 4px solid blue; background: #f0f4f8; }
        h2 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h3 { color: #666; margin-top: 20px; }
        hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
        .stats { background: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
<div class='container'>
    <h2>🔧 Insert Test Citizens & Complaints</h2>";

// Step 1: Insert Citizens
echo "<h3>Step 1: Inserting Citizens as Users</h3>";

$citizens = [
    ['Mahamudul Hasan', 'mahamudulhasan@gmail.com', 'mahamudulhasan'],
    ['Tania Islam', 'tania.islam@gmail.com', 'tania.islam'],
    ['Maria Tasnim', 'maria.tasnim@gmail.com', 'maria.tasnim']
];

$citizen_ids = [];
$citizen_count = 0;
$skip_count = 0;

foreach ($citizens as $citizen) {
    $name = $citizen[0];
    $email = $citizen[1];
    $password = $citizen[2];
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    
    // Check if user already exists
    $check_stmt = $conn->prepare("SELECT user_id FROM user WHERE email = ?");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        $row = $check_result->fetch_assoc();
        $citizen_ids[] = $row['user_id'];
        echo "<div class='warning'>⊙ Already exists: <strong>$name</strong> (User ID: {$row['user_id']})</div>";
        $skip_count++;
    } else {
        // Insert into user table first
        $stmt = $conn->prepare("INSERT INTO user (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)");
        $role = "Citizen";
        $status = "Active";
        $stmt->bind_param("sssss", $name, $email, $hashed_password, $role, $status);
        
        if ($stmt->execute()) {
            $user_id = $stmt->insert_id;
            $citizen_ids[] = $user_id;
            
            // Also insert into citizen table
            $citizen_stmt = $conn->prepare("INSERT INTO citizen (name, email, password) VALUES (?, ?, ?)");
            $citizen_stmt->bind_param("sss", $name, $email, $hashed_password);
            
            if ($citizen_stmt->execute()) {
                echo "<div class='success'>✓ Inserted: <strong>$name</strong> (User ID: $user_id) | Citizen ID: " . $citizen_stmt->insert_id . "</div>";
                $citizen_count++;
            } else {
                echo "<div class='error'>✗ Error inserting to citizen table: " . $citizen_stmt->error . "</div>";
            }
            $citizen_stmt->close();
        } else {
            echo "<div class='error'>✗ Error inserting user $name: " . $stmt->error . "</div>";
        }
        $stmt->close();
    }
    $check_stmt->close();
}

echo "<hr>";
echo "<h3>Step 2: Inserting Complaints</h3>";

// Complaint data for each citizen (7 complaints each)
$complaint_data = [
    // Citizen 1: Mahamudul Hasan
    [
        ['Water Supply', 'No water supply for 2 days', 'Pending', 3, -7],
        ['Road Damage', 'Pothole on main road', 'In Progress', 4, -6],
        ['Electricity', 'Power outage since morning', 'Resolved', 5, -5],
        ['Sanitation', 'Uncleaned streets', 'Pending', 6, -4],
        ['Traffic', 'Traffic signal not working', 'In Progress', 7, -3],
        ['Noise', 'Excessive noise from construction', 'Pending', 3, -2],
        ['Garbage', 'Garbage not collected', 'Resolved', 4, -1]
    ],
    // Citizen 2: Tania Islam
    [
        ['Water Supply', 'Water pipe burst', 'In Progress', 5, -7],
        ['Road Damage', 'Street lights broken', 'Resolved', 6, -6],
        ['Electricity', 'Drain blockage near house', 'Pending', 7, -5],
        ['Sanitation', 'Sewage overflow in area', 'In Progress', 3, -4],
        ['Traffic', 'Heavy traffic congestion', 'Resolved', 4, -3],
        ['Noise', 'Loud speaker noise at night', 'Pending', 5, -2],
        ['Garbage', 'Waste scattered on street', 'In Progress', 6, -1]
    ],
    // Citizen 3: Maria Tasnim
    [
        ['Water Supply', 'Low water pressure issue', 'Resolved', 7, -7],
        ['Road Damage', 'Damaged sidewalk', 'Pending', 3, -6],
        ['Electricity', 'Street light not functioning', 'In Progress', 4, -5],
        ['Sanitation', 'Water stagnation in area', 'Resolved', 5, -4],
        ['Traffic', 'Missing traffic signs', 'Pending', 6, -3],
        ['Noise', 'Industrial noise pollution', 'In Progress', 7, -2],
        ['Garbage', 'Open dumping near residence', 'Resolved', 3, -1]
    ]
];

$complaint_count = 0;
$total_complaints = 0;

foreach ($citizen_ids as $idx => $citizen_id) {
    echo "<h4>Complaints for Citizen ID: <strong>$citizen_id</strong></h4>";
    
    foreach ($complaint_data[$idx] as $complaint) {
        $type = $complaint[0];
        $description = $complaint[1];
        $status = $complaint[2];
        $zone = $complaint[3];
        $days_ago = $complaint[4];
        
        $submitted_date = date('Y-m-d', strtotime("$days_ago days"));
        
        $stmt = $conn->prepare("INSERT INTO complaint (user_id, title, description, category, status, created_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssss", $citizen_id, $type, $description, $type, $status, $submitted_date);
        
        if ($stmt->execute()) {
            echo "<div class='success' style='margin-left: 20px; font-size: 0.9em;'>✓ $type | Status: $status | Date: $submitted_date</div>";
            $complaint_count++;
            $total_complaints++;
        } else {
            echo "<div class='error' style='margin-left: 20px; font-size: 0.9em;'>✗ Error: " . $stmt->error . "</div>";
        }
        $stmt->close();
    }
}

echo "<hr>";
echo "<div class='stats'>
    <h3>📊 Summary</h3>
    <p><strong>Citizens Inserted:</strong> $citizen_count</p>
    <p><strong>Citizens Skipped (Already Exist):</strong> $skip_count</p>
    <p><strong>Total Citizens in Database:</strong> " . (count($citizen_ids)) . "</p>
    <p><strong>Complaints Inserted:</strong> $complaint_count</p>
    <p style='color: blue; background: #e3f2fd; padding: 10px; border-radius: 3px;'><strong>📧 Login Credentials:</strong><br>
        Email: mahamudulhasan@gmail.com | Password: mahamudulhasan<br>
        Email: tania.islam@gmail.com | Password: tania.islam<br>
        Email: maria.tasnim@gmail.com | Password: maria.tasnim
    </p>
</div>

<hr>
<div class='info'>
    <strong>✅ Data insertion complete!</strong> You can now login with the credentials above.
</div>

</div>
</body>
</html>";

$conn->close();
?>
