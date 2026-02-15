<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

// First, ensure zones exist
$zones = [1 => 'Mirpur', 2 => 'Dhanmondi', 3 => 'Uttara'];
foreach ($zones as $zoneId => $zoneName) {
    $checkZone = $conn->prepare("SELECT zone_id FROM zone WHERE zone_id = ?");
    $checkZone->bind_param('i', $zoneId);
    $checkZone->execute();
    $zoneResult = $checkZone->get_result();
    
    if ($zoneResult->num_rows === 0) {
        $insertZone = $conn->prepare("INSERT INTO zone (zone_id, zone_name) VALUES (?, ?)");
        $insertZone->bind_param('is', $zoneId, $zoneName);
        $insertZone->execute();
    }
}

// Ensure departments exist
$departments = [
    1 => 'Road & Transport',
    2 => 'Water & Sewerage',
    3 => 'Waste Management',
    4 => 'Electricity'
];
foreach ($departments as $deptId => $deptName) {
    $checkDept = $conn->prepare("SELECT dept_id FROM department WHERE dept_id = ?");
    $checkDept->bind_param('i', $deptId);
    $checkDept->execute();
    $deptResult = $checkDept->get_result();
    
    if ($deptResult->num_rows === 0) {
        $insertDept = $conn->prepare("INSERT INTO department (dept_id, name) VALUES (?, ?)");
        $insertDept->bind_param('is', $deptId, $deptName);
        $insertDept->execute();
    }
}

// Get or create test user
$userEmail = 'test@example.com';
$userName = 'Test User';
$userPhone = '01700000000';
$userPassword = password_hash('Pass@1234', PASSWORD_BCRYPT);

$checkUser = $conn->prepare("SELECT user_id FROM user WHERE email = ?");
$checkUser->bind_param('s', $userEmail);
$checkUser->execute();
$result = $checkUser->get_result();

if ($result->num_rows > 0) {
    $userRow = $result->fetch_assoc();
    $userId = $userRow['user_id'];
} else {
    $insertUser = $conn->prepare("INSERT INTO user (name, email, password, phone_no, role, status) VALUES (?, ?, ?, ?, ?, ?)");
    $role = 'Citizen';
    $status = 'Active';
    $insertUser->bind_param('ssssss', $userName, $userEmail, $userPassword, $userPhone, $role, $status);
    $insertUser->execute();
    $userId = $insertUser->insert_id;
}

// Get or create citizen record
$checkCitizen = $conn->prepare("SELECT user_id FROM citizen WHERE user_id = ?");
$checkCitizen->bind_param('i', $userId);
$checkCitizen->execute();
$citizenResult = $checkCitizen->get_result();

$citizenId = null;
if ($citizenResult->num_rows === 0) {
    $firstName = 'Test';
    $lastName = 'User';
    $fullName = 'Test User';
    $street = 'School Road';
    $city = 'Dhaka';
    $area = 'Mirpur';
    $regDate = date('Y-m-d');
    $zoneId = 1;
    
    $insertCitizen = $conn->prepare("INSERT INTO citizen (user_id, first_name, last_name, full_name, street, city, area, reg_date, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $insertCitizen->bind_param('isssssssi', $userId, $firstName, $lastName, $fullName, $street, $city, $area, $regDate, $zoneId);
    $insertCitizen->execute();
    $citizenId = $conn->insert_id;
} else {
    $row = $citizenResult->fetch_assoc();
    // Since citizen table uses user_id as reference, we need to query to get the ID or just use user_id
}

// Get citizen_id for this user
$getCitizenId = $conn->prepare("SELECT user_id FROM citizen WHERE user_id = ? LIMIT 1");
$getCitizenId->bind_param('i', $userId);
$getCitizenId->execute();
$cidResult = $getCitizenId->get_result();
if ($cidResult && $cidResult->num_rows > 0) {
    $cidRow = $cidResult->fetch_assoc();
    $citizenId = $cidRow['user_id']; // In this schema, user_id IS the citizen reference
}

// Now insert test complaints
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
    $checkComplaint->bind_param('is', $citizenId, $desc);
    $checkComplaint->execute();
    $complaintResult = $checkComplaint->get_result();
    
    if ($complaintResult && $complaintResult->num_rows === 0) {
        $submittedDate = date('Y-m-d H:i:s');
        $type = $category;
        $city = 'Dhaka';
        
        // If dept_id is null, we need to handle it differently  
        if ($deptId === null) {
            $insertComplaint = $conn->prepare("INSERT INTO complaint (citizen_id, zone_id, description, type, location_city, location_area, location_street, current_status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insertComplaint->bind_param('iisssssss', $citizenId, $zoneId, $desc, $type, $city, $locationArea, $locationStreet, $status, $submittedDate);
        } else {
            $insertComplaint = $conn->prepare("INSERT INTO complaint (citizen_id, zone_id, dept_id, description, type, location_city, location_area, location_street, current_status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insertComplaint->bind_param('iiisssssss', $citizenId, $zoneId, $deptId, $desc, $type, $city, $locationArea, $locationStreet, $status, $submittedDate);
        }
        $insertComplaint->execute();
        $insertedCount++;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Test data inserted successfully',
    'user_id' => $userId,
    'citizen_id' => $citizenId,
    'complaints_inserted' => $insertedCount
]);
?>
