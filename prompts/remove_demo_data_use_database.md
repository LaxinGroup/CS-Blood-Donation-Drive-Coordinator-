# Implementation Prompt: Remove Demo Data — Database Only + Empty States

## Context & Objectives
The UI currently shows seeded in-memory demo drives/users/appointments (`memoryStore` + `seedMemoryStore`) when PostgreSQL is unreachable or when DB reads fall back on error. Live Neon currently has **0 rows** in users/drives/slots/appointments — so users should see real empty states (“No records” / role-appropriate empty copy), not fake campus drives.

Goal: serve **only** PostgreSQL data; never seed or silently fall back to demo data; show clear empty states when tables have no rows.

## Scope

### A. Server — `server/src/db/store.js`
1. **Delete** `seedMemoryStore()` and its entire demo dataset (users `*@campus.edu`, sample drives, slots, appointments `BDC-*`, donation records, notifications).
2. **Remove** the `seedMemoryStore()` call at module load.
3. Keep an empty `memoryStore` only if still needed as a structural stub, but:
   - When `isDbConnected()` is **true**: on query failure, **rethrow** (or return empty for list reads) — **never** assign `memoryStore.*` as fallback.
   - When `isDbConnected()` is **false**: list/read methods return `[]` / `null`; write methods throw a clear error (`Database unavailable`) — do **not** invent demo rows.
4. Apply this pattern across all DataStore methods that currently log `using fallback` and return `memoryStore` (drives, slots, appointments, queue, notifications, audit logs, donation records, etc.).

### B. Client — remove demo auth UX
1. **`AuthContext`**: remove `quickLoginAs` (and its `password123` / `*@campus.edu` accounts) from the context API.
2. **`login/page.tsx`**: remove “Instant 1-Click Demo Login” buttons and `handleDemoLogin`.
3. **`Navbar.tsx`**: remove “Demo Switch” / “Instant Demo Switch” role switcher (desktop + mobile).
4. **Role pages** (`donor`, `coordinator`, `staff`, `admin`, home `page.tsx`): remove auto `quickLoginAs(...)` on mount / booking start. Unauthenticated users should be redirected to `/login` (or prompted to sign in) instead of silent demo login.

### C. Client — empty states when DB has no records
Tighten empty copy so zero DB rows read as “no records”, not “search didn’t match”:

| Surface | Empty message |
|---------|----------------|
| Home drives list | If `drives.length === 0`: “No records” / “No blood drives scheduled yet.” If search filters an existing list to zero: keep search-specific copy. |
| Donor bookings / history | Keep/align with “No records” / no upcoming bookings / no completed donations. |
| Staff queue | “No records” / “No donors in the queue.” |
| Coordinator donor list / hourly | Already mostly empty — align wording to “No records” where appropriate. |
| Admin audit | Already empty — keep/align. |
| Notifications / slots | Keep existing empty states; ensure they aren’t fed by demo seed. |

Match existing glass-panel empty UI patterns; do not redesign pages.

## Out of Scope
- Seeding production/test users into Neon
- Changing booking transactional lock logic
- New migration framework
- Changing auth (JWT/bcrypt) beyond removing demo shortcuts

## Success Criteria
1. With empty Neon tables, home shows no fake drives — empty state only.
2. Demo login buttons and navbar demo role switch are gone.
3. Creating a real drive via coordinator (after real register/login) appears on home from the API/DB.
4. No `seedMemoryStore` / campus.edu demo users remain in `store.js`.
5. Restart API after changes so the process drops the old seeded memory.

## Test Steps (after implement)
1. Restart Express server.
2. Open home → expect empty drives message (DB has 0 drives).
3. Register a real user → login with email/password (no demo buttons).
4. As COORDINATOR, create a drive → home lists that drive only.
5. Confirm donor/staff/admin empty views say no records when applicable.
