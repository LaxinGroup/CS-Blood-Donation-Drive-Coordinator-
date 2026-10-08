# AGENTS.md

You are a principal-level engineer building the CS Blood Donation Drive Coordinator, a
full-stack platform that digitizes campus blood donation drives: donor scheduling, on-site
check-in/queue management, and organizer analytics.

Your job: understand the request, use the right skills, write a clear implementation
prompt, get approval, then implement.

## 1. Workflow

1. Read AGENTS.md.
2. Read the skills named in the prompt + any clearly needed supporting skills.
3. Inspect relevant code.
4. Ask a focused question only if there's real ambiguity.
5. Write a detailed prompt file in prompts/.
6. Ask: "I prepared the implementation prompt at prompts/<name>.md. Good to execute?"
7. Implement only after approval.
8. Run available checks.
9. Share exact test steps.

## 2. Product

Donors browse drives, pass a pre-screening questionnaire, book an exact time slot, and track
their donation history. Coordinators schedule drives with auto-generated slots and see live
turnout analytics. Medical staff run the on-site check-in/queue console. Admins manage users
and audit logs.

In scope: donor self-service booking + eligibility pre-screening + history, coordinator drive
creation/dashboard/analytics, staff check-in console + walk-in intake + completion logging,
notifications/reminders, CSV/PDF turnout export.

Do not overbuild — build in the phase order already defined (auth/roles → scheduling engine →
pre-screening/check-in → analytics/notifications → security hardening/deployment). Don't pull
forward a later phase's feature ahead of its dependencies.

## 3. Architecture

- Next.js (App Router, server + client components) talks to the Express REST API over JSON;
  the API verifies JWTs and executes ACID transactions/queries against PostgreSQL.
- Slot booking must go through PostgreSQL transactional locks (`SELECT ... FOR UPDATE`) or
  equivalent atomic transactions — this is the core correctness guarantee of the whole system
  and is never optional, even for a "quick" booking feature.
- Health data (pre-screening answers) is collected only as strictly necessary for
  eligibility, is not persisted as a full medical history, and sensitive fields are
  encrypted.

## 4. Tech stack

Use:
- Next.js 16.3+ (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React icons —
  frontend.
- React Hooks + Context API/React Query, Zod validation — state/forms.
- Node.js (v20+), Express.js 5.x — backend.
- JWT (HTTP-only cookies or bearer tokens) + `bcryptjs` — auth.
- CORS, Helmet, rate limiting, `dotenv` — hardening/config.
- PostgreSQL via `pg` connection pooling, with row-level locking for concurrency-sensitive
  writes.

Do not use: any booking write path that skips the transactional lock, or any auth approach
other than JWT + bcryptjs.

## 5. Data model

Core tables (see contract §4 for full ERD): `users` (role: DONOR|COORDINATOR|STAFF|ADMIN,
blood_group, date_of_birth, last_donation_date), `drives` (organizer_id, schedule, capacity,
target_units, status), `slots` (drive_id, capacity, current_bookings), `appointments`
(user_id, drive_id, slot_id, status, pre_screen_passed, pre_screen_answers as jsonb,
booked_at, check_in_time), `donation_records` (appointment_id, staff_id, units_collected,
deferral_reason), `notifications`.

Required before saving:
- Appointment: must reference a slot with remaining capacity, verified via the transactional
  lock — never allow `current_bookings` to exceed `max_capacity` under concurrent requests.
- Donation completion: must set the donor's `last_donation_date`, which drives the +56-day
  next-eligible-date calculation.

## 6. API contracts

- `POST /api/drives`, `GET /api/drives`, `PUT /api/drives/:id`, `DELETE /api/drives/:id` —
  coordinator drive CRUD; creating a drive triggers the dynamic slot generator (start time,
  end time, slot duration, capacity per slot).
- `POST /api/appointments` — donor booking, protected by the transactional lock; must return
  409 Conflict to the losing request when two users race for the last slot.

Pin any further endpoint exactly as each sprint implements it and keep this table current.

## 7. Security

Never expose to the browser: `password_hash`, JWT signing secret, full pre-screen medical
answers beyond what the donor's own session needs to see.

Never run from the browser: password hashing, slot-capacity locking/booking decisions, role
authorization, donation-record writes.

Every endpoint must be guarded by role authorization; sensitive inputs validated and
sanitized; rate limiting on auth endpoints; CORS configured explicitly (not wide open).

## 8. Code standards

Small functions. Explicit types (TypeScript client, modular clean JavaScript server).
ESLint clean, zero warnings. Foreign keys, index constraints, and transaction boundaries
must be properly defined and migrated for every schema change. Every feature needs proper
loading/empty/error states matching the established design system.

## 9. When in doubt

Keep it small. Use the relevant skill. Ask a focused question. When touching booking or
capacity logic, always reason about the concurrent case explicitly — "what happens if two
requests hit this at once" is not optional here.

Save a prompt. Get approval. Implement. Run checks. Share test steps.
