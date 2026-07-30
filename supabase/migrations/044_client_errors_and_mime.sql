-- 1. Client error log table (receives uncaught JS errors from browsers)
CREATE TABLE IF NOT EXISTS client_errors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message     text NOT NULL,
  stack       text,
  url         text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read client errors"
  ON client_errors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin','owner')
        AND om.status = 'active'
    )
  );

-- SECURITY DEFINER: callable even when session is partially initialised
CREATE OR REPLACE FUNCTION log_client_error(
  p_message    text,
  p_stack      text DEFAULT NULL,
  p_url        text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO client_errors(user_id, message, stack, url, user_agent)
  VALUES (auth.uid(), left(p_message, 500), left(p_stack, 2000), left(p_url, 300), left(p_user_agent, 300));
EXCEPTION WHEN OTHERS THEN
  NULL; -- never raise from error handler
END;
$$;

GRANT EXECUTE ON FUNCTION log_client_error(text, text, text, text) TO authenticated, anon;

-- 2. Restrict attachments bucket to allowed MIME types (same list as client-side validation)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'application/octet-stream'  -- encrypted blobs uploaded by the crypto layer
]
WHERE id = 'attachments';

GRANT SELECT ON public.client_errors TO authenticated;
