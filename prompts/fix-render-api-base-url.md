# Implementation Prompt: Fix Render API Base URL Handling

## Problem
The deployed frontend is requesting:

`https://cs-blood-donation-drive-coordinator.onrender.com/auth/login`

The Express API mounts authentication at `/api/auth`, so the request is missing the `/api` prefix and returns `404`. The frontend API helper reads `NEXT_PUBLIC_API_URL` and appends endpoint paths as-is. The deployment environment may therefore supply the Render origin without the required API prefix.

## Objective
Make frontend API URL construction reliably target the backend's `/api` namespace whether `NEXT_PUBLIC_API_URL` is configured as the Render origin or already includes `/api`.

## Scope
- Update `client/my-app/lib/api.ts` API base URL handling.
- Preserve the local default (`http://localhost:5000/api`).
- Normalize whitespace/trailing slashes and ensure a single `/api` suffix.
- Avoid duplicate `/api/api` when the configured URL already includes that path.
- Ensure both JSON requests and generated ICS URLs use the normalized base.
- Update directly related deployment documentation to state that the Vercel `NEXT_PUBLIC_API_URL` should point to the Render API root (with normalization applied) and document the resulting health endpoint.
- Add or run the narrowest suitable validation; do not change backend routes or unrelated dirty files.

## Verification
- Verify configured values with and without `/api` resolve to a base ending in exactly `/api`.
- Verify `/auth/login` resolves to `https://cs-blood-donation-drive-coordinator.onrender.com/api/auth/login`.
- Verify existing localhost default still resolves to `http://localhost:5000/api`.
- Run relevant type/build or lint checks available in the frontend project.

## Constraints
- Do not expose or modify credentials or secrets.
- Keep the change surgical and consistent with the existing TypeScript client.
