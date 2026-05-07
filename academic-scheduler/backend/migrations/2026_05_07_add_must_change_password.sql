ALTER TABLE users
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 1 AFTER is_profile_complete;

UPDATE users SET must_change_password = 0 WHERE role = 'ADMIN';
