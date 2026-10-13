# Implementation Prompt: Fix Missing `booking_reference` on `appointments`

## Context & Objectives
Booking fails with PostgreSQL error:

> `column "booking_reference" of relation "appointments" does not exist`

Root cause: `server/src/db/schema.sql` defines `booking_reference`, and `store.js` inserts it, but the **live** Neon `appointments` table was created earlier without that column. `CREATE TABLE IF NOT EXISTS` in `initializeDatabase()` does not alter existing tables, so the column was never added.

Verified live columns: `id`, `user_id`, `drive_id`, `slot_id`, `status`, `pre_screen_passed`, `pre_screen_answers`, `booked_at`, `check_in_time` — no `booking_reference`.

## Scope
- Add an idempotent schema migration that adds `booking_reference` to existing DBs.
- Keep application booking logic unchanged (already correct).
- Do not change frontend.

## Proposed Changes

### 1. `server/src/db/schema.sql`
Append idempotent migration SQL after the `CREATE TABLE IF NOT EXISTS appointments` block (or at end of file):

```sql
-- Idempotent: add booking_reference to DBs created before this column existed
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(50);

-- Backfill any rows that lack a reference
UPDATE appointments
SET booking_reference = 'BDC-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 6))
WHERE booking_reference IS NULL;

-- Enforce NOT NULL once backfilled
DO $$ BEGIN
  ALTER TABLE appointments ALTER COLUMN booking_reference SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Unique constraint if missing
DO $$ BEGIN
  ALTER TABLE appointments ADD CONSTRAINT appointments_booking_reference_key UNIQUE (booking_reference);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### 2. Apply migration
- Restart the API so `initializeDatabase()` re-runs `schema.sql`, **or**
- Run the same SQL once against `DATABASE_URL` if the server is already up and schema reload is preferred immediately.

### 3. Verify
- Confirm `information_schema.columns` lists `booking_reference` on `appointments`.
- Confirm a donor can complete "Confirm Reservation" without the column error and receives a `BDC-######` reference.

## Out of Scope
- Reworking booking/transactional lock logic
- Broader migration framework
- Other schema drift (e.g. live `status` as enum vs schema `VARCHAR`) unless it blocks booking

## Success Criteria
1. Column exists on live DB.
2. Slot booking INSERT succeeds.
3. Confirmation UI can show `booking_reference`.
