-- Fix FK delete behavior for tables that now support DELETE
-- 1. replies referencing a deleted message → SET NULL (don't orphan the reply row)
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_reply_to_id_fkey,
  ADD CONSTRAINT messages_reply_to_id_fkey
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

-- 2. documents without a folder are valid (personal/ungrouped) → SET NULL
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_folder_id_fkey,
  ADD CONSTRAINT documents_folder_id_fkey
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

-- 3. nested folders: deleting parent makes children top-level → SET NULL
ALTER TABLE folders
  DROP CONSTRAINT IF EXISTS folders_parent_id_fkey,
  ADD CONSTRAINT folders_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL;

-- 4. deleting a team: folders become unassigned (kept in org library) → SET NULL
ALTER TABLE folders
  DROP CONSTRAINT IF EXISTS folders_team_id_fkey,
  ADD CONSTRAINT folders_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
