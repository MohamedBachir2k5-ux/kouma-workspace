# Kouma Workspace

Plateforme SaaS de gestion d'équipe pour les organisations africaines.

Stack : React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase

---

## Architecture

```
Frontend (React)
    └── Services métier (src/services/)
            └── Supabase (base de données + auth + storage)
```

Les composants React ne communiquent **jamais** directement avec Supabase.
Toute interaction passe par la couche service.

---

## Environnements

| Environnement | Usage | Base de données |
|---|---|---|
| `local` | Développement — données mock si pas de credentials | aucune (mock) ou Supabase TEST |
| `test` | Validation fonctionnelle et sécurité | Supabase TEST |
| `production` | Clients réels | Supabase PROD (séparée) |

**Règle absolue : ne jamais pointer le frontend vers Supabase PROD depuis un environnement de développement.**

---

## Installation

Voir [SETUP.md](./SETUP.md) pour les instructions complètes.

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # http://localhost:3007
```

---

## Structure du projet

```
src/
├── components/        # Composants UI réutilisables
├── contexts/          # AuthContext (session Supabase)
├── config/            # Pricing, pays, i18n
├── lib/               # Types, mock data, utils, client Supabase
├── pages/             # Pages de l'application
│   ├── admin/         # Console d'administration
│   ├── app/           # Espace utilisateur
│   └── auth/          # Connexion, inscription, invitation
└── services/          # Couche service (seule interface avec Supabase)

supabase/
├── migrations/        # Schéma SQL versionné
│   ├── 001_initial_schema.sql
│   └── 002_schema_additions.sql
└── seed.sql           # Données TEST (jamais en production)
```

---

## Commandes

```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run lint      # Oxlint
npx tsc --noEmit  # Vérification TypeScript
```

---

## Migrations Supabase

Pour reconstruire un environnement depuis zéro :

```sql
-- Dans le SQL Editor Supabase (ordre obligatoire) :
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_schema_additions.sql
-- 3. supabase/seed.sql   ← TEST uniquement, jamais en production
```

---

## Sécurité

- Aucune clé secrète dans le code source
- RLS (Row Level Security) activé sur toutes les tables
- Isolation stricte entre organisations via `is_org_member()`
- Buckets storage privés (avatars, documents, pièces jointes)
- `.env.local` exclu du versionnement (voir `.gitignore`)
