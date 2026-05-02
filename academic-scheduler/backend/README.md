# Academic Scheduler — Backend (minimal)

This folder contains a minimal Node.js + Express backend using Prisma (MySQL) to demonstrate authentication.

Setup (local development)

1. Start a MySQL server (Docker example):

```bash
docker run --name mysql-local -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=devdb -p 3306:3306 -d mysql:8
```

2. Copy the example env and edit values:

```bash
cp .env.example .env
# set DATABASE_URL and JWT_SECRET
```

3. Install dependencies and generate Prisma client:

```bash
cd backend
npm install
npx prisma generate
# create migration and dev db
npx prisma migrate dev --name init
```

4. Start the server:

```bash
npm run dev
```

API endpoints
- POST `/api/auth/login` { email, password } -> sets httpOnly cookie `sid` and returns role
- POST `/api/auth/logout` -> clears cookie
- GET `/api/auth/me` -> returns logged-in user info (id,email,role)
- GET `/api/users` -> admin-only list of users

Notes
- This is a minimal scaffold for local development. For production use, ensure `JWT_SECRET` is strong, enable HTTPS, set `secure: true` on cookies, and use a managed DB.
