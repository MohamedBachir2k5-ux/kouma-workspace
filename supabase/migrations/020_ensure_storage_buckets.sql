-- Ensure the three storage buckets exist (idempotent).
-- Buckets may already exist on production; ON CONFLICT DO NOTHING is safe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',     'avatars',     false, 5242880,
   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('documents',   'documents',   false, 52428800,
   ARRAY['application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'text/plain','text/csv']),
  ('attachments', 'attachments', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
