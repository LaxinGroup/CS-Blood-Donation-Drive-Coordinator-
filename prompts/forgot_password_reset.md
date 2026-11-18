# Implementation Prompt: Forgot Password / Password Reset (Brevo email + sign out other devices)

## Context & Objectives
Today a user who forgets their password is stuck: there's no recovery path. Auth is JWT (7-day expiry,
stored in `localStorage`) + bcryptjs, served by Express on Render, data in Neon Postgres, UI on Vercel.

The user wants:
- A "Forgot password?" entry point on **/login** and **/register**.
- The reset link delivered by email via **Brevo** (transactional email HTTPS API).
- After a successful reset, **every existing session on every device is signed out**.

## Platforms touched
| Platform | Change |
|---|---|
| Vercel (Next.js) | 2 new pages, links on login/register, 2 api client methods |
| Render (Express) | 2 new endpoints, rate limiter, mail module, JWT `iat` check in `authenticate` |
| Neon (Postgres) | New `password_reset_tokens` table + `users.password_changed_at` column (auto-applied by `schema.sql` on boot) |
| Brevo (new) | Account, verified sender, API key → Render env vars |

## Scope

### 1. Database — `server/src/db/schema.sql` (idempotent, runs on boot)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,          -- SHA-256 hex of the raw token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
```
- The raw token is **never stored**; only its SHA-256 hash. A DB leak cannot be replayed into a reset.
- `password_changed_at` is nullable: existing users are unaffected (null = no invalidation).

### 2. Data access — `server/src/db/store.js`
- `findUserById`: also select `password_changed_at` (not sensitive; needed by `authenticate`).
- `createPasswordResetToken({ user_id, token_hash, expires_at })`: in one transaction, delete that user's
  previous unused/expired tokens, then insert the new one. Only the newest link works.
- `resetPasswordWithToken({ token_hash, password_hash })` via `executeTransaction`:
  1. `SELECT ... FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE`
  2. Reject (return `null`) if missing, `used_at IS NOT NULL`, or `expires_at < NOW()`.
  3. `UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2`
  4. `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`
  5. Delete the user's other outstanding tokens.
  6. Return `{ user_id, email }`.
- **Concurrency:** two simultaneous submits of the same link both hit the `FOR UPDATE`; the second waits,
  then sees `used_at` set and is rejected. A token can only ever be consumed once.

### 3. Email — new `server/src/services/mailer.js`
- `sendPasswordResetEmail({ to, name, resetUrl })` → `POST https://api.brevo.com/v3/smtp/email` using
  Node 20's built-in `fetch` (no SDK dependency), header `api-key: BREVO_API_KEY`.
- Sender from `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME`. Plain HTML + text body: link, "expires in 30 minutes",
  "ignore this if you didn't ask".
- **Dev fallback:** if `BREVO_API_KEY` is unset and `NODE_ENV !== 'production'`, log the reset URL to the
  server console instead of sending. In production with no key, log an error (never the URL).
- HTTPS API, not SMTP — Render free instances block outbound SMTP ports.

### 4. Controller — `server/src/controllers/authController.js`
- `forgotPassword`: validate `email` is a non-empty string. Look up user. If found: generate
  `crypto.randomBytes(32).toString('hex')`, store its SHA-256 hash with `expires_at = now + 30 min`,
  build `${FRONTEND_URL}/reset-password?token=<raw>`, send email **without awaiting** (`.catch` logs),
  audit `PASSWORD_RESET_REQUESTED`.
  **Always** respond `200 { success: true, message: 'If an account exists for that email, a reset link has been sent.' }`
  — same body and similar timing whether the account exists or not (no account enumeration).
- `resetPassword`: validate `token` (64 hex chars) and `password` (min 6, same rule as register).
  Hash password with bcryptjs (cost 10), hash token, call `resetPasswordWithToken`.
  Invalid/expired/used → `400 'This reset link is invalid or has expired. Request a new one.'`.
  Success → audit `PASSWORD_RESET_COMPLETED`, `200 'Password updated. Please sign in.'`. No token issued;
  the user signs in fresh.
- Small helper functions (`hashToken`, `buildResetUrl`) — keep each handler short.

### 5. Sign out other devices — `server/src/middleware/auth.js`
- After loading the user, if `user.password_changed_at` is set and
  `decoded.iat < Math.floor(password_changed_at.getTime() / 1000)` → `401 'Your password was changed. Please sign in again.'`.
- Every JWT issued before the reset is rejected on its next request. Client already clears the stored token
  when `/auth/me` fails on load (`AuthContext`), so other devices land signed out.
- Edge: a token issued in the **same second** as the reset stays valid (JWT `iat` is whole seconds). Accepted —
  not exploitable in practice.

### 6. Routes + rate limiting
- `server/src/routes/authRoutes.js`: `POST /forgot-password`, `POST /reset-password` (public).
- Add dependency `express-rate-limit`. New `server/src/middleware/rateLimit.js` exporting
  `passwordResetLimiter`: 5 requests / 15 min per IP, JSON `429` message. Applied to these two routes only
  (rate limiting for login/register is a separate hardening task — not pulled forward here).
- `server.js`: `app.set('trust proxy', 1)` so the limiter sees the real client IP behind Render's proxy.

### 7. Env — `server/.env.example` (+ README deploy section)
```
BREVO_API_KEY=
MAIL_FROM_EMAIL=your-verified-sender@example.com
MAIL_FROM_NAME=CS Blood Donation Drive
```
`FRONTEND_URL` (already present) becomes the reset-link base — must be the Vercel URL in production.
No client env changes.

### 8. Frontend (Next.js)
- `lib/api.ts`: `forgotPassword(email)` and `resetPassword({ token, password })`, typed responses.
- `app/(app)/login/page.tsx`: "Forgot password?" link (`/forgot-password`) right under the password field.
- `app/(app)/register/page.tsx`: footer becomes "Already registered? Sign in · Forgot your password?".
- New `app/(app)/forgot-password/page.tsx`: email field → submit → swaps form for a success notice with the
  generic message. Loading (spinner button), error (`notice--bad`), success (`notice--good` or existing
  equivalent) states. Same `app-card` / `field` / `btn` classes as login.
- New `app/(app)/reset-password/page.tsx`: reads `token` via `useSearchParams` (wrapped in `<Suspense>` as
  Next 16 requires). No token → empty state with link to `/forgot-password`. Two `PasswordInput`s
  (new + confirm, `autoComplete="new-password"`, `minLength={6}`), client-side match check, submit →
  on success clear any local `token` from `localStorage` and `router.push('/login?reset=1')`.
- Login page shows a success notice when `?reset=1` is present.
- Explicit types, no `any`, ESLint zero warnings.

## Out of scope
- Changing password while logged in (profile page), email verification on register, login/register rate
  limiting, Helmet, refresh tokens / moving JWT to cookies.

## Brevo setup (user, one-time)
1. Sign up at brevo.com (free tier).
2. Senders, Domains & Dedicated IPs → **Senders** → add and verify the email you'll send from.
3. SMTP & API → **API Keys** → generate a key.
4. Local: put `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` in `server/.env`.
   Render: add the same three in the service's Environment tab and redeploy.
   (Note: Brevo may require account activation review before the first sends go out.)

## Checks
- `cd client/my-app && npm run lint` and `npx tsc --noEmit` — zero warnings.
- `node -e "require('./server/server.js')"` style boot check: schema applies cleanly on Neon.
- Manual flow below.

## Test steps
1. Start API + client. Log in on two browsers (A and B) as the same user.
2. In A, sign out → /login → "Forgot password?" → enter the email → generic success message.
3. Enter an unregistered email → identical message, no email, no error.
4. Open the link from the inbox (or the server console in dev without a key).
5. Mismatched passwords → inline error. Valid new password → redirected to /login with success notice.
6. Sign in with the new password → works; old password → 401.
7. Refresh browser B → signed out ("Your password was changed…").
8. Reopen the same reset link → "invalid or has expired".
9. Request two links, use the first → rejected (only the newest works).
10. Hit forgot-password 6 times in a row → 6th returns 429.
