-- Grace period: track when a member was soft-deleted so we can allow recovery within 7 days.
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Backfill: members already in deleted status get a deleted_at of now() as a safe default.
UPDATE organization_members SET deleted_at = now() WHERE status = 'deleted' AND deleted_at IS NULL;
