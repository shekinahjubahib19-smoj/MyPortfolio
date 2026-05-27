-- Student-centered schedule assignments
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS student_schedule_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  timeslot_id INT NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (timeslot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_timeslot (student_id, timeslot_id),
  UNIQUE KEY uq_timeslot_teacher (timeslot_id, teacher_id)
);

SET FOREIGN_KEY_CHECKS=1;

-- Note: this migration creates a new table to store assignments per student.
