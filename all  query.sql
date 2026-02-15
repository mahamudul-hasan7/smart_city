-- সব zone দেখানো
SELECT * FROM Zone;

-- সব department দেখানো
SELECT * FROM Department;

-- সব citizen দেখানো
SELECT * FROM Citizen;



--Citizen এর complain
SELECT 
  complaint_id, 
  description, 
  submitted_date
FROM Complaint
WHERE citizen_id = 101;


--Citizen + Zone + Complaint (Normalized JOIN)
--citizen er nam and zone er namsoho sob ovijog er talika
SELECT 
  cm.complaint_id,
  c.full_name AS citizen_name,
  z.name AS zone_name,
  cm.description,
  cm.submitted_date
FROM Complaint cm
JOIN Citizen c ON cm.citizen_id = c.user_id
JOIN Zone z ON cm.zone_id = z.zone_id;


--WHERE Clause Queries
-- নির্দিষ্ট zone এর citizen
SELECT * 
FROM Citizen
WHERE zone_id = 1;

-- Pending complaint গুলো
SELECT * 
FROM Complaint
WHERE current_status = 'Pending';


--Citizen + Complaint + Zone (JOIN)

SELECT 
  c.full_name,
  z.name AS zone_name,
  cm.description
FROM Complaint cm
JOIN Citizen c ON cm.citizen_id = c.user_id
JOIN Zone z ON cm.zone_id = z.zone_id;



--ADVANCED ADMIN QUERY 
--When an admin views all complaints, they should be able to see not only the IDs, 
--but also the department names and status names in a detailed and user-friendly way.
SELECT 
  cm.complaint_id,
  c.full_name AS citizen_name,
  d.name AS department_name,
  z.name AS zone_name,
  cm.current_status,
  cm.submitted_date
FROM Complaint cm
JOIN Citizen c ON cm.citizen_id = c.user_id
JOIN Department d ON cm.dept_id = d.dept_id
JOIN Zone z ON cm.zone_id = z.zone_id;


--Complaint + Department
SELECT 
  cm.complaint_id,
  d.name AS department_name,
  cm.current_status
FROM Complaint cm
JOIN Department d ON cm.dept_id = d.dept_id;


--Department-wise Filtering
--department er nam dea ovijog khuja jabe
SELECT 
  cm.description,
  cm.current_status
FROM Complaint cm
JOIN Department d ON cm.dept_id = d.dept_id
WHERE d.name = 'Water & Sewerage';


--AGGREGATE / REPORT QUERIES
--Zone-wise complaints (this query finds the most complained zone)
SELECT 
  z.name AS zone_name,
  COUNT(cm.complaint_id) AS total_complaints
FROM Complaint cm
JOIN Zone z ON cm.zone_id = z.zone_id
GROUP BY z.name
ORDER BY total_complaints DESC;


--Department-wise complaints
--total number of  complains per department 
SELECT 
  d.name AS department_name,
  COUNT(cm.complaint_id) AS total_complaints
FROM Department d
LEFT JOIN Complaint cm ON d.dept_id = cm.dept_id
GROUP BY d.name;


--Pending vs Resolved
SELECT 
  current_status,
  COUNT(*) AS total
FROM Complaint
GROUP BY current_status;


--Average Resolution Time 
SELECT 
  AVG(DATEDIFF(cs.status_date, cm.submitted_date)) AS avg_resolution_days
FROM Complaint cm
JOIN Complaint_Status cs 
ON cm.complaint_id = cs.complaint_id
WHERE cs.status_name = 'Resolved';


--INSERT / UPDATE / DELETE
-- INSERT
INSERT INTO Zone 
VALUES (1, 'Mirpur', 'Dhaka', 'Residential area');

INSERT INTO Department 
VALUES (1, 'Roads Department', 'roads@city.gov', '0123456789', 'Main Road', 'Dhaka', 'Mirpur');

-- UPDATE
UPDATE Complaint
SET current_status = 'In Progress'
WHERE complaint_id = 101;

-- DELETE
DELETE FROM Complaint
WHERE complaint_id = 200;


--SUBQUERY (Fixed)
SELECT * 
FROM Complaint
WHERE zone_id = (
  SELECT zone_id 
  FROM Zone 
  WHERE name = 'Mirpur'
);


--Staff by Department
-- সাব-কুয়েরি ব্যবহার করে স্টাফ লিস্ট
SELECT 
  s.full_name, 
  s.designation
FROM Staff s
WHERE s.user_id IN (
  SELECT user_id
  FROM Staff
  WHERE designation = 'Waste Management'
);

--VIEW
CREATE VIEW Complaint_Report AS 
SELECT 
  c.full_name,
  d.name AS department,
  z.name AS zone,
  cm.current_status
FROM Complaint cm
JOIN Citizen c ON cm.citizen_id = c.user_id
JOIN Department d ON cm.dept_id = d.dept_id
JOIN Zone z ON cm.zone_id = z.zone_id;