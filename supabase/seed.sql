-- ═══════════════════════════════════════════════════════════════════════════════
-- seed.sql — Kouma Workspace TEST Environment
-- ⚠️  JAMAIS exécuter sur la production.
-- Prérequis : migrations 001 et 002 appliquées.
-- Exécuter dans le SQL Editor Supabase (rôle postgres / service_role).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Désactiver temporairement les triggers pour l'insertion en masse
SET session_replication_role = replica;

-- ─── UUIDs fixes (pour pouvoir les référencer entre sections) ────────────────

-- Organisation principale
-- org_main   : 'cc000001-0000-0000-0000-000000000001'
-- Admin user : 'aa000001-0000-0000-0000-000000000001'
-- Abonnement : 'ee000001-0000-0000-0000-000000000001'
-- Équipes    : 'bb000001-…' à 'bb000004-…'

-- Organisation d'isolation (test RLS)
-- org_iso    : 'cc000002-0000-0000-0000-000000000002'
-- User iso   : 'aa000002-0000-0000-0000-000000000002'


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1 — Utilisateur admin TEST SARL
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  'aa000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@test-sarl.com',
  crypt('TestKouma2025!', gen_salt('bf')),
  now(),
  '{"firstname":"Admin","lastname":"SARL"}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Profil admin (le trigger est désactivé — insertion manuelle)
INSERT INTO public.profiles (id, firstname, lastname, email, language, status, created_at)
VALUES (
  'aa000001-0000-0000-0000-000000000001',
  'Admin', 'SARL',
  'admin@test-sarl.com',
  'fr', 'active', now() - interval '90 days'
) ON CONFLICT (id) DO NOTHING;


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
  (now() - interval '60 days')::date::text,
  (now() + interval '30 days')::date::text,
  40,
  (now() + interval '305 days')::date::text,
  now() - interval '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Admin comme membre admin de l'organisation
INSERT INTO public.organization_members (organization_id, user_id, role, status)
VALUES (
  'cc000001-0000-0000-0000-000000000001',
  'aa000001-0000-0000-0000-000000000001',
  'admin', 'active'
) ON CONFLICT (organization_id, user_id) DO NOTHING;


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

INSERT INTO public.teams (id, organization_id, name, description, color, owner_id, created_at) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'Direction Générale',   'Comité de direction',       '#0f1628', 'aa000001-0000-0000-0000-000000000001', now() - interval '85 days'),
  ('bb000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'Finance',              'Gestion comptable',         '#16a34a', 'aa001000-0000-0000-0000-000000000003', now() - interval '80 days'),
  ('bb000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'Ressources Humaines',  'Recrutement et formation',  '#7c3aed', 'aa001000-0000-0000-0000-000000000005', now() - interval '78 days'),
  ('bb000004-0000-0000-0000-000000000004', 'cc000001-0000-0000-0000-000000000001', 'Informatique',         'Infrastructure et dev',     '#0891b2', 'aa001000-0000-0000-0000-000000000004', now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

-- Membres des équipes (admin dans toutes + quelques users)
INSERT INTO public.team_members (team_id, user_id, role) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'owner'),
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

-- Fichiers
INSERT INTO public.files (id, owner_id, organization_id, storage_path, name, type, size, category, created_at) VALUES
  ('fi000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'documents/rapport-q2-2025.pdf',          'Rapport Q2 2025.pdf',              'pdf',  2400000, 'document', now() - interval '2 days'),
  ('fi000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'documents/organigramme-2025.docx',       'Organigramme 2025.docx',           'docx',  450000, 'document', now() - interval '5 days'),
  ('fi000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'documents/budget-previsionnel.xlsx',     'Budget prévisionnel.xlsx',         'xlsx',  890000, 'document', now() - interval '7 days'),
  ('fi000004-0000-0000-0000-000000000004', 'aa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'documents/contrat-fournisseur.pdf',      'Contrat fournisseur Bauxite SA.pdf','pdf', 1200000, 'document', now() - interval '10 days'),
  ('fi000005-0000-0000-0000-000000000005', 'aa001000-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'documents/procedure-onboarding.pdf',     'Procédure onboarding.pdf',         'pdf',   320000, 'document', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- Documents (pointent vers les fichiers)
INSERT INTO public.documents (id, organization_id, folder_id, owner_id, title, file_id, created_at) VALUES
  ('dc000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'ff000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'Rapport Q2 2025',              'fi000001-0000-0000-0000-000000000001', now() - interval '2 days'),
  ('dc000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'ff000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'Organigramme 2025',            'fi000002-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('dc000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'ff000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000003', 'Budget prévisionnel',          'fi000003-0000-0000-0000-000000000003', now() - interval '7 days'),
  ('dc000004-0000-0000-0000-000000000004', 'cc000001-0000-0000-0000-000000000001', null,                                   'aa000001-0000-0000-0000-000000000001', 'Contrat fournisseur Bauxite SA','fi000004-0000-0000-0000-000000000004', now() - interval '10 days'),
  ('dc000005-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'ff000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000005', 'Procédure onboarding',         'fi000005-0000-0000-0000-000000000005', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7 — Conversations et messages
-- ═══════════════════════════════════════════════════════════════════════════════

-- Conversation d'équipe Direction Générale
INSERT INTO public.conversations (id, type, organization_id, reference_id, created_at) VALUES
  ('co000001-0000-0000-0000-000000000001', 'team', 'cc000001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', now() - interval '85 days'),
  ('co000002-0000-0000-0000-000000000002', 'team', 'cc000001-0000-0000-0000-000000000001', 'bb000002-0000-0000-0000-000000000002', now() - interval '80 days'),
  ('co000003-0000-0000-0000-000000000003', 'direct', 'cc000001-0000-0000-0000-000000000001', null, now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Membres des conversations
INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
  ('co000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001'),
  ('co000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000001'),
  ('co000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000002'),
  ('co000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000003'),
  ('co000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000004'),
  ('co000003-0000-0000-0000-000000000003', 'aa000001-0000-0000-0000-000000000001'),
  ('co000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000001')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Messages
INSERT INTO public.messages (id, conversation_id, sender_id, content, status, created_at) VALUES
  ('ms000001-0000-0000-0000-000000000001', 'co000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'Réunion budget confirmée pour vendredi 10h00.',              'read', now() - interval '12 minutes'),
  ('ms000002-0000-0000-0000-000000000002', 'co000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000001', 'Confirmé. Je prépare les slides d''ici jeudi soir.',          'read', now() - interval '10 minutes'),
  ('ms000003-0000-0000-0000-000000000003', 'co000001-0000-0000-0000-000000000001', 'aa001000-0000-0000-0000-000000000002', 'Parfait. J''enverrai les convocations officielles ce soir.', 'read', now() - interval '8 minutes'),
  ('ms000004-0000-0000-0000-000000000004', 'co000002-0000-0000-0000-000000000002', 'aa001000-0000-0000-0000-000000000003', 'Les chiffres du trimestre ont été validés.',                 'read', now() - interval '2 hours'),
  ('ms000005-0000-0000-0000-000000000005', 'co000003-0000-0000-0000-000000000003', 'aa001000-0000-0000-0000-000000000001', 'Le rapport est prêt, je te l''envoie.',                      'sent', now() - interval '45 minutes')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8 — Audit logs
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.audit_logs (id, organization_id, user_id, action, target_type, target_id, target_name, detail, created_at) VALUES
  ('al000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'organization_created', 'organization', 'cc000001-0000-0000-0000-000000000001', 'Organisation TEST SARL',  null,                        now() - interval '90 days'),
  ('al000002-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'team_created',         'team',         'bb000001-0000-0000-0000-000000000001', 'Direction Générale',       null,                        now() - interval '85 days'),
  ('al000003-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'team_created',         'team',         'bb000002-0000-0000-0000-000000000002', 'Finance',                  null,                        now() - interval '80 days'),
  ('al000004-0000-0000-0000-000000000004', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'invite_generated',     null,           null,                                   null,                       'user50@test-sarl.com',      now() - interval '50 days'),
  ('al000005-0000-0000-0000-000000000005', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'user_joined',          'user',         'aa001000-0000-0000-0000-000000000001', 'Mamadou Bah1',             null,                        now() - interval '89 days'),
  ('al000006-0000-0000-0000-000000000006', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'document_added',       'document',     'dc000001-0000-0000-0000-000000000001', 'Rapport Q2 2025.pdf',      'Dossier Finance',           now() - interval '2 days'),
  ('al000007-0000-0000-0000-000000000007', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'permission_changed',   'team',         'bb000002-0000-0000-0000-000000000002', 'Finance',                  'manage_documents activé',   now() - interval '10 days'),
  ('al000008-0000-0000-0000-000000000008', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'subscription_changed', 'subscription', 'ee000001-0000-0000-0000-000000000001', null,                       'Passage trial → active',    now() - interval '60 days'),
  ('al000009-0000-0000-0000-000000000009', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'user_suspended',       'user',         'aa001000-0000-0000-0000-000000000020', 'Fatoumata Traoré20',       'Accès bloqué temporairement', now() - interval '5 days'),
  ('al000010-0000-0000-0000-000000000010', 'cc000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'user_activated',       'user',         'aa001000-0000-0000-0000-000000000020', 'Fatoumata Traoré20',       null,                        now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9 — Organisation d'isolation (test RLS cross-org)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Cette organisation simule un attaquant ou une autre organisation légitime.
-- Son utilisateur NE DOIT PAS voir les données de TEST SARL.

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  'aa000002-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'user@isolation-org.com',
  crypt('IsolationTest2025!', gen_salt('bf')),
  now(),
  '{"firstname":"Isolé","lastname":"Test"}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, firstname, lastname, email, language, status, created_at)
VALUES (
  'aa000002-0000-0000-0000-000000000002',
  'Isolé', 'Test', 'user@isolation-org.com', 'fr', 'active', now()
) ON CONFLICT (id) DO NOTHING;

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

INSERT INTO public.organization_members (organization_id, user_id, role, status)
VALUES (
  'cc000002-0000-0000-0000-000000000002',
  'aa000002-0000-0000-0000-000000000002',
  'admin', 'active'
) ON CONFLICT (organization_id, user_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 10 — Storage buckets
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',     'avatars',     false, 5242880,    ARRAY['image/jpeg','image/png','image/webp']),
  ('documents',   'documents',   false, 52428800,   ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('attachments', 'attachments', false, 26214400,   ARRAY['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Politique storage : avatars — lecture par membres org, upload par propriétaire
CREATE POLICY IF NOT EXISTS "Avatar upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Avatar read org members"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Politique storage : documents — accès réservé aux membres de l'org propriétaire
CREATE POLICY IF NOT EXISTS "Document upload org member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY IF NOT EXISTS "Document read org member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY IF NOT EXISTS "Document delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND owner::uuid = auth.uid());

-- Politique storage : attachments — membres de l'org
CREATE POLICY IF NOT EXISTS "Attachment upload org member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY IF NOT EXISTS "Attachment read org member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    public.is_org_member((storage.foldername(name))[1]::uuid)
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 11 — Réactivation des triggers
-- ═══════════════════════════════════════════════════════════════════════════════

SET session_replication_role = DEFAULT;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 12 — Tests RLS (à exécuter manuellement pour validation)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ces requêtes doivent être exécutées en tant qu'utilisateur connecté (anon/JWT)
-- pour vérifier l'isolation des données.

/*
-- ─── TEST A : Isolation cross-org ───────────────────────────────────────────
-- Connecté en tant que user@isolation-org.com
-- ATTENDU : 0 résultat (RLS bloque l'accès à org cc000001-…)

SELECT set_config('request.jwt.claim.sub', 'aa000002-0000-0000-0000-000000000002', true);
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
-- Connecté en tant que user1@test-sarl.com
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
-- Comptes de test :
--   admin@test-sarl.com       / TestKouma2025!   → Admin TEST SARL (101 membres au total)
--   user1@test-sarl.com       / TestKouma2025!   → Membre standard TEST SARL
--   user@isolation-org.com    / IsolationTest2025! → Accès isolation (autre org)
-- ═══════════════════════════════════════════════════════════════════════════════
