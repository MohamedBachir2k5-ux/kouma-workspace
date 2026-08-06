# Syli taa — Système de permissions

## Modèle de rôles

### Rôles globaux (organization_members.role)

| Rôle | Accès |
|------|-------|
| `admin` | Console /admin/* + tout l'espace collaborateur. Voit les métadonnées org (pas le contenu des messages chiffrés). |
| `member` | Espace collaborateur /app/* uniquement. |

### Rôles équipe (team_members.role)

| Rôle | Capacités |
|------|-----------|
| `owner` | Modifier l'équipe, gérer les membres, définir les permissions |
| `admin` | Gérer les membres |
| `member` | Accès lecture |

### Statuts utilisateur (organization_members.status)

| Statut | Comportement |
|--------|-------------|
| `active` | Accès normal |
| `suspended` | Compte désactivé temporairement. Login refusé par RLS. |
| `deleted` | Exclure des requêtes. 7 jours de grâce pour restauration. |
| `invited` | Invitation envoyée, pas encore acceptée |

## Permissions équipe (team_permissions)

Champs booléens dans la table `team_permissions` :

| Clé | Description |
|-----|-------------|
| `invite_members` | Peut inviter de nouveaux membres dans l'équipe |
| `manage_documents` | Peut créer/modifier/supprimer les documents d'équipe |
| `manage_events` | Peut créer/modifier les événements agenda d'équipe |
| `admin_space` | Peut modifier les paramètres de l'équipe |

Seul le `owner` peut modifier ces permissions.

## RLS — Isolation des organisations

Chaque table applique une politique RLS qui vérifie l'appartenance via `is_org_member(org_id)` ou `is_org_admin(org_id)`.

**Règle fondamentale** : Un utilisateur de l'Organisation A ne peut **jamais** lire les données de l'Organisation B, même avec un accès direct à l'API Supabase.

## RLS — Confidentialité des messages

Les admins **ne peuvent pas** lire le contenu des conversations privées :
- La table `conversations` est accessible seulement via `is_conversation_member()`.
- Même les admins org ne sont pas membres des conversations privées par défaut.
- Le chiffrement E2E renforce cette isolation : même si un admin avait accès à la ligne SQL, il ne peut pas déchiffrer sans la clé de conversation.

Exception : Clés de récupération org (`org_recovery_keys`) → accès légal uniquement via breakglass, tracé dans `audit_logs`.

## Page AdminPermissions (/admin/permissions)

Interface admin pour configurer les permissions globales des rôles `member` vs `admin` sur les modules (messagerie, documents, agenda, équipes). Stocké dans `team_permissions` ou une future table `org_permissions`.

## Vérifications d'autorisation côté service

```typescript
// Avant toute opération admin-only
const adminCount = await UserService.getAdminCount(orgId)
// ex: impossible de retirer le dernier admin

// Avant promotion admin
await KeyService.distributeRecoveryKeyToAdmin(orgId, newAdminId)
// distribue la clé de récupération org au nouvel admin
```
