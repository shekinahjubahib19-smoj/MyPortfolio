ALTER TABLE weekly_schedules 
ADD COLUMN student_id INT AFTER subject_id,
ADD CONSTRAINT fk_ws_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- If you already added student_name, you can drop it:
ALTER TABLE weekly_schedules DROP COLUMN student_name;