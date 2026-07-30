// AXIS Knowledge Base — Kouma Workspace
// All keywords are lowercase and accent-free (the engine normalises input the same way).

export type AxisCategory =
  | 'axis' | 'general' | 'messages' | 'teams' | 'documents'
  | 'agenda' | 'announcements' | 'profile' | 'admin'
  | 'security' | 'polls' | 'minutes' | 'notifications' | 'onboarding' | 'errors'

export type AxisEntry = {
  id: string
  category: AxisCategory
  keywords: string[]
  answer: string
  action?: { label: string; link: string }
}

export const KB: AxisEntry[] = [

  // ── AXIS ─────────────────────────────────────────────────────────────────

  {
    id: 'axis-what',
    category: 'axis',
    keywords: ['axis', 'assistant', 'qui es tu', 'tu es qui', 'que fais tu', 'role axis', 'cest quoi axis', 'presente', 'tu fais quoi', 'tu sers', 'a quoi tu sers'],
    answer: 'AXIS est l\'assistant intégré de Kouma. Il répond aux questions sur la plateforme, résume des conversations, crée des tâches et recherche des documents.',
  },
  {
    id: 'axis-can',
    category: 'axis',
    keywords: ['que peux tu', 'capacite', 'fonctions', 'fonctionnalites', 'aide avec quoi', 'tu peux quoi', 'quelles fonctions', 'aider comment'],
    answer: '- Répondre aux **questions sur Kouma** (onglet Chat)\n- **Résumer** une conversation (onglet Résumé)\n- Créer une **tâche** (onglet Action)\n- **Rechercher** un document ou compte-rendu (onglet Recherche)',
  },
  {
    id: 'axis-limit',
    category: 'axis',
    keywords: ['limite', 'limitation', 'impossible', 'ne sais pas', 'hors sujet', 'generateur', 'ecrire texte', 'redige', 'genere'],
    answer: 'AXIS répond uniquement aux questions sur Kouma. Il ne rédige pas de texte libre.',
  },

  // ── GÉNÉRAL ──────────────────────────────────────────────────────────────

  {
    id: 'general-what',
    category: 'general',
    keywords: ['kouma', 'plateforme', 'application', 'workspace', 'outil', 'logiciel', 'cest quoi kouma', 'quest ce que kouma'],
    answer: 'Kouma Workspace est une plateforme collaborative chiffrée : messagerie, documents, agenda, équipes et annonces dans un seul espace sécurisé.',
  },
  {
    id: 'general-support',
    category: 'general',
    keywords: ['support', 'aide', 'probleme', 'bug', 'contact', 'assistance', 'signaler erreur', 'signaler bug', 'joindre support'],
    answer: 'Contactez le support à **support@kouma.io** avec une description du problème et une capture d\'écran si possible.',
  },
  {
    id: 'general-pwa',
    category: 'general',
    keywords: ['mobile', 'telephone', 'pwa', 'installer appli', 'smartphone', 'iphone', 'android', 'ecran accueil', 'appli mobile'],
    answer: 'Kouma est une PWA. Sur mobile, ouvrez Kouma dans Chrome ou Safari puis utilisez **"Ajouter à l\'écran d\'accueil"**. Aucun store requis.',
  },
  {
    id: 'general-browser',
    category: 'general',
    keywords: ['navigateur', 'chrome', 'firefox', 'safari', 'edge', 'compatible', 'quel navigateur'],
    answer: 'Kouma fonctionne sur Chrome, Firefox, Edge et Safari. Préférez **Chrome** ou **Edge** pour les meilleures performances.',
  },
  {
    id: 'general-version',
    category: 'general',
    keywords: ['version', 'mise a jour', 'nouveautes', 'changelog', 'quoi de neuf'],
    answer: 'Kouma se met à jour automatiquement. Rechargez la page pour bénéficier de la dernière version.',
  },
  {
    id: 'general-price',
    category: 'general',
    keywords: ['prix', 'tarif', 'abonnement', 'payant', 'gratuit', 'plan', 'facturation', 'cout', 'offre'],
    answer: 'Les tarifs sont disponibles sur **kouma.io/tarifs**. Contactez le support pour les offres entreprise.',
  },

  // ── ONBOARDING ────────────────────────────────────────────────────────────

  {
    id: 'onboard-join',
    category: 'onboarding',
    keywords: ['rejoindre', 'creer compte', 'inscription', 'comment commencer', 'demarrer', 'nouveau compte', 'invitation rejoindre'],
    answer: 'Vous devez recevoir une **invitation** de votre administrateur. Cliquez sur le lien reçu par email, créez votre mot de passe et votre code PIN.',
  },
  {
    id: 'onboard-create-org',
    category: 'onboarding',
    keywords: ['creer organisation', 'nouvelle organisation', 'creer entreprise', 'creer espace', 'fonder', 'ouvrir kouma'],
    answer: 'Allez sur **kouma.io/creer**, renseignez le nom de votre organisation et créez votre compte admin.',
    action: { label: 'Créer une organisation', link: '/creer' },
  },
  {
    id: 'onboard-invitation-error',
    category: 'onboarding',
    keywords: ['invitation expiree', 'lien invalide', 'invitation ne fonctionne pas', 'lien expire', 'erreur invitation'],
    answer: 'Demandez à votre **administrateur** de générer un nouveau lien : Console admin → Utilisateurs → Inviter.',
  },
  {
    id: 'onboard-pin-setup',
    category: 'onboarding',
    keywords: ['creer pin', 'choisir pin', 'definir pin', 'nouveau pin', 'setup pin', 'premier pin'],
    answer: 'Le code PIN est créé lors de votre première connexion. Il protège votre clé de chiffrement. Retenez-le bien — sans lui, l\'accès à vos messages chiffrés peut être compromis.',
  },

  // ── MESSAGES ──────────────────────────────────────────────────────────────

  {
    id: 'msg-send',
    category: 'messages',
    keywords: ['envoyer message', 'ecrire message', 'envoie', 'texte', 'taper message', 'saisir message', 'communiquer', 'rediger message'],
    answer: 'Tapez votre message dans la zone de saisie et appuyez sur **Entrée**. Pour un saut de ligne : **Shift+Entrée**.',
    action: { label: 'Ouvrir Messages', link: '/app/messages' },
  },
  {
    id: 'msg-direct',
    category: 'messages',
    keywords: ['conversation directe', 'message direct', 'dm', 'prive', 'contacter personne', 'ecrire personne', 'parler individuel', 'chat prive'],
    answer: 'Dans Messages, cliquez sur **+** en haut et sélectionnez un collaborateur.',
    action: { label: 'Ouvrir Messages', link: '/app/messages' },
  },
  {
    id: 'msg-group',
    category: 'messages',
    keywords: ['groupe', 'creer groupe', 'nouveau groupe', 'plusieurs personnes', 'conversation groupe', 'multi personnes', 'chat groupe'],
    answer: 'Dans Messages, cliquez sur **+** et sélectionnez plusieurs collaborateurs pour créer un groupe.',
    action: { label: 'Ouvrir Messages', link: '/app/messages' },
  },
  {
    id: 'msg-react',
    category: 'messages',
    keywords: ['reaction', 'emoji', 'reagir', 'like', 'aimer', 'emoticone', 'pouce', 'coeur'],
    answer: 'Survolez le message et cliquez sur l\'icône **smiley**. Choisissez votre emoji dans le panneau.',
  },
  {
    id: 'msg-reply',
    category: 'messages',
    keywords: ['repondre', 'replique', 'citer message', 'reply', 'repondre message', 'citer', 'repondre a un message precis'],
    answer: 'Survolez le message et cliquez sur l\'icône **répondre**. Votre message sera lié au message original avec une citation.',
  },
  {
    id: 'msg-forward',
    category: 'messages',
    keywords: ['transferer message', 'transmettre message', 'envoyer ailleurs', 'partager message', 'forward', 'envoyer autre conversation'],
    answer: 'Survolez le message et cliquez sur l\'icône **transférer**. Sélectionnez la conversation de destination dans la liste.',
  },
  {
    id: 'msg-copy',
    category: 'messages',
    keywords: ['copier message', 'copier texte', 'copier contenu', 'clipboard'],
    answer: 'Survolez le message et cliquez sur l\'icône **copier**. Le texte est copié dans votre presse-papiers.',
  },
  {
    id: 'msg-photo-view',
    category: 'messages',
    keywords: ['voir photo', 'agrandir image', 'photo grande', 'voir image plein ecran', 'ouvrir photo', 'image recue', 'photo conversation'],
    answer: 'Les photos s\'affichent directement dans la conversation. Cliquez dessus pour les voir en plein écran.',
  },
  {
    id: 'msg-file',
    category: 'messages',
    keywords: ['fichier message', 'piece jointe', 'joindre fichier', 'envoyer fichier', 'photo message', 'image message', 'upload message', 'attachment', 'partager fichier'],
    answer: 'Cliquez sur l\'icône **trombone** pour joindre un fichier. Formats : images, PDF, Word, Excel, PowerPoint, ZIP. Taille max : **50 Mo**.',
  },
  {
    id: 'msg-delete',
    category: 'messages',
    keywords: ['supprimer message', 'effacer message', 'retirer message', 'enlever message'],
    answer: 'Survolez votre message et cliquez sur l\'icône **corbeille**. Seul l\'expéditeur peut supprimer ses propres messages.',
  },
  {
    id: 'msg-edit',
    category: 'messages',
    keywords: ['modifier message', 'editer message', 'corriger message', 'changer message', 'rectifier'],
    answer: 'Survolez votre message et cliquez sur l\'icône **crayon**. Les messages modifiés affichent la mention "Modifié".',
  },
  {
    id: 'msg-leave',
    category: 'messages',
    keywords: ['quitter conversation', 'quitter groupe', 'sortir groupe', 'partir conversation', 'quitter', 'se retirer'],
    answer: 'Dans une conversation, cliquez sur les **trois points** en haut à droite → **Quitter la conversation**.',
  },
  {
    id: 'msg-unread',
    category: 'messages',
    keywords: ['non lu', 'non lus', 'messages non lus', 'badge rouge', 'compteur messages', 'messages en attente'],
    answer: 'Les conversations avec messages non lus affichent un **badge rouge**. Cliquez sur la conversation pour les marquer comme lus.',
  },
  {
    id: 'msg-encrypt',
    category: 'messages',
    keywords: ['chiffrement messages', 'messages chiffres', 'securite messages', 'messages prives', 'confidentialite', 'e2e messages', 'bout en bout'],
    answer: 'Tous les messages sont chiffrés **de bout en bout** (AES-256-GCM). Ni Kouma, ni les administrateurs ne peuvent les lire.',
  },
  {
    id: 'msg-find',
    category: 'messages',
    keywords: ['trouver message', 'chercher message', 'retrouver message', 'rechercher message', 'recherche messages'],
    answer: 'Utilisez l\'onglet **Recherche** dans AXIS et tapez des mots-clés.',
  },
  {
    id: 'msg-team-channel',
    category: 'messages',
    keywords: ['canal equipe', 'channel equipe', 'conversation equipe', 'message equipe', 'groupe equipe', 'equipe messages'],
    answer: 'Chaque équipe a une **conversation dédiée** visible dans vos Messages, avec tous ses membres automatiquement inclus.',
    action: { label: 'Ouvrir Messages', link: '/app/messages' },
  },
  {
    id: 'msg-not-sending',
    category: 'messages',
    keywords: ['message ne part pas', 'envoi echoue', 'impossible envoyer', 'erreur envoi', 'message bloque', 'message ne senvoie pas'],
    answer: '1. Vérifiez votre connexion internet\n2. Rechargez la page et entrez votre PIN\n3. Si le problème persiste, contactez le support',
  },
  {
    id: 'msg-decrypt-error',
    category: 'messages',
    keywords: ['impossible dechiffrer', 'message illisible', 'message chiffre erreur', 'cle manquante', 'ne peut pas lire', 'dechiffrement echoue'],
    answer: 'Rechargez la page et entrez votre code PIN pour restaurer votre session de chiffrement.',
  },
  {
    id: 'msg-scroll-reply',
    category: 'messages',
    keywords: ['remonter message original', 'voir message cite', 'aller message repondu', 'cliquer citation'],
    answer: 'Cliquez sur le bloc de citation dans un message pour remonter directement au message original.',
  },

  // ── ÉQUIPES ──────────────────────────────────────────────────────────────

  {
    id: 'teams-view',
    category: 'teams',
    keywords: ['voir equipes', 'mes equipes', 'liste equipes', 'equipes', 'teams', 'groupes travail'],
    answer: 'Retrouvez toutes vos équipes dans la section **Équipes** de la navigation.',
    action: { label: 'Voir mes équipes', link: '/app/equipes' },
  },
  {
    id: 'teams-create',
    category: 'teams',
    keywords: ['creer equipe', 'nouvelle equipe', 'former equipe', 'creer team', 'creer groupe travail'],
    answer: 'Réservé aux **administrateurs** : Console admin → Équipes → Nouvelle équipe.',
  },
  {
    id: 'teams-add-member',
    category: 'teams',
    keywords: ['ajouter membre equipe', 'ajouter personne equipe', 'inclure equipe', 'integrer equipe', 'rejoindre equipe'],
    answer: 'L\'ajout de membres est réservé aux **administrateurs**. Contactez votre admin pour être ajouté à une équipe.',
  },
  {
    id: 'teams-remove-member',
    category: 'teams',
    keywords: ['retirer membre', 'exclure equipe', 'virer equipe', 'supprimer membre equipe', 'enlever membre'],
    answer: 'Le retrait de membres est réservé aux **administrateurs**.',
  },
  {
    id: 'teams-manage',
    category: 'teams',
    keywords: ['gerer equipe', 'modifier equipe', 'editer equipe', 'parametres equipe', 'admin equipe'],
    answer: 'Console admin → **Équipes**. Vous pouvez modifier le nom, les membres et supprimer une équipe.',
  },

  // ── DOCUMENTS ────────────────────────────────────────────────────────────

  {
    id: 'docs-upload',
    category: 'documents',
    keywords: ['uploader', 'ajouter document', 'deposer fichier', 'importer document', 'envoyer document', 'nouveau document', 'mettre en ligne', 'charger fichier'],
    answer: 'Dans **Documents**, cliquez sur **+ Nouveau** et sélectionnez votre fichier. Il est chiffré automatiquement.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-preview',
    category: 'documents',
    keywords: ['previsualiser fichier', 'voir fichier sans telecharger', 'apercu document', 'ouvrir document', 'lire pdf', 'voir image document', 'visualiser'],
    answer: 'Cliquez sur un fichier dans Documents. Les images et PDF s\'ouvrent directement dans l\'app. Pour les autres formats, un bouton télécharger est disponible.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-download',
    category: 'documents',
    keywords: ['telecharger document', 'download', 'recuperer fichier', 'obtenir document', 'exporter fichier', 'sauvegarder document'],
    answer: 'Ouvrez le document et cliquez sur **Télécharger**. Le fichier est déchiffré automatiquement.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-folders-nav',
    category: 'documents',
    keywords: ['dossier', 'naviguer dossier', 'ouvrir dossier', 'cliquer dossier', 'contenu dossier', 'entrer dossier'],
    answer: 'Cliquez sur un dossier pour naviguer dedans et voir les fichiers qu\'il contient. Utilisez le fil d\'Ariane pour revenir en arrière.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-create-folder',
    category: 'documents',
    keywords: ['creer dossier', 'nouveau dossier', 'ajouter dossier', 'faire dossier'],
    answer: 'Cliquez sur **+ Dossier**, donnez-lui un nom et choisissez sa visibilité :\n- **Personnel** : visible uniquement par vous\n- **Organisation** : visible par tous les membres',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-folder-visibility',
    category: 'documents',
    keywords: ['dossier personnel', 'dossier organisation', 'visibilite dossier', 'difference dossier', 'partager dossier', 'dossier prive'],
    answer: '**Personnel** : visible uniquement par vous.\n**Organisation** : visible par tous les membres de l\'organisation.',
  },
  {
    id: 'docs-move-doc',
    category: 'documents',
    keywords: ['deplacer document', 'mettre dossier', 'ranger document', 'glisser document', 'drag drop document'],
    answer: 'Glissez un fichier et déposez-le sur un dossier pour l\'y ranger. Vous pouvez aussi glisser-déposer depuis la vue liste.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-delete-folder',
    category: 'documents',
    keywords: ['supprimer dossier', 'effacer dossier', 'retirer dossier', 'enlever dossier'],
    answer: 'Survolez le dossier et cliquez sur l\'icône supprimer (visible pour le créateur et les admins). Les fichiers sont automatiquement déplacés à la racine.',
  },
  {
    id: 'docs-formats',
    category: 'documents',
    keywords: ['format accepte', 'type fichier', 'extension', 'pdf', 'word', 'excel', 'powerpoint', 'image', 'zip', 'fichier autorise'],
    answer: 'Formats acceptés : **PDF, Word, Excel, PowerPoint, Images (PNG/JPG/GIF/WebP), Texte (txt/csv), ZIP**. Taille max : **50 Mo**.',
  },
  {
    id: 'docs-size',
    category: 'documents',
    keywords: ['taille fichier', 'limite upload', 'max taille', 'trop lourd', 'trop grand', 'poids fichier', 'taille maximale'],
    answer: 'La taille maximale par fichier est de **50 Mo**. Compressez en ZIP pour les fichiers plus volumineux.',
  },
  {
    id: 'docs-delete',
    category: 'documents',
    keywords: ['supprimer document', 'effacer document', 'retirer document', 'enlever fichier'],
    answer: 'Dans **Documents**, cliquez sur les **trois points** à côté du fichier → **Supprimer**.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-find',
    category: 'documents',
    keywords: ['trouver document', 'chercher document', 'retrouver document', 'rechercher document', 'ou est document'],
    answer: 'Utilisez la barre de recherche en haut des Documents ou l\'onglet **Recherche** d\'AXIS.',
    action: { label: 'Ouvrir Documents', link: '/app/documents' },
  },
  {
    id: 'docs-encrypt',
    category: 'documents',
    keywords: ['documents chiffres', 'securite documents', 'confidentialite documents', 'admin voit documents', 'acces documents'],
    answer: 'Les documents sont chiffrés de bout en bout. Les administrateurs ne peuvent pas lire les documents personnels.',
  },
  {
    id: 'docs-visibility',
    category: 'documents',
    keywords: ['visibilite document', 'document personnel', 'document organisation', 'document equipe', 'qui voit mes documents', 'partager document'],
    answer: '- **Personnel** : visible uniquement par vous\n- **Équipe** : visible par les membres de votre équipe\n- **Organisation** : visible par tous les membres',
  },

  // ── AGENDA ───────────────────────────────────────────────────────────────

  {
    id: 'agenda-create',
    category: 'agenda',
    keywords: ['creer reunion', 'nouvelle reunion', 'organiser reunion', 'planifier reunion', 'programmer reunions', 'creer evenement', 'meeting', 'reunion', 'rendez vous'],
    answer: 'Dans **Agenda**, cliquez sur **+ Nouvelle réunion**. Renseignez le titre, les dates, les participants et la description.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-view',
    category: 'agenda',
    keywords: ['voir agenda', 'calendrier', 'planning', 'mes reunions', 'programme', 'schedule', 'voir reunions', 'agenda'],
    answer: 'Retrouvez toutes vos réunions dans l\'**Agenda**. Les réunions auxquelles vous êtes invité y apparaissent automatiquement.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-rsvp',
    category: 'agenda',
    keywords: ['accepter invitation', 'refuser invitation', 'repondre invitation', 'rsvp', 'confirmer presence', 'decliner reunion'],
    answer: 'Dans **Agenda**, ouvrez la réunion et cliquez sur **Accepter** ou **Refuser**.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-invite',
    category: 'agenda',
    keywords: ['inviter participants', 'ajouter participants', 'convier', 'ajouter membres reunion', 'invites reunion'],
    answer: 'Lors de la création, sélectionnez les participants dans le champ **Participants**. Ils reçoivent une notification et voient la réunion dans leur Agenda.',
  },
  {
    id: 'agenda-cancel',
    category: 'agenda',
    keywords: ['annuler reunion', 'supprimer reunion', 'annuler event', 'supprimer evenement', 'enlever reunion'],
    answer: 'Ouvrez la réunion dans **Agenda** et cliquez sur **Supprimer**. Seul l\'organisateur peut supprimer.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-minutes',
    category: 'agenda',
    keywords: ['compte rendu', 'cr reunion', 'compte-rendu', 'notes reunion', 'rapport reunion', 'bilan reunion', 'rediger cr', 'creer cr'],
    answer: 'Dans **Agenda**, ouvrez la réunion et cliquez sur **Compte-rendu**. Renseignez le résumé, les décisions et les actions.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-action-item',
    category: 'agenda',
    keywords: ['action reunion', 'tache cr', 'todo reunion', 'point action', 'assigner tache', 'suivi action', 'echeance action'],
    answer: 'Dans un compte-rendu, cliquez sur **+ Ajouter une action**. Assignez-la à un membre avec une date d\'échéance. Cochez-la une fois terminée.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'agenda-not-invited',
    category: 'agenda',
    keywords: ['pas invite', 'ne vois pas reunion', 'reunion invisible', 'absent agenda', 'manque reunion'],
    answer: 'Si une réunion n\'apparaît pas, vous n\'êtes pas invité. Demandez à l\'organisateur de vous ajouter.',
  },
  {
    id: 'agenda-organizer',
    category: 'agenda',
    keywords: ['organisateur', 'qui organise', 'createur reunion', 'hote reunion', 'qui a cree'],
    answer: 'L\'organisateur est affiché dans les détails de la réunion. Il est le seul à pouvoir la modifier ou la supprimer.',
  },

  // ── ANNONCES ─────────────────────────────────────────────────────────────

  {
    id: 'ann-view',
    category: 'announcements',
    keywords: ['annonce', 'annonces', 'communication', 'info organisation', 'actualite', 'nouvelles organisation', 'voir annonces'],
    answer: 'Les annonces sont dans la section **Annonces** de la navigation. Elles sont publiées par les administrateurs.',
    action: { label: 'Voir les annonces', link: '/app/annonces' },
  },
  {
    id: 'ann-create',
    category: 'announcements',
    keywords: ['publier annonce', 'creer annonce', 'poster annonce', 'nouvelle annonce', 'ecrire annonce'],
    answer: 'Réservé aux **administrateurs** : Console admin → Annonces → + Nouvelle annonce.',
  },
  {
    id: 'ann-notify',
    category: 'announcements',
    keywords: ['notification annonce', 'alerte annonce', 'prevenu annonce', 'recevoir annonce'],
    answer: 'Quand une annonce est publiée, tous les membres reçoivent une **notification**.',
  },

  // ── PROFIL ───────────────────────────────────────────────────────────────

  {
    id: 'profile-edit',
    category: 'profile',
    keywords: ['modifier profil', 'editer profil', 'changer profil', 'mettre a jour', 'modifier nom', 'changer nom', 'profil'],
    answer: 'Dans **Moi**, cliquez sur **Modifier le profil** pour changer votre prénom, nom, titre de poste et photo.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-avatar',
    category: 'profile',
    keywords: ['photo profil', 'avatar', 'image profil', 'changer photo', 'modifier photo', 'mettre photo'],
    answer: 'Dans **Moi**, cliquez sur votre avatar et importez une nouvelle photo.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-password',
    category: 'profile',
    keywords: ['mot de passe', 'password', 'changer mot de passe', 'modifier mot de passe', 'reinitialiser mdp', 'nouveau mot de passe'],
    answer: 'Dans **Moi** → Sécurité → **Changer le mot de passe**. Votre mot de passe actuel est requis.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-pin',
    category: 'profile',
    keywords: ['changer pin', 'modifier pin', 'nouveau pin', 'code pin profil', 'reinitialiser pin'],
    answer: 'Dans **Moi** → Sécurité → **Changer le code PIN**. Un changement de PIN re-chiffre vos données automatiquement.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-jobtitle',
    category: 'profile',
    keywords: ['titre poste', 'fonction', 'job', 'metier', 'intitule poste', 'changer titre', 'mon poste'],
    answer: 'Dans **Moi** → Modifier le profil → champ **Titre de poste**.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-language',
    category: 'profile',
    keywords: ['langue', 'language', 'francais', 'anglais', 'espagnol', 'portugais', 'changer langue', 'interface langue'],
    answer: 'Dans **Moi** → Préférences → **Langue**. Kouma est disponible en Français, Anglais, Espagnol et Portugais.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-signout',
    category: 'profile',
    keywords: ['deconnecter', 'se deconnecter', 'logout', 'quitter session', 'sortir', 'fermer session'],
    answer: 'Dans **Moi**, cliquez sur **Se déconnecter** en bas de la page.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-theme',
    category: 'profile',
    keywords: ['theme', 'mode sombre', 'dark mode', 'mode clair', 'apparence', 'couleur interface'],
    answer: 'Dans **Moi** → Préférences → **Apparence**. Basculez entre le mode clair et le mode sombre.',
    action: { label: 'Mon profil', link: '/app/profil' },
  },
  {
    id: 'profile-notif-prefs',
    category: 'profile',
    keywords: ['preferences notifications', 'activer desactiver notifications', 'gerer alertes', 'notif preferences'],
    answer: 'Dans **Moi** → Préférences → **Notifications**. Choisissez quels types d\'alertes recevoir (messages, réunions, annonces…).',
    action: { label: 'Mon profil', link: '/app/profil' },
  },

  // ── ADMIN ────────────────────────────────────────────────────────────────

  {
    id: 'admin-invite',
    category: 'admin',
    keywords: ['inviter utilisateur', 'ajouter utilisateur', 'nouvel utilisateur', 'lien invitation', 'inviter collaborateur', 'ajouter membre organisation'],
    answer: 'Console admin → Utilisateurs → **Inviter**. Un lien d\'invitation unique est généré.',
  },
  {
    id: 'admin-users',
    category: 'admin',
    keywords: ['gerer utilisateurs', 'liste membres', 'tous utilisateurs', 'voir membres', 'utilisateurs organisation'],
    answer: 'Console admin → **Utilisateurs**. Voyez tous les membres, invitez, suspendez ou promouvez en admin.',
  },
  {
    id: 'admin-departments',
    category: 'admin',
    keywords: ['departement', 'service', 'direction', 'pole', 'creer departement', 'gerer departement'],
    answer: 'Console admin → **Départements**. Créez des départements et assignez-y des membres.',
  },
  {
    id: 'admin-teams-manage',
    category: 'admin',
    keywords: ['gerer equipes', 'admin equipe', 'creer equipe admin', 'supprimer equipe', 'modifier equipe'],
    answer: 'Console admin → **Équipes**. Créez, modifiez et supprimez des équipes.',
  },
  {
    id: 'admin-logo',
    category: 'admin',
    keywords: ['logo organisation', 'changer logo', 'modifier logo', 'image organisation', 'branding', 'nom organisation'],
    answer: 'Console admin → Paramètres → **Organisation**. Uploadez votre logo et modifiez le nom.',
  },
  {
    id: 'admin-permissions',
    category: 'admin',
    keywords: ['permission', 'droits', 'acces', 'role admin', 'gerer permissions', 'privileges'],
    answer: 'Console admin → **Permissions**. Définissez les droits par rôle (Admin, Collaborateur).',
  },
  {
    id: 'admin-storage',
    category: 'admin',
    keywords: ['stockage', 'espace disque', 'capacite', 'quota', 'espace utilise', 'espace disponible'],
    answer: 'Console admin → **Stockage**. Consultez l\'espace utilisé et les fichiers les plus volumineux.',
  },
  {
    id: 'admin-audit',
    category: 'admin',
    keywords: ['journal audit', 'logs', 'historique actions', 'activite', 'trace', 'qui a fait quoi'],
    answer: 'Console admin → **Journal**. Enregistre toutes les actions importantes : connexions, uploads, invitations, etc.',
  },
  {
    id: 'admin-promote',
    category: 'admin',
    keywords: ['promouvoir admin', 'rendre admin', 'droits administrateur', 'nouvel administrateur', 'elever role'],
    answer: 'Console admin → Utilisateurs → cliquez sur le membre → **Promouvoir en administrateur**.',
  },
  {
    id: 'admin-security',
    category: 'admin',
    keywords: ['securite admin', 'parametres securite', 'politique securite', 'expiration session', 'otp', '2fa'],
    answer: 'Console admin → **Sécurité**. Configurez la durée de session, l\'OTP et la politique de mot de passe.',
  },
  {
    id: 'admin-disable-user',
    category: 'admin',
    keywords: ['desactiver utilisateur', 'suspendre utilisateur', 'bloquer utilisateur', 'exclure membre', 'retirer acces'],
    answer: 'Console admin → Utilisateurs → cliquez sur le membre → **Suspendre**. L\'accès est révoqué immédiatement.',
  },
  {
    id: 'admin-announcements',
    category: 'admin',
    keywords: ['admin annonces', 'publier communication', 'gerer annonces', 'creer communication officielle'],
    answer: 'Console admin → Annonces → **+ Nouvelle annonce**.',
  },

  // ── SÉCURITÉ ─────────────────────────────────────────────────────────────

  {
    id: 'sec-e2e',
    category: 'security',
    keywords: ['chiffrement bout en bout', 'e2e', 'end to end', 'aes256', 'securise', 'comment chiffre', 'comment fonctionne securite'],
    answer: 'Kouma utilise le chiffrement **de bout en bout** (ECDH P-256 + AES-256-GCM). Les données sont chiffrées sur votre appareil. Ni Kouma ni les serveurs n\'ont accès aux clés.',
  },
  {
    id: 'sec-admin-cant-read',
    category: 'security',
    keywords: ['admin peut lire', 'admin voit messages', 'admin accede', 'administrateur messages', 'lire messages admin', 'espionner', 'surveiller messages'],
    answer: 'Les administrateurs **ne peuvent jamais lire** vos messages privés ou de groupe. Les clés de déchiffrement ne sont stockées que sur vos appareils.',
  },
  {
    id: 'sec-pin-why',
    category: 'security',
    keywords: ['pourquoi pin', 'pin obligatoire', 'pin utilite', 'code pin sert', 'a quoi sert pin', 'expliquer pin'],
    answer: 'Le code PIN déchiffre votre clé privée. Sans lui, même en cas de piratage de compte, vos messages restent illisibles.',
  },
  {
    id: 'sec-pin-forgot',
    category: 'security',
    keywords: ['oublie pin', 'pin oublie', 'perdu pin', 'plus mon pin', 'reinitialiser pin', 'pin perdu'],
    answer: 'Contactez votre **administrateur** pour initier une récupération via la clé de récupération organisationnelle. Sans cette clé, les données chiffrées ne sont pas récupérables.',
  },
  {
    id: 'sec-recovery',
    category: 'security',
    keywords: ['recuperation compte', 'acces perdu', 'breakglass', 'cle recuperation', 'restaurer acces', 'phrase recuperation'],
    answer: 'La récupération passe par la **clé de récupération organisationnelle** (phrase breakglass), détenue par l\'admin. Sans elle, les données chiffrées sont irrécupérables.',
  },
  {
    id: 'sec-session',
    category: 'security',
    keywords: ['session expire', 'deconnexion auto', 'expiration', 'timeout', 'combien temps session'],
    answer: 'La durée de session est configurée par votre admin (Console admin → Sécurité). À l\'expiration, entrez à nouveau votre PIN.',
  },
  {
    id: 'sec-team-recovery',
    category: 'security',
    keywords: ['recuperation equipe', 'admin recupere messages equipe', 'acces organisation messages', 'audit messages equipe'],
    answer: 'Les conversations d\'**équipe** ont une clé de récupération que l\'admin peut utiliser si besoin légal. Les conversations **directes et de groupe** sont inaccessibles même aux admins.',
  },
  {
    id: 'sec-data-where',
    category: 'security',
    keywords: ['ou stockees donnees', 'serveurs', 'ou heberge', 'data center', 'cloud', 'europe', 'gdpr', 'rgpd'],
    answer: 'Les données Kouma sont hébergées sur des serveurs sécurisés. Seuls les membres autorisés peuvent déchiffrer les données. Consultez notre politique de confidentialité pour les détails.',
  },

  // ── SONDAGES ─────────────────────────────────────────────────────────────

  {
    id: 'poll-create',
    category: 'polls',
    keywords: ['creer sondage', 'nouveau sondage', 'faire sondage', 'sondage', 'enquete', 'vote', 'poll'],
    answer: 'Dans **Messages**, ouvrez une conversation et cliquez sur l\'icône **sondage**. Saisissez la question et les options, puis publiez.',
    action: { label: 'Ouvrir Messages', link: '/app/messages' },
  },
  {
    id: 'poll-vote',
    category: 'polls',
    keywords: ['voter sondage', 'repondre sondage', 'participer sondage', 'choisir option', 'voter'],
    answer: 'Trouvez le sondage dans la conversation et cliquez sur votre choix. Un seul vote par sondage.',
  },
  {
    id: 'poll-results',
    category: 'polls',
    keywords: ['resultats sondage', 'voir resultats', 'qui a vote', 'score sondage', 'reponses sondage'],
    answer: 'Les résultats sont visibles en temps réel par tous les membres de la conversation.',
  },
  {
    id: 'poll-notify',
    category: 'polls',
    keywords: ['notification sondage', 'alerte sondage', 'nouveau vote notif', 'createur sondage notif'],
    answer: 'Le créateur d\'un sondage reçoit une notification à chaque nouveau vote.',
  },

  // ── COMPTE-RENDUS ────────────────────────────────────────────────────────

  {
    id: 'minutes-create',
    category: 'minutes',
    keywords: ['creer compte rendu', 'nouveau cr', 'rediger compte rendu', 'compte-rendu reunion'],
    answer: 'Dans **Agenda**, ouvrez une réunion et cliquez sur **Compte-rendu**.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'minutes-view',
    category: 'minutes',
    keywords: ['voir compte rendu', 'lire cr', 'consulter cr', 'historique cr', 'retrouver cr'],
    answer: 'Ouvrez la réunion dans **Agenda** et cliquez sur **Compte-rendu**.',
    action: { label: 'Ouvrir l\'Agenda', link: '/app/agenda' },
  },
  {
    id: 'minutes-action',
    category: 'minutes',
    keywords: ['tache compte rendu', 'action cr', 'todo cr', 'creer action cr', 'assigner action', 'marquer termine'],
    answer: 'Dans un compte-rendu, cliquez sur **+ Ajouter une action**. Assignez-la à un membre avec une date d\'échéance.',
  },
  {
    id: 'minutes-who-can-see',
    category: 'minutes',
    keywords: ['qui voit cr', 'acces cr', 'qui peut lire cr', 'visibilite cr'],
    answer: 'Le compte-rendu est visible par tous les **participants invités** à la réunion.',
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────

  {
    id: 'notif-push',
    category: 'notifications',
    keywords: ['notification push', 'notification navigateur', 'activer notifications', 'recevoir notifications', 'alertes', 'push notification'],
    answer: 'Kouma envoie des **notifications navigateur** (push) même quand l\'onglet est en arrière-plan. Autorisez-les quand le navigateur les demande.',
  },
  {
    id: 'notif-inapp',
    category: 'notifications',
    keywords: ['notification inapp', 'notification cloche', 'voir notifications', 'badge notification', 'notification dans app', 'alerte in app'],
    answer: 'Les notifications in-app apparaissent dans la **cloche** en haut de la navigation. Elles sont visibles uniquement quand vous êtes connecté à Kouma.',
  },
  {
    id: 'notif-push-vs-inapp',
    category: 'notifications',
    keywords: ['difference push inapp', 'push vs inapp', 'types notification', 'notifications differentes'],
    answer: '**Push** : alerte navigateur/OS, visible même si Kouma est fermé.\n**In-app** : badge dans l\'interface, visible uniquement quand Kouma est ouvert.\nLes deux sont complémentaires.',
  },
  {
    id: 'notif-no-receive',
    category: 'notifications',
    keywords: ['pas recevoir notification', 'notification marche pas', 'aucune notification', 'notifications bloquees'],
    answer: '1. Vérifiez que les notifications sont **autorisées** dans les paramètres de votre navigateur\n2. Vérifiez que Kouma est ouvert dans un onglet\n3. Rechargez la page',
  },
  {
    id: 'notif-types',
    category: 'notifications',
    keywords: ['quels types notifications', 'notification message', 'notification reunion', 'quand notification', 'notification vote'],
    answer: 'Kouma vous notifie pour : **nouveau message**, **invitation à une réunion**, **réponse RSVP**, **nouveau vote** sur vos sondages, **nouvelle annonce**.',
  },

  // ── ERREURS & DÉPANNAGE ───────────────────────────────────────────────────

  {
    id: 'err-cant-login',
    category: 'errors',
    keywords: ['connexion impossible', 'ne peux pas se connecter', 'login echoue', 'erreur connexion', 'connexion bloquee'],
    answer: '1. Vérifiez votre **email et mot de passe**\n2. Vérifiez votre connexion internet\n3. Essayez **Mot de passe oublié**\n4. Contactez votre admin si le problème persiste',
  },
  {
    id: 'err-pin-wrong',
    category: 'errors',
    keywords: ['pin incorrect', 'mauvais pin', 'pin refuse', 'pin ne marche pas', 'pin faux', 'pin errone'],
    answer: 'Vérifiez que vous entrez le bon code. Après plusieurs échecs, contactez votre **administrateur** pour une récupération.',
  },
  {
    id: 'err-upload-fail',
    category: 'errors',
    keywords: ['upload echoue', 'erreur upload', 'upload ne marche pas', 'fichier pas charge', 'envoi fichier echoue'],
    answer: '1. Vérifiez que le fichier fait **moins de 50 Mo**\n2. Vérifiez que le **format est accepté**\n3. Vérifiez votre connexion\n4. Rechargez et réessayez',
  },
  {
    id: 'err-blank-screen',
    category: 'errors',
    keywords: ['page blanche', 'ecran blanc', 'application ne charge pas', 'rien ne charge', 'app cassee'],
    answer: '1. **Ctrl+Shift+R** (ou Cmd+Shift+R Mac) pour forcer le rechargement\n2. Videz le cache navigateur\n3. Essayez en navigation privée\n4. Contactez le support si persistant',
  },
  {
    id: 'err-session-lost',
    category: 'errors',
    keywords: ['session perdue', 'deconnecte', 'pin redemande', 'rechargement pin', 'perte session', 'pin apres rechargement'],
    answer: 'Le rechargement de page redemande le PIN. Entrez-le pour restaurer votre session. La clé de chiffrement est conservée uniquement en mémoire par mesure de sécurité.',
  },
  {
    id: 'err-notif-denied',
    category: 'errors',
    keywords: ['notification refusee', 'notifications bloquees navigateur', 'autoriser notifications', 'debloquer notifications'],
    answer: '**Chrome** : cadenas dans l\'URL → Notifications → Autoriser\n**Firefox** : Menu → Préférences → Vie privée → Notifications\n**Safari** : Préférences → Sites web → Notifications',
  },
  {
    id: 'err-file-type',
    category: 'errors',
    keywords: ['type fichier refuse', 'format non autorise', 'fichier refuse', 'extension refusee'],
    answer: 'Formats autorisés : PDF, Word, Excel, PowerPoint, Images (PNG/JPG/GIF/WebP), Texte (txt/csv), ZIP. Les exécutables (.exe, .app…) sont bloqués.',
  },
  {
    id: 'err-quota',
    category: 'errors',
    keywords: ['quota depasse', 'plus de place', 'espace plein', 'stockage plein', 'limite stockage atteinte'],
    answer: 'Votre quota de stockage est atteint. Supprimez des fichiers ou contactez votre admin pour augmenter le quota (Console admin → Stockage).',
  },
]
