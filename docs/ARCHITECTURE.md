# Gundo — Architecture Générale

## Vue d'ensemble

Gundo est un workspace collaboratif SaaS ciblant les organisations africaines. Il combine messagerie chiffrée bout-en-bout, gestion documentaire, agenda et gestion d'équipes, le tout sous un modèle multi-tenant strict.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + TypeScript + Vite |
| Styles | TailwindCSS 4 |
| Routing | React Router 6 |
| i18n | react-i18next |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Cryptographie | Web Crypto API (navigateur natif) |
| Tests | Vitest + jsdom |

## Règle d'architecture absolue

```
Composants React → Services métier → Supabase
```

Les composants React ne doivent **jamais** appeler Supabase directement. Toutes les opérations de données passent par les services dans `src/services/`.

## Structure des dossiers

```
src/
├── components/        # Composants UI réutilisables
│   ├── layout/        # AppLayout, AdminLayout
│   └── ui/            # Avatar, Badge, NotificationBell
├── config/            # Pricing, pays, devises
├── contexts/          # AuthContext (session globale)
├── hooks/             # useRequireAuth
├── i18n/              # Traductions (fr, en, pt, es)
├── lib/               # Types, utils, supabase client, crypto-session
├── pages/
│   ├── admin/         # Console administrateur (/admin/*)
│   ├── app/           # Application collaborateur (/app/*)
│   ├── auth/          # Authentification (/connexion/*, /creer, etc.)
│   ├── legal/         # Pages légales
│   └── solutions/     # Pages marketing solutions
└── services/          # Couche métier — seule à appeler Supabase
    └── __tests__/     # Tests de sécurité cryptographiques

supabase/
└── migrations/        # Schéma SQL versionné (001 → 010)

docs/                  # Documentation technique permanente
```

## Deux espaces distincts

### /app/* — Espace collaborateur
- Accès via connexion PIN à 6 chiffres
- Navigation : Messages, Documents, Agenda, Équipes, Profil
- Toutes les données sont org-scoped par RLS Supabase
- Les messages et fichiers sont chiffrés E2E si crypto session active

### /admin/* — Console administrateur
- Accès via email + mot de passe
- Navigation : Dashboard, Utilisateurs, Départements, Équipes, Stockage, Sécurité, Journal, Permissions, Paramètres
- Admins voient les métadonnées org mais pas le contenu des messages (RLS)

## Services métier

| Service | Responsabilités |
|---------|----------------|
| `auth.service.ts` | signUp, signIn, signOut, updatePassword, réinitialisation |
| `user.service.ts` | profils, membres org, invitations, rôles, avatar |
| `organization.service.ts` | org CRUD, logo, abonnement, essai |
| `team.service.ts` | équipes, membres, CRUD |
| `department.service.ts` | départements CRUD |
| `message.service.ts` | conversations, messages, chiffrement, realtime, PJ |
| `document.service.ts` | documents, dossiers, upload/download chiffré |
| `event.service.ts` | agenda, réunions, participants |
| `notification.service.ts` | notifications en temps réel |
| `audit.service.ts` | journal d'audit immuable |
| `session.service.ts` | sessions actives, heartbeat, révocation |
| `permission.service.ts` | permissions par équipe |
| `storage.service.ts` | gestion du quota de stockage |
| `payment.service.ts` | upgrade abonnement (LengoPay) |
| `recovery.service.ts` | récupération de compte (breakglass) |
| `crypto.service.ts` | primitives cryptographiques Web Crypto |
| `key.service.ts` | cycle de vie des clés E2E |
