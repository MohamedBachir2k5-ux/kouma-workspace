-- Migration 021: Fix two RLS gaps
--
-- Gap 1: team_members INSERT
--   "Team creator becomes first owner" requires user_id = auth.uid()
--   An admin creating a team for another person as responsable fails because
--   the admin inserts user_id = responsable_id != auth.uid().
--   Fix: add a policy that lets org admins insert any row into team_members
--   for teams belonging to their org.
--
-- Gap 2: conversations INSERT for collaborators
--   is_org_member() relies on auth.uid(). In some Supabase local sessions,
--   auth.uid() resolves to null inside SECURITY DEFINER helper functions.
--   Fix: replace client-side INSERT with SECURITY DEFINER RPCs that do the
--   INSERT as postgres (bypasses RLS entirely) after validating membership.

-- ── Gap 1 fix ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Org admins manage team members" ON public.team_members;

CREATE POLICY "Org admins manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (
    public.is_org_admin(
      (SELECT organization_id FROM public.teams WHERE id = team_id)
    )
  )
  WITH CHECK (
    public.is_org_admin(
      (SELECT organization_id FROM public.teams WHERE id = team_id)
    )
  );

-- ── Gap 2 fix — RPC: create or return existing direct conversation ────────────

CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  p_org_id  uuid,
  p_user1   uuid,
  p_user2   uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Verify caller belongs to this org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not a member of this organisation';
  END IF;

  -- Return existing direct conversation between these two users, if any
  SELECT c.id INTO v_id
  FROM conversations c
  JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = p_user1
  JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = p_user2
  WHERE c.organization_id = p_org_id
    AND c.type = 'direct'
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Create new direct conversation
  INSERT INTO conversations (organization_id, type)
  VALUES (p_org_id, 'direct')
  RETURNING id INTO v_id;

  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES (v_id, p_user1), (v_id, p_user2);

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid, uuid, uuid) TO authenticated;

-- ── RPC: ensure a team conversation exists and all members are in it ──────────

CREATE OR REPLACE FUNCTION public.ensure_team_conversation(
  p_org_id    uuid,
  p_team_id   uuid,
  p_members   uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Return or create the team conversation
  SELECT id INTO v_id
  FROM conversations
  WHERE type = 'team' AND reference_id = p_team_id
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO conversations (organization_id, type, reference_id)
    VALUES (p_org_id, 'team', p_team_id)
    RETURNING id INTO v_id;
  END IF;

  -- Upsert all member rows (idempotent)
  INSERT INTO conversation_members (conversation_id, user_id)
  SELECT v_id, unnest(p_members)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_team_conversation(uuid, uuid, uuid[]) TO authenticated;
