# Smart City 3NF Migration Runbook

## 1) Backup first
- Open phpMyAdmin or terminal and export current `smart_city` database.
- Keep a `.sql` backup before any migration.

## 2) Apply schema migration
- File: `backend/migrate-normalize-3nf.sql`
- Execute in MariaDB/MySQL:

```sql
SOURCE c:/xampp/htdocs/Smart_City/backend/migrate-normalize-3nf.sql;
```

If `SOURCE` is not available, copy-paste the SQL content in your SQL client and run.

## 3) Normalize existing status history (optional but recommended)
- Run endpoint once:
- `http://localhost/Smart_City/backend/normalize-status.php`

This cleans old/non-standard values in `complaint_status.status_name`.

## 4) Quick smoke test endpoints
Call these URLs and verify `success: true`:
- `http://localhost/Smart_City/backend/get-dashboard-stats.php`
- `http://localhost/Smart_City/backend/get-all-complaints.php`
- `http://localhost/Smart_City/backend/get-complaints-for-reports.php`

Then test write flows from UI:
- Submit complaint (citizen)
- Update complaint status (staff/admin)
- Assign staff to complaint (admin)

## 5) Rollback strategy
If anything fails:
1. Stop writes from app.
2. Drop affected DB or tables.
3. Re-import backup SQL.
4. Re-run only after fixing failing endpoint/query.
