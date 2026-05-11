ALTER TABLE weekly_schedules 
ADD COLUMN student_name VARCHAR(100) AFTER subject_id,
ADD COLUMN level VARCHAR(20) AFTER student_name;