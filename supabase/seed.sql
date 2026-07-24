-- ═══════════════════════════════════════════════════════════════════════════════
-- seed.sql — Kouma Workspace TEST Environment
-- ⚠️  JAMAIS exécuter sur la production.
-- Prérequis :
--   1. Migrations 001 et 002 appliquées.
--   2. Les comptes nommés créés via l'Admin API Supabase AVANT ce script :
--        POST /auth/v1/admin/users  (service_role key requis)
--        • admin@test-sarl.com         / TestKouma2025!
--        • user@isolation-org.com      / IsolationTest2025!
-- Exécuter dans le SQL Editor Supabase (rôle postgres / service_role).
-- ═══════════════════════════════════════════════════════════════════════════════

SET session_replication_role = replica;

-- ─── Résolution dynamique des UUIDs des comptes nommés ────────────────────────
-- GoTrue attribue les UUIDs lors de la création via Admin API.
-- Ce script échoue explicitement si les comptes n'existent pas.

CREATE TEMP TABLE IF NOT EXISTS _seed_ids (admin_id uuid, isolat_id uuid);
TRUNCATE _seed_ids;

INSERT INTO _seed_ids
SELECT
  (SELECT id FROM auth.users WHERE email = 'admin@test-sarl.com'),
  (SELECT id FROM auth.users WHERE email = 'user@isolation-org.com');

DO $$
BEGIN
  IF (SELECT admin_id FROM _seed_ids) IS NULL THEN
    RAISE EXCEPTION
      'admin@test-sarl.com introuvable dans auth.users. '
      'Créer les comptes nommés via l''Admin API Supabase avant de lancer ce seed.';
  END IF;
  IF (SELECT isolat_id FROM _seed_ids) IS NULL THEN
    RAISE EXCEPTION
      'user@isolation-org.com introuvable dans auth.users. '
      'Créer les comptes nommés via l''Admin API Supabase avant de lancer ce seed.';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1 — Profil admin TEST SARL
-- ⚠️  Le compte auth est créé via l'Admin API (voir prérequis).
--     Ce script insère uniquement le profil (le trigger peut déjà l'avoir créé).
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, firstname, lastname, email, language, status, created_at)
SELECT admin_id, 'Admin', 'SARL', 'admin@test-sarl.com', 'fr', 'active', now() - interval '90 days'
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2 — Organisation TEST SARL
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organizations (
  id, name, email, phone, website,
  country, city, currency, language,
  sector, plan, created_at
) VALUES (
  'cc000001-0000-0000-0000-000000000001',
  'Organisation TEST SARL',
  'contact@test-sarl.com',
  '+224 620 00 00 00',
  'https://test-sarl.com',
  'Guinée', 'Conakry', 'GNF', 'fr',
  'Technologie',
  'starter',
  now() - interval '90 days'
) ON CONFLICT (id) DO NOTHING;

-- Abonnement Starter actif
INSERT INTO public.subscriptions (
  id, organization_id, plan, status,
  currency, amount,
  trial_ends_at, start_date, renews_at,
  discount_percent, discount_ends_at,
  created_at
) VALUES (
  'ee000001-0000-0000-0000-000000000001',
  'cc000001-0000-0000-0000-000000000001',
  'starter', 'active',
  'GNF', 700000,
  null,
  (now() - interval '60 days'),
  (now() + interval '30 days'),
  40,
  (now() + interval '305 days'),
  now() - interval '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Admin comme membre admin de l'organisation (UUID dynamique)
INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT
  'cc000001-0000-0000-0000-000000000001',
  admin_id,
  'admin', 'active'
FROM _seed_ids
ON CONFLICT (organization_id, user_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3 — 100 membres actifs (génération automatique)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  i      int;
  uid    uuid;
  depts  text[] := ARRAY['Direction','Finance','RH','IT','Juridique','Commercial','Marketing','Opérations'];
  dept   text;
  roles  text[] := ARRAY['Analyste','Responsable','Coordinateur','Chargé de mission','Directeur adjoint','Chef de projet','Consultant','Ingénieur'];
  rname  text;
  fnames text[] := ARRAY['Mamadou','Fatoumata','Ibrahim','Aïssatou','Sékou','Mariama','Oumar','Kadiatou','Abdoulaye','Aminata','Moussa','Hawa','Saliou','Djénébou','Thierno','Nafi','Boubacar','Kadijah','Ibrahima','Salamatou'];
  lnames text[] := ARRAY['Diallo','Bah','Camara','Kouyaté','Condé','Barry','Traoré','Sylla','Soumah','Kourouma','Baldé','Keita','Cissé','Bangoura','Fofana'];
BEGIN
  FOR i IN 1..100 LOOP
    uid   := ('aa001000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    dept  := depts[1 + (i % array_length(depts, 1))];
    rname := roles[1 + (i % array_length(roles, 1))];

    -- Authentification
    -- Si l'email existe déjà (compte Admin API), on ignore le conflit d'email.
    BEGIN
      INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, created_at, updated_at
      ) VALUES (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'user' || i || '@test-sarl.com',
        crypt('TestKouma2025!', gen_salt('bf')),
        now(),
        ('{"firstname":"' || fnames[1 + (i % array_length(fnames, 1))] || '","lastname":"' || lnames[1 + (i % array_length(lnames, 1))] || i::text || '"}')::jsonb,
        now() - (i || ' days')::interval,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
      NULL; -- email déjà utilisé par un compte Admin API — skip
    END;

    -- Profil
    INSERT INTO public.profiles (id, firstname, lastname, email, language, status, created_at)
    VALUES (
      uid,
      fnames[1 + (i % array_length(fnames, 1))],
      lnames[1 + (i % array_length(lnames, 1))] || i::text,
      'user' || i || '@test-sarl.com',
      'fr', 'active',
      now() - (i || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;

    -- Membership
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (
      'cc000001-0000-0000-0000-000000000001',
      uid, 'member', 'active'
    ) ON CONFLICT (organization_id, user_id) DO NOTHING;

  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4 — Départements
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.departments (id, organization_id, name, code) VALUES
  ('dd000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'Direction Générale',  'DG'),
  ('dd000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'Finance',             'FIN'),
  ('dd000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'Ressources Humaines', 'RH'),
  ('dd000004-0000-0000-0000-000000000004', 'cc000001-0000-0000-0000-000000000001', 'Informatique',        'IT'),
  ('dd000005-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'Juridique',           'JUR'),
  ('dd000006-0000-0000-0000-000000000006', 'cc000001-0000-0000-0000-000000000001', 'Commercial',          'COM')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5 — Équipes + membres + permissions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Équipe 1 : Direction Générale (owner = admin, UUID dynamique)
INSERT INTO public.teams (id, organization_id, name, description, color, owner_id, created_at)
SELECT
  'bb000001-0000-0000-0000-000000000001',
  'cc000001-0000-0000-0000-000000000001',
  'Direction Générale', 'Comité de direction', '#0f1628',
  admin_id,
  now() - interval '85 days'
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;

-- Équipes 2-4 (owners = membres générés, UUIDs fixes)
INSERT INTO public.teams (id, organization_id, name, description, color, owner_id, created_at) VALUES
  ('bb000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'Finance',             'Gestion comptable',        '#16a34a', 'aa001000-0000-0000-0000-000000000003', now() - interval '80 days'),
  ('bb000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'Ressources Humaines', 'Recrutement et formation', '#7c3aed', 'aa001000-0000-0000-0000-000000000005', now() - interval '78 days'),
  ('bb000004-0000-0000-0000-000000000004', 'cc000001-0000-0000-0000-000000000001', 'Informatique',        'Infrastructure et dev',    '#0891b2', 'aa001000-0000-0000-0000-000000000004', now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

-- Propriétaire de l'équipe Direction Générale (admin, UUID dynamique)
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'bb000001-0000-0000-0000-000000000001', admin_id, 'owner'
FROM _seed_ids
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Autres membres des équipes (membres générés, UUIDs fixes)
INSERT INTO public.team_members (team_id, user_id, role) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000001', 'member'),
  ('bb000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000002', 'member'),
  ('bb000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000003', 'owner'),
  ('bb000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000004', 'member'),
  ('bb000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000010', 'member'),
  ('bb000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000005', 'owner'),
  ('bb000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000006', 'member'),
  ('bb000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000007', 'member'),
  ('bb000004-0000-0000-0000-000000000004', 'aa001000-0000-0000-0000-000000000004', 'owner'),
  ('bb000004-0000-0000-0000-000000000004', 'aa001000-0000-0000-0000-000000000008', 'member'),
  ('bb000004-0000-0000-0000-000000000004', 'aa001000-0000-0000-0000-000000000009', 'member')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Permissions des équipes
INSERT INTO public.team_permissions (team_id, permission_name, enabled) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'invite_members',   true),
  ('bb000001-0000-0000-0000-000000000001', 'manage_documents', true),
  ('bb000001-0000-0000-0000-000000000001', 'manage_events',    true),
  ('bb000001-0000-0000-0000-000000000001', 'admin_space',      true),
  ('bb000002-0000-0000-0000-000000000002', 'invite_members',   false),
  ('bb000002-0000-0000-0000-000000000002', 'manage_documents', true),
  ('bb000002-0000-0000-0000-000000000002', 'manage_events',    true),
  ('bb000002-0000-0000-0000-000000000002', 'admin_space',      false),
  ('bb000003-0000-0000-0000-000000000003', 'invite_members',   true),
  ('bb000003-0000-0000-0000-000000000003', 'manage_documents', true),
  ('bb000003-0000-0000-0000-000000000003', 'manage_events',    false),
  ('bb000003-0000-0000-0000-000000000003', 'admin_space',      false),
  ('bb000004-0000-0000-0000-000000000004', 'invite_members',   false),
  ('bb000004-0000-0000-0000-000000000004', 'manage_documents', false),
  ('bb000004-0000-0000-0000-000000000004', 'manage_events',    true),
  ('bb000004-0000-0000-0000-000000000004', 'admin_space',      false)
ON CONFLICT (team_id, permission_name) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6 — Documents
-- ═══════════════════════════════════════════════════════════════════════════════

-- Dossiers
INSERT INTO public.folders (id, organization_id, name, team_id, created_at) VALUES
  ('ff000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'Finance',             'bb000002-0000-0000-0000-000000000002', now() - interval '70 days'),
  ('ff000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'Ressources Humaines', 'bb000003-0000-0000-0000-000000000003', now() - interval '70 days')
ON CONFLICT (id) DO NOTHING;

-- Fichiers créés par des membres générés
INSERT INTO public.files (id, owner_id, organization_id, storage_path, name, type, size, category, created_at) VALUES
  ('f1000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'documents/rapport-q2-2025.pdf',      'Rapport Q2 2025.pdf',      'pdf',  2400000, 'document', now() - interval '2 days'),
  ('f1000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'documents/organigramme-2025.docx',   'Organigramme 2025.docx',   'docx',  450000, 'document', now() - interval '5 days'),
  ('f1000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'documents/budget-previsionnel.xlsx', 'Budget prévisionnel.xlsx', 'xlsx',  890000, 'document', now() - interval '7 days'),
  ('f1000005-0000-0000-0000-000000000005', 'aa001000-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'documents/procedure-onboarding.pdf', 'Procédure onboarding.pdf', 'pdf',   320000, 'document', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- Fichier 4 (propriétaire = admin, UUID dynamique)
INSERT INTO public.files (id, owner_id, organization_id, storage_path, name, type, size, category, created_at)
SELECT
  'f1000004-0000-0000-0000-000000000004',
  admin_id,
  'cc000001-0000-0000-0000-000000000001',
  'documents/contrat-fournisseur.pdf',
  'Contrat fournisseur Bauxite SA.pdf',
  'pdf', 1200000, 'document', now() - interval '10 days'
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;

-- Documents créés par des membres générés
INSERT INTO public.documents (id, organization_id, folder_id, owner_id, title, file_id, created_at) VALUES
  ('dc000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'ff000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'Rapport Q2 2025',      'f1000001-0000-0000-0000-000000000001', now() - interval '2 days'),
  ('dc000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'ff000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'Organigramme 2025',    'f1000002-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('dc000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'ff000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'Budget prévisionnel',  'f1000003-0000-0000-0000-000000000003', now() - interval '7 days'),
  ('dc000005-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'ff000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'Procédure onboarding', 'f1000005-0000-0000-0000-000000000005', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- Document 4 (propriétaire = admin, UUID dynamique)
INSERT INTO public.documents (id, organization_id, folder_id, owner_id, title, file_id, created_at)
SELECT
  'dc000004-0000-0000-0000-000000000004',
  'cc000001-0000-0000-0000-000000000001',
  null,
  admin_id,
  'Contrat fournisseur Bauxite SA',
  'f1000004-0000-0000-0000-000000000004',
  now() - interval '10 days'
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7 — Conversations et messages
-- ═══════════════════════════════════════════════════════════════════════════════

-- Conversations
INSERT INTO public.conversations (id, type, organization_id, reference_id, created_at) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'team',   'cc000001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', now() - interval '85 days'),
  ('c0000002-0000-0000-0000-000000000002', 'team',   'cc000001-0000-0000-0000-000000000001', 'bb000002-0000-0000-0000-000000000002', now() - interval '80 days'),
  ('c0000003-0000-0000-0000-000000000003', 'direct', 'cc000001-0000-0000-0000-000000000001', null,                                   now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Membres des conversations incluant admin (UUID dynamique)
INSERT INTO public.conversation_members (conversation_id, user_id)
SELECT 'c0000001-0000-0000-0000-000000000001', admin_id FROM _seed_ids
ON CONFLICT (conversation_id, user_id) DO NOTHING;

INSERT INTO public.conversation_members (conversation_id, user_id)
SELECT 'c0000003-0000-0000-0000-000000000003', admin_id FROM _seed_ids
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Membres des conversations (membres générés, UUIDs fixes)
INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000001'),
  ('c0000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000002'),
  ('c0000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000003'),
  ('c0000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000004'),
  ('c0000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000001')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Message 1 (expéditeur = admin, UUID dynamique)
INSERT INTO public.messages (id, conversation_id, sender_id, content, status, created_at)
SELECT
  'b5000001-0000-0000-0000-000000000001',
  'c0000001-0000-0000-0000-000000000001',
  admin_id,
  'Réunion budget confirmée pour vendredi 10h00.',
  'read', now() - interval '12 minutes'
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;

-- Messages 2-5 (expéditeurs = membres générés, UUIDs fixes)
INSERT INTO public.messages (id, conversation_id, sender_id, content, status, created_at) VALUES
  ('b5000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000001', 'Confirmé. Je prépare les slides d''ici jeudi soir.',          'read', now() - interval '10 minutes'),
  ('b5000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000002', 'Parfait. J''enverrai les convocations officielles ce soir.', 'read', now() - interval '8 minutes'),
  ('b5000004-0000-0000-0000-000000000004', 'c0000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000003', 'Les chiffres du trimestre ont été validés.',                 'read', now() - interval '2 hours'),
  ('b5000005-0000-0000-0000-000000000005', 'c0000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000001', 'Le rapport est prêt, je te l''envoie.',                      'sent', now() - interval '45 minutes')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8 — Audit logs (tous générés par admin)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.audit_logs (id, organization_id, user_id, action, target_type, target_id, target_name, detail, created_at)
SELECT
  t.log_id::uuid,
  'cc000001-0000-0000-0000-000000000001'::uuid,
  s.admin_id,
  t.action,
  t.target_type,
  t.target_id::uuid,
  t.target_name,
  t.detail,
  t.ts
FROM _seed_ids s
CROSS JOIN (VALUES
  ('a1000001-0000-0000-0000-000000000001'::text, 'organization_created'::text, 'organization'::text, 'cc000001-0000-0000-0000-000000000001'::text, 'Organisation TEST SARL'::text,  null::text,                          (now() - interval '90 days')::timestamptz),
  ('a1000002-0000-0000-0000-000000000002',        'team_created',              'team',               'bb000001-0000-0000-0000-000000000001',        'Direction Générale',             null,                                (now() - interval '85 days')),
  ('a1000003-0000-0000-0000-000000000003',        'team_created',              'team',               'bb000002-0000-0000-0000-000000000002',        'Finance',                        null,                                (now() - interval '80 days')),
  ('a1000004-0000-0000-0000-000000000004',        'invite_generated',          null,                 null,                                          null,                             'user50@test-sarl.com',              (now() - interval '50 days')),
  ('a1000005-0000-0000-0000-000000000005',        'user_joined',               'user',               'aa001000-0000-0000-0000-000000000001',        'Mamadou Bah1',                   null,                                (now() - interval '89 days')),
  ('a1000006-0000-0000-0000-000000000006',        'document_added',            'document',           'dc000001-0000-0000-0000-000000000001',        'Rapport Q2 2025.pdf',            'Dossier Finance',                   (now() - interval '2 days')),
  ('a1000007-0000-0000-0000-000000000007',        'permission_changed',        'team',               'bb000002-0000-0000-0000-000000000002',        'Finance',                        'manage_documents activé',           (now() - interval '10 days')),
  ('a1000008-0000-0000-0000-000000000008',        'subscription_changed',      'subscription',       'ee000001-0000-0000-0000-000000000001',        null,                             'Passage trial → active',            (now() - interval '60 days')),
  ('a1000009-0000-0000-0000-000000000009',        'user_suspended',            'user',               'aa001000-0000-0000-0000-000000000020',        'Fatoumata Traoré20',             'Accès bloqué temporairement',       (now() - interval '5 days')),
  ('a1000010-0000-0000-0000-000000000010',        'user_activated',            'user',               'aa001000-0000-0000-0000-000000000020',        'Fatoumata Traoré20',             null,                                (now() - interval '3 days'))
) AS t(log_id, action, target_type, target_id, target_name, detail, ts)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9 — Organisation d'isolation (test RLS cross-org)
-- ⚠️  Le compte auth user@isolation-org.com est créé via l'Admin API.
--     Ce script insère uniquement le profil et les données org.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Profil (le trigger peut déjà l'avoir créé via Admin API)
INSERT INTO public.profiles (id, firstname, lastname, email, language, status, created_at)
SELECT isolat_id, 'Isolé', 'Test', 'user@isolation-org.com', 'fr', 'active', now()
FROM _seed_ids
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organizations (
  id, name, email, country, city, currency, language, plan, created_at
) VALUES (
  'cc000002-0000-0000-0000-000000000002',
  'Organisation ISOLÉE TEST',
  'contact@isolation-org.com',
  'Sénégal', 'Dakar', 'XOF', 'fr', 'starter', now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (
  id, organization_id, plan, status, currency, amount, discount_percent, created_at
) VALUES (
  'ee000002-0000-0000-0000-000000000002',
  'cc000002-0000-0000-0000-000000000002',
  'starter', 'trial', 'XOF', 45000, 40, now()
) ON CONFLICT (id) DO NOTHING;

-- Isolation user comme admin de son org (UUID dynamique)
INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT
  'cc000002-0000-0000-0000-000000000002',
  isolat_id,
  'admin', 'active'
FROM _seed_ids
ON CONFLICT (organization_id, user_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 10 — Storage buckets
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',     'avatars',     false, 5242880,    ARRAY['image/jpeg','image/png','image/webp']),
  ('documents',   'documents',   false, 52428800,   ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('attachments', 'attachments', false, 26214400,   ARRAY['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Politique storage : avatars
DROP POLICY IF EXISTS "Avatar upload own" ON storage.objects;
CREATE POLICY "Avatar upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatar read org members" ON storage.objects;
CREATE POLICY "Avatar read org members"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Politique storage : documents
DROP POLICY IF EXISTS "Document upload org member" ON storage.objects;
CREATE POLICY "Document upload org member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Document read org member" ON storage.objects;
CREATE POLICY "Document read org member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Document delete own" ON storage.objects;
CREATE POLICY "Document delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND owner::uuid = auth.uid());

-- Politique storage : attachments
DROP POLICY IF EXISTS "Attachment upload org member" ON storage.objects;
CREATE POLICY "Attachment upload org member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Attachment read org member" ON storage.objects;
CREATE POLICY "Attachment read org member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 11 — Réactivation des triggers
-- ═══════════════════════════════════════════════════════════════════════════════

SET session_replication_role = DEFAULT;

DROP TABLE IF EXISTS _seed_ids;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 12 — Tests RLS (à exécuter manuellement pour validation)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ces requêtes doivent être exécutées en tant qu'utilisateur connecté (anon/JWT)
-- pour vérifier l'isolation des données.
-- Récupérer les UUIDs dynamiques :
--   SELECT id FROM auth.users WHERE email = 'user@isolation-org.com';
--   SELECT id FROM auth.users WHERE email = 'user1@test-sarl.com';

/*
-- ─── TEST A : Isolation cross-org ───────────────────────────────────────────
-- Connecté en tant que user@isolation-org.com
-- ATTENDU : 0 résultat (RLS bloque l'accès à org cc000001-…)
-- Remplacer <isolat_uuid> par le résultat de :
--   SELECT id FROM auth.users WHERE email = 'user@isolation-org.com';

SELECT set_config('request.jwt.claim.sub', '<isolat_uuid>', true);
SET ROLE authenticated;

-- 0 lignes attendues (pas membre de TEST SARL)
SELECT count(*) FROM public.organizations
  WHERE id = 'cc000001-0000-0000-0000-000000000001';

SELECT count(*) FROM public.documents
  WHERE organization_id = 'cc000001-0000-0000-0000-000000000001';

SELECT count(*) FROM public.audit_logs
  WHERE organization_id = 'cc000001-0000-0000-0000-000000000001';

-- Réinitialiser
RESET ROLE;

-- ─── TEST B : Limite plan Starter (100 membres) ──────────────────────────────
-- L'application doit détecter le dépassement et proposer Business.
-- Vérification : compter les membres actifs de TEST SARL

SELECT count(*) FROM public.organization_members
  WHERE organization_id = 'cc000001-0000-0000-0000-000000000001'
    AND status = 'active';
-- Résultat attendu : 101 (admin + 100 membres)
-- PLAN_USER_LIMITS.starter = 100 → l'UI doit afficher le prompt de mise à niveau.

-- ─── TEST C : Membre peut voir ses propres données ───────────────────────────
-- Connecté en tant que user1@test-sarl.com (aa001000-…-000000000001)
-- ATTENDU : voit les données de TEST SARL, PAS celles de ISOLATION ORG

SELECT set_config('request.jwt.claim.sub', 'aa001000-0000-0000-0000-000000000001', true);
SET ROLE authenticated;

SELECT count(*) FROM public.organizations
  WHERE id = 'cc000001-0000-0000-0000-000000000001';
-- Attendu : 1

SELECT count(*) FROM public.organizations
  WHERE id = 'cc000002-0000-0000-0000-000000000002';
-- Attendu : 0

RESET ROLE;
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DU SEED — Environment : TEST uniquement
-- Comptes de test (créés via Admin API) :
--   admin@test-sarl.com       / TestKouma2025!     → Admin TEST SARL (101 membres au total)
--   user@isolation-org.com    / IsolationTest2025! → Admin org isolation (test RLS)
-- Membres générés (auth via SQL — ne peuvent pas se connecter) :
--   user1@test-sarl.com … user100@test-sarl.com / TestKouma2025!
-- ═══════════════════════════════════════════════════════════════════════════════
