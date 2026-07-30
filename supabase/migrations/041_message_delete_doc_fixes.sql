-- Fix 1: allow users to delete their own messages
CREATE POLICY "Delete own messages"
  ON messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- Fix 2: documents SELECT — admins can see all team docs in their org
-- (team docs are organizational resources, not private conversations)
DROP POLICY IF EXISTS "Documents select" ON documents;
CREATE POLICY "Documents select"
  ON documents FOR SELECT TO authenticated
  USING (
    is_org_member(organization_id) AND (
      visibility = 'org'
      OR (visibility = 'personal' AND owner_id = auth.uid())
      OR (visibility = 'team' AND (
            is_org_admin(organization_id)
            OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
          ))
      OR (visibility = 'group' AND (
            conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
          ))
    )
  );
