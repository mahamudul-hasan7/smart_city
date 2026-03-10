<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit();
}

$userEmail = 'test@example.com';
$userName = 'Test User';
$userPhone = '01700000000';
$userPassword = password_hash('Pass@1234', PASSWORD_BCRYPT);

$checkUser = $conn->prepare("SELECT user_id FROM user WHERE email = ? LIMIT 1");
$checkUser->bind_param('s', $userEmail);
$checkUser->execute();
$result = $checkUser->get_result();

if ($result && $result->num_rows > 0) {
    $userId = (int)$result->fetch_assoc()['user_id'];
} else {
    $insertUser = $conn->prepare("INSERT INTO user (name, email, password, phone_no, role, status) VALUES (?, ?, ?, ?, 'Citizen', 'Active')");
    $insertUser->bind_param('ssss', $userName, $userEmail, $userPassword, $userPhone);
    $insertUser->execute();
    $userId = (int)$conn->insert_id;
}

$checkCitizen = $conn->prepare("SELECT user_id FROM citizen WHERE user_id = ? LIMIT 1");
$checkCitizen->bind_param('i', $userId);
$checkCitizen->execute();
$citizenResult = $checkCitizen->get_result();
if (!$citizenResult || $citizenResult->num_rows === 0) {
    $nid = 'NID-' . $userId;
    $dob = '2000-01-01';
    $gender = null;
    $street = 'School Road';
    $area = 'Mirpur';
    $city = 'Dhaka';
    $insertCitizen = $conn->prepare("INSERT INTO citizen (user_id, nid, dob, gender, street, area, city) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insertCitizen->bind_param('issssss', $userId, $nid, $dob, $gender, $street, $area, $city);
    $insertCitizen->execute();
}

$complaints = [
    ['Broken Road Near School', 'The main road near Green School has multiple potholes and needs urgent repair', 'Road', 'Mirpur, School Road', 'Pending'],
    ['Water Leakage in Main Pipeline', 'There is continuous water leakage from the main pipeline on 5th Street causing water wastage', 'Water', 'Mirpur, 5th Street', 'In Progress'],
    ['Garbage Pile on Street', 'Large pile of uncollected garbage has been accumulating on the corner of Block A for 3 days', 'Waste', 'Mirpur, Block A', 'Resolved'],
    ['Broken Streetlight', 'The streetlight at the corner of Main Road and 3rd Avenue has been broken for weeks', 'Electricity', 'Mirpur, Main Road', 'Pending'],
    ['Park Maintenance Issue', 'The park benches are broken and need replacement urgently', 'Other', 'Mirpur, Central Park', 'In Progress'],
];

$insertedCount = 0;
foreach ($complaints as $complaint) {
    [$title, $desc, $category, $location, $status] = $complaint;

    $checkComplaint = $conn->prepare("SELECT complaint_id FROM complaint WHERE user_id = ? AND description = ? LIMIT 1");
    $checkComplaint->bind_param('is', $userId, $desc);
    $checkComplaint->execute();
    $complaintResult = $checkComplaint->get_result();

    if ($complaintResult && $complaintResult->num_rows === 0) {
        $submittedDate = date('Y-m-d H:i:s');
        $insertComplaint = $conn->prepare("INSERT INTO complaint (user_id, title, description, category, location, created_date) VALUES (?, ?, ?, ?, ?, ?)");
        $insertComplaint->bind_param('isssss', $userId, $title, $desc, $category, $location, $submittedDate);
        $insertComplaint->execute();

        $complaintId = (int)$conn->insert_id;
        $remarks = 'Inserted by insert-test-complaints.php';
        $updatedBy = 'system';
        $statusStmt = $conn->prepare("INSERT INTO complaint_status (complaint_id, status_name, remarks, status_date, updated_by) VALUES (?, ?, ?, ?, ?)");
        if ($statusStmt) {
            $statusStmt->bind_param('issss', $complaintId, $status, $remarks, $submittedDate, $updatedBy);
            $statusStmt->execute();
            $statusStmt->close();
        }
        $insertedCount++;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Test data inserted successfully',
    'user_id' => $userId,
    'complaints_inserted' => $insertedCount
]);
?>
