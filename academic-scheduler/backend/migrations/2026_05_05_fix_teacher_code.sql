USE academic_scheduler;

-- Check if column `user_code` exists; if so, rename it to `teacher_code`.
SET @exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'academic_scheduler' AND TABLE_NAME = 'teacher_profiles' AND COLUMN_NAME = 'user_code'
);

SET @stmt = IF(@exists > 0,
  'ALTER TABLE teacher_profiles CHANGE COLUMN user_code teacher_code VARCHAR(20) NULL;',
  'SELECT "no-op: user_code not present";'
);

PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- After this, you can optionally make `teacher_code` NOT NULL if every profile will have one:
-- ALTER TABLE teacher_profiles MODIFY teacher_code VARCHAR(20) NOT NULL;
