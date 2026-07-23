# KOUMA — Rapport d'audit architecture
> Produit avant connexion Supabase. Ne pas modifier l'UI avant résolution des points critiques.

---

## 1. État actuel — Résumé

| Couche | État |
|---|---|
| Interface utilisateur | Complète et validée |
| Services métier | Écrits, non connectés (`@ts-nocheck`) |
| Base de données | Types définis, aucune connexion active |
| Authentification | Simulée via `mockUser` |
| Permissions | Frontend uniquement — non sécurisées |
| Notifications | Hardcodées dans le composant |
| Paiements | Stub écrit, SDK non intégré |

---

## 2. Audit des données mock

### 2.1 Fichier source : `src/lib/mock.ts`

Contient toutes les données fictives du prototype :

| Entité | Quantité | Utilisée dans |
|---|---|---|
| `mockUser` | 1 utilisateur courant | AppLayout, Profile, Teams, Agenda, Messages |
| `mockOrgUsers` | 8 utilisateurs | Dashboard, Users, Teams, Departments, Storage, Agenda, Messages, Documents, Journal, Permissions |
| `mockOrgName` | 1 chaîne | AppLayout, AdminLayout, Dashboard, Settings |
| `mockTeams` | 5 équipes | Teams (app + admin), Agenda, Messages, Permissions |
| `mockChannels` | 6 canaux | Messages, Agenda, Teams |
| `mockMessages` | 8 messages | Messages |
| `mockDocuments` | 5 documents | Documents, Storage, Teams |
| `mockEvents` | 5 événements | Agenda |
| `mockAuditLogs` | 10 entrées | Journal |

### 2.2 Fichiers importants `mock.ts`

26 fichiers consomment directement des données mock :

**Layouts (2) :** `AppLayout.tsx`, `AdminLayout.tsx`

**Pages admin (7) :** `Dashboard.tsx`, `Users.tsx`, `Teams.tsx`, `Departments.tsx`, `Storage.tsx`, `Journal.tsx`, `Permissions.tsx`, `Settings.tsx`

**Pages app (5) :** `Messages.tsx`, `Documents.tsx`, `Agenda.tsx`, `Teams.tsx`, `Profile.tsx`

**Composants UI (1) :** `NotificationBell.tsx`

---

## 3. Valeurs hardcodées détectées

### Critique — À supprimer avant Supabase

| Fichier | Valeur | Problème |
|---|---|---|
| `admin/Dashboard.tsx` | `"7"`, `"4,2 Go"`, `"1 247"`, `"38"`, `"+18%"` | Statistiques fixes — ne reflètent aucune donnée réelle |
| `admin/Dashboard.tsx` | `recentActivity` (tableau statique) | Activité fictive non liée au journal |
| `admin/Settings.tsx` | `"7 utilisateurs actifs"`, `"7 / 100"` | Compteurs fixes |
| `admin/Settings.tsx` | `"~5 Mo / 50 Go"` | Stockage fictif |
| `admin/Settings.tsx` | `"23 août 2026"`, `"23 juil. 2027"` | Dates de paiement/remise hardcodées |
| `admin/Settings.tsx` | `email: 'it@nimba-industries.gn'`, `website: ...` | Données Nimba dans l'état initial |
| `admin/Storage.tsx` | `TOTAL_STORAGE = 50 * 1024 * 1024 * 1024` | Quota fixé à 50 Go — doit venir de l'abonnement |
| `admin/Teams.tsx` | `organizationId: 'org1'` | ID fictif lors de la création |
| `app/Agenda.tsx` | `organizationId: 'org1'` | ID fictif lors de la création |
| `app/Messages.tsx` | `'u1'` (4 occurrences) | ID utilisateur courant hardcodé |
| `pages/Landing.tsx` | `"Nimba Industries"` | Nom fictif affiché dans la page publique |
| `NotificationBell.tsx` | `INITIAL_NOTIFS` (4 notifications fixes) | Notifications inventées, non liées à l'activité réelle |

### Non critique — Configuration centralisée (OK)

| Fichier | Valeur | Statut |
|---|---|---|
| `config/pricing.ts` | `PRICING`, `STORAGE`, `TRIAL_DAYS` | ✓ Centralisé, modifiable |
| `config/countries.ts` | Liste des pays + devises | ✓ Données statiques légitimes |

---

## 4. Problèmes d'architecture

### 4.1 Absence d'un contexte d'authentification

`mockUser` remplace partout un vrai utilisateur authentifié. Il n'existe aucun `AuthContext` ou `useAuth()` hook.

Conséquence : toutes les vérifications d'identité sont fictives.

```
Actuel   →  mockUser.id === team.responsableId
Attendu  →  auth.currentUser.id === team.responsableId  (vérifié côté serveur)
```

### 4.2 Permissions uniquement en frontend

Les contrôles d'accès actuels ne sont que visuels (affichage/masquage de boutons).

| Composant | Vérification actuelle | Risque |
|---|---|---|
| `app/Teams.tsx` | `isResponsable = team.responsableId === mockUser.id` | Contournable — pas de vérification serveur |
| `app/Teams.tsx` | `disabled={!isResponsable}` sur les toggles | Un appel API direct bypasserait le contrôle |
| `app/Profile.tsx` | `disabled` sur l'email | Pas de validation serveur |

### 4.3 Logique métier dans les composants

Des règles critiques sont directement dans les pages, sans couche service :

| Logique | Composant | Service attendu |
|---|---|---|
| Filtrage des membres actifs | `Messages.tsx`, `Teams.tsx`, `Agenda.tsx` | `UserService.getActiveMembers()` |
| Création d'un événement | `Agenda.tsx` | `EventService.create()` |
| Gestion des membres d'équipe | `app/Teams.tsx` | `TeamService.updateMembers()` |
| Calcul du stockage utilisé | `admin/Storage.tsx` | `StorageService.getUsage()` |
| Filtrage des logs d'audit | `admin/Journal.tsx` | `AuditService.getLogs()` |

### 4.4 Services écrits mais non utilisés

6 services existent dans `src/services/` mais aucun n'est importé par l'interface :

```
auth.service.ts          → @ts-nocheck
organization.service.ts  → @ts-nocheck
user.service.ts          → @ts-nocheck
team.service.ts          → @ts-nocheck
storage.service.ts       → @ts-nocheck
payment.service.ts       → @ts-nocheck
```

### 4.5 Services manquants

Les services suivants ne sont pas encore écrits :

- `MessageService` — envoi, réception, historique
- `DocumentService` — upload, liste, suppression
- `NotificationService` — push, lecture, compteur
- `PermissionService` — vérification des droits d'équipe
- `AuditService` — écriture et lecture du journal

---

## 5. Carte des données

| Donnée | Source actuelle | Source future | Migration |
|---|---|---|---|
| Utilisateur courant | `mockUser` | `auth.getUser()` via Supabase Auth | Remplacer `mockUser` par `useAuth()` |
| Nom de l'organisation | `mockOrgName` | `OrganizationService.get()` | Remplacer dans AppLayout, AdminLayout |
| Liste des utilisateurs | `mockOrgUsers` | `UserService.list(orgId)` | Remplacer dans tous les composants admin |
| Équipes | `mockTeams` | `TeamService.list(orgId)` | Remplacer dans Teams, Messages, Agenda |
| Canaux & messages | `mockChannels`, `mockMessages` | `MessageService.getChannels()` / `getMessages()` | Remplacer dans Messages |
| Documents | `mockDocuments` | `DocumentService.list(orgId)` | Remplacer dans Documents, Storage, Teams |
| Événements | `mockEvents` | `EventService.list(orgId)` | Remplacer dans Agenda |
| Journal d'audit | `mockAuditLogs` | `AuditService.getLogs(orgId)` | Remplacer dans Journal |
| Notifications | `INITIAL_NOTIFS` (hardcodé) | `NotificationService.getForUser(userId)` | Réécrire NotificationBell |
| Quota stockage | `TOTAL_STORAGE = 50 Go` (fixe) | `subscription.storageQuota` | Lire depuis l'abonnement actif |
| Statistiques dashboard | Tableau statique | Agrégations Supabase | Réécrire `stats` dans Dashboard |
| Activité récente dashboard | Tableau statique | `AuditService.getRecent(orgId, limit: 4)` | Réécrire `recentActivity` |
| ID organisation | `'org1'` (hardcodé) | `auth.currentUser.organizationId` | Remplacer dans Teams, Agenda |
| ID utilisateur courant | `'u1'` (hardcodé) | `auth.currentUser.id` | Remplacer dans Messages (×4) |
| Abonnement actif | Starter simulé | `SubscriptionService.getCurrent(orgId)` | Lier Settings, Storage, Dashboard |
| Permissions d'équipe | `DEFAULT_PERMS` (hardcodé) | `PermissionService.getTeamPerms(teamId)` | Remplacer dans app/Teams |
| Départements | Calculés depuis `mockOrgUsers` | `DepartmentService.list(orgId)` | Remplacer dans Departments |

---

## 6. Architecture backend proposée

### 6.1 Tables Supabase (déjà définies dans `database.types.ts`)

```
profiles              — utilisateurs (liés à auth.users)
organizations         — organisations
organization_members  — appartenance utilisateur ↔ organisation
departments           — départements
teams                 — équipes
team_members          — appartenance utilisateur ↔ équipe
team_permissions      — permissions par équipe
channels              — canaux (direct, groupe, équipe)
channel_members       — appartenance canal
messages              — messages
documents             — métadonnées fichiers
folders               — dossiers
events                — événements agenda
event_participants    — participants
invitations           — invitations par lien
subscriptions         — abonnements
payments              — paiements
notifications         — notifications utilisateur
audit_logs            — journal d'audit
```

### 6.2 Services à finaliser

```
AuthService          → signUp, signIn, signOut, getSession, updatePassword
OrganizationService  → create, get, update
UserService          → list, invite, suspend, activate, revoke
TeamService          → list, create, update, delete, updateMembers, updatePermissions
MessageService       → getChannels, getMessages, send, edit, delete      [À ÉCRIRE]
DocumentService      → list, upload, delete, getByTeam                   [À ÉCRIRE]
EventService         → list, create, update, cancel                      [À ÉCRIRE]
NotificationService  → getForUser, markRead, markAllRead                 [À ÉCRIRE]
PermissionService    → getTeamPerms, updateTeamPerms, checkPerm          [À ÉCRIRE]
AuditService         → log, getLogs, getRecent                           [À ÉCRIRE]
StorageService       → getUsage, getByUser, deleteFile
SubscriptionService  → getCurrent, upgrade, cancel                       [partiel]
PaymentService       → createSession, getHistory                         [partiel]
```

### 6.3 Contexte d'authentification à créer

```tsx
// src/contexts/AuthContext.tsx
interface AuthContext {
  user: User | null
  organization: Organization | null
  subscription: Subscription | null
  loading: boolean
  signOut: () => Promise<void>
}
```

Ce contexte remplace `mockUser` et `mockOrgName` dans toute l'application.

---

## 7. Plan de migration

```
Phase 1 — Nettoyage
  1.1  Créer AuthContext — remplace mockUser partout
  1.2  Remplacer 'u1' et 'org1' hardcodés par le contexte
  1.3  Relier TOTAL_STORAGE à subscription.storageQuota
  1.4  Réécrire NotificationBell — état vide par défaut, prêt pour service
  1.5  Vider les stats hardcodées du Dashboard — états vides + squelettes

Phase 2 — Services manquants
  2.1  Écrire MessageService
  2.2  Écrire DocumentService
  2.3  Écrire EventService
  2.4  Écrire NotificationService
  2.5  Écrire PermissionService
  2.6  Écrire AuditService

Phase 3 — Connexion Supabase TEST
  3.1  Créer projet Supabase TEST
  3.2  Appliquer migrations (tables déjà définies)
  3.3  Configurer RLS (Row Level Security) pour isolation des organisations
  3.4  Retirer @ts-nocheck des services existants
  3.5  Remplacer mock imports par appels service dans chaque composant

Phase 4 — Données de simulation TEST
  4.1  Organisation à 99 utilisateurs → tester dépassement 100
  4.2  Stockage à 80 %, 95 %, 100 %
  4.3  Essai à J-3 d'expiration
  4.4  Invitation expirée, annulée, acceptée
  4.5  Paiement échoué puis relancé

Phase 5 — Tests
  5.1  Fonctionnel : parcours complets end-to-end
  5.2  Permissions : isolation inter-organisations, droits d'équipe
  5.3  Sécurité : RLS, jetons, stockage privé
  5.4  Charge : messages, fichiers, organisations simultanées

Phase 6 — Production
  6.1  Créer projet Supabase PRODUCTION (séparé, aucune donnée de test)
  6.2  Configurer domaine, emails, provider paiement
  6.3  Déploiement
```

---

## 8. Priorités immédiates avant toute connexion backend

| Priorité | Action | Fichiers concernés |
|---|---|---|
| 🔴 Critique | Créer `AuthContext` — supprimer `mockUser` des layouts | `AppLayout`, `AdminLayout`, `Profile`, `Messages`, `Teams`, `Agenda` |
| 🔴 Critique | Supprimer IDs hardcodés `'u1'`, `'org1'` | `Messages.tsx` (×4), `Teams.tsx`, `Agenda.tsx` |
| 🔴 Critique | Lier `TOTAL_STORAGE` à l'abonnement | `admin/Storage.tsx` |
| 🟡 Important | Vider stats Dashboard — afficher `—` ou squelette | `admin/Dashboard.tsx` |
| 🟡 Important | Vider activité récente Dashboard | `admin/Dashboard.tsx` |
| 🟡 Important | Vider Settings — supprimer email/site Nimba | `admin/Settings.tsx` |
| 🟡 Important | NotificationBell — état vide par défaut | `NotificationBell.tsx` |
| 🟢 Préparation | Écrire les 5 services manquants | `src/services/` |
| 🟢 Préparation | Retirer `@ts-nocheck` après correction types | 6 services |
