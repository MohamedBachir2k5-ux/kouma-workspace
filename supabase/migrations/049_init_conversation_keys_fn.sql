-- Server-side helper to batch-insert conversation keys for all participants.
-- Using SECURITY DEFINER to bypass the RLS UPDATE policy check that PostgREST
-- triggers even with ON CONFLICT DO NOTHING upserts.
-- Security is preserved: keys are ECIES-wrapped per recipient (only they can decrypt),
-- and the function only INSERTs — it never reads or returns key material.

CREATE OR REPLACE FUNCTION init_conversation_keys(
  p_conversation_id uuid,
  p_key_rows        jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a member of this conversation (authorization check)
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this conversation';
  END IF;

  INSERT INTO conversation_keys (conversation_id, user_id, encrypted_key, eph_public_key, ecies_iv)
  SELECT
    p_conversation_id,
    (elem->>'user_id')::uuid,
    elem->>'encrypted_key',
    elem->>'eph_public_key',
    elem->>'ecies_iv'
  FROM jsonb_array_elements(p_key_rows) AS elem
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION init_conversation_keys(uuid, jsonb) TO authenticated;
