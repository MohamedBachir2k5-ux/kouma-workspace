-- Migration 031: Rename plan 'starter' → 'free', add 'enterprise'.
-- Business plan limits change: 100 users / 50 Go (data only, enforced in app).
-- DB stores the plan name as text; only the CHECK constraint needs updating.

-- 1. Drop old CHECK constraints
ALTER TABLE organizations   DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE subscriptions   DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 2. Rename existing 'starter' rows to 'free'
UPDATE organizations  SET plan = 'free' WHERE plan = 'starter';
UPDATE subscriptions  SET plan = 'free' WHERE plan = 'starter';

-- 3. Update default for organizations.plan
ALTER TABLE organizations ALTER COLUMN plan SET DEFAULT 'free';

-- 4. Fix last_read_at DEFAULT (was missing on pre-existing column)
ALTER TABLE conversation_members ALTER COLUMN last_read_at SET DEFAULT now();
UPDATE conversation_members SET last_read_at = now() WHERE last_read_at IS NULL;

-- 5. Add new CHECK constraints accepting all three plan values
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan = ANY (ARRAY['free'::text, 'business'::text, 'enterprise'::text]));

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan = ANY (ARRAY['free'::text, 'business'::text, 'enterprise'::text]));
