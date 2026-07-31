-- Migration 065: Add RPC to distribute an existing conversation key to a late-joining member.
--
-- Root cause of "[Impossible de déchiffrer]":
--   initConversationKeys always generates a NEW symmetric key and uses DO NOTHING
--   on conflict. When user B sends their first message and has no conversation key,
--   they generate Key_B and insert it for themselves (Key_A already exists for user A,
--   so A's row is left unchanged). Result: A has Key_A, B has Key_B — incompatible.
--
-- Fix: add a dedicated RPC that lets an existing key-holder distribute their copy
--   of the symmetric key (re-wrapped for the new user) without generating a new one.
--   The client uses this when it detects it already has a key and another member is missing theirs.

CREATE OR REPLACE FUNCTION public.add_user_conversation_key(
  p_conversation_id uuid,
  p_user_id         uuid,
  p_encrypted_key   text,
  p_eph_public_key  text,
  p_ecies_iv        text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only members of the conversation can distribute keys
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this conversation';
  END IF;

  -- The recipient must also be a member
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Recipient is not a member of this conversation';
  END IF;

  INSERT INTO conversation_keys (conversation_id, user_id, encrypted_key, eph_public_key, ecies_iv)
  VALUES (p_conversation_id, p_user_id, p_encrypted_key, p_eph_public_key, p_ecies_iv)
  ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET encrypted_key    = EXCLUDED.encrypted_key,
        eph_public_key   = EXCLUDED.eph_public_key,
        ecies_iv         = EXCLUDED.ecies_iv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_user_conversation_key(uuid, uuid, text, text, text) TO authenticated;
