<?php
require_once 'db_config.php';

echo "Testing get-complaints query...\n\n";

$sql = "SELECT 
            c.complaint_id as id,
            c.category,
            c.location,
            COALESCE(cs_latest.status_name, 'Pending') as status,
            c.created_date
        FROM complaint c
        LEFT JOIN (
            SELECT cs1.complaint_id, cs1.status_name
            FROM complaint_status cs1
            INNER JOIN (
                SELECT complaint_id, MAX(status_id) AS latest_status_id
                FROM complaint_status
                GROUP BY complaint_id
            ) latest ON latest.latest_status_id = cs1.status_id
        ) cs_latest ON c.complaint_id = cs_latest.complaint_id
        ORDER BY c.created_date DESC
        LIMIT 20";

$result = $conn->query($sql);

if (!$result) {
    echo "Error: " . $conn->error . "\n";
} else {
    echo "Success! Rows: " . $result->num_rows . "\n";
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            print_r($row);
        }
    }
}

$conn->close();
?>
