<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit();
}

function table_exists($conn, $name) {
    $res = $conn->query("SHOW TABLES LIKE '".$conn->real_escape_string($name)."'");
    return $res && $res->num_rows > 0;
}

function get_scalar($conn, $sql, $types = '', $params = []) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) return null;
    if ($types) { $stmt->bind_param($types, ...$params); }
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_row()) return $row[0];
    return null;
}

function get_row($conn, $sql, $types = '', $params = []) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) return null;
    if ($types) { $stmt->bind_param($types, ...$params); }
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) return $row;
    return null;
}

$summary = [
    'zones' => 0,
    'departments' => 0,
    'users' => 0,
    'citizens' => 0,
    'staff_users' => 0,
    'staff_profiles' => 0,
    'complaints' => 0,
    'status_history' => 0
];

$conn->begin_transaction();
try {
    // Zones
    if (table_exists($conn, 'zone')) {
        $zones = ['Mirpur','Dhanmondi','Uttara','Gulshan','Mohammadpur'];
        $selZ = $conn->prepare("SELECT zone_id FROM zone WHERE name = ? LIMIT 1");
        $maxZ = (int) get_scalar($conn, "SELECT COALESCE(MAX(zone_id),0) FROM zone");
        $insZ = $conn->prepare("INSERT INTO zone (zone_id, name, city_name, area_description) VALUES (?, ?, 'Dhaka', 'Residential area')");
        foreach ($zones as $name) {
            $selZ->bind_param('s', $name); $selZ->execute(); $r = $selZ->get_result();
            if ($r && $r->num_rows) continue;
            $maxZ += 1;
            $insZ->bind_param('is', $maxZ, $name);
            $insZ->execute();
            $summary['zones']++;
        }
    }

    // Departments
    if (table_exists($conn, 'department')) {
        $deps = [
            [1, 'Road & Transport'],
            [2, 'Water & Sewerage'],
            [3, 'Waste Management'],
            [4, 'Electricity']
        ];
        $sel = $conn->prepare("SELECT dept_id FROM department WHERE dept_id = ? OR name = ? LIMIT 1");
        $ins = $conn->prepare("INSERT INTO department (dept_id, name, email, phone_no, office_street, office_city, office_area) VALUES (?, ?, ?, '', '', 'Dhaka', '')");
        foreach ($deps as $d) {
            [$id,$name] = $d;
            $sel->bind_param('is', $id, $name); $sel->execute(); $r = $sel->get_result();
            if (!$r || $r->num_rows === 0) {
                $email = strtolower(str_replace([' & ', ' '], ['.', '.'], $name)) . '@smartcity.gov';
                $ins->bind_param('iss', $id, $name, $email);
                $ins->execute();
                $summary['departments']++;
            }
        }
    }

    // Users and Citizens
    if (table_exists($conn, 'user') && table_exists($conn, 'citizen')) {
        $people = [
            ['Rahim Uddin','rahim@example.com','Citizen'],
            ['Nusrat Jahan','nusrat@example.com','Citizen'],
            ['System Admin','admin@city.gov','Admin']
        ];
        $selU = $conn->prepare("SELECT user_id FROM user WHERE email = ? LIMIT 1");
        $insU = $conn->prepare("INSERT INTO user (name, email, password, phone_no, role, status) VALUES (?,?,?,?,?,?)");
        $defaultPass = password_hash('Pass@1234', PASSWORD_BCRYPT);
        foreach ($people as $p) {
            [$name,$email,$role] = $p; $status='Active'; $phone='';
            $selU->bind_param('s', $email); $selU->execute(); $r = $selU->get_result();
            if ($r && $r->num_rows) continue;
            $insU->bind_param('ssssss', $name,$email,$defaultPass,$phone,$role,$status);
            $insU->execute();
            $summary['users']++;
            $uid = $conn->insert_id;
            if ($role === 'Citizen') {
                $nid = 'NID'.strval(1000+$uid); $dob='1995-01-01';
                $street = ''; $area = ''; $city='Dhaka'; $gender = null;
                $insC = $conn->prepare("INSERT INTO citizen (user_id, nid, dob, gender, street, area, city) VALUES (?,?,?,?,?,?,?)");
                $insC->bind_param('issssss', $uid, $nid, $dob, $gender, $street, $area, $city);
                $insC->execute();
                $summary['citizens']++;
            }
        }
    }

    // Staff users + profiles
    if (table_exists($conn, 'staff')) {
        $zoneId = intval(get_scalar($conn, "SELECT zone_id FROM zone WHERE name='Mirpur' LIMIT 1") ?? 1);
        $staff = [
            ['Arif', 'Hasan','Inspector','arif@city.gov','01811111111','Active',$zoneId,1],
            ['Nabila', 'Rahman','Supervisor','nabila@city.gov','01822222222','Active',$zoneId,2],
        ];
        $selS = $conn->prepare("SELECT user_id FROM user WHERE email = ? LIMIT 1");
        $insStaffUser = $conn->prepare("INSERT INTO user (name, email, password, phone_no, role, status) VALUES (?, ?, ?, ?, 'Staff', ?)");
        $insStaffProfile = $conn->prepare("INSERT INTO staff (user_id, first_name, last_name, designation, joining_date, status, phone_no, zone_id, dept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $defaultStaffPass = password_hash('Pass@1234', PASSWORD_BCRYPT);
        foreach ($staff as $s) {
            [$first,$last,$des,$em,$ph,$st,$zid,$deptId] = $s; $jd = date('Y-m-d');
            $fullName = trim($first . ' ' . $last);
            $selS->bind_param('s', $em); $selS->execute(); $r=$selS->get_result();
            if ($r && $r->num_rows) {
                $uid = (int)$r->fetch_assoc()['user_id'];
            } else {
                $insStaffUser->bind_param('sssss', $fullName, $em, $defaultStaffPass, $ph, $st);
                $insStaffUser->execute();
                $uid = (int)$conn->insert_id;
                $summary['staff_users']++;
            }

            $checkProfile = $conn->prepare("SELECT user_id FROM staff WHERE user_id = ? LIMIT 1");
            $checkProfile->bind_param('i', $uid);
            $checkProfile->execute();
            $profileResult = $checkProfile->get_result();
            if (!$profileResult || $profileResult->num_rows === 0) {
                $insStaffProfile->bind_param('issssssii', $uid, $first, $last, $des, $jd, $st, $ph, $zid, $deptId);
                $insStaffProfile->execute();
                $summary['staff_profiles']++;
            }
            $checkProfile->close();
        }
    }

    // Complaints + status
    if (table_exists($conn, 'complaint')) {
        $citRahim = intval(get_scalar($conn, "SELECT user_id FROM user WHERE email='rahim@example.com' LIMIT 1") ?? 0);
        $citNusrat = intval(get_scalar($conn, "SELECT user_id FROM user WHERE email='nusrat@example.com' LIMIT 1") ?? 0);
        $zMirpur = intval(get_scalar($conn, "SELECT zone_id FROM zone WHERE name='Mirpur' LIMIT 1") ?? 1);
        $zDhan = intval(get_scalar($conn, "SELECT zone_id FROM zone WHERE name='Dhanmondi' LIMIT 1") ?? 2);

        $samples = [
            [$citRahim,$zMirpur,1,'Potholes on main street','Road','Dhaka','Mirpur','Road 7','Pending','2026-01-18 10:00:00','High'],
            [$citRahim,$zMirpur,3,'Garbage pile near market','Waste','Dhaka','Mirpur','Market Area','In Progress','2026-01-19 12:30:00','Medium'],
            [$citNusrat,$zDhan,2,'Water leakage in Block B','Water','Dhaka','Dhanmondi','Block B','Resolved','2026-01-17 09:15:00','High'],
            [$citNusrat,$zDhan,4,'Street lights not working','Electricity','Dhaka','Dhanmondi','Road 8','Pending','2026-01-20 20:45:00','Low']
        ];

        $selC = $conn->prepare("SELECT complaint_id FROM complaint WHERE user_id=? AND description=? LIMIT 1");
        $insC = $conn->prepare("INSERT INTO complaint (user_id, title, description, category, location, created_date) VALUES (?,?,?,?,?,?)");
        foreach ($samples as $c) {
            [$cit,$zone,$dept,$desc,$type,$city,$area,$street,$status,$date,$prio] = $c;
            if ($cit <= 0) continue;
            $selC->bind_param('is', $cit, $desc); $selC->execute(); $r=$selC->get_result();
            if ($r && $r->num_rows) continue;
            $location = $area . ', ' . $street;
            $title = $type . ' Complaint';
            $insC->bind_param('isssss', $cit,$title,$desc,$type,$location,$date);
            $insC->execute();
            $summary['complaints']++;
            $cid = $conn->insert_id;
            if (table_exists($conn, 'complaint_status')) {
                $st = $conn->prepare("INSERT INTO complaint_status (complaint_id, status_name, remarks, status_date, updated_by) VALUES (?,?,?,?,?)");
                $hist = [
                    [$cid,'Pending','Reported by citizen', $date, 'system'],
                    [$cid,$status,'Auto update based on routing', date('Y-m-d H:i:s', strtotime($date)+3600), 'system']
                ];
                foreach ($hist as $h) { $st->bind_param('issss', $h[0],$h[1],$h[2],$h[3],$h[4]); $st->execute(); $summary['status_history']++; }
            }
        }
    }

    $conn->commit();
    echo json_encode(['success'=>true,'message'=>'Seed complete','summary'=>$summary]);
} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Seed failed','error'=>$e->getMessage()]);
}
