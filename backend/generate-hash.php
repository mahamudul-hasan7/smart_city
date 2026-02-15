<?php
// Generate bcrypt hash for password "123456"
$password = "123456";
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "Hash for '123456': " . $hash . "\n";

// Test if it matches
echo "Verification test: " . (password_verify($password, $hash) ? "SUCCESS" : "FAILED") . "\n";
?>
