-- Represent shelter-matched donations that still need a driver.
-- Safe to run after the initial schema; no rows are deleted.

ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_status_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_status_check CHECK (
    status IN ('posted', 'matched', 'awaiting_driver', 'picked_up', 'delivered', 'unmatched')
  );
