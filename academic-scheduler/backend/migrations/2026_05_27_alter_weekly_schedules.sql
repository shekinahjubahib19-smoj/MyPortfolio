-- Migration: add mode/weeks/online fields and include Sunday in day_of_week
-- Backup your DB before running: mysqldump -u root -p academic_scheduler > backup.sql

-- 1) Extend day_of_week enum to include Sunday (modify to your enum list)
ALTER TABLE weekly_schedules
  MODIFY COLUMN day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL;

-- 2) Add mode column (online / f2f)
ALTER TABLE weekly_schedules
  ADD COLUMN IF NOT EXISTS mode ENUM('online','f2f') NOT NULL DEFAULT 'online';

-- 3) Add weeks (number of weeks the schedule repeats)
ALTER TABLE weekly_schedules
  ADD COLUMN IF NOT EXISTS weeks INT NOT NULL DEFAULT 1;

-- 4) Add online/session fields for storing meeting info
ALTER TABLE weekly_schedules
  ADD COLUMN IF NOT EXISTS teacher_email VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS zoom_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS zoom_pass VARCHAR(100) DEFAULT NULL;

-- Notes:
-- - `ADD COLUMN IF NOT EXISTS` requires MySQL 8.0+. If your server does not support it, remove the `IF NOT EXISTS` clauses and run carefully.
-- - If you already have existing schedules using a different default for `room_name`, you may want to update existing rows to set `mode` and `weeks` appropriately.
-- Example: set existing rows to f2f and weeks=1 by default
-- UPDATE weekly_schedules SET mode='f2f', weeks=1 WHERE mode IS NULL;

-- End of migration
