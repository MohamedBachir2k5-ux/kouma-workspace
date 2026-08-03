-- Add name column to conversations so group names entered by users are persisted.
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS name TEXT;

-- Drop old signature (p_org_id uuid, p_members uuid[]) to replace with the name-aware version.
DROP FUNCTION IF EXISTS public.create_group_conversation(uuid, uuid[]);

CREATE OR REPLACE FUNCTION public.create_group_conversation(
  p_org_id  uuid,
  p_name    text,
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

  INSERT INTO public.conversations (organization_id, type, name)
  VALUES (p_org_id, 'group', NULLIF(trim(p_name), ''))
  RETURNING id INTO v_id;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  SELECT v_id, unnest(p_members);

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_conversation(uuid, text, uuid[]) TO authenticated;
