# Implementation Prompt: Frontend Redesign with `design-taste-frontend` (tasteskill 2.5)

## Context & Objectives
The client (`client/my-app`, Next.js 16 App Router, React 19, Tailwind v4, Lucide) currently uses an
ad-hoc dark "glassmorphism" look (crimson radial glows, gradient text, `glass-panel` / `glass-card`,
`btn-primary` with glow, Sparkles badges). It reads as templated/"AI-made".

Goal: redesign the frontend using the project's installed skill
`.agents/skills/design-taste-frontend` (symlinked at `.claude/skills/design-taste-frontend`).

Decisions confirmed by the user:
| Question | Decision |
|---|---|
| Scope | **Landing page `/` rebuilt to the skill's full rules**; every other page (login, register, donor, coordinator, staff, admin) + all modals + Navbar/Footer **restyled to the same system** (palette, type, buttons, cards, inputs, motion layer) while keeping their tool layouts usable — no "one section per screen" rule on dashboards. |
| Site kind | **software** (`data-type="software"`, `site-kind=software`, `--page software`). Lead with the platform's own UI (slot picker, check-in queue) as live HTML in one `app-frame`. One effect allowed. |
| Checks | Gate/checker run against the **local dev server** `http://localhost:3000/`. **No** `output: 'export'`, `next.config.ts` and deployment untouched. |
| Photos | **Licensed stand-in photographs** via `scripts/photos.mjs search` (blood donation, campus, volunteers), saved to `public/assets/photos`, credited in **one footer line**, listed in the report for the client to replace. |

## Hard constraints (AGENTS.md — not negotiable)
- **Frontend-only.** No change to `server/`, `lib/api.ts` request/response contracts, `AuthContext` logic,
  booking flow order (PreScreen → SlotPicker → BookingConfirmation), or any role guard / redirect.
- Booking decisions, capacity, role checks stay on the server; the UI only displays results.
  The 409 "slot just filled" path must still surface clearly in the redesigned SlotPicker.
- Every data surface keeps proper **loading / empty / error states** (restyled, not removed).
- Pre-screen answers are not displayed anywhere new.
- TypeScript explicit types, small components, `npm run lint` clean with **zero warnings**, `next build` passes.
- Stack stays: Tailwind v4 + Lucide + the kit's plain CSS/JS. No new UI framework. Fonts via
  `next/font` (or the pairing's Google Fonts link) — whatever the dealt pairing prints.
- No violet/lavender anywhere (skill rule). Blood-red may only appear if the dealt palette yields it or
  is justified on plan line 2 via `start.mjs brand` (the client's existing crimson identity) — decide at
  the deal and record why.

## Skill run (follows SKILL.md §4 exactly)

### 0. Stack setup
1. Copy `<skill>/assets` → `client/my-app/public/assets` (kit loaded as plain files: `system.css`,
   `system.js`, motion layer, chosen ui/diagrams/moment/effect, icons).
2. Load `system.css` + `system.js` (+ motion) from `app/layout.tsx` (`<link>` / `next/script`
   `strategy="afterInteractive"`). Map the dealt `:root` tokens into `globals.css` under Tailwind v4
   `@theme` so Tailwind utilities (`bg-*`, `text-*`, `rounded-*`) use the same tokens on app pages.
3. Remove the old glass/glow classes from `globals.css` once no component uses them.

### 1. Read the brief + arm the gate (before any page change)
- kind: software · what is sold: "campus blood donation drive scheduling" · buyer: students/staff
  donors and drive coordinators · main action: **"Book a donation slot"** (secondary: "Sign in").
- Real material: the product UI itself, live stats from `getSystemOverview()` (donors, units, drives).
- `node <skill>/scripts/gate.mjs --start http://localhost:3000/ --kind software --category "campus blood donation drive scheduling" --primary "Book a donation slot"`

### 2. Copy first
Read `copy.md`, `copy-voice.md`, `copy-registers.md`, `copy-moves.md`, `system.md`, `layout-v4.md`,
`sections.md` in full. Write fact sheet + voice card, then all landing copy in a draft `.md`, lint
with `copy-lint.mjs --kind software`. h1 names the category and the buyer; one hard fact on screen 1
(e.g. 56-day eligibility rule or live drive count — only real facts, nothing invented); a noun in every
heading; buttons verb + object. 60–80 words per screen outside UI mocks. Remove existing slop
("Frictionless Experience", "Sparkles" badge, "Estimated Lives Saved" unless backed by a real figure).

### 3. Plan the landing as screens (written into the top-of-`<body>` comment and the report)
Proposed outline (final ids/recipes come from `sections.md` / `sections-library.md` and the deal):
1. `hero` — dealt hero; h1 + fact + "Book a donation slot"; picture: the live slot-picker UI in an
   `app-frame` (real component markup, sample state). Enters once (`data-enter`). 1 screen.
2. `drives` — upcoming drives from the API (search + list cards, booking entry point; loading/empty/
   error states). 1–2 screens.
3. `how-it-works` — pre-screen → exact slot → check-in → history; diagram card (one input, processor,
   lanes) or UI fragments. 1 screen. Candidate moment section.
4. `for-teams` — coordinator analytics + staff check-in console fragments (real UI, not a generic
   dashboard). 1 screen.
5. `donors` — stand-in photographs of donors/volunteers + eligibility facts (56-day rule). 1 screen.
6. dealt close + dealt footer (with the one credits line).

### 4. Deal (never by taste), from `client/my-app`
```
node <skill>/assets/layout/deal.mjs --type software --has photo,ui --history .taste-skill/layout-history.json
node <skill>/scripts/start.mjs deal --page software --trade "health scheduling platform" --history .taste-skill/history.json
node <skill>/scripts/start.mjs css --page software --palette <first> --type <first> --radius soft --history .taste-skill/history.json
node <skill>/scripts/moments.mjs pick --page software --count 1 --fits section,statement --photo --history .taste-skill/history.json
nav / footer / close / rhythm / buttons / mark via the software one-liner lists in SKILL.md
```
Take the first palette/pairing printed (unless it fails `hero-lines`). Ground + the one effect per
`effects-usage.md` / `backgrounds.md`. Record every result on plan line 2.

### 5. Build
- `app/page.tsx` split into small components under `components/landing/` (Hero, DrivesSection,
  HowItWorks, ForTeams, Donors, Close). Markup/classes from `starter.html`, the dealt
  `hero-<id>.html` (hero section only), the moment from `assets/moments/_demo/in-page.html`.
  `<html>` attributes (`lang data-type data-radius data-buttons data-motion data-ground`) and metas
  (`page-type`, `site-kind`, title/description/og/theme-color) set in `app/layout.tsx` via `metadata`.
- Effects/moments mounted exactly as their reference says, inside a client component.
- Icons: `icons.mjs scan … --out public/assets/icons --colour` last.
- `share.jpg` from `shoot.mjs` → `public/share.jpg`.
- **App pages restyle** (login, register, donor, coordinator, staff, admin) + modals (PreScreen,
  SlotPicker, BookingConfirmation, CreateDrive, Broadcast, Notification, Phlebotomy, WalkIn) +
  Navbar (dealt nav style, role links preserved) + Footer: same tokens, one button pair, one card
  style, one radius scale, one input style, visible labels, focus rings, 44px tap targets, hover
  layer (lift 2px, button step/press). Charts in coordinator analytics follow the `dataviz` skill
  palette rules if restyled. Logic untouched — className/markup changes only.

### 6. Check (sequential, foreground, 10-min timeout, `--profile .taste-skill/chrome-check`)
With `npm run dev` running on :3000 (and API reachable or empty-state tolerated):
```
node <skill>/scripts/copy-lint.mjs <draft or page> --kind software
node <skill>/scripts/consistency.mjs http://localhost:3000/ --widths 1440,1024,820,768,390 --rhythm-widths 1440,820,768,390 --profile .taste-skill/chrome-check --page software --category "campus blood donation drive scheduling" --primary "Book a donation slot"
node <skill>/assets/layout/check.mjs --url http://localhost:3000/ --profile .taste-skill/chrome-check --sizes 1440x900,1024x768,820x1180,768x1024,390x844 --shots shots/layout
node <skill>/scripts/shoot.mjs --url http://localhost:3000/ --w 1440 --out shots/1440.png --profile .taste-skill/chrome-check   (+1024, 820, 768, 390)
node <skill>/scripts/perf.mjs http://localhost:3000/ --profile .taste-skill/chrome-check
node <skill>/scripts/gate.mjs http://localhost:3000/
```
Max 3 gate rounds; false FAILs waived in `.taste-skill/waivers.json` with a reason. Also screenshot
`/login`, `/donor`, `/coordinator`, `/staff`, `/admin` at 1440 and 390 for a visual review.
Then `npm run lint` (0 warnings) and `npm run build`.
Add `.taste-skill/chrome-*` and `shots/` to `.gitignore`.

## Out of Scope
- Server/API/DB changes, new endpoints, auth changes, new features or pages.
- Static export / deployment config changes.
- Pulling forward later-phase features (e.g. new PDF export UI) — only restyle what exists.

## Success Criteria
1. `GATE: PASS` (or `GATE: OPEN` with every remaining FAIL listed/waived with reasons) on `/`.
2. Landing: hero alone on screen 1 at 1440/1024/768/390 with the real booking UI, equal edges,
   one dealt moment, hero entrance, hover layer, photo credits in one footer line.
3. All role pages + modals use the same tokens/buttons/cards/inputs; no leftover `glass-*`,
   gradient-text, or glow classes.
4. Booking flow, 409 conflict message, role redirects, loading/empty/error states all still work.
5. `npm run lint` zero warnings; `npm run build` succeeds.

## Test Steps (after implement)
1. `cd server && npm start` (API) · `cd client/my-app && npm run dev`.
2. Open `/` at desktop and phone width: hero, drives list (or empty state), sections, footer credits.
3. Register/login as DONOR → book a drive: pre-screen → slot picker → confirmation; check `/donor`.
4. Open the same last slot in two browsers and book both → second sees the restyled 409 message.
5. Login as COORDINATOR → create drive modal, analytics; STAFF → check-in, walk-in, phlebotomy;
   ADMIN → users/audit. Confirm every view's loading/empty/error state renders.
6. `npm run lint` and `npm run build` both clean.
