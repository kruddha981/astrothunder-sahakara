-- Make delivery, shelter capacity, and driver release one database transaction.

CREATE OR REPLACE FUNCTION public.deliver_donation(p_donation_id TEXT)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_donation public.donations%ROWTYPE;
  completed_donation public.donations%ROWTYPE;
BEGIN
  SELECT * INTO current_donation
  FROM public.donations
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;

  IF current_donation.status <> 'picked_up' THEN
    RAISE EXCEPTION 'Donation must be picked up before delivery';
  END IF;

  UPDATE public.donations
  SET status = 'delivered'
  WHERE id = p_donation_id;

  UPDATE public.shelters
  SET capacity = GREATEST(0, capacity - current_donation.quantity)
  WHERE id = current_donation.matched_shelter_id;

  IF current_donation.assigned_driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET available = TRUE
    WHERE id = current_donation.assigned_driver_id;
  END IF;

  SELECT * INTO completed_donation
  FROM public.donations
  WHERE id = p_donation_id;

  RETURN completed_donation;
END;
$$;

REVOKE ALL ON FUNCTION public.deliver_donation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deliver_donation(TEXT) TO service_role;
