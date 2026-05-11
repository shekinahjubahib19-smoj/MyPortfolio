-- Backfill users.is_profile_complete for users that have a teacher_profiles row
-- Run this once against the academic_scheduler database.
SET SQL_SAFE_UPDATES = 0;

UPDATE users u
JOIN teacher_profiles tp ON tp.user_id = u.id
SET u.is_profile_complete = 1
WHERE u.is_profile_complete = 0;

SET SQL_SAFE_UPDATES = 1;

SELECT u.id, u.username, u.is_profile_complete, tp.teacher_code
FROM users u
LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
ORDER BY u.id;

-- Optionally verify:
-- SELECT u.id, u.username, u.is_profile_complete, tp.teacher_code FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id ORDER BY u.id;
