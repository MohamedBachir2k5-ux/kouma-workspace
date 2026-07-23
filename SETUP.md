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

### Étape C — Charger les données TEST (optionnel)

```sql
-- Uniquement sur l'environnement TEST, jamais sur PROD
-- Contenu de : supabase/seed.sql
```

Le seed crée :
- Organisation TEST SARL (101 membres, plan Starter)
- 4 équipes avec membres et permissions
- Documents, messages, audit logs
- Organisation d'isolation pour tester le RLS cross-org
- Comptes de test (voir fin du fichier seed.sql)

### Étape D — Configurer les variables

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

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@test-sarl.com` | `TestKouma2025!` | Admin TEST SARL |
| `user1@test-sarl.com` | `TestKouma2025!` | Membre standard |
| `user@isolation-org.com` | `IsolationTest2025!` | Autre organisation (test RLS) |
