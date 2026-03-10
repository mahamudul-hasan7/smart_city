<?php
require_once __DIR__ . '/cors-headers.php';
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $deptColumnExists = false;
    $colCheck = $conn->query("SHOW COLUMNS FROM Staff LIKE 'dept_id'");
    if ($colCheck && $colCheck->num_rows > 0) {
        $deptColumnExists = true;
    }

    // Check if StaffAssignment table exists
    $assignmentTableExists = false;
    $tableCheck = $conn->query("SHOW TABLES LIKE 'StaffAssignment'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $assignmentTableExists = true;
    }

    if ($deptColumnExists && $assignmentTableExists) {
        $query = "SELECT 
            s.user_id,
            CONCAT('S-', s.user_id) as staff_id,
            CONCAT(COALESCE(s.first_name, ''), CASE WHEN s.last_name IS NULL OR s.last_name = '' THEN '' ELSE ' ' END, COALESCE(s.last_name, '')) as full_name,
            s.designation,
            u.email,
            s.phone_no,
            s.status,
            s.dept_id,
            d.name as dept_name,
            z.name as zone_name,
            s.joining_date,
            COUNT(sa.assignment_id) as assigned_complaints
        FROM Staff s
        LEFT JOIN user u ON s.user_id = u.user_id
        LEFT JOIN Zone z ON s.zone_id = z.zone_id
        LEFT JOIN Department d ON s.dept_id = d.dept_id
        LEFT JOIN StaffAssignment sa ON s.user_id = sa.staff_id
        GROUP BY s.user_id
        ORDER BY s.user_id DESC";
    } else if ($deptColumnExists) {
        $query = "SELECT 
            s.user_id,
            CONCAT('S-', s.user_id) as staff_id,
            CONCAT(COALESCE(s.first_name, ''), CASE WHEN s.last_name IS NULL OR s.last_name = '' THEN '' ELSE ' ' END, COALESCE(s.last_name, '')) as full_name,
            s.designation,
            u.email,
            s.phone_no,
            s.status,
            s.dept_id,
            d.name as dept_name,
            z.name as zone_name,
            s.joining_date,
            0 as assigned_complaints
        FROM Staff s
        LEFT JOIN user u ON s.user_id = u.user_id
        LEFT JOIN Zone z ON s.zone_id = z.zone_id
        LEFT JOIN Department d ON s.dept_id = d.dept_id
        ORDER BY s.user_id DESC";
    } else if ($assignmentTableExists) {
        $query = "SELECT 
            s.user_id,
            CONCAT('S-', s.user_id) as staff_id,
            CONCAT(COALESCE(s.first_name, ''), CASE WHEN s.last_name IS NULL OR s.last_name = '' THEN '' ELSE ' ' END, COALESCE(s.last_name, '')) as full_name,
            s.designation,
            u.email,
            s.phone_no,
            s.status,
            z.name as zone_name,
            s.joining_date,
            COUNT(sa.assignment_id) as assigned_complaints
        FROM Staff s
        LEFT JOIN user u ON s.user_id = u.user_id
        LEFT JOIN Zone z ON s.zone_id = z.zone_id
        LEFT JOIN StaffAssignment sa ON s.user_id = sa.staff_id
        GROUP BY s.user_id
        ORDER BY s.user_id DESC";
    } else {
        $query = "SELECT 
            s.user_id,
            CONCAT('S-', s.user_id) as staff_id,
            CONCAT(COALESCE(s.first_name, ''), CASE WHEN s.last_name IS NULL OR s.last_name = '' THEN '' ELSE ' ' END, COALESCE(s.last_name, '')) as full_name,
            s.designation,
            u.email,
            s.phone_no,
            s.status,
            z.name as zone_name,
            s.joining_date,
            0 as assigned_complaints
        FROM Staff s
        LEFT JOIN user u ON s.user_id = u.user_id
        LEFT JOIN Zone z ON s.zone_id = z.zone_id
        ORDER BY s.user_id DESC";
    }
    
    $result = $conn->query($query);
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }

    $staff = [];
    
    while ($row = $result->fetch_assoc()) {
        $staff[] = [
            'staff_id' => $row['staff_id'],
            'user_id' => $row['user_id'],
            'name' => $row['full_name'],
            'designation' => $row['designation'] ?? 'N/A',
            'email' => $row['email'] ?? 'N/A',
            'phone' => $row['phone_no'] ?? 'N/A',
            'zone' => $row['zone_name'] ?? 'N/A',
            'status' => $row['status'] ?? 'Active',
            'assigned_complaints' => intval($row['assigned_complaints'] ?? 0),
            'department_id' => $deptColumnExists ? ($row['dept_id'] ?? null) : null,
            'department' => $deptColumnExists ? ($row['dept_name'] ?? 'N/A') : 'N/A',
            'joining_date' => $row['joining_date'] ?? 'N/A'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'staff' => $staff,
        'count' => count($staff)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
