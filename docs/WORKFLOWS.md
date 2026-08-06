# Syli taa — Workflows utilisateur

## 1. Création d'organisation (admin fondateur)

```
/creer (CreateOrg.tsx)
  Étape 1 : Informations org (nom, type, pays, ville, langue, devise)
  Étape 2 : Compte admin (prénom, nom, email, téléphone, mot de passe)
  Étape 3 : Confirmation récapitulative
  → handleSubmit() :
      AuthService.signUp()                          [Supabase Auth]
      KeyService.generateAndStoreUserKeys(id, pwd)  [ECDH P-256 + wrap]
      OrganizationService.create()                  [org + member admin]
      KeyService.generateOrgRecoveryKeys(orgId)     [recovery pair + breakglass]
  Étape 4 : Affichage phrase breakglass (une seule fois)
  → navigate('/admin/tableau-de-bord')
```

## 2. Connexion collaborateur (PIN)

```
/connexion/utilisateur (UserLogin.tsx)
  Étape 1 : Email → setStep('pin')
  Étape 2 : PIN 6 chiffres
  → handleSubmit() :
      AuthService.signIn(email, pin)
      OrganizationService.getForUser(userId)
      KeyService.loadUserKeys(userId, pin, orgId)   [charge cryptoSession]
  → navigate('/app/messages')
```

## 3. Connexion admin (email + mot de passe)

```
/connexion/admin (AdminLogin.tsx)
  → AuthService.signIn(email, password)
  → KeyService.loadUserKeys(userId, password, orgId)
  → navigate('/admin/tableau-de-bord')
```

## 4. Invitation et onboarding collaborateur

```
Admin → /admin/utilisateurs → Générer lien
  UserService.invite(orgId, actorId)  →  invitations.token (UUID hex)
  URL partagée : /rejoindre/{token}

Collaborateur → /rejoindre/{token} (JoinOrg.tsx)
  UserService.getInviteByToken(token)
  AuthService.signUp(email, pin, ...)
  KeyService.generateAndStoreUserKeys(userId, pin)
  UserService.acceptInvite(token, userId)
  → navigate('/app/messages')
```

## 5. Récupération de compte

### Admin (mot de passe oublié)
```
/recuperation/admin (AdminRecovery.tsx)
  AuthService.sendPasswordReset(email)  →  email Supabase
  Clic lien email → /reset-password
  ResetPassword.tsx :
    Écoute onAuthStateChange(PASSWORD_RECOVERY)
    AuthService.updatePassword(newPassword)
    KeyService.rewrapPrivateKey(userId, newPassword)
    [Avertissement E2E : données inaccessibles sans ancien mot de passe]
    → navigate('/connexion')
```

### Collaborateur (PIN oublié)
```
/recuperation/utilisateur (CollaboratorRecovery.tsx)
  Contact admin pour reset PIN
```

### Breakglass (récupération d'urgence org)
```
/admin/securite ou interface dédiée
  RecoveryService.breakglassDecrypt(phrase, orgId)
  → déchiffre bg_encrypted_key via PBKDF2(phrase)
  → accès temporaire aux clés de récupération
  → tracé dans audit_logs action 'breakglass_used'
```

## 6. Envoi d'un message chiffré

```
Messages.tsx → ConvView → handleSend()
  MessageService.send(convId, senderId, text, orgId)
    → ensureConvKey(convId, orgId)
        si absent : KeyService.initConversationKeys(convId, orgId, [participants])
    → CryptoService.encryptMessage(text, convKey)
    → INSERT messages(content=ciphertext, content_encrypted=true)
  Realtime → callback decryptRow() → affichage plaintext
```

## 7. Upload / download de document chiffré

```
Documents.tsx → handleFileSelected()
  DocumentService.uploadDocument(orgId, userId, file)
    → KeyService.initFileKey(storagePath, orgId)  [fileKey + escrow]
    → IV || AES-GCM(file, fileKey) → .enc blob
    → Storage upload + INSERT files + INSERT documents

handleDownload(doc)
  DocumentService.downloadDocument(docId, orgId)
    → Signed URL → fetch
    → KeyService.getOrLoadFileKey(storagePath, orgId)
    → AES-GCM decrypt
    → Blob URL → <a download>
```

## 8. Promotion d'un collaborateur en admin

```
/admin/utilisateurs → Promouvoir
  UserService.promoteToAdmin(orgId, targetId, actorId)
  KeyService.distributeRecoveryKeyToAdmin(orgId, newAdminId)
    → déchiffre org_recovery_priv (ECIES acteur)
    → re-chiffre pour new admin (ECIES)
    → INSERT org_recovery_keys pour new admin
  Audit log : 'admin_promoted'
```

## 9. Quitter un groupe (messagerie)

```
Messages.tsx → InfoPanel → "Quitter le groupe" → confirm()
  MessageService.leaveConversation(convId, userId)
    → DELETE conversation_members WHERE conv=convId AND user=userId
  → Retire channel de la liste
  → Retour à la liste de conversations
```
