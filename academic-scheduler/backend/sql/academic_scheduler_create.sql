-- Complete database creation script for academic_scheduler
-- NOTE: This file does NOT drop the existing database. Drop manually if you wish.

CREATE DATABASE IF NOT EXISTS academic_scheduler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_scheduler;

-- 1. Core users (authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','TEACHER') NOT NULL DEFAULT 'TEACHER',
  is_profile_complete TINYINT(1) NOT NULL DEFAULT 0,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Subjects table (human-readable code shown in UI)
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  default_hours DECIMAL(4,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Teacher profiles (one per teacher user)
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  teacher_code VARCHAR(20) UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  max_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
  total_rendered_hours DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ux_teacher_user UNIQUE (user_id),
  CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Many-to-many: which subjects each teacher can teach
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_profile_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ux_teacher_subject UNIQUE (teacher_profile_id, subject_id),
  CONSTRAINT fk_ts_teacher FOREIGN KEY (teacher_profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Assignments / schedule rows (use to compute rendered hours)
CREATE TABLE IF NOT EXISTS teacher_assignments (
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

-- 6. Seed admin account (password hash for 'admin123')
INSERT IGNORE INTO users (username, password_hash, role, is_profile_complete, must_change_password)
VALUES (
  'admin_user',
  '$2y$10$9vaDS32NxAIGEsQZfTylguhD8tvUWBpyOAaASMljbZbS7h.PmvCEG',
  'ADMIN',
  1,
  0
);

-- 7. Optional: seed example subjects
INSERT IGNORE INTO subjects (subject_name, subject_code, default_hours)
VALUES
  ('English', 'ENG-101', 1.50),
  ('Filipino', 'FIL-101', 1.50),
  ('Mathematics', 'MTH-101', 1.50);

-- 8. Final adjustments: ensure indexes exist (safe to run)
ALTER TABLE subjects ADD UNIQUE KEY IF NOT EXISTS ux_subject_code (subject_code(20));
ALTER TABLE teacher_profiles ADD UNIQUE KEY IF NOT EXISTS ux_teacher_user (user_id);
ALTER TABLE teacher_profiles ADD UNIQUE KEY IF NOT EXISTS ux_teacher_code (teacher_code(20));


-- Migration: Create weekly_schedules table
-- Purpose: To handle specific time-slots and days for the Master Scheduler.

CREATE TABLE IF NOT EXISTS weekly_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_profile_id INT NOT NULL,
    subject_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_name VARCHAR(50) DEFAULT 'TBA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ws_teacher FOREIGN KEY (teacher_profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ws_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE weekly_schedules 
ADD COLUMN student_name VARCHAR(100) AFTER subject_id,
ADD COLUMN level VARCHAR(20) AFTER student_name;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    current_level VARCHAR(20), -- e.g., 'Level 1', 'Grade 7'
    enrollment_status ENUM('Active', 'Graduated', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE weekly_schedules 
ADD COLUMN student_id INT AFTER subject_id,
ADD CONSTRAINT fk_ws_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- If you already added student_name, you can drop it:
ALTER TABLE weekly_schedules DROP COLUMN student_name;

ALTER TABLE subjects 
ADD COLUMN level VARCHAR(50) AFTER subject_code;

-- End of script
