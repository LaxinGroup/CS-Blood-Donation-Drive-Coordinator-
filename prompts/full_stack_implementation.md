# Full-Stack Implementation Prompt: Campus Blood Donation Drive Coordinator

**Target Repository:** `CS-Blood-Donation-Drive-Coordinator-`  
**Frontend Path:** `client/my-app` (Next.js 16.3+, React 19, TypeScript, Tailwind CSS v4, Lucide React)  
**Backend Path:** `server` (Node.js, Express.js 5.x, PostgreSQL `pg` pool, JWT, bcryptjs)  
**Architecture Standard:** Project Contract & AGENTS.md

---

## 1. Overview & Objective
Build and deploy the complete, production-ready full-stack **CS Blood Donation Drive Coordinator** platform spanning all 10 Sprints across 5 Phases defined in [PROJECT_CONTRACT.md](file:///c:/Users/4IR%20Research%20Lab/Desktop/CS-Blood-Donation-Drive-Coordinator-/PROJECT_CONTRACT.md).

The platform replaces manual campus paper sign-up sheets with:
1. **Donor Portal:** Pre-donation eligibility questionnaire, interactive slot booking with concurrency protection (`SELECT FOR UPDATE`), donation history tracking, and 56-day next-eligibility countdown.
2. **Coordinator Portal:** Drive management, dynamic automated slot generation, live turnout analytics dashboard, emergency blood shortage broadcasts, and CSV/PDF report generation.
3. **Medical Staff Live Console:** Real-time on-site check-in desk, rapid walk-in donor intake, and phlebotomy completion/deferral logging.
4. **Admin Dashboard:** Platform user management, audit logs, and system-wide metrics.
5. **Security & Deployment:** Strict CORS policy allowing dynamic Vercel frontend domains (`https://*.vercel.app` & custom origins) and Render backend environments (`https://*.onrender.com`), Helmet security headers, Express rate-limiting, and JWT authentication with role-based access control.

---

## 2. Phased Sprint Breakdown

### Phase 1: Foundation, Architecture & Database Design
- **Sprint 1: Database Schema & Migration Setup**
  - Configure PostgreSQL `pg.Pool` with automatic schema initialization and fallback/mock safety if DB is unavailable.
  - Create tables: `users`, `drives`, `slots`, `appointments`, `donation_records`, `notifications`, `audit_logs`.
  - Add database indexing on `appointments(slot_id, user_id)`, `drives(organizer_id, drive_date)`, `slots(drive_id)`.
  - Provide seed data script for initial coordinator, staff, donor accounts, and upcoming sample campus drives.
- **Sprint 2: Authentication & RBAC Engine**
  - Backend `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.
  - Password hashing with `bcryptjs` (salt rounds = 10) and JWT token signing.
  - Role authorization middleware: `authorize(['DONOR', 'COORDINATOR', 'STAFF', 'ADMIN'])`.
  - Next.js Auth Context, Login/Register pages with sleek UI, role switching demo tabs, and client-side Zod validation.

### Phase 2: Core Scheduling Engine & Concurrency
- **Sprint 3: Drive Creation & Dynamic Slot Generator**
  - Coordinator drive management endpoints (`POST /api/drives`, `GET /api/drives`, `PUT /api/drives/:id`, `DELETE /api/drives/:id`).
  - **Dynamic Slot Generation Engine:** Slices drive window (e.g. 09:00 - 15:00) into discrete intervals (e.g. 15, 30, or 60 min) with allocated concurrent donor capacity per slot.
  - Interactive Drive Creation modal with instant slot preview and capacity calculator.
- **Sprint 4: Concurrency-Safe Donor Booking**
  - `POST /api/appointments` with transactional PostgreSQL row locking (`SELECT ... FOR UPDATE` on the slot row) to guarantee zero double-booking under high concurrent load.
  - Return `409 Conflict` when a slot is exhausted mid-flight.
  - Downloadable ICS calendar invite generator and unique booking reference code (e.g., `BDC-XXXXXX`).
  - Cancel & reschedule endpoints with automated atomic capacity release.

### Phase 3: Operations & Day-of-Drive
- **Sprint 5: Eligibility Pre-Screening & Donor History Portal**
  - Multi-step pre-screening questionnaire (age, weight >= 50kg, 56-day donation interval cooldown, medication/wellness check).
  - Storage of clearance status and encrypted/sanitized answers in appointment records.
  - Donor Dashboard: upcoming bookings, past donation badges, blood type card, and cooldown countdown timer.
- **Sprint 6: Medical Staff Live Check-In Console**
  - Dedicated console for drive day (`/staff/drive/:id/checkin`).
  - Real-time search by Donor Name, Email, or Booking Reference.
  - One-click Check-In, In-Chair, Completed (recording units collected), or Deferred (logging medical reason).
  - Walk-in donor rapid registration modal into open slots.

### Phase 4: Analytics, Export & Reminders
- **Sprint 7: Turnout Analytics & CSV/PDF Export**
  - Visual charts for Target vs. Actual Units collected, turnout rate %, deferral reasons, blood group distribution (O+, A+, B+, AB+, etc.), and peak arrival hours.
  - One-click CSV export and printable formatted PDF turnout summary report.
- **Sprint 8: Notifications & Reminders**
  - In-app notification center with real-time unread badges.
  - Coordinator broadcast alert modal for urgent blood shortage drives.
  - Automated appointment reminder pipeline.

### Phase 5: Hardening, CORS & Deployment
- **Sprint 9: Security Hardening & Integration Testing**
  - CORS policy configured for `localhost:3000`, `localhost:3001`, `*.vercel.app`, and `*.onrender.com` plus environment variable overrides.
  - Helmet headers, rate limiting on `/api/auth/*`.
  - Comprehensive automated integration tests covering the full booking lifecycle and concurrency guarantees.
- **Sprint 10: Production Readiness & Documentation**
  - Clean TypeScript build in `client/my-app`.
  - Complete `.env.example` templates for both server and client.
  - Full API documentation and verification test steps.

---

## 3. Technology & Aesthetic Standards
- **Design:** Modern medical-tech aesthetic with Tailwind CSS v4, Lucide icons, glassmorphic cards, crimson & slate harmonious color palette, dark/light theme awareness, responsive layouts, micro-animations, loading skeletons, and interactive state feedback.
- **Code Quality:** Modular Node/Express architecture (`controllers/`, `routes/`, `middleware/`, `models/`, `db/`), TypeScript typed components and API clients in Next.js App Router.

---

## 4. Verification & Testing Plan
1. Test database connection, migration scripts, and seed fixtures.
2. Test auth registration, login, JWT issuance, and RBAC route protection.
3. Test dynamic slot generator math.
4. Test concurrent booking race condition (simulating parallel requests on the final slot).
5. Test pre-screening validation logic and 56-day cooldown computation.
6. Test medical staff check-in, walk-in registration, and completion tally.
7. Test analytics data aggregation and CSV/PDF export.
8. Validate CORS configuration with Vercel and Render headers.
