-- Add visibility scoping to documents so personal, team, group and org-library
-- spaces can be distinguished and properly secured by RLS.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'org'
    CHECK (visibility IN ('personal', 'team', 'group', 'org')),
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL;

-- Existing documents that belong to a team folder → migrate to 'team' visibility.
UPDATE documents d
SET visibility = 'team',
    team_id    = f.team_id
FROM folders f
WHERE d.folder_id = f.id
  AND f.team_id IS NOT NULL;

-- Documents whose folder_id is NULL and owner matches a real member → personal.
-- (Message attachments promoted via promoteFromPath will keep 'org' for now.)
UPDATE documents
SET visibility = 'personal'
WHERE folder_id IS NULL
  AND visibility = 'org';

-- Drop the old catch-all policies.
DROP POLICY IF EXISTS "Manage documents" ON documents;
DROP POLICY IF EXISTS "Org documents"    ON documents;

-- New RLS policies per visibility scope.

-- SELECT: org-library and team docs are visible to all org members.
--         personal docs are visible only to the owner.
--         group docs are visible to conversation members.
CREATE POLICY "Documents select"
  ON documents FOR SELECT TO authenticated
  USING (
    is_org_member(organization_id) AND (
      visibility = 'org'
      OR (visibility = 'personal' AND owner_id = auth.uid())
      OR (visibility = 'team' AND (
            team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
          ))
      OR (visibility = 'group' AND (
            conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
          ))
    )
  );

-- INSERT: members can upload personal docs; admins or team members can upload team docs;
--         org library restricted to admins.
CREATE POLICY "Documents insert"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (
    is_org_member(organization_id) AND (
      (visibility = 'personal' AND owner_id = auth.uid())
      OR (visibility = 'team' AND (
            team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
         ))
      OR (visibility = 'group' AND (
            conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
          ))
      OR (visibility = 'org' AND is_org_admin(organization_id))
    )
  );

-- UPDATE/DELETE: owner can always manage their own doc; admins can manage all.
CREATE POLICY "Documents update"
  ON documents FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY "Documents delete"
  ON documents FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR is_org_admin(organization_id));
