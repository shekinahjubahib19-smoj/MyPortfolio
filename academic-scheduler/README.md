# Academic Scheduler

A full-stack web application for managing teacher scheduling, student assignments, and weekly timetables.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | PHP (REST API) |
| Database | MySQL |
| Server | Apache (via XAMPP) |

---

## Prerequisites — Software to Install

### 1. Node.js (for the frontend)
Download and install from: https://nodejs.org/

Choose the **LTS** version (recommended). This also installs `npm`.

Verify installation:
```bash
node -v
npm -v
```

### 2. XAMPP (for Apache + PHP + MySQL)
Download from: https://www.apachefriends.org/

During installation, make sure these components are selected:
- **Apache** (web server)
- **PHP** (version 8.x recommended)
- **MySQL** (database)

---

## Project Structure

```
academic-scheduler/
├── src/              ← React frontend (Vite)
├── backend/          ← PHP REST API
│   ├── api/          ← API endpoints
│   ├── config/       ← Database configuration
│   ├── migrations/   ← Database schema migrations
│   ├── models/       ← PHP model classes
│   ├── controllers/  ← Auth controller
│   ├── init_db.php   ← One-time database setup script
│   └── sql/          ← .env and SQL files
└── vite.config.js    ← Vite config with /backend proxy
```

---

## Setup Instructions

### Step 1 — Configure Apache to Serve the Backend

1. Open the XAMPP Control Panel
2. Click **Config** → **Apache (httpd.conf)**
3. Find the `<Directory "C:/xampp/htdocs">` block and add this **inside** it:

   ```apacheconf
   Alias /backend "C:/xampp/htdocs/MyPortfolio/academic-scheduler/backend"
   <Directory "C:/xampp/htdocs/MyPortfolio/academic-scheduler/backend">
       Options Indexes FollowSymLinks
       AllowOverride All
       Require all granted
   </Directory>
   ```

   Or alternatively, copy the `academic-scheduler` folder directly into `C:\xampp\htdocs\` and change the Alias path accordingly.

4. Click **Config** again → **Apache (httpd-xampp.conf)** at the bottom
5. Add at the very end:
   ```apacheconf
   Include conf/extra/httpd-xampp.conf
   ```

6. Restart **Apache** from the XAMPP Control Panel.

> **Note:** If you only see a blank page or 404 on API calls, make sure the Alias path matches the actual location of your `backend` folder on this computer.

---

### Step 2 — Create the Database

1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Click **Import** in the top menu
3. Browse to `academic-scheduler/backend/migrations/` and run each SQL file **in order** (earliest files first), OR:
4. Open your browser and visit:
   ```
   http://localhost/backend/init_db.php
   ```
   This initializes the database and required tables.

5. Still in phpMyAdmin, also run these migration files manually if the tables are missing:
   - `backend/migrations/2026_05_12_create_weekly_schedules_table.sql`
   - `backend/migrations/2026_05_27_alter_weekly_schedules.sql`

---

### Step 3 — Configure Backend Environment

1. Copy `backend/sql/.env.example` to `backend/sql/.env`:
   ```bash
   # On Windows (Command Prompt):
   copy backend\sql\.env.example backend\sql\.env

   # On Windows (PowerShell):
   Copy-Item "backend/sql/.env.example" "backend/sql/.env"
   ```

2. Edit `backend/sql/.env` — update if needed:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=
   DB_NAME=academic_scheduler
   DB_PORT=3306
   ```

   > **Default XAMPP credentials:** `root` with **no password**.

---

### Step 4 — Install Frontend Dependencies

Open your terminal/Command Prompt in the `academic-scheduler` folder:

```bash
cd C:\xampp\htdocs\MyPortfolio\academic-scheduler

npm install
```

This installs React, Vite, Tailwind CSS, and all other frontend dependencies.

---

### Step 5 — Start the Frontend Dev Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Keep this terminal open.

---

### Step 6 — Access the Application

Open your browser and go to:

```
http://localhost:5173
```

> The API calls from the frontend (e.g. `/backend/api/*`) are automatically proxied to your Apache server (`http://localhost/backend/`), so you do **not** need to run a separate PHP server.

---

## Troubleshooting

### API calls return 404 or blank page
- Ensure Apache is **running** in XAMPP.
- Verify the Alias path in `httpd.conf` matches your actual folder path.
- Make sure the `backend` folder is accessible: http://localhost/backend/

### "Class 'mysqli' not found" error
- In XAMPP Control Panel, click **Config** → **PHP**
- Find `;extension=mysqli` and remove the `;` to uncomment it
- Restart Apache

### "Database connection failed"
- Check that `DB_USER` and `DB_PASS` in `backend/sql/.env` match your XAMPP MySQL credentials
- Make sure MySQL is **running** in XAMPP

### CORS or preflight errors in browser console
- The `backend/api/*.php` files already include CORS headers. If problems persist, check that Apache `mod_headers` is enabled.

### phpMyAdmin not accessible
- Start the MySQL service from XAMPP Control Panel
- Then visit: http://localhost/phpmyadmin

### npm install fails
- Update npm: `npm install -g npm`
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and try again: `rm -rf node_modules && npm install`

---

## Creating a Test Account

When the database is first set up, use the registration feature in the app to create a teacher or admin account, or insert one manually via phpMyAdmin in the `users` table.

---

## API Reference

The backend exposes REST endpoints under `/backend/api/`. Key endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register_user.php` | Create a new user account |
| POST | `/api/update_teacher_profile.php` | Save teacher profile & subjects |
| POST | `/api/create_student.php` | Add a student |
| POST | `/api/create_weekly_schedule.php` | Schedule a session |
| GET | `/api/list_weekly_schedules.php` | Get schedules by teacher/student |
| GET | `/api/list_students.php` | List all students |
| GET | `/api/list_subjects.php` | List all subjects |
| GET | `/api/list_users.php` | List all teachers |

---

## Useful URLs

| Service | URL |
|---|---|
| App (Frontend) | http://localhost:5173 |
| phpMyAdmin | http://localhost/phpmyadmin |
| Apache Config | C:\xampp\apache\conf\httpd.conf |
| PHP Config | C:\xampp\php\php.ini |