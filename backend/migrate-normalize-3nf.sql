START TRANSACTION;

-- Keep a strict 1:1 relation between user and citizen profile
ALTER TABLE citizen
  ADD UNIQUE KEY uq_citizen_user_id (user_id);

-- Remove duplicate attributes from citizen (kept in user table)
ALTER TABLE citizen
  DROP COLUMN name,
  DROP COLUMN email,
  DROP COLUMN password;

-- Remove duplicate / derived attributes from staff
ALTER TABLE staff
  DROP COLUMN full_name,
  DROP COLUMN email;

-- Department comes from assigned staff (staff.dept_id)
ALTER TABLE staffassignment
  DROP COLUMN department_id;

-- Source of truth for complaint status is complaint_status history
ALTER TABLE complaint
  DROP COLUMN status;

COMMIT;
