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
- **Backend (`server/`):** Node.js, Express.js 5.x, JWT Authentication, `bcryptjs` password hashing.
- **Database:** PostgreSQL (`pg` pool) with ACID transactional row locking (`SELECT FOR UPDATE`) and fallback in-memory store for standalone dev.
- **Security & CORS:** Dynamic CORS matching Vercel (`*.vercel.app`), Render (`*.onrender.com`), and Localhost (`localhost:3000`, `localhost:3001`), Helmet headers, rate limiting.

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blood_drive_db
JWT_SECRET=super_secret_blood_donation_coordinator_jwt_key_2026!
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://blood-donation-coordinator.vercel.app
```

### Frontend (`client/my-app/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing & Verification

### 1. Run Automated Backend Integration Test Suite (Sprints 1–10)
```bash
cd server
node test_sprints.js
```
*Validates health check, CORS origin headers (Vercel & Render), JWT auth & RBAC guards, dynamic slot math, parallel concurrency race condition handling (409 Conflict), pre-screening cooldowns, staff check-in/outcome logs, turnout analytics, and emergency broadcasts.*

### 2. Run Next.js Frontend
```bash
cd client/my-app
npm run dev
```

### 3. Quick Demo Login Switcher
The navigation bar includes an **Instant Demo Switcher** with pre-configured accounts:
- **Donor:** `donor@campus.edu` / `password123`
- **Coordinator:** `coordinator@campus.edu` / `password123`
- **Medical Staff:** `staff@campus.edu` / `password123`
- **System Admin:** `admin@campus.edu` / `password123`

---

## 🌐 Production Deployment Guide

### Deploy Backend to Render
1. Connect repository and set root directory to `server`.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (set to your Vercel frontend URL).

### Deploy Frontend to Vercel
1. Connect repository and set root directory to `client/my-app`.
2. Framework: Next.js.
3. Environment variables: `NEXT_PUBLIC_API_URL` (set to your Render backend API e.g. `https://your-api.onrender.com/api`).
