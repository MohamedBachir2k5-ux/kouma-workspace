-- Performance test seed — Syli taa Demo org (aaaaaaaa-0000-0000-0000-000000000001)
-- Creates Bob Perf + 1000 conversations with demo@kouma.local
-- Safe to re-run (ON CONFLICT DO NOTHING everywhere)

BEGIN;

-- ── 1. Second test user ─────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  'cccccccc-0001-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'bob.perf@gundo.local',
  crypt('perftest123', gen_salt('bf')),
  now(),
  '{"firstname":"Bob","lastname":"Perf"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, firstname, lastname, email, language, status)
VALUES (
  'cccccccc-0001-0000-0000-000000000001',
  'Bob', 'Perf', 'bob.perf@gundo.local', 'fr', 'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role, status)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'cccccccc-0001-0000-0000-000000000001',
  'member', 'active'
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ── 2. 1000 direct conversations + messages ─────────────────────────────────
DO $$
DECLARE
  i         INTEGER;
  conv_id   UUID;
  demo_id   UUID := '8c3af125-3f8e-413e-a7c4-1af26794864b';
  bob_id    UUID := 'cccccccc-0001-0000-0000-000000000001';
  org_id    UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  msg_count INTEGER;
  j         INTEGER;
  sender    UUID;
  msgs      TEXT[] := ARRAY[
    'Salut, comment ça va ?',
    'Bonjour ! Tu as regardé le rapport ?',
    'Oui, je l''ai lu ce matin.',
    'Super, on en parle en réunion ?',
    'D''accord, à quelle heure ?',
    'Disons 14h, ça te convient ?',
    'Parfait, je serai là.',
    'N''oublie pas les slides.',
    'Je les ai déjà préparées.',
    'Excellent travail !',
    'Merci, c''était complexe.',
    'Je sais, tu t''en es bien sorti.',
    'On refait ça la semaine prochaine ?',
    'Oui, je bloque le créneau.',
    'Envoyé. Tu as reçu l''invitation ?',
    'Oui, c''est dans mon agenda.',
    'Le client a appelé ce matin.',
    'Et alors, il est satisfait ?',
    'Plutôt oui, quelques ajustements mineurs.',
    'Je peux voir les détails ?',
    'Je te transfère le mail.',
    'Reçu, je regarde ça maintenant.',
    'Prends ton temps.',
    'Ok, j''ai des questions sur le point 3.',
    'Je t''écoute.',
    'C''est un peu flou dans le contrat.',
    'Tu as raison, on clarifie avec le juridique.',
    'Je contacte Marie alors ?',
    'Oui, elle est la plus à jour.',
    'Je reviens vers toi rapidement.'
  ];
BEGIN
  FOR i IN 1..1000 LOOP
    conv_id := gen_random_uuid();

    INSERT INTO conversations (id, type, organization_id, created_at)
    VALUES (
      conv_id, 'direct', org_id,
      now() - ((random() * 180)::int || ' days')::interval
    );

    INSERT INTO conversation_members (conversation_id, user_id, last_read_at)
    VALUES
      (conv_id, demo_id, now() - ((random() * 5)::int || ' hours')::interval),
      (conv_id, bob_id,  now() - ((random() * 5)::int || ' hours')::interval);

    -- First 50 = heavy (150–249 messages), rest = light (2–8 messages)
    IF i <= 50 THEN
      msg_count := 150 + floor(random() * 100)::int;
    ELSE
      msg_count := 2 + floor(random() * 7)::int;
    END IF;

    FOR j IN 1..msg_count LOOP
      sender := CASE WHEN random() > 0.45 THEN demo_id ELSE bob_id END;
      INSERT INTO messages (
        id, conversation_id, sender_id, content, status, created_at, content_encrypted
      ) VALUES (
        gen_random_uuid(),
        conv_id,
        sender,
        msgs[1 + (floor(random() * array_length(msgs, 1)))::int],
        'sent',
        now() - ((random() * 180)::int || ' days')::interval
                - ((random() * 24)::int || ' hours')::interval,
        false
      );
    END LOOP;

  END LOOP;
END $$;

COMMIT;
