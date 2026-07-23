-- 002_schema_additions.sql
-- Adds fields present in app types but missing from the initial schema.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS renews_at timestamptz;
