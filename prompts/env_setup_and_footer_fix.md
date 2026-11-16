# Implementation Prompt: Environment Files (Neon + API URL) and Footer Name Fix

## Context & Objectives
1. The backend has no `server/.env`, so it falls back to `postgresql://postgres:postgres@localhost:5432/blood_drive_db`
   and a hard-coded JWT secret in `server/src/middleware/auth.js`. It must read the Neon connection string
   and a real JWT secret from `server/.env`.
2. The frontend reads `NEXT_PUBLIC_API_URL` (`client/my-app/lib/api.ts`, default `http://localhost:5000/api`). It needs
   an env file that names the backend explicitly.
3. Both projects need a committed `.env.example`. Today both `.gitignore` files ignore `.env*`, which also hides
   `.env.example` from git.
4. The landing footer's large "CS Blood Drive" name (`.close__word`, close-word in `footer.closing.footer--statement`)
   overlaps the tagline and link columns on short laptop screens (seen at 1280x720, touching at 1366x768), and
   never lines up with the right content edge (ends at 1128 of 1200 at 1280, 720 of 772 at 820). Cause: its size
   follows the viewport width only (`clamp(40px, 12.8vw, 184px)`), while the footer is locked to one screen's height.

## Variables actually read by the code
| Where | Variable | Read in |
|---|---|---|
| server | `DATABASE_URL` | `src/config/db.js` (Neon gets SSL automatically: `neon.tech` / `sslmode=require`) |
| server | `JWT_SECRET` | `src/middleware/auth.js` |
| server | `PORT` | `server.js` (default 5000) |
| server | `FRONTEND_URL`, `ALLOWED_ORIGINS` | `server.js`, `src/middleware/cors.js` (localhost, *.vercel.app, *.onrender.com already allowed) |
| server | `NODE_ENV` | `src/middleware/errorHandler.js` |
| client | `NEXT_PUBLIC_API_URL` | `lib/api.ts` (`/api` is appended when missing) |

## Scope

### A. Server env
1. `server/.env` (git-ignored, local only):
   - `DATABASE_URL=` left for the user to paste their Neon connection string (never guessed, never sent through chat).
   - `JWT_SECRET=` a freshly generated 64-byte random hex value.
   - `PORT=5000`, `NODE_ENV=development`, `FRONTEND_URL=http://localhost:3000`, `ALLOWED_ORIGINS=` (empty, comma list).
2. `server/.env.example` (committed): the same keys with placeholder values and one comment line each.
3. `server/.gitignore`: keep ignoring `.env*`, add `!.env.example`.

### B. Client env
1. `client/my-app/.env.local` (git-ignored): `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.
2. `client/my-app/.env.example` (committed): the same key with a comment showing the deployed form
   (`https://<your-backend>.onrender.com/api`).
3. `client/my-app/.gitignore`: add `!.env.example`.

### C. Footer name
1. `app/globals.css` only (page CSS, kit files untouched):
   - Size `.close__word` from the content column's width (container query units on `.closing__cta`), so the name
     runs from the left content edge to the right one at every width, with a small negative left margin for the
     "C"'s side bearing.
   - Cap the size by the screen height (`svh`) so the footer's three rows (head, name, links) fit one screen on
     short laptops without overlap.
2. Re-check with the skill: layout check at 1920x1080, 1536x864, 1440x900, 1366x768, 1280x720, 1024x768, 820x1180,
   768x1024, 390x844; footer screenshots at each; then `gate.mjs` must still read `GATE: PASS`.

## Out of Scope
- Writing the Neon URL for the user; changing `db.js`, `auth.js`, CORS logic or any server code.
- Setting Render/Vercel dashboard variables (listed in the report for the user to add).

## Notes
- A new `JWT_SECRET` invalidates tokens signed with the old hard-coded default: users sign in again once.
- On startup `db.js` runs `server/src/db/schema.sql` against the database it connects to.

## Success Criteria
1. `node server.js` logs "Connected to PostgreSQL database successfully" once the Neon URL is pasted.
2. `GET http://localhost:5000/api/drives` returns rows from Neon; the landing shows them.
3. `git status` shows both `.env.example` files as committable; `.env` and `.env.local` stay ignored.
4. Footer name sits on both content edges and overlaps nothing at every size listed; gate PASS; lint and build clean.

## Test Steps
1. Paste the Neon connection string into `server/.env` as `DATABASE_URL`.
2. `cd server && node server.js` and look for the connected line.
3. `cd client/my-app && npm run dev`, open `http://localhost:3000`, and check the drives list loads.
4. Resize the browser to a laptop size (1280x720) and scroll to the footer: the name should sit between the
   heading row and the links without touching either, edge to edge.
