# Academic Scheduler — Backend (PHP)

This folder contains the small PHP backend used by the Academic Scheduler frontend.

Structure (grouped by role)

- `config/` - configuration files and `.env` loader
- `controllers/` - HTTP controllers (auth, profile, etc.)
- `models/` - database models (User.php)
- `api/` - public API endpoints (register_user.php, list_users.php)
- `logs/` - runtime logs (error.log)
- root files: `db.php`, `init_db.php`, and small dev helpers

Quick start

1. Copy `.env.example` to `.env` and fill DB credentials.
2. Ensure PHP and MySQL (or XAMPP) are running.
3. Visit `backend/init_db.php` once to create the database/tables.

Notes

- Keep `.env` out of version control.
- Remove dev helpers (`set_password.php`) after use.

