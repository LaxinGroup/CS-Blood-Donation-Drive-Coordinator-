# Implementation Prompt: Migrate Login to Neon Auth (Auth URL + JWKS verification)

## Context & Objectives
Today Express owns identity: `/api/auth/register|login` hash passwords with bcryptjs and sign HS256 JWTs with
`JWT_SECRET`; the browser keeps the token in `localStorage`. The user has enabled **Neon Auth** (Managed Better
Auth) on the Neon project and wants it to be the login system, using the **Auth URL** and **JWKS URL**.

User decisions (2026-11-19):
1. **Switch fully to Neon Auth** and update AGENTS.md (§4 currently forbids anything but JWT + bcryptjs).
2. **Existing users link by verified email**: they sign up once in Neon Auth with the same email; after the email
   is verified, that Neon identity is linked to their existing `users` row (role, appointments, history kept).
3. **Use Neon's password reset** and remove the Brevo-based reset built on 2026-11-18.

Target architecture:
```
Browser ──(Better Auth calls)──► Next.js /api/auth/[...path] ──► Neon Auth (Auth URL)
Browser ──(Authorization: Bearer <Neon JWT>)──► Express ──verify via JWKS URL──► users row (role) ──► Postgres
```
- Neon Auth owns passwords, sessions, verification and reset emails. No password ever reaches Express.
- Express verifies the Neon JWT (EdDSA, 15-min expiry, `iss` = `aud` = Auth URL origin) with `jose`
  against the JWKS URL, then loads the app's `users` row for the **role**. Roles stay in our table (Neon
  JWTs carry no custom claims). Role authorization stays server-side, as AGENTS.md §7 requires.

## Email verification + reset: codes, not links
Neon's shared mailer (`auth@mail.myneon.app`) sends **codes** without extra setup; **links** need custom SMTP.
So both flows use 6-digit email codes (Better Auth Email OTP), which work immediately:
- Sign-up → code emailed → user enters it → verified.
- Forgot password → code emailed → user enters code + new password.
Production should later get custom SMTP in the Neon console (Brevo SMTP can supply it) for deliverability;
no code change needed for that.

## Scope

### A. Neon console (user, before testing)
1. Neon Auth → settings: turn on **Verify email at signup**, verification method **code (OTP)**, and enable
   **Email OTP**. Required: linking existing rows by email is only safe for verified emails.
2. Trusted domains: localhost is allowed by default; add the production Vercel origin before deploying.
3. Copy the **Auth URL** and **JWKS URL** (pasted into env files, see F).

### B. Database — `server/src/db/schema.sql` (idempotent)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
-- Remove the custom reset built 2026-11-18 (tokens are short-lived and disposable)
DROP TABLE IF EXISTS password_reset_tokens;
ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at;
```
- `auth_user_id` = Neon Auth user id (`sub`). Unique, nullable (walk-ins and not-yet-linked old users).
- No foreign key into `neon_auth."user"`: that schema is managed by Neon and an FK could block Neon's own
  writes/deletes. Uniqueness + JWT signature verification is the integrity guarantee. (Documented exception to §8.)
- `password_hash` is kept (old data, non-destructive) but no longer written or read.

### C. Express
- **`src/middleware/auth.js`** (rewrite):
  - `verifyNeonToken(token)`: `jose.jwtVerify` with `createRemoteJWKSet(NEON_AUTH_JWKS_URL)` (keys cached,
    refetched on unknown `kid`), `algorithms: ['EdDSA']`, `issuer` and `audience` = `new URL(NEON_AUTH_BASE_URL).origin`.
  - `requireIdentity`: Bearer token → verified claims on `req.identity` (`sub`, `email`, `name`,
    `emailVerified`). 401 on missing/invalid/expired. **403 if `emailVerified !== true`.**
  - `authenticate` = `requireIdentity` + load `users` row by `auth_user_id`. No row → 403
    `{ code: 'PROFILE_REQUIRED' }`. Sets `req.user` exactly as today (`id`, `email`, `full_name`, `role`,
    `blood_group`), so **every other route, controller and RBAC check is unchanged**.
  - `authorizeRole` unchanged.
- **`src/db/store.js`**:
  - `findUserByAuthId(authUserId)`.
  - `linkOrCreateUserForIdentity({ sub, email, name, requestedRole })` in **one transaction**:
    1. `SELECT ... FROM users WHERE auth_user_id = $sub` → return if found.
    2. `SELECT ... FROM users WHERE LOWER(email) = LOWER($email) FOR UPDATE`:
       - row with `auth_user_id IS NULL` → set it to `sub` (**link**; keeps the existing role).
       - row linked to a different `sub` → throw 409 (email already linked to another identity).
    3. no row → `INSERT` with `requestedRole` (DONOR/COORDINATOR/STAFF only; **ADMIN can no longer be
       self-assigned** — today's register endpoint accepts `role: 'ADMIN'`).
    - **Concurrency:** two first requests at once → the `FOR UPDATE` serializes the link; two inserts at once →
      the unique email / `auth_user_id` index makes one fail with `23505`, which is caught and resolved by
      re-reading the row. One identity never ends up with two rows.
  - `registerWalkIn`: stop creating a `walkin123` bcrypt password (a shared known password today); insert with
    `password_hash = NULL`. A walk-in who later signs up with that email links to the row via step 2.
  - Remove `createPasswordResetToken`, `resetPasswordWithToken`, `createUser`'s `password_hash` param,
    and the bcrypt import. Drop `password_hash`/`password_changed_at` from selects.
- **`src/controllers/authController.js`**: remove `register`, `login`, `logout`, `forgotPassword`,
  `resetPassword` and their helpers. Add `syncProfile` (`POST /api/auth/profile`, `requireIdentity` only):
  body `{ role? }`, calls `linkOrCreateUserForIdentity`, audits `USER_LINKED` or `USER_REGISTERED`, returns
  the safe user. Keep `getMe` / `updateMe`.
- **`src/routes/authRoutes.js`**: `POST /profile` (requireIdentity), `GET|PUT /me` (authenticate).
- **Delete** `src/services/mailer.js`, `src/middleware/rateLimit.js`.
- **`server.js`**: keep `trust proxy` (harmless, correct on Render).
- **Dependencies**: add `jose`; remove `bcryptjs`, `jsonwebtoken`, `express-rate-limit` (npm + pnpm lockfiles).
- **`server/.env.example`**: remove `JWT_SECRET`, `JWT_EXPIRES_IN`, `BREVO_*`, `MAIL_FROM_*`; add
  `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`.
- Check `src/middleware/cors.js` allows the `Authorization` header (it must already, since Bearer is used today).

### D. Next.js
- Install `@neon/auth` (pulls in a matching `better-auth`; nothing pinned by hand).
- `lib/auth/server.ts`: `createNeonAuth({ baseUrl: NEON_AUTH_BASE_URL, cookies: { secret: NEON_AUTH_COOKIE_SECRET } })`.
- `app/api/auth/[...path]/route.ts`: `export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();`
- `lib/auth/client.ts`: `createAuthClient()` from `@neon/auth/next` (same-origin proxy, no args).
- `proxy.ts` (Next 16 convention — confirm in `node_modules/next/dist/docs`): `auth.middleware({ loginUrl: '/login' })`
  matching `/donor`, `/coordinator`, `/staff`, `/admin`. Pages keep their own role checks; Express stays the
  real enforcement point.
- `lib/api.ts`: `request()` gets the Bearer token from `authClient.token()` instead of `localStorage`,
  cached in memory until ~60 s before `exp` (avoids a token round-trip per API call). Remove `login`,
  `register`, `forgotPassword`, `resetPassword`; add `syncProfile(role?)`.
- `context/AuthContext.tsx`: same public shape for pages (`user`, `isAuthenticated`, `isLoading`, `login`,
  `register`, `logout`, `refreshUser`), backed by Neon Auth:
  - `login` → `authClient.signIn.email` → `api.syncProfile()` → set user (handles first login of a linked
    old user).
  - `register` → `authClient.signUp.email` → returns "verification needed".
  - `verifyEmail(email, code)` → `authClient.emailOtp.verifyEmail` → sign in → `api.syncProfile(role)`.
  - `logout` → `authClient.signOut()`.
  - Drop `localStorage` token handling. (Removes the existing `set-state-in-effect` lint error there.)
- Pages (same design system: `app-card`, `field`, `notice--*`, loading/error/empty states):
  - **register**: on submit, show a **"Enter the 6-digit code we emailed you"** step, then route by role as today.
    Role select keeps DONOR/COORDINATOR/STAFF.
  - **login**: if Neon says the email is unverified, offer "Send a new code" → verify step.
    Old users see a one-time notice: *"Moved to the new sign-in: if you registered before
    [date], create your account again with the same email — your bookings carry over."*
  - **forgot-password**: email → `emailOtp.sendVerificationOtp({ type: 'forget-password' })` → go to
    `/reset-password?email=…`. Same generic message as now.
  - **reset-password**: email (prefilled) + code + new password + confirm → `emailOtp.resetPassword` →
    `/login?reset=1`.
- Exact SDK method names (`token`, `emailOtp.*`, error codes) are confirmed against the **installed**
  `@neon/auth` type definitions before use, not assumed.
- `client/my-app/.env.example`: add `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (server-only, **no**
  `NEXT_PUBLIC_` prefix).

### E. Docs
- **AGENTS.md**: §4 → "Neon Auth (Managed Better Auth) for identity; Express verifies Neon JWTs via JWKS
  (`jose`); roles live in `users`. Do not add a second password store." §6 → replace the two reset endpoints
  with `POST /api/auth/profile`; note login/register now go through Neon Auth. §7 unchanged in spirit.
- **README**: env vars for Render and Vercel; Neon console steps.
- `server/test_sprints.js` logs in with seeded passwords against `/auth/login`, which no longer exists. Its auth
  section is updated to read Neon JWTs from env vars (`TEST_DONOR_TOKEN` etc.) and skip with a clear message
  when they're absent. Full re-seeding of Neon Auth test users is **out of scope**.

### F. Env values (user pastes, I only add empty keys)
| File / host | Keys |
|---|---|
| `server/.env`, Render | `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` (remove `JWT_SECRET`, `JWT_EXPIRES_IN`, `BREVO_*`, `MAIL_FROM_*`) |
| `client/my-app/.env.local`, Vercel | `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (I'll generate the cookie secret locally if asked) |

## Out of scope
Social login (Google etc.), MFA, admin user management via Neon's admin plugin, custom SMTP setup,
moving roles into Neon Auth, removing the `password_hash` column, re-seeding test users.

## Risks
- **Every current user must create their account again once** (same email → data carries over).
- JWTs live 15 minutes; sign-out doesn't revoke an already-issued JWT before it expires (Neon limitation).
- If "Verify email at signup" is off in Neon, Express rejects all users with 403, deliberately (fails closed).

## Checks
- Client: `eslint --max-warnings=0`, `next build`.
- Server: syntax/load checks; offline harness: no token → 401, garbage token → 401, valid-shape token
  signed by a local Ed25519 key not in the JWKS → 401, `emailVerified: false` → 403 (using a local JWKS
  stub so no Neon call is needed).

## Test steps
1. Fill env values (F), restart API and `npm run dev`.
2. **New user:** /register → code step → enter code → lands on the donor portal. Refresh → still signed in.
3. **Old user:** /register with an email that exists in `users` → verify code → their old bookings and role appear.
4. Sign out → /donor redirects to /login.
5. Wrong password → error message; unverified account → "send a new code" path.
6. /forgot-password → code email → /reset-password → new password works, old one doesn't.
7. `curl http://localhost:5000/api/auth/me` with no token → 401; with a token for an unverified email → 403.
8. Coordinator, staff and admin pages still enforce roles (a donor gets 403 from their APIs).
