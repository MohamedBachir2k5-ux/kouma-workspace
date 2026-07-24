# Setup — Kouma Workspace

Instructions pour démarrer le projet sur une nouvelle machine ou recréer un environnement.

---

## Prérequis

- Node.js 20+
- npm 10+
- Un projet Supabase (TEST ou PROD) — optionnel pour le développement local

---

## 1. Cloner le dépôt

```bash
git clone https://github.com/<org>/kouma-workspace.git
cd kouma-workspace
npm install
```

---

## 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Ouvrir `.env.local` et remplir :

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-publique>
VITE_APP_URL=http://localhost:3007
VITE_APP_ENV=development
```

> La clé `anon` est publique (côté client). Ne jamais mettre la `service_role` dans le frontend.

**Sans credentials Supabase** : l'application fonctionne en mode mock (données fictives). Utile pour travailler sur l'UI sans accès réseau.

---

## 3. Lancer le projet

```bash
npm run dev
# → http://localhost:3007
```

---

## 4. Reconstruire un environnement Supabase depuis zéro

### Étape A — Créer le projet sur supabase.com

1. Créer un nouveau projet (nommer clairement : `kouma-test` ou `kouma-prod`)
2. Choisir la région la plus proche des utilisateurs
3. Noter l'URL et la clé `anon` (Settings → API)

### Étape B — Appliquer les migrations

Dans le **SQL Editor** de Supabase, exécuter dans l'ordre :

```sql
-- 1. Schéma principal (tables, RLS, fonctions, triggers)
-- Contenu de : supabase/migrations/001_initial_schema.sql

-- 2. Ajouts de colonnes
-- Contenu de : supabase/migrations/002_schema_additions.sql
```

### Étape C — Créer les comptes nommés via l'Admin API

Le seed SQL ne peut pas créer des comptes GoTrue authentifiables. Il faut les
créer via l'Admin API **avant** d'exécuter le seed :

```bash
# Remplacer <SERVICE_ROLE_KEY> par la clé service_role du projet TEST
# (Settings → API → service_role — ne jamais l'exposer côté client)

curl -X POST https://vmdikkxnaubavzzfmtco.supabase.co/auth/v1/admin/users \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test-sarl.com","password":"TestKouma2025!","email_confirm":true,"user_metadata":{"firstname":"Admin","lastname":"SARL"}}'

curl -X POST https://vmdikkxnaubavzzfmtco.supabase.co/auth/v1/admin/users \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@isolation-org.com","password":"IsolationTest2025!","email_confirm":true,"user_metadata":{"firstname":"Isolé","lastname":"Test"}}'
```

Ou depuis le Dashboard Supabase : **Authentication → Users → Invite user**.

> Ces deux comptes doivent exister dans `auth.users` avant l'étape D.
> Le seed échoue explicitement s'ils sont absents.

### Étape D — Charger les données TEST (optionnel)

```sql
-- Uniquement sur l'environnement TEST, jamais sur PROD
-- Contenu de : supabase/seed.sql
```

Le seed crée :
- Organisation TEST SARL (101 membres, plan Starter)
- 4 équipes avec membres et permissions
- Documents, messages, audit logs
- Organisation d'isolation pour tester le RLS cross-org

### Étape E — Configurer les variables

Copier l'URL et la clé `anon` du nouveau projet dans `.env.local`.

---

## 5. Séparation des environnements

```
VITE_APP_ENV=development  →  Supabase TEST
VITE_APP_ENV=production   →  Supabase PROD
```

**Ne jamais utiliser les credentials PROD dans `.env.local` sur une machine de développement.**

---

## 6. Vérifications avant livraison

```bash
npx tsc --noEmit    # 0 erreur TypeScript
npm run lint        # 0 erreur Oxlint
npm run build       # Build propre
```

Vérifier que `.env.local` n'est pas dans le dépôt :

```bash
git status          # .env.local ne doit pas apparaître
git ls-files | grep env  # doit retourner uniquement .env.example
```

---

## 7. Ajouter un développeur

1. Inviter sur le dépôt GitHub (accès en lecture minimum)
2. Partager les credentials Supabase TEST via un gestionnaire de mots de passe (pas par email/chat)
3. Le développeur suit les étapes 1 à 3 de ce guide
4. **Jamais** partager les credentials Supabase PROD

---

## Comptes de test disponibles (Supabase TEST uniquement)

| Email | Mot de passe | Rôle | Peut se connecter |
|---|---|---|---|
| `admin@test-sarl.com` | `TestKouma2025!` | Admin TEST SARL | ✅ (créé via Admin API) |
| `user@isolation-org.com` | `IsolationTest2025!` | Admin org isolation (test RLS) | ✅ (créé via Admin API) |
| `user1@test-sarl.com` … `user100@test-sarl.com` | — | Membres générés TEST SARL | ❌ (insérés via SQL, non authentifiables via GoTrue) |

> Les membres générés (`user1` à `user100`) existent comme données dans `profiles` et
> `organization_members` mais ne peuvent pas s'authentifier. Ils servent uniquement à
> simuler un plan Starter à 101 membres (dépassement de quota).
