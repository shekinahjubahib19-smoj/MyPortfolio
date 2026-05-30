-- Complete database creation script for academic_scheduler
-- Cleans up existing definitions to prevent duplicate key/column execution errors.

DROP DATABASE IF EXISTS academic_scheduler;
CREATE DATABASE academic_scheduler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_scheduler;

-- 1. Core users (authentication)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','TEACHER') NOT NULL DEFAULT 'TEACHER',
  is_profile_complete TINYINT(1) NOT NULL DEFAULT 0,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Subjects table (Includes the 'level' column amendment directly)
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  level VARCHAR(50) DEFAULT NULL,
  default_hours DECIMAL(4,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Students table (Moved up so it can be referenced by weekly_schedules)
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
    current_level VARCHAR(20), -- e.g., 'Level 1', 'Grade 7'
    enrollment_status ENUM('Active', 'Graduated', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Teacher profiles (one per teacher user)
CREATE TABLE teacher_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  teacher_code VARCHAR(20) UNIQUE,
  teacher_email VARCHAR(255) UNIQUE DEFAULT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  max_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
  total_rendered_hours DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ux_teacher_user UNIQUE (user_id),
  CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Admin profiles: store admin-specific minimal profile data
CREATE TABLE admin_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  admin_code VARCHAR(64) DEFAULT NULL,
  first_name VARCHAR(50) DEFAULT NULL,
  last_name VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Many-to-many: which subjects each teacher can teach
CREATE TABLE teacher_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_profile_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ux_teacher_subject UNIQUE (teacher_profile_id, subject_id),
  CONSTRAINT fk_ts_teacher FOREIGN KEY (teacher_profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Assignments / schedule rows (use to compute rendered hours)
CREATE TABLE teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_profile_id INT NOT NULL,
  subject_id INT NOT NULL,
  assigned_date DATE NULL,
  hours DECIMAL(4,2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_ta_date (assigned_date)
) ENGINE=InnoDB;

-- 7. Master Scheduler: weekly_schedules table (Includes final level and student structural changes)
CREATE TABLE weekly_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_profile_id INT NOT NULL,
  subject_id INT NOT NULL,
  student_id INT DEFAULT NULL,
  level VARCHAR(20) DEFAULT NULL,
  -- include Sunday in case some schedules run every day
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- mode indicates whether the session is online or face-to-face
  mode ENUM('online','f2f') NOT NULL DEFAULT 'online',
  -- number of weeks the schedule repeats for (period length)
  weeks INT NOT NULL DEFAULT 1,
  -- Online meeting fields (used when mode = 'online')
  zoom_id VARCHAR(100) DEFAULT NULL,
  zoom_password VARCHAR(255) DEFAULT NULL,
  -- Room management (used when mode = 'f2f')
  room_id INT DEFAULT NULL,
  room_name VARCHAR(50) DEFAULT 'TBA',
  -- Start and end dates for the repeating schedule. The end date is calculated
  -- as the date of the first occurrence plus (weeks - 1) * 7 days.
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ws_teacher FOREIGN KEY (teacher_profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ws_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ws_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  -- enforce that required fields exist depending on `mode`
  ,CONSTRAINT chk_ws_mode_fields CHECK (
    (mode = 'online' AND zoom_id IS NOT NULL)
    OR
    (mode = 'f2f' AND room_id IS NOT NULL)
  )
) ENGINE=InnoDB;

-- 8. Seed admin account (password hash for 'admin123')
INSERT INTO users (username, password_hash, role, is_profile_complete, must_change_password)
VALUES (
  'admin_user',
  '$2y$10$9vaDS32NxAIGEsQZfTylguhD8tvUWBpyOAaASMljbZbS7h.PmvCEG',
  'ADMIN',
  1,
  0
);

-- 9. Optional: seed example subjects
INSERT INTO subjects (subject_name, subject_code, default_hours)
VALUES
  ('English', 'ENG-101', 1.50),
  ('Filipino', 'FIL-101', 1.50),
  ('Mathematics', 'MTH-101', 1.50);

-- End of script