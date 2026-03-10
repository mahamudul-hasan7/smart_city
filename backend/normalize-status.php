<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection failed']);
    exit();
}

try {
    $validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Cancelled', 'On Hold'];
    $statusMap = [
        '1' => 'Pending',
        '2' => 'In Progress',
        '3' => 'Resolved',
        '4' => 'Rejected',
        '5' => 'Pending',
        'pending' => 'Pending',
        'in progress' => 'In Progress',
        'resolved' => 'Resolved',
        'rejected' => 'Rejected',
        'cancelled' => 'Cancelled',
        'on hold' => 'On Hold',
        'assigned' => 'Assigned'
    ];

    $updates = [];
    $result = $conn->query("SELECT status_id, complaint_id, status_name FROM complaint_status ORDER BY status_id ASC");

    while ($result && $row = $result->fetch_assoc()) {
        $raw = trim((string)($row['status_name'] ?? ''));
        $key = strtolower($raw);

        $normalized = $statusMap[$key] ?? ($statusMap[$raw] ?? null);
        if (!$normalized || !in_array($normalized, $validStatuses, true)) {
            $normalized = 'Pending';
        }

        if ($normalized !== $raw) {
            $statusId = (int)$row['status_id'];
            $stmt = $conn->prepare("UPDATE complaint_status SET status_name = ? WHERE status_id = ?");
            if ($stmt) {
                $stmt->bind_param('si', $normalized, $statusId);
                $stmt->execute();
                $stmt->close();
                $updates[] = [
                    'status_id' => $statusId,
                    'complaint_id' => (int)$row['complaint_id'],
                    'old' => $raw,
                    'new' => $normalized
                ];
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Complaint status history normalized successfully',
        'updated_count' => count($updates),
        'updates' => $updates
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>
