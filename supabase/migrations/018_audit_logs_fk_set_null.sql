ALTER TABLE public.audit_logs
  DROP CONSTRAINT audit_logs_user_id_fkey,
  ADD CONSTRAINT audit_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON DELETE SET NULL;
