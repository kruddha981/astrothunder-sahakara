-- Link every new donation to the authenticated donor account.
-- Safe to run after the initial schema because it does not delete existing data.

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donor_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'donations_donor_id_fkey'
  ) THEN
    ALTER TABLE public.donations
      ADD CONSTRAINT donations_donor_id_fkey
      FOREIGN KEY (donor_id) REFERENCES public.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_donations_donor_id
  ON public.donations(donor_id);

-- Existing demo rows remain valid with donor_id = NULL.
-- New rows created through the backend must have a donor_id.
