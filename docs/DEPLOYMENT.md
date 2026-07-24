# Gundo — Procédures de déploiement

## Prérequis

- Node.js 20+
- Un projet Supabase (TEST ou production)
- `.env.local` configuré (voir `.env.example`)

## Variables d'environnement

```bash
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={anon-key}
VITE_APP_URL=https://votre-domaine.com
VITE_APP_ENV=production
```

**Jamais** committer `.env.local` — exclu par `.gitignore`.

## Développement local

```bash
npm install
npm run dev        # Vite dev server sur http://localhost:3007
npm test           # Tests de sécurité crypto (15 tests Vitest)
npm run build      # Build de production dans dist/
```

## Appliquer les migrations Supabase

```bash
# Depuis un répertoire avec supabase/config.toml initialisé :
supabase link --project-ref {project-ref}
supabase db push

# Ou via l'éditeur SQL Supabase Dashboard :
# Copier/coller chaque fichier supabase/migrations/*.sql dans l'ordre numérique.
```

## Ordre des migrations

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009 → 010
```

Ne jamais sauter une migration. Chaque migration est additive (IF NOT EXISTS / ALTER IF NOT EXISTS).

## Build production

```bash
npm run build
# Sortie : dist/
# dist/index.html + dist/assets/
```

Déployer `dist/` sur n'importe quel CDN statique (Netlify, Vercel, Cloudflare Pages).

Configuration SPA nécessaire : toutes les routes inconnues → `index.html`.

### Netlify

`netlify.toml` :
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

`vercel.json` :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Bucket Storage Supabase

Créer le bucket `attachments` manuellement dans Supabase Dashboard → Storage :
- Nom : `attachments`
- Public : Non (privé)
- Limit de taille par fichier : 50MB (ou selon le plan)

Les politiques RLS storage sont appliquées par la migration 005 et 010.

## Checklist avant mise en production

- [ ] Migrations 001 → 010 appliquées dans l'ordre
- [ ] Bucket `attachments` créé (privé)
- [ ] Variables d'environnement production configurées
- [ ] `.env.local` exclu du repository (vérifier `git status`)
- [ ] `npm run build` sans erreur TypeScript
- [ ] `npm test` : 15/15 tests passés
- [ ] Supabase Auth → Email confirmations configurées
- [ ] Supabase Auth → Password recovery URL = `{APP_URL}/reset-password`
- [ ] Domaine ajouté dans Supabase Auth → URL Configuration

## Supabase Auth — Configuration requise

1. **Site URL** : `https://votre-domaine.com`
2. **Redirect URLs** : `https://votre-domaine.com/**`
3. **Email templates** → Reset Password → `{APP_URL}/reset-password`
4. **Disable email confirmations** : optionnel pendant les tests. En production : activer la confirmation.
