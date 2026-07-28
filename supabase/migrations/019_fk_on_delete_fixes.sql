-- Toutes les FK qui référencent profiles(id) sans ON DELETE action.
-- Bloquent la suppression d'un utilisateur. Fix groupé.

-- messages.sender_id (NOT NULL → CASCADE)
ALTER TABLE public.messages
  DROP CONSTRAINT messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- files.owner_id (NOT NULL → CASCADE)
ALTER TABLE public.files
  DROP CONSTRAINT files_owner_id_fkey,
  ADD CONSTRAINT files_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- documents.owner_id (NOT NULL → CASCADE)
ALTER TABLE public.documents
  DROP CONSTRAINT documents_owner_id_fkey,
  ADD CONSTRAINT documents_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- groups.creator_id (NOT NULL → CASCADE)
ALTER TABLE public.groups
  DROP CONSTRAINT groups_creator_id_fkey,
  ADD CONSTRAINT groups_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- meetings.creator_id (NOT NULL → CASCADE)
ALTER TABLE public.meetings
  DROP CONSTRAINT meetings_creator_id_fkey,
  ADD CONSTRAINT meetings_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- events.created_by (NOT NULL → CASCADE)
ALTER TABLE public.events
  DROP CONSTRAINT events_created_by_fkey,
  ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- teams.owner_id (nullable → SET NULL)
ALTER TABLE public.teams
  DROP CONSTRAINT teams_owner_id_fkey,
  ADD CONSTRAINT teams_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
