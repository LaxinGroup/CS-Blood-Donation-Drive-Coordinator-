# Implementation Prompt: Password Show/Hide With Auto-Hide Timer (Sign in + Sign up)

## Context & Objectives
`app/(app)/login/page.tsx` and `app/(app)/register/page.tsx` each have a plain `type="password"` input with
no way to check what was typed. The user wants:
- Password **hidden by default** (already true; keep it).
- An eye button to **show** the password.
- An **automatic re-hide after 5 seconds**.

User decisions:
- Timer: **5 seconds** from the moment it is shown.
- **No visible countdown.**
- Also hide **when the tab becomes hidden** (tab switch or minimised window, via `visibilitychange`).
- Typing does **not** restart the timer, and submitting does not hide it early. Only the timer, the tab
  becoming hidden, or pressing the button again hide it.

This is browser-only display state. The password value, submit flow, API calls and hashing (bcryptjs, on the
server) are unchanged.

## Scope
1. **New client component `components/PasswordInput.tsx`**
   - Props: `id`, `value`, `onChange(value: string)`, `autoComplete` (`'current-password' | 'new-password'`),
     `required?`, `minLength?`, `describedBy?`. Explicit TypeScript types.
   - State `visible: boolean`, default `false`. Input `type={visible ? 'text' : 'password'}`, same `input` class.
   - Toggle button (`type="button"`, `.icon-btn`) sits inside the right edge of the input. It shows the Lucide
     `Eye` icon when hidden and `EyeOff` when shown. `aria-label` is "Show password" or "Hide password",
     with `aria-pressed={visible}` and `aria-controls={id}`. It does not steal focus from typing in a way that
     submits the form.
   - Timer: when `visible` becomes true, a `useEffect` starts `setTimeout(hide, 5000)`, with the cleanup
     clearing it. Hiding manually or unmounting clears the timer, so no stray timers are left running.
     `REVEAL_MS = 5000` is a named constant.
   - Tab hidden: while `visible`, a `visibilitychange` listener hides it when `document.visibilityState === 'hidden'`.
     The listener is removed in cleanup.
   - Hiding happens only inside timer or event callbacks, never directly in the effect body, which keeps the
     `react-hooks/set-state-in-effect` lint rule clean.
   - Input gets right padding so text never runs under the button.
2. **`app/(app)/login/page.tsx`**: replace the password `<input>` with `<PasswordInput id="login-password"
   autoComplete="current-password" required … />`. The label stays as it is.
3. **`app/(app)/register/page.tsx`**: replace with `<PasswordInput id="reg-password" autoComplete="new-password"
   required minLength={6} describedBy="reg-password-hint" … />`. The hint stays.
4. **`app/globals.css`**: small rules `.password-field` (position: relative) and the button placement (absolutely
   positioned, vertically centred in the 48px input), plus input `padding-right`. Existing tokens only.

## Out of Scope
- Any countdown text, password strength meter, confirm-password field, or validation change.
- Server and auth changes.

## Checks
- `npm run lint` (zero new problems; only the known AuthContext error remains) and `npx next build`.
- Manual: the timer hides the password at 5s, and switching tabs hides it right away.

## Test Steps
1. `cd client/my-app && npm run dev`, open `http://localhost:3000/login`.
2. Type a password: it shows as dots. Press the eye button: the text is readable and the icon changes to eye-off.
3. Wait 5 seconds: it hides again by itself.
4. Show it again and press the button: it hides right away.
5. Show it, switch to another browser tab, and come back: it is hidden.
6. Press Tab to reach the button and use Enter/Space: it toggles, and the form does not submit.
7. Repeat on `/register`. The "At least 6 characters" hint still shows, and sign up and sign in still work.
