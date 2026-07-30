-- Add visibility and creator tracking to folders.
-- visibility: 'personal' (visible only to creator) | 'org' (visible to all org members)
ALTER TABLE folders ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE folders ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'personal'
  CHECK (visibility IN ('personal', 'org'));

-- Creators can fully manage their own folders (rename, delete)
CREATE POLICY "Creator manages own folder"
  ON folders
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
