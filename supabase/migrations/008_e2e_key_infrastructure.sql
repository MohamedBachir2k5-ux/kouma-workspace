-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1 : E2E key infrastructure
-- Tables: user_key_pairs, org_recovery_keys, conversation_keys,
--         conversation_recovery_keys, file_keys, file_recovery_keys
-- ═══════════════════════════════════════════════════════════════════════════

-- ── user_key_pairs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_key_pairs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_key            text        NOT NULL,  -- Base64url SPKI (ECDH P-256)
  encrypted_private_key text        NOT NULL,  -- Base64url AES-GCM wrapped PKCS8
  kdf_salt              text        NOT NULL,  -- Base64url random salt (PBKDF2)
  kdf_iv                text        NOT NULL,  -- Base64url IV for the AES-GCM wrapping
  kdf_iterations        integer     NOT NULL DEFAULT 600000,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_key_pairs ENABLE ROW LEVEL SECURITY;

-- Users read/write their own key material
CREATE POLICY "Users manage own key pair"
  ON public.user_key_pairs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Org members can read public keys of peers in the same org
CREATE POLICY "Org members read peer public keys"
  ON public.user_key_pairs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = user_key_pairs.user_id
        AND om1.status != 'deleted'
    )
  );

-- ── org_recovery_keys ────────────────────────────────────────────────────────
-- One row per admin per organisation.
-- The founding admin's row also holds the breakglass blob (bg_* columns).
CREATE TABLE IF NOT EXISTS public.org_recovery_keys (
  id                               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_user_id                    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Org recovery public key (same value for all rows of the same org)
  recovery_public_key              text        NOT NULL,  -- Base64url SPKI

  -- ECIES blob for this admin: org_recovery_priv encrypted with admin's public key
  encrypted_recovery_private_key   text        NOT NULL,  -- Base64url AES-GCM ciphertext
  eph_public_key                   text        NOT NULL,  -- Base64url raw ECDH point (ephemeral)
  ecies_iv                         text        NOT NULL,  -- Base64url

  -- Breakglass: org_recovery_priv encrypted with PBKDF2(phrase, salt)
  -- Only the founding admin's row carries these columns (nullable for subsequent admins).
  bg_encrypted_key                 text,       -- Base64url AES-GCM ciphertext
  bg_kdf_salt                      text,       -- Base64url
  bg_iv                            text,       -- Base64url

  created_at                       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organization_id, admin_user_id)
);

ALTER TABLE public.org_recovery_keys ENABLE ROW LEVEL SECURITY;

-- Admins of the org can read and write recovery key rows
CREATE POLICY "Admins manage org recovery keys"
  ON public.org_recovery_keys FOR ALL TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- ── conversation_keys ────────────────────────────────────────────────────────
-- One row per user per conversation (ECIES-wrapped AES-256-GCM key).
CREATE TABLE IF NOT EXISTS public.conversation_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  encrypted_key   text        NOT NULL,  -- Base64url AES-GCM ciphertext (raw AES-256 key)
  eph_public_key  text        NOT NULL,  -- Base64url
  ecies_iv        text        NOT NULL,  -- Base64url
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

ALTER TABLE public.conversation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversation keys"
  ON public.conversation_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members insert conversation keys for self"
  ON public.conversation_keys FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow a participant to insert keys for other participants when creating a conversation
-- (e.g., distributing the symmetric key to all members on conversation creation).
-- Constraint: the inserter must be a member of the conversation.
CREATE POLICY "Conversation members insert keys for others"
  ON public.conversation_keys FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_keys.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own conversation keys"
  ON public.conversation_keys FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── conversation_recovery_keys ───────────────────────────────────────────────
-- One row per conversation per organisation (escrow).
CREATE TABLE IF NOT EXISTS public.conversation_recovery_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  encrypted_key   text        NOT NULL,
  eph_public_key  text        NOT NULL,
  ecies_iv        text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, organization_id)
);

ALTER TABLE public.conversation_recovery_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage conversation recovery keys"
  ON public.conversation_recovery_keys FOR ALL TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- Conversation participants can insert the recovery key when creating a conversation
CREATE POLICY "Participants insert conversation recovery key"
  ON public.conversation_recovery_keys FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_recovery_keys.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── file_keys ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.file_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path    text        NOT NULL,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_key   text        NOT NULL,
  eph_public_key  text        NOT NULL,
  ecies_iv        text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_path, user_id)
);

ALTER TABLE public.file_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own file keys"
  ON public.file_keys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- The uploader can insert file keys for other users (to share access)
CREATE POLICY "Uploaders insert file keys for others"
  ON public.file_keys FOR INSERT TO authenticated
  WITH CHECK (true);  -- refined at app layer; RLS on files bucket enforces org isolation

-- ── file_recovery_keys ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.file_recovery_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path    text        NOT NULL,
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  encrypted_key   text        NOT NULL,
  eph_public_key  text        NOT NULL,
  ecies_iv        text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_path, organization_id)
);

ALTER TABLE public.file_recovery_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage file recovery keys"
  ON public.file_recovery_keys FOR ALL TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- ── messages: add encrypted flag for migration coexistence ───────────────────
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content_encrypted boolean NOT NULL DEFAULT false;
