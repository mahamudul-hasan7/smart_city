<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

try {
    require_once 'db_config.php';
    
    if (!$conn || $conn->connect_error) {
        http_response_code(500);
        exit(json_encode([
            'success' => false, 
            'message' => 'Database connection failed',
            'error' => $conn ? $conn->connect_error : 'Connection is null'
        ]));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        exit(json_encode([
            'success' => false, 
            'message' => 'Invalid JSON data',
            'error' => json_last_error_msg()
        ]));
    }
    
    $user_id = $input['user_id'] ?? 0;
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $category = trim($input['category'] ?? '');
    $location = trim($input['location'] ?? '');
    
    $errors = [];
    
    if (empty($user_id) || $user_id <= 0) $errors['user_id'] = 'Invalid user ID';
    if (empty($title)) $errors['title'] = 'Title required';
    if (empty($description)) $errors['description'] = 'Description required';
    if (empty($category)) $errors['category'] = 'Category required';
    if (empty($location)) $errors['location'] = 'Location required';
    
    if (!empty($errors)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'errors' => $errors]));
    }
    
    $status = 'pending';
    $created_date = date('Y-m-d H:i:s');
    
    // Check table structure first
    $table_check = $conn->query("SHOW TABLES LIKE 'complaint'");
    if (!$table_check || $table_check->num_rows == 0) {
        // Try uppercase
        $table_check = $conn->query("SHOW TABLES LIKE 'Complaint'");
        if (!$table_check || $table_check->num_rows == 0) {
            http_response_code(500);
            exit(json_encode([
                'success' => false, 
                'message' => 'Complaint table does not exist. Please create the table first.',
                'error' => 'Table not found'
            ]));
        } else {
            $table_name = 'Complaint';
        }
    } else {
        $table_name = 'complaint';
    }
    
    // Check table columns
    $columns_result = $conn->query("DESCRIBE $table_name");
    $columns = [];
    while ($row = $columns_result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }
    
    // Determine which structure to use
    if (in_array('user_id', $columns) && in_array('title', $columns)) {
        // Simple structure: user_id, title, description, category, location, status, created_date
        $sql = "INSERT INTO $table_name (user_id, title, description, category, location, status, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            exit(json_encode([
                'success' => false, 
                'message' => 'Failed to prepare SQL statement',
                'error' => $conn->error
            ]));
        }
        $stmt->bind_param('issssss', $user_id, $title, $description, $category, $location, $status, $created_date);
    } else if (in_array('citizen_id', $columns) && in_array('type', $columns)) {
        // Complex structure: citizen_id, type, description, location_city, location_area, location_street, current_status, submitted_date
        // Map user_id to citizen_id (assuming they're the same)
        $citizen_id = $user_id;
        $type = $category;
        $current_status = 'Pending';
        $submitted_date = date('Y-m-d H:i:s');
        
        // Parse location (format: "Zone, Street/Area")
        $location_parts = explode(',', $location, 2);
        $location_city = 'Dhaka';
        $location_area = trim($location_parts[0] ?? '');
        $location_street = trim($location_parts[1] ?? $location);
        
        // Get zone_id from zone name (if zone table exists)
        $zone_id = null;
        if (in_array('zone_id', $columns)) {
            $zone_query = $conn->prepare("SELECT zone_id FROM zone WHERE name = ? LIMIT 1");
            if ($zone_query) {
                $zone_query->bind_param('s', $location_area);
                $zone_query->execute();
                $zone_result = $zone_query->get_result();
                if ($zone_result->num_rows > 0) {
                    $zone_id = $zone_result->fetch_assoc()['zone_id'];
                }
                $zone_query->close();
            }
        }
        
        // Get dept_id from category (if dept table exists)
        $dept_id = null;
        if (in_array('dept_id', $columns)) {
            // Map category to department (simple mapping)
            $dept_map = [
                'Road' => 1,
                'Water' => 2,
                'Waste' => 3,
                'Electricity' => 4,
                'Traffic' => 5
            ];
            $dept_id = $dept_map[$category] ?? 1;
        }
        
        $sql = "INSERT INTO $table_name (citizen_id, zone_id, dept_id, description, type, location_city, location_area, location_street, current_status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            exit(json_encode([
                'success' => false, 
                'message' => 'Failed to prepare SQL statement',
                'error' => $conn->error
            ]));
        }
        $stmt->bind_param('iiisssssss', $citizen_id, $zone_id, $dept_id, $description, $type, $location_city, $location_area, $location_street, $current_status, $submitted_date);
    } else {
        http_response_code(500);
        exit(json_encode([
            'success' => false, 
            'message' => 'Unknown table structure. Table columns: ' . implode(', ', $columns),
            'error' => 'Table structure mismatch'
        ]));
    }
    
    if ($stmt->execute()) {
        $complaint_id = $conn->insert_id;
        http_response_code(201);
        exit(json_encode([
            'success' => true,
            'message' => 'Complaint submitted successfully',
            'complaint_id' => $complaint_id
        ]));
    } else {
        http_response_code(500);
        exit(json_encode([
            'success' => false, 
            'message' => 'Failed to submit complaint',
            'error' => $stmt->error ? $stmt->error : $conn->error,
            'sql_error' => $conn->error
        ]));
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]));
}
?>
