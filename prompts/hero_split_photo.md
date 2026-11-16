# Implementation Prompt: Desktop Hero, Text and Whole Photo Side by Side

## Context & Objectives
On desktop the landing hero (`components/landing/Hero.tsx`, the dealt `product` hero) gives the donor photo a
full-width, short strip under the headline (about 1440x490 at 1440x900), so a 1280x1058 photo (1.21:1) is cropped
to a band of the arm: the sample tubes, machine and part of the needle disappear (at 1366x768 the needle is cut),
and the 1280px file is stretched to 1440 to 1920px, so it looks soft. On a phone it shows well (4:3, whole scene).

The user chose: **text on the left, the whole photo on the right at its natural shape** (the kit's `split` hero,
replacing the dealt `product` hero by the user's choice). Phone stays as it is today.

## Scope
1. `components/landing/Hero.tsx`: rebuild as the kit's `hero--split` markup (`assets/layout/hero-split.html`, hero
   section only): `.hero__text.span-5` with the h1, lead and the same two buttons; `.hero__media.span-6.start-7`
   holding the same photograph (same file, alt, `data-source`, `data-subject`, `fetchpriority="high"`). Copy and
   links unchanged. No float card (it would cover part of the photo, which is the point of the change).
2. `app/globals.css` (page CSS, kit files untouched):
   - Desktop and tablet: the media frame takes the photo's own ratio (1280 / 1058), top-aligned with the h1, so
     the whole picture shows with nothing cropped; `object-position` centred.
   - Phone (under 640px): keep today's look, text first, then the photo full width at 4:3.
   - Remove the old product-hero phone rule (`.hero--product .hero__stage …`).
3. Image sharpness: the frame becomes about 628px wide at 1440, so the existing 1280px file covers it at 2x
   (retina); `sizes` updated to the frame's real width so the browser picks the right file. No new download.
4. `app/page.tsx` plan comment: hero `split` (the user's choice over the dealt `product`).

## Out of Scope
- Any other section, copy, or the photograph itself.

## Checks
- Screenshots of the first screen at 1920x1080, 1536x864, 1440x900, 1366x768, 1280x720, 1024x768, 820x1180,
  768x1024, 390x844: whole photo visible, hero fills one screen, nothing of the next section showing.
- Skill layout check at those sizes, then `gate.mjs` → `GATE: PASS`; `npm run lint` (only the known
  AuthContext error) and `next build`.

## Test Steps
1. `cd client/my-app && npm run dev`, open `http://localhost:3000` on a computer: headline left, whole photo right.
2. Narrow the window to phone width: text first, then the photo, as before.
