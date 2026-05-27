-- Scheduling tables (no rooms) - created 2026-05-25
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(191) NOT NULL,
  max_weekly_hours INT DEFAULT 40,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  day_of_week TINYINT NOT NULL, -- 0 = Sunday .. 6 = Saturday
  slot_index INT NOT NULL, -- reference to time_slots.slot_index
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week TINYINT NOT NULL,
  slot_index INT NOT NULL,
  label VARCHAR(191) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_day_slot (day_of_week, slot_index)
);

CREATE TABLE IF NOT EXISTS class_offerings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  level VARCHAR(64) DEFAULT NULL,
  weekly_sessions INT DEFAULT 1,
  session_slots INT DEFAULT 1, -- number of contiguous slots per session
  preferred_teacher_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_offering_id INT NOT NULL,
  timeslot_id INT NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_offering_id) REFERENCES class_offerings(id) ON DELETE CASCADE,
  FOREIGN KEY (timeslot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_timeslot_teacher (timeslot_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  status VARCHAR(32) DEFAULT 'enrolled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_subject (student_id, subject_id)
);

SET FOREIGN_KEY_CHECKS=1;

-- Seed simple time_slots: Monday(1) - Friday(5), slots 1..8
INSERT IGNORE INTO time_slots (day_of_week, slot_index, label)
SELECT d.day, s.slot, CONCAT('Day', d.day, ' Slot', s.slot)
FROM (
  SELECT 1 AS day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
) AS d,
(
  SELECT 1 AS slot UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
) AS s;
