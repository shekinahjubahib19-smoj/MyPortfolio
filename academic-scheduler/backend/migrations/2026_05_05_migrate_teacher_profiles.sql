-- Migration: Rename user_code -> teacher_code and add UNIQUE constraints
-- Run this file against the `academic_scheduler` database.
-- IMPORTANT: BACKUP your database before running.

-- 1) Rename `user_code` column to `teacher_code` (if it exists)
ALTER TABLE teacher_profiles
  CHANGE COLUMN user_code teacher_code VARCHAR(20) NULL;

-- 2) Add UNIQUE constraint for one-to-one relationship between users and teacher_profiles
ALTER TABLE teacher_profiles
  ADD UNIQUE KEY ux_teacher_user (user_id);

-- 3) Add UNIQUE constraint on teacher_code (human-facing ID)
ALTER TABLE teacher_profiles
  ADD UNIQUE KEY ux_teacher_code (teacher_code);

-- 4) Ensure subjects.subject_code is UNIQUE (if not already)
ALTER TABLE subjects
  ADD UNIQUE KEY ux_subject_code (subject_code);

-- Notes:
-- - If any of the ALTER statements fail because the column/index already exists,
--   inspect the current schema and adjust accordingly.
-- - After running, consider making `teacher_code` NOT NULL if every profile will have a code:
--     ALTER TABLE teacher_profiles MODIFY teacher_code VARCHAR(20) NOT NULL;
