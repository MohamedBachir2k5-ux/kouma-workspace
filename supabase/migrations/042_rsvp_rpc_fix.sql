-- Fix: RSVP for event participants (direct UPDATE is blocked by RLS for non-creators)
-- Solution: SECURITY DEFINER RPC that validates the caller is a participant
-- Also notifies the event creator so they see who responded.
CREATE OR REPLACE FUNCTION rsvp_to_event(
  p_event_id uuid,
  p_response  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rsvp      jsonb;
  v_creator   uuid;
  v_title     text;
  v_responder text;
BEGIN
  -- Only allow 'accepted' or 'declined'
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response: must be accepted or declined';
  END IF;

  -- Verify caller is a participant or creator of the event; fetch creator + title
  SELECT created_by, title
  INTO v_creator, v_title
  FROM events
  WHERE id = p_event_id
    AND (created_by = auth.uid() OR auth.uid() = ANY(participants));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a participant of this event';
  END IF;

  -- Merge new RSVP response atomically
  SELECT COALESCE(rsvp, '{}'::jsonb) INTO v_rsvp
  FROM events WHERE id = p_event_id;

  v_rsvp := v_rsvp || jsonb_build_object(auth.uid()::text, p_response);

  UPDATE events SET rsvp = v_rsvp WHERE id = p_event_id;

  -- Notify the creator (unless they RSVPed themselves)
  IF v_creator IS DISTINCT FROM auth.uid() THEN
    SELECT firstname || ' ' || lastname INTO v_responder
    FROM profiles WHERE id = auth.uid();

    PERFORM notify_users(
      ARRAY[v_creator],
      'rsvp_response',
      jsonb_build_object(
        'text', v_responder || ' a ' || CASE p_response WHEN 'accepted' THEN 'accepté' ELSE 'décliné' END || ' la réunion "' || v_title || '".',
        'eventId', p_event_id
      )
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION rsvp_to_event(uuid, text) TO authenticated;
