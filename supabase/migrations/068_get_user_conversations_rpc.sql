-- getConversations used .in('id', convIds) which generates a URL > 32 KB
-- when a user belongs to many conversations, silently returning an empty array.
-- This RPC replaces the two-step query with a single server-side JOIN.

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_org_id uuid, p_user_id uuid)
RETURNS TABLE(
  id              uuid,
  type            text,
  organization_id uuid,
  reference_id    uuid,
  created_at      timestamptz,
  name            text,
  member_ids      uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.type,
    c.organization_id,
    c.reference_id,
    c.created_at,
    c.name,
    array_agg(cm2.user_id ORDER BY cm2.user_id) AS member_ids
  FROM conversation_members cm1
  JOIN conversations        c   ON c.id   = cm1.conversation_id
  JOIN conversation_members cm2 ON cm2.conversation_id = c.id
  WHERE cm1.user_id         = p_user_id
    AND c.organization_id   = p_org_id
    AND p_user_id           = auth.uid()     -- caller may only read their own conversations
  GROUP BY c.id, c.type, c.organization_id, c.reference_id, c.created_at, c.name
  ORDER BY c.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid, uuid) TO authenticated;
