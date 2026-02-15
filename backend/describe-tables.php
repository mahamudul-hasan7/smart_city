<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/db_config.php';
$tables = ['user','Citizen','Zone','Department','Staff','Complaint','complaint_status'];
foreach ($tables as $t) {
  echo "\n-- $t --\n";
  $res = $conn->query("DESCRIBE $t");
  if ($res) {
    while ($row = $res->fetch_assoc()) {
      echo $row['Field']."\t".$row['Type']."\t".$row['Null']."\t".$row['Key']."\t".$row['Default']."\t".$row['Extra']."\n";
    }
  } else {
    echo "(missing)\n";
  }
}
