# CS Blood Donation Drive Coordinator

> **A modern, full-stack platform that digitizes campus blood donation drives: replacing manual paper sign-up sheets with real-time transactional slot scheduling, digital pre-donation eligibility screening, on-site check-in/queue desk, and live organizer turnout analytics.**

---

## 🚀 Key Features by User Role

### 🩸 Donor Self-Service Portal (`/donor`)
- **Interactive Pre-Screening Questionnaire:** Evaluates age, weight (>=50kg), wellness, travel history, and calculates the **56-day clinical donation cooldown interval** dynamically.
- **Transactional Slot Picker:** Choose exact 30-minute intervals with live capacity indicators, protected by PostgreSQL `SELECT FOR UPDATE` row locks to prevent double-booking.
- **Personal Dashboard:** View active bookings, cancel/reschedule with automatic atomic slot capacity release, and download **ICS calendar invites**.
- **Donation History & Cooldown Tracker:** Badges for blood group, units donated, and countdown to next eligible donation date.

### 📊 Drive Coordinator & Organizer Portal (`/coordinator`)
- **Dynamic Slot Generator:** Slices drive window (e.g. 09:00 - 15:00) into discrete intervals with concurrent bed capacities and instant slot previews.
- **Real-Time Turnout Analytics:** Live gauge for Target vs. Actual Units Collected, Turnout Rate %, Deferral reason breakdowns, and Blood Group distribution (O+, O-, A+, etc.).
- **Official Reporting:** One-click CSV export and printable formatted PDF turnout reports for health compliance.
- **Emergency Shortage Broadcast:** Push urgent broadcast alerts to registered campus donors matching specific blood groups.

### 🩺 Medical Staff On-Site Live Desk (`/staff`)
- **Live Attendance Queue:** Status filters (`BOOKED`, `CHECKED_IN`, `IN_CHAIR`, `COMPLETED`, `DEFERRED`).
- **Instant Search:** Find donors by Name, Email, or Booking Reference Code (`BDC-XXXXXX`).
- **One-Click Check-In:** Timestamps arrival and moves donor into the active waiting queue.
- **Rapid Walk-In Intake:** Register and check in unscheduled walk-in donors into open capacity slots.
- **Phlebotomy Outcome Logging:** Record units collected, verified blood type, or clinical deferral reasons (automatically updates the donor's `last_donation_date`).

### 🛡️ System Administration & Audit (`/admin`)
- **Role-Based Access Control (RBAC):** Manage user roles (`DONOR`, `COORDINATOR`, `STAFF`, `ADMIN`).
- **Security Audit Logs:** Immutable trail of system actions, user actors, and timestamps.

---

## 🛠️ Technology Stack & Architecture

- **Frontend (`client/my-app`):** Next.js 16.3+ (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React Icons.
- **Auth:** Neon Auth (Managed Better Auth) via `@neon/auth` in Next.js; Express verifies Neon JWTs against the JWKS URL with `jose`. Roles live in the app's `users` table.
- **Backend (`server/`):** Node.js, Express.js 5.x.
- **Database:** PostgreSQL (`pg` pool) with ACID transactional row locking (`SELECT FOR UPDATE`) and fallback in-memory store for standalone dev.
- **Security & CORS:** Dynamic CORS matching Vercel (`*.vercel.app`), Render (`*.onrender.com`), and Localhost (`localhost:3000`, `localhost:3001`), Helmet headers, rate limiting.

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blood_drive_db
NEON_AUTH_BASE_URL=https://ep-xxxx.neonauth.REGION.aws.neon.tech/neondb/auth
NEON_AUTH_JWKS_URL=https://ep-xxxx.neonauth.REGION.aws.neon.tech/neondb/auth/.well-known/jwks.json
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://blood-donation-coordinator.vercel.app
```

### Frontend (`client/my-app/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Server-only (never NEXT_PUBLIC_)
NEON_AUTH_BASE_URL=https://ep-xxxx.neonauth.REGION.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=<32+ random characters>
```

### Neon console (one-time)
1. Auth → enable **Verify email at signup** with the **code** method, and enable **Email OTP**.
2. Auth → Domains: add the production Vercel origin (localhost is allowed by default).
3. Production: configure custom SMTP under Auth email settings (the shared Neon mailer is for development).

---

## 🧪 Testing & Verification

### 1. Run Automated Backend Integration Test Suite (Sprints 1–10)
```bash
cd server
node test_sprints.js
```
*Set `TEST_DONOR_TOKEN`, `TEST_DONOR2_TOKEN`, `TEST_COORDINATOR_TOKEN` and `TEST_STAFF_TOKEN` (Neon Auth JWTs for verified users with those roles) to run the full suite; without them only health, CORS and token-rejection checks run. Validates health check, CORS origin headers (Vercel & Render), Neon JWT verification & RBAC guards, dynamic slot math, parallel concurrency race condition handling (409 Conflict), pre-screening cooldowns, staff check-in/outcome logs, turnout analytics, and emergency broadcasts.*

### 2. Run Next.js Frontend
```bash
cd client/my-app
npm run dev
```

### 3. Accounts
Sign up at `/register` and verify the emailed code. Accounts created before the move to Neon Auth are linked automatically when someone registers again with the same email. An ADMIN role can only be granted by an existing admin.

---

## 🌐 Production Deployment Guide

### Deploy Backend to Render
1. Connect repository and set root directory to `server`.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Environment variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, `FRONTEND_URL` (set to your Vercel frontend URL).

### Deploy Frontend to Vercel
1. Connect repository and set root directory to `client/my-app`.
2. Framework: Next.js.
3. Set the Vercel environment variable `NEXT_PUBLIC_API_URL` to the Render backend origin (for example, `https://your-api.onrender.com`) or API base URL (for example, `https://your-api.onrender.com/api`). The frontend normalizes either value to a single `/api` suffix. Also set `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (not `NEXT_PUBLIC_`).
4. After redeploying, verify the backend health endpoint at `https://your-api.onrender.com/api/health`.
