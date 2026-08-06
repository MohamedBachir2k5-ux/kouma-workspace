# Syli taa — Modèle de données Supabase

## Projet Supabase

- **Environnement TEST** : `vmdikkxnaubavzzfmtco.supabase.co`
- **Jamais** exposer ou utiliser le projet de production dans le code frontend.
- Credentials dans `.env.local` (exclu du repository par `.gitignore`).

## Migrations appliquées

| # | Fichier | Contenu |
|---|---------|---------|
| 001 | `001_initial_schema.sql` | Schéma complet initial — toutes les tables, index, RLS, helpers, trigger |
| 002 | `002_schema_additions.sql` | `organizations.city`, `subscriptions.renews_at` |
| 003 | `003_invitation_email_optional.sql` | Email invitation optionnel |
| 004 | `004_member_profile_fields.sql` | Champs profil membres (`department_id`, `job_title`) |
| 005 | `005_messages_files_realtime.sql` | `messages.files[]`, publication Realtime, policies storage |
| 006 | `006_events_table.sql` | Table `events` (agenda), `event_participants` |
| 007 | `007_user_sessions.sql` | Table `user_sessions`, RLS sessions |
| 008 | `008_e2e_key_infrastructure.sql` | Tables clés E2E, `messages.content_encrypted` |
| 009 | `009_recovery_rls_fix.sql` | Policy `admin_read_all_org_recovery_keys` |
| 010 | `010_storage_update_policy.sql` | Policy UPDATE storage (nécessaire pour upsert avatar/logo) |

## Tables principales

### Identité

```
profiles           — Étend auth.users. Stocke prénom, nom, avatar_url, langue.
organizations      — Entité racine. name, logo_url, country, currency, plan.
organization_members — Lien M-N user ↔ org. role (admin/member), status.
```

### Structure organisationnelle

```
departments        — Unités organisationnelles. Référencées par organization_members.
teams              — Équipes avec owner_id, color.
team_members       — Membres des équipes. role (owner/admin/member).
team_permissions   — Permissions par équipe (invite_members, manage_documents, etc.).
```

### Messagerie

```
conversations      — type: direct/group/team/org. reference_id → teams.id pour type=team.
conversation_members — Participants. last_read_at pour les compteurs non-lus.
messages           — content, content_encrypted (bool), files (text[]), sender_id.
```

### Documents

```
folders            — Dossiers org-scoped. parent_id auto-référentiel. team_id optionnel.
files              — Métadonnées fichiers. storage_path, category (attachment/document).
documents          — Lien folder ↔ file + métadonnées org.
```

### Agenda

```
events             — title, start_at, end_at, location, status (scheduled/done/cancelled).
event_participants — user_id participant.
```

### Sécurité & clés E2E

```
user_key_pairs           — ECDH P-256 par utilisateur. Clé privée AES-GCM wrappée.
org_recovery_keys        — Clé de récupération org par admin. Champs breakglass (bg_*).
conversation_keys        — Clé symétrique AES-256 par conv par user (ECIES-wrappée).
conversation_recovery_keys — Escrow conversation par org.
file_keys                — Clé symétrique AES-256 par fichier par user.
file_recovery_keys       — Escrow fichier par org.
```

### Administration

```
invitations        — Tokens d'invitation (7 jours). status: sent/accepted/expired.
subscriptions      — Un par org. plan, status, trial_ends_at, renews_at.
payments           — Historique paiements LengoPay.
notifications      — Push in-app par user. type, payload, read.
audit_logs         — Journal immuable des actions admin. Jamais de contenu message.
user_sessions      — Sessions actives. device_name, browser, platform, last_seen_at.
```

## Fonctions helpers (SECURITY DEFINER)

Ces fonctions brisent les cycles de récursion RLS :

| Fonction | Rôle |
|----------|------|
| `is_org_member(org_id)` | Vérifie appartenance active à une org |
| `is_org_admin(org_id)` | Vérifie rôle admin dans une org |
| `is_team_member(team_id)` | Vérifie appartenance à une équipe |
| `is_team_owner_or_admin(team_id)` | Vérifie rôle owner/admin dans une équipe |
| `is_group_member_fn(group_id)` | Vérifie appartenance à un groupe |
| `is_conversation_member(conv_id)` | Vérifie participation à une conversation |

## Storage

Bucket : `attachments`

Conventions de chemin (toutes org-scopées pour RLS) :

| Usage | Chemin |
|-------|--------|
| Pièces jointes messages | `{orgId}/{conversationId}/{timestamp}_{filename}` |
| Documents chiffrés | `{orgId}/docs/{userId}/{timestamp}_{filename}.enc` |
| Documents non chiffrés | `{orgId}/docs/{userId}/{timestamp}_{filename}` |
| Avatars utilisateurs | `{orgId}/avatars/{userId}.{ext}` |
| Logos organisations | `{orgId}/logos/{orgId}.{ext}` |

**Règle critique** : Le premier segment de chemin doit toujours être `{orgId}` pour satisfaire la politique RLS storage.

## Realtime

Table `messages` publiée dans `supabase_realtime`. Les composants s'abonnent via `MessageService.subscribe()` — jamais directement depuis les composants.
