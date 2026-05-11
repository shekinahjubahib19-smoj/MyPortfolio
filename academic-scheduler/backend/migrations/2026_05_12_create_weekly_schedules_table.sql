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