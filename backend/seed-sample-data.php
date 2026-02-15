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
    'staff' => 0,
    'complaints' => 0,
    'status_history' => 0
];

$conn->begin_transaction();
try {
    // Zones
    if (table_exists($conn, 'Zone')) {
        $zones = ['Mirpur','Dhanmondi','Uttara','Gulshan','Mohammadpur'];
        $selZ = $conn->prepare("SELECT zone_id FROM Zone WHERE name = ? LIMIT 1");
        $maxZ = (int) get_scalar($conn, "SELECT COALESCE(MAX(zone_id),0) FROM Zone");
        $insZ = $conn->prepare("INSERT INTO Zone (zone_id, name) VALUES (?, ?)");
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
    if (table_exists($conn, 'Department')) {
        $deps = [
            [1, 'Road & Transport'],
            [2, 'Water & Sewerage'],
            [3, 'Waste Management'],
            [4, 'Electricity']
        ];
        $sel = $conn->prepare("SELECT dept_id FROM Department WHERE dept_id = ? OR name = ? LIMIT 1");
        $ins = $conn->prepare("INSERT INTO Department (dept_id, name) VALUES (?, ?)");
        foreach ($deps as $d) {
            [$id,$name] = $d;
            $sel->bind_param('is', $id, $name); $sel->execute(); $r = $sel->get_result();
            if (!$r || $r->num_rows === 0) { $ins->bind_param('is', $id, $name); $ins->execute(); $summary['departments']++; }
        }
    }

    // Users and Citizens
    if (table_exists($conn, 'user') && table_exists($conn, 'Citizen')) {
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
                $first = explode(' ', $name, 2)[0]; $last = trim(substr($name, strlen($first)));
                $reg = date('Y-m-d'); $city='Dhaka';
                $insC = $conn->prepare("INSERT INTO Citizen (user_id, first_name, last_name, full_name, city, reg_date, nid_no, dob) VALUES (?,?,?,?,?,?,?,?)");
                $nid = 'NID'.strval(1000+$uid); $dob='1995-01-01';
                $insC->bind_param('isssssss', $uid,$first,$last,$name,$city,$reg,$nid,$dob);
                $insC->execute();
                $summary['citizens']++;
            }
        }
    }

    // Staff
    if (table_exists($conn, 'Staff')) {
        $zoneId = intval(get_scalar($conn, "SELECT zone_id FROM Zone WHERE name='Mirpur' LIMIT 1") ?? 1);
        $staff = [
            ['Arif Hasan','Inspector','arif@city.gov','01811111111','Active',$zoneId],
            ['Nabila Rahman','Supervisor','nabila@city.gov','01822222222','Active',$zoneId],
        ];
        $selS = $conn->prepare("SELECT user_id FROM Staff WHERE email = ? LIMIT 1");
        $maxS = (int) get_scalar($conn, "SELECT COALESCE(MAX(user_id),0) FROM Staff");
        $insS = $conn->prepare("INSERT INTO Staff (user_id, full_name, designation, email, phone_no, status, zone_id, joining_date) VALUES (?,?,?,?,?,?,?,?)");
        foreach ($staff as $s) {
            [$nm,$des,$em,$ph,$st,$zid] = $s; $jd = date('Y-m-d');
            $selS->bind_param('s', $em); $selS->execute(); $r=$selS->get_result();
            if ($r && $r->num_rows) continue;
            $maxS += 1;
            $insS->bind_param('isssssis', $maxS,$nm,$des,$em,$ph,$st,$zid,$jd);
            $insS->execute();
            $summary['staff']++;
        }
    }

    // Complaints + status
    if (table_exists($conn, 'Complaint')) {
        $citRahim = intval(get_scalar($conn, "SELECT user_id FROM user WHERE email='rahim@example.com' LIMIT 1") ?? 0);
        $citNusrat = intval(get_scalar($conn, "SELECT user_id FROM user WHERE email='nusrat@example.com' LIMIT 1") ?? 0);
        $zMirpur = intval(get_scalar($conn, "SELECT zone_id FROM Zone WHERE name='Mirpur' LIMIT 1") ?? 1);
        $zDhan = intval(get_scalar($conn, "SELECT zone_id FROM Zone WHERE name='Dhanmondi' LIMIT 1") ?? 2);

        $samples = [
            [$citRahim,$zMirpur,1,'Potholes on main street','Road','Dhaka','Mirpur','Road 7','Pending','2026-01-18 10:00:00','High'],
            [$citRahim,$zMirpur,3,'Garbage pile near market','Waste','Dhaka','Mirpur','Market Area','In Progress','2026-01-19 12:30:00','Medium'],
            [$citNusrat,$zDhan,2,'Water leakage in Block B','Water','Dhaka','Dhanmondi','Block B','Resolved','2026-01-17 09:15:00','High'],
            [$citNusrat,$zDhan,4,'Street lights not working','Electricity','Dhaka','Dhanmondi','Road 8','Pending','2026-01-20 20:45:00','Low']
        ];

        $selC = $conn->prepare("SELECT complaint_id FROM Complaint WHERE citizen_id=? AND description=? LIMIT 1");
        $insC = $conn->prepare("INSERT INTO Complaint (citizen_id, zone_id, dept_id, description, type, location_city, location_area, location_street, current_status, submitted_date, priority_level) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        foreach ($samples as $c) {
            [$cit,$zone,$dept,$desc,$type,$city,$area,$street,$status,$date,$prio] = $c;
            if ($cit <= 0) continue;
            $selC->bind_param('is', $cit, $desc); $selC->execute(); $r=$selC->get_result();
            if ($r && $r->num_rows) continue;
            $insC->bind_param('iiissssssss', $cit,$zone,$dept,$desc,$type,$city,$area,$street,$status,$date,$prio);
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
