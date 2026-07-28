-- Migration 022: Fix RLS helper functions + group conversation RPC
--
-- Root cause: is_org_member / is_org_admin / is_team_owner_or_admin / is_conversation_member
-- are NOT SECURITY DEFINER. When called from a RLS policy they re-enter the RLS engine
-- on organization_members / team_members / conversation_members, creating circular policy
-- evaluation. PostgreSQL's recursion guard resolves this by returning false, causing
-- all downstream policies to deny access even for valid users.
--
-- Fix: add SECURITY DEFINER + SET search_path = public to each helper so they bypass
-- RLS when querying their backing tables. auth.uid() still reads the caller's JWT claims.

-- ── Helper functions ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner_or_admin(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  );
$$;

-- ── Group conversation RPC ────────────────────────────────────────────────────
-- Mirrors create_direct_conversation: runs as postgres, validates membership,
-- then inserts conversations + conversation_members bypassing client-side RLS.

CREATE OR REPLACE FUNCTION public.create_group_conversation(
  p_org_id  uuid,
  p_members uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not a member of this organisation';
  END IF;

  INSERT INTO public.conversations (organization_id, type)
  VALUES (p_org_id, 'group')
  RETURNING id INTO v_id;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  SELECT v_id, unnest(p_members);

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_conversation(uuid, uuid[]) TO authenticated;
