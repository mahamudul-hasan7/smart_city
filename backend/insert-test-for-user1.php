<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

// Get or create user 1
$userId = 1;
$userEmail = 'citizen@example.com';
$userName = 'Citizen User';
$userPhone = '01700000001';

// Check if user 1 exists
$checkUser = $conn->prepare("SELECT user_id FROM user WHERE user_id = ?");
$checkUser->bind_param('i', $userId);
$checkUser->execute();
$result = $checkUser->get_result();

if ($result->num_rows === 0) {
    // Create user 1
    $userPassword = password_hash('Pass@1234', PASSWORD_BCRYPT);
    $role = 'Citizen';
    $status = 'Active';
    $insertUser = $conn->prepare("INSERT INTO user (user_id, name, email, password, phone_no, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insertUser->bind_param('issssss', $userId, $userName, $userEmail, $userPassword, $userPhone, $role, $status);
    $insertUser->execute();
}

// Get or create citizen record
$checkCitizen = $conn->prepare("SELECT user_id FROM citizen WHERE user_id = ?");
$checkCitizen->bind_param('i', $userId);
$checkCitizen->execute();
$citizenResult = $checkCitizen->get_result();

if ($citizenResult->num_rows === 0) {
    $firstName = 'Citizen';
    $lastName = 'User';
    $fullName = 'Citizen User';
    $street = 'Main Street';
    $city = 'Dhaka';
    $area = 'Mirpur';
    $regDate = date('Y-m-d');
    $zoneId = 1;
    
    $insertCitizen = $conn->prepare("INSERT INTO citizen (user_id, first_name, last_name, full_name, street, city, area, reg_date, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $insertCitizen->bind_param('isssssssi', $userId, $firstName, $lastName, $fullName, $street, $city, $area, $regDate, $zoneId);
    $insertCitizen->execute();
}

// Now insert test complaints for user 1
$complaints = [
    ['Broken Road Near School', 'The main road near Green School has multiple potholes and needs urgent repair', 'Road & Transport', 'Mirpur', 'School Road', 'Pending'],
    ['Water Leakage in Main Pipeline', 'There is continuous water leakage from the main pipeline on 5th Street causing water wastage', 'Water & Sewerage', 'Mirpur', '5th Street', 'In Progress'],
    ['Garbage Pile on Street', 'Large pile of uncollected garbage has been accumulating on the corner of Block A for 3 days', 'Waste Management', 'Mirpur', 'Block A', 'Resolved'],
    ['Broken Streetlight', 'The streetlight at the corner of Main Road and 3rd Avenue has been broken for weeks', 'Electricity', 'Mirpur', 'Main Road', 'Pending'],
    ['Park Maintenance Issue', 'The park benches are broken and need replacement urgently', 'Other', 'Mirpur', 'Central Park', 'In Progress'],
];

$insertedCount = 0;
foreach ($complaints as $complaint) {
    list($title, $desc, $category, $locationArea, $locationStreet, $status) = $complaint;
    
    // Map category to dept_id
    $deptMap = [
        'Road & Transport' => 1,
        'Water & Sewerage' => 2,
        'Waste Management' => 3,
        'Electricity' => 4,
        'Other' => null
    ];
    $deptId = $deptMap[$category] ?? null;
    
    // Map area to zone_id  
    $zoneMap = ['Mirpur' => 1, 'Dhanmondi' => 2, 'Uttara' => 3];
    $zoneId = $zoneMap[$locationArea] ?? 1;
    
    // Check if complaint exists
    $checkComplaint = $conn->prepare("SELECT complaint_id FROM complaint WHERE citizen_id = ? AND description = ? LIMIT 1");
    $checkComplaint->bind_param('is', $userId, $desc);
    $checkComplaint->execute();
    $complaintResult = $checkComplaint->get_result();
    
    if ($complaintResult && $complaintResult->num_rows === 0) {
        $submittedDate = date('Y-m-d H:i:s');
        $type = $category;
        $city = 'Dhaka';
        
        if ($deptId === null) {
            $insertComplaint = $conn->prepare("INSERT INTO complaint (citizen_id, zone_id, description, type, location_city, location_area, location_street, current_status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insertComplaint->bind_param('iisssssss', $userId, $zoneId, $desc, $type, $city, $locationArea, $locationStreet, $status, $submittedDate);
        } else {
            $insertComplaint = $conn->prepare("INSERT INTO complaint (citizen_id, zone_id, dept_id, description, type, location_city, location_area, location_street, current_status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insertComplaint->bind_param('iiisssssss', $userId, $zoneId, $deptId, $desc, $type, $city, $locationArea, $locationStreet, $status, $submittedDate);
        }
        $insertComplaint->execute();
        $insertedCount++;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Test data for user 1 inserted successfully',
    'user_id' => $userId,
    'complaints_inserted' => $insertedCount
]);
?>
