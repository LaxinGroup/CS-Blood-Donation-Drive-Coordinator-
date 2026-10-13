# Implementation Prompt: Database Connection & Auth Schema Alignment

## Context & Objectives
The user requested aligning the registration and login flows with the exact PostgreSQL `users` table schema:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'DONOR',
    last_donation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

and ensuring that the application reliably connects to the PostgreSQL database defined in `server/.env` (`DATABASE_URL`) without falling back to in-memory storage.

---

## 1. Problem Analysis & Root Causes

1. **Database Connection Configuration (`server/src/config/db.js`)**:
   - Currently, SSL is enabled only if `NODE_ENV === 'production'`. Since `NODE_ENV=development` in `server/.env`, SSL was disabled, while remote cloud providers (such as Neon) mandate SSL (`rejectUnauthorized: false`).
   - `connectionTimeoutMillis` was set to a restrictive `5000ms` (5s), which causes query aborts and timeout errors during cold starts / compute wake-up on serverless PostgreSQL (Neon).
   - Because errors were caught and swallowed into fallback in-memory mode, queries fell back to `memoryStore` instead of persisting to PostgreSQL.

2. **Table Schema & Query Mismatch (`server/src/db/store.js` & `server/src/db/schema.sql`)**:
   - `store.js`'s `createUser` currently runs an INSERT with columns `(id, full_name, email, password_hash, role, blood_group, phone, date_of_birth, created_at)`.
   - The user's `users` table in Neon does not have `blood_group`, `phone`, or `date_of_birth`, causing PostgreSQL column errors.
   - The user table uses `role user_role NOT NULL DEFAULT 'DONOR'`, where `user_role` is an `ENUM ('DONOR', 'COORDINATOR', 'STAFF', 'ADMIN')`.
   - `id` defaults to `gen_random_uuid()` and `created_at` defaults to `CURRENT_TIMESTAMP`.

3. **Frontend & Auth Flow (`client/my-app/app/register/page.tsx` & `client/my-app/context/AuthContext.tsx`)**:
   - The registration page and API client include extra fields that are no longer part of the `users` table.
   - The client form should align cleanly with the required fields: `full_name`, `email`, `password`, and `role`.

---

## 2. Proposed Changes

### Step 1: Database Connection Hardening (`server/src/config/db.js`)
- Configure `Pool` to automatically enable SSL with `{ rejectUnauthorized: false }` whenever `DATABASE_URL` is a remote host or includes `sslmode=require` / `neon.tech` / `render.com` / `supabase.com`.
- Increase `connectionTimeoutMillis` to `30000ms` (30 seconds) to accommodate serverless wake-up latency.
- Ensure `initializeDatabase()` accurately verifies connection and runs schema synchronization without errors.

### Step 2: Schema Migration Alignment (`server/src/db/schema.sql`)
- Ensure enum type `user_role` exists:
  ```sql
  DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('DONOR', 'COORDINATOR', 'STAFF', 'ADMIN');
  EXCEPTION
      WHEN duplicate_object THEN null;
  END $$;
  ```
- Ensure `users` table definition matches the user's exact specification:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role user_role NOT NULL DEFAULT 'DONOR',
      last_donation_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```

### Step 3: Data Store User Methods (`server/src/db/store.js`)
- Update `createUser`:
  - Insert only `(full_name, email, password_hash, role)` into `users`.
  - Allow PostgreSQL to generate `id` via `DEFAULT gen_random_uuid()` and `created_at` via `DEFAULT CURRENT_TIMESTAMP`.
  - Return `RETURNING id, full_name, email, role, last_donation_date, created_at`.
- Update `findUserByEmail`:
  - Query `SELECT id, full_name, email, password_hash, role, last_donation_date, created_at FROM users WHERE LOWER(email) = LOWER($1)`.
- Update `findUserById`:
  - Query `SELECT id, full_name, email, role, last_donation_date, created_at FROM users WHERE id = $1`.
- Update `updateUser`:
  - Allow updating `full_name` or `last_donation_date`.
- Update `getAllUsers`:
  - Query `SELECT id, full_name, email, role, last_donation_date, created_at FROM users ORDER BY created_at DESC`.

### Step 4: Auth Controller Update (`server/src/controllers/authController.js`)
- `register`:
  - Validate required fields: `full_name`, `email`, `password`.
  - Sanitize role to valid `user_role` values (`'DONOR'`, `'COORDINATOR'`, `'STAFF'`, `'ADMIN'`), defaulting to `'DONOR'`.
  - Check for existing user via `findUserByEmail`.
  - Hash password with `bcrypt.hash(password, 10)`.
  - Call `DataStore.createUser({ full_name, email, password_hash, role })`.
  - Issue JWT containing `{ id, email, role, full_name }`.
  - Return safe user without `password_hash`.
- `login`:
  - Validate email and password.
  - Verify password hash via `bcrypt.compare`.
  - Issue JWT token and return safe user record.
- `getMe`:
  - Fetch user by authenticated JWT id and return profile.

### Step 5: Frontend Form & API Alignment (`client/my-app`)
- In `client/my-app/app/register/page.tsx`:
  - Focus fields on: Full Name, Campus Email, Account Role, Password.
  - Cleanly submit `full_name`, `email`, `password`, `role`.
- In `client/my-app/lib/api.ts` and `client/my-app/context/AuthContext.tsx`:
  - Update `User` interface and `register` method payload to align with the core model.

---

## 3. Verification & Testing Plan
1. **Database Connectivity Test**:
   - Run health check endpoint `GET /api/health` to verify `database.connected: true`.
2. **Registration Integration Test**:
   - Send `POST /api/auth/register` with unique credentials.
   - Verify `201 Created` status code and JWT token return.
   - Query PostgreSQL database directly to confirm the user row exists in Neon's `users` table.
3. **Login Integration Test**:
   - Send `POST /api/auth/login` with newly registered credentials.
   - Verify `200 OK` and valid JWT token.
4. **Token Verification (`/api/auth/me`)**:
   - Send `GET /api/auth/me` with Bearer token header.
   - Verify user object matches DB record.
5. **Frontend Flow Check**:
   - Verify that registration and login UI forms complete cleanly without runtime errors.
