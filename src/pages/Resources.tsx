import { useParams, Link, useNavigate } from 'react-router-dom'
import { BookOpen, FileText, MessageSquare, ChevronRight, Check } from 'lucide-react'
import { PublicNav } from '../components/layout/PublicNav'
import { SiteFooter } from './Landing'

/* ── Top-level tab navigation ── */
const NAV = [
  { slug: 'documentation', label: 'Documentation', icon: BookOpen },
  { slug: 'guides',        label: 'Guide utilisateur', icon: FileText },
  { slug: 'support',       label: 'Support', icon: MessageSquare },
]

/* ────────────────────────────────────────────────────────────
   DOCUMENTATION CONTENT
   ──────────────────────────────────────────────────────────── */

const DOC_SECTIONS = [
  {
    id: 'premiers-pas',
    title: 'Premiers pas',
    items: [
      {
        id: 'creer-espace',
        title: 'Créer votre espace Kouma',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Kouma est un espace de travail privé réservé à votre organisation. Chaque organisation dispose de son propre espace, complètement isolé des autres.</p>
            <p>Pour créer votre espace, rendez-vous sur <strong className="text-ink">/creer</strong>. Vous renseignerez en trois étapes :</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Les informations de votre organisation (nom, pays, ville, type)</li>
              <li>Les coordonnées du compte administrateur (email, téléphone, mot de passe)</li>
              <li>La confirmation des informations saisies</li>
            </ol>
            <p>À la fin de la création, une <strong className="text-ink">phrase de récupération</strong> vous sera communiquée. Elle est essentielle — conservez-la dans un endroit sûr, hors de l'application.</p>
          </div>
        ),
      },
      {
        id: 'configuration-initiale',
        title: 'Configuration initiale de l\'organisation',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Une fois votre espace créé, connectez-vous à la <strong className="text-ink">console d'administration</strong> (accessible via le menu principal en haut à gauche).</p>
            <p>Les premières étapes recommandées :</p>
            <ul className="space-y-2 pl-2">
              {[
                'Ajoutez le logo de votre organisation dans Paramètres',
                'Vérifiez la devise et la langue configurées (elles s\'appliquent aux tarifs et à l\'interface)',
                'Créez vos départements (ex. : RH, Finance, Direction)',
                'Créez vos équipes pour organiser les espaces de messagerie',
                'Invitez vos premiers collaborateurs',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <Check size={13} className="text-success mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: 'inviter-collaborateurs',
        title: 'Inviter vos premiers collaborateurs',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Dans la console d'administration → <strong className="text-ink">Utilisateurs</strong>, cliquez sur <strong className="text-ink">Générer un lien d'invitation</strong>. Le lien est valable pour une durée que vous choisissez (1 à 30 jours).</p>
            <p>Partagez ce lien avec vos collaborateurs par email ou messagerie. Chaque personne qui clique sur le lien est invitée à créer son compte et à rejoindre votre espace automatiquement.</p>
            <p><strong className="text-ink">Limites selon le plan :</strong> plan Gratuit = 25 membres, Business = 100 membres, Entreprise = illimité.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'modules',
    title: 'Modules',
    items: [
      {
        id: 'messagerie',
        title: 'Messagerie et espaces d\'équipe',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>La messagerie Kouma est organisée en <strong className="text-ink">conversations</strong>. Il en existe trois types :</p>
            <ul className="space-y-2 pl-2">
              <li><strong className="text-ink">Espaces d'équipe</strong> — conversations permanentes pour une équipe (ex. Finance, RH). Tous les membres de l'équipe y ont accès.</li>
              <li><strong className="text-ink">Conversations directes</strong> — échange privé entre deux personnes.</li>
              <li><strong className="text-ink">Groupes</strong> — conversation privée entre plusieurs personnes sélectionnées.</li>
            </ul>
            <p>Tous les messages sont chiffrés de bout en bout. Même les administrateurs ne peuvent pas lire les messages privés.</p>
            <p>Vous pouvez joindre des fichiers, réagir avec des émojis, répondre à un message spécifique et créer des sondages directement dans une conversation.</p>
          </div>
        ),
      },
      {
        id: 'documents',
        title: 'Documents et fichiers',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>La section Documents centralise tous les fichiers partagés dans votre organisation. Vous pouvez :</p>
            <ul className="space-y-1.5 pl-2">
              {[
                'Importer des fichiers (PDF, Word, Excel, images, etc.)',
                'Organiser vos fichiers en dossiers',
                'Contrôler la visibilité : personnel, équipe ou toute l\'organisation',
                'Télécharger un fichier à tout moment',
                'Voir l\'historique des consultations (administrateur)',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted mt-2 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p>Le quota de stockage dépend de votre plan : 5 Go (Gratuit), 50 Go (Business), 250 Go (Entreprise).</p>
          </div>
        ),
      },
      {
        id: 'agenda',
        title: 'Agenda et réunions',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>L'agenda vous permet de planifier des événements et des réunions avec les membres de votre organisation. Chaque événement peut avoir des participants invités qui reçoivent une notification.</p>
            <p>Pour chaque réunion, vous pouvez rédiger un <strong className="text-ink">compte-rendu</strong> directement dans l'agenda. Le compte-rendu est visible par tous les participants et peut être retrouvé via AXIS (recherche intégrée).</p>
            <p>L'agenda est partagé à l'échelle de l'organisation. Chaque membre voit les événements auxquels il est invité.</p>
          </div>
        ),
      },
      {
        id: 'annonces',
        title: 'Annonces',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Les annonces permettent aux administrateurs de diffuser un message important à <strong className="text-ink">toute l'organisation</strong>. Contrairement aux messages, les annonces sont visibles par tous les membres sans exception.</p>
            <p>Chaque membre peut marquer une annonce comme lue. L'administrateur peut voir combien de personnes ont consulté l'annonce.</p>
            <p>Les annonces sont accessibles depuis le menu principal → Annonces.</p>
          </div>
        ),
      },
      {
        id: 'axis-guide',
        title: 'AXIS — guide intégré',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>AXIS est le guide intégré de Kouma. Il est accessible depuis le menu principal → <strong className="text-ink">Assistant</strong>. AXIS répond uniquement aux questions relatives à l'utilisation de la plateforme.</p>
            <p>Ce qu'AXIS peut faire :</p>
            <ul className="space-y-1.5 pl-2">
              {[
                'Répondre à des questions sur Kouma (onglet Chat)',
                'Résumer le contenu d\'une conversation (onglet Résumé)',
                'Créer une tâche ou rappel (onglet Action)',
                'Rechercher un document ou un compte-rendu (onglet Recherche)',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted mt-2 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p>AXIS ne rédige pas de texte libre et ne peut pas accéder à des informations extérieures à Kouma.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      {
        id: 'roles',
        title: 'Rôles et permissions',
        body: (
          <div className="space-y-4 text-sm text-muted leading-relaxed">
            <div>
              <p className="font-semibold text-ink mb-1">Administrateur</p>
              <p>Accès complet à la console d'administration. Peut inviter et gérer les membres, créer des équipes et départements, publier des annonces, consulter le journal d'audit, modifier les paramètres de l'organisation et gérer l'abonnement.</p>
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">Collaborateur</p>
              <p>Accède à la messagerie, aux documents, à l'agenda et aux annonces selon les équipes auxquelles il appartient. Ne peut pas modifier les paramètres de l'organisation ni consulter les données des autres membres.</p>
            </div>
            <p>Un administrateur peut suspendre ou révoquer l'accès d'un collaborateur depuis la console → Utilisateurs. La révocation prend effet immédiatement (toutes les sessions actives de la personne sont fermées).</p>
          </div>
        ),
      },
      {
        id: 'equipes-departements',
        title: 'Équipes et départements',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p><strong className="text-ink">Départements</strong> : servent à organiser votre organigramme (RH, Finance, Direction…). Chaque collaborateur peut être rattaché à un département.</p>
            <p><strong className="text-ink">Équipes</strong> : chaque équipe crée automatiquement un espace de messagerie dédié. Les membres de l'équipe y ont accès et peuvent s'y communiquer en temps réel.</p>
            <p>Un même collaborateur peut appartenir à plusieurs équipes. L'administrateur définit les membres et les permissions de chaque équipe.</p>
          </div>
        ),
      },
      {
        id: 'console-admin',
        title: 'Console d\'administration',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>La console d'administration est le tableau de bord réservé aux administrateurs. Elle regroupe :</p>
            <ul className="space-y-1.5 pl-2">
              {[
                'Tableau de bord — vue d\'ensemble de l\'activité',
                'Utilisateurs — liste des membres, invitations, gestion des accès',
                'Départements — organisation de l\'équipe',
                'Équipes — espaces de messagerie par groupe',
                'Annonces — diffusion à toute l\'organisation',
                'Stockage — suivi de l\'utilisation et des fichiers',
                'Sécurité — paramètres de sécurité avancés',
                'Journal d\'audit — historique de toutes les actions importantes',
                'Paramètres — informations organisation, logo, abonnement',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted mt-2 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: 'gestion-stockage',
        title: 'Gestion du stockage',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Le stockage disponible dépend de votre plan. Il est partagé entre tous les membres de l'organisation.</p>
            <p>Dans la console → <strong className="text-ink">Stockage</strong>, vous voyez l'espace utilisé, les fichiers les plus volumineux et les membres qui ont importé des fichiers.</p>
            <p>Les fichiers supprimés par leurs propriétaires libèrent immédiatement de l'espace. Les administrateurs peuvent voir le détail du stockage mais ne peuvent pas accéder aux fichiers marqués comme personnels.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'facturation',
    title: 'Plans et facturation',
    items: [
      {
        id: 'plans',
        title: 'Comparer les plans',
        body: (
          <div className="space-y-4 text-sm text-muted leading-relaxed">
            <div className="grid gap-3">
              {[
                { name: 'Gratuit', members: '25 membres', storage: '5 Go', highlight: false },
                { name: 'Business', members: '100 membres', storage: '50 Go', highlight: true },
                { name: 'Entreprise', members: 'Illimité', storage: '250 Go', highlight: false },
              ].map(p => (
                <div key={p.name} className={`p-4 rounded-xl border ${p.highlight ? 'border-indigo bg-indigo-pale' : 'border-border bg-surface'}`}>
                  <div className="font-semibold text-ink mb-1">{p.name}</div>
                  <div className="text-xs space-y-0.5">
                    <div>Membres : <span className="text-ink font-medium">{p.members}</span></div>
                    <div>Stockage : <span className="text-ink font-medium">{p.storage}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <p>Tous les plans incluent l'accès à l'intégralité des fonctionnalités (messagerie, documents, agenda, annonces, AXIS, administration).</p>
          </div>
        ),
      },
      {
        id: 'essai',
        title: 'Période d\'essai gratuite',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Les plans Business et Entreprise incluent <strong className="text-ink">3 semaines d'essai gratuit</strong> sans engagement et sans carte bancaire requise.</p>
            <p>Pendant l'essai, toutes les fonctionnalités du plan choisi sont disponibles sans restriction. À la fin de la période d'essai, votre espace repasse automatiquement en plan Gratuit si aucun abonnement n'a été activé.</p>
          </div>
        ),
      },
      {
        id: 'upgrade',
        title: 'Passer à un plan supérieur',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Dans la console d'administration → <strong className="text-ink">Paramètres</strong>, faites défiler jusqu'à la section "Abonnement". Vous y trouverez le bouton de mise à niveau.</p>
            <p>Le passage au plan supérieur est immédiat et entièrement en self-service — aucune intervention humaine n'est nécessaire, y compris pour le plan Entreprise.</p>
          </div>
        ),
      },
      {
        id: 'devises',
        title: 'Devises disponibles',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Kouma est disponible dans 12 devises : GNF, XOF, XAF, EUR, USD, CAD, GBP, CHF, RUB, MAD, NGN, GHS.</p>
            <p>La devise est choisie lors de la création de l'espace en fonction du pays de l'organisation. Elle peut être modifiée dans Paramètres → Devise. Chaque devise a ses propres tarifs définis indépendamment.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité et confidentialité',
    items: [
      {
        id: 'chiffrement',
        title: 'Chiffrement de bout en bout',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Tous les messages et fichiers dans Kouma sont <strong className="text-ink">chiffrés de bout en bout</strong>. Cela signifie que leur contenu ne peut être lu que par les personnes impliquées dans la conversation — personne d'autre, pas même Kouma ou les administrateurs de votre organisation.</p>
            <p>Techniquement, chaque message est chiffré avec une clé unique avant d'être envoyé. Cette clé n'est jamais transmise à nos serveurs en clair. Seuls les appareils des participants de la conversation peuvent déchiffrer les messages.</p>
            <p>Cette protection est automatique et ne nécessite aucune action de votre part.</p>
          </div>
        ),
      },
      {
        id: 'recuperation',
        title: 'Phrase de récupération',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>À la création de l'espace, une <strong className="text-ink">phrase de récupération</strong> (aussi appelée "clé de secours") est générée. C'est une série de mots uniques à votre organisation.</p>
            <p>Elle sert à récupérer l'accès à vos données chiffrées si l'administrateur perd son mot de passe et ne peut plus se connecter. Sans cette phrase, certaines données chiffrées ne pourraient pas être récupérées.</p>
            <p><strong className="text-ink">Conservez-la dans un endroit sûr, hors de l'application</strong> : imprimée et rangée, dans un coffre-fort numérique, ou confiée à une personne de confiance. Ne la partagez jamais par email ou messagerie.</p>
          </div>
        ),
      },
      {
        id: 'sessions',
        title: 'Sessions et appareils connectés',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Chaque appareil utilisé pour se connecter à Kouma crée une session. Dans votre profil → <strong className="text-ink">Sécurité</strong>, vous voyez la liste de vos sessions actives (appareil, navigateur, dernière activité).</p>
            <p>Vous pouvez fermer une session à distance — utile si vous avez oublié de vous déconnecter d'un appareil public ou si vous pensez qu'un accès non autorisé a eu lieu.</p>
            <p>Les administrateurs peuvent également révoquer les sessions d'un membre depuis la console → Utilisateurs (en cas de départ, par exemple).</p>
          </div>
        ),
      },
      {
        id: 'audit',
        title: 'Journal d\'audit',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Le journal d'audit (console → <strong className="text-ink">Journal</strong>) enregistre toutes les actions importantes : connexions, invitations, modifications de rôle, suppressions, changements de paramètres.</p>
            <p>Chaque entrée indique qui a fait quoi et quand. Ce journal est en lecture seule — il ne peut pas être modifié ni supprimé.</p>
            <p>Utile pour suivre l'activité de l'organisation, détecter des actions inattendues ou répondre à des questions de conformité interne.</p>
          </div>
        ),
      },
    ],
  },
]

/* ────────────────────────────────────────────────────────────
   GUIDE UTILISATEUR CONTENT
   ──────────────────────────────────────────────────────────── */

const GUIDE_SECTIONS = [
  {
    id: 'demarrage',
    title: 'Démarrage',
    items: [
      {
        id: 'creer-organisation',
        title: 'Comment créer mon espace ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3 counter-reset-none">
              {[
                'Rendez-vous sur kouma.app et cliquez sur "Créer mon espace".',
                'Renseignez le nom de votre organisation, son type, le pays et la ville.',
                'Choisissez la langue et la devise de votre espace (elles peuvent être changées plus tard).',
                'Renseignez votre email, votre téléphone et choisissez un mot de passe (6 caractères minimum).',
                'Vérifiez le récapitulatif et confirmez.',
                'Notez votre phrase de récupération et cochez la case de confirmation.',
                'Votre espace est prêt — cliquez sur "Accéder à mon espace".',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'compte-administrateur',
        title: 'Configurer mon compte administrateur',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Connectez-vous à votre espace. Vous arriverez sur la messagerie.',
                'Cliquez sur "Administration" dans le menu en haut à gauche pour accéder à la console.',
                'Dans Paramètres, ajoutez le logo de votre organisation et vérifiez les informations.',
                'Dans Départements, créez les départements de votre structure (RH, Finance, etc.).',
                'Dans Utilisateurs, générez un premier lien d\'invitation pour accueillir vos collaborateurs.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'phrase-recuperation',
        title: 'Sauvegarder ma phrase de récupération',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-medium text-xs mb-1">Important</p>
              <p className="text-amber-700 text-xs">Cette phrase est générée une seule fois, à la création de votre espace. Elle ne peut pas être régénérée. Si vous la perdez, certaines données ne pourront pas être récupérées en cas de perte de mot de passe.</p>
            </div>
            <p>La phrase de récupération s'affiche uniquement lors de la dernière étape de création de votre espace.</p>
            <p><strong className="text-ink">Comment la sauvegarder :</strong></p>
            <ul className="space-y-1.5 pl-2">
              {[
                'Imprimez-la et rangez-la dans un endroit sûr (coffre, tiroir fermé à clé)',
                'Notez-la dans un gestionnaire de mots de passe sécurisé (Bitwarden, 1Password…)',
                'Confiez-la à une personne de confiance dans votre organisation',
              ].map(s => (
                <li key={s} className="flex items-start gap-2">
                  <Check size={13} className="text-success mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-faint">Ne l'envoyez jamais par email ou messagerie — pas même dans Kouma.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'collaborateurs',
    title: 'Collaborateurs',
    items: [
      {
        id: 'inviter',
        title: 'Comment inviter un collaborateur ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans la console d\'administration, cliquez sur "Utilisateurs".',
                'Cliquez sur "Générer un lien d\'invitation".',
                'Choisissez la durée de validité du lien (7 jours par défaut).',
                'Copiez le lien et envoyez-le à votre collaborateur par email ou autre canal.',
                'Le collaborateur clique sur le lien, crée son compte et rejoint automatiquement votre espace.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-faint">Si le lien expire avant que la personne l'utilise, générez-en un nouveau depuis la même page. Les anciens liens sont révoqués automatiquement.</p>
          </div>
        ),
      },
      {
        id: 'creer-equipe',
        title: 'Comment créer une équipe ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans la console → "Équipes", cliquez sur "Nouvelle équipe".',
                'Donnez un nom à l\'équipe (ex. : Finance, RH, Projet Alpha).',
                'Ajoutez les membres de l\'équipe en les sélectionnant dans la liste.',
                'Définissez les permissions de l\'équipe si nécessaire.',
                'Cliquez sur "Créer". Un espace de messagerie dédié est automatiquement créé pour cette équipe.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>Les membres de l'équipe ont immédiatement accès à l'espace de messagerie correspondant.</p>
          </div>
        ),
      },
      {
        id: 'gerer-roles',
        title: 'Gérer les rôles et les accès',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Dans la console → <strong className="text-ink">Utilisateurs</strong>, cliquez sur un membre pour voir ses options.</p>
            <ul className="space-y-2 pl-2">
              {[
                { action: 'Suspendre', desc: 'Le membre ne peut plus se connecter, mais son compte est conservé. Ses sessions actives sont fermées immédiatement.' },
                { action: 'Réactiver', desc: 'Restore l\'accès à un membre suspendu.' },
                { action: 'Révoquer', desc: 'Supprime définitivement l\'accès à l\'espace. Le membre ne peut plus se connecter ni récupérer ses données.' },
              ].map(({ action, desc }) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="font-semibold text-ink shrink-0">{action} :</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      {
        id: 'envoyer-message',
        title: 'Comment envoyer un message ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans la messagerie, sélectionnez une conversation dans la liste à gauche (ou créez-en une nouvelle).',
                'Tapez votre message dans la zone de saisie en bas.',
                'Appuyez sur Entrée ou cliquez sur l\'icône d\'envoi.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>Vous pouvez aussi <strong className="text-ink">joindre un fichier</strong> (icône trombone), <strong className="text-ink">répondre à un message</strong> (survolez-le et cliquez sur "Répondre") ou <strong className="text-ink">réagir avec un émoji</strong>.</p>
          </div>
        ),
      },
      {
        id: 'creer-conversation',
        title: 'Créer une conversation de groupe',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans la messagerie, cliquez sur l\'icône "Nouveau message" ou "+" en haut de la liste.',
                'Choisissez "Groupe" comme type de conversation.',
                'Sélectionnez les participants (vous pouvez en ajouter plusieurs).',
                'Donnez un nom au groupe.',
                'Cliquez sur "Créer".',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-faint">Les conversations de groupe sont privées. Seuls les participants peuvent lire les messages — pas même les administrateurs.</p>
          </div>
        ),
      },
      {
        id: 'publier-annonce',
        title: 'Publier une annonce à toute l\'organisation',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Seuls les administrateurs peuvent publier des annonces.</p>
            <ol className="space-y-3">
              {[
                'Dans la console d\'administration, cliquez sur "Annonces".',
                'Cliquez sur "Nouvelle annonce".',
                'Rédigez votre annonce (titre et contenu).',
                'Cliquez sur "Publier". Tous les membres de l\'organisation la verront immédiatement.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: 'documents-fichiers',
    title: 'Documents et fichiers',
    items: [
      {
        id: 'partager-document',
        title: 'Comment partager un document ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans la section Documents, cliquez sur "Importer un fichier".',
                'Sélectionnez le fichier depuis votre ordinateur.',
                'Choisissez la visibilité : Personnel (vous seul), Équipe (les membres de votre équipe) ou Organisation (tous les membres).',
                'Choisissez le dossier de destination (optionnel).',
                'Cliquez sur "Importer".',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>Vous pouvez aussi joindre un fichier directement dans un message — il sera automatiquement disponible dans la section Documents.</p>
          </div>
        ),
      },
      {
        id: 'organiser-dossiers',
        title: 'Organiser ses dossiers',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans Documents, cliquez sur "Nouveau dossier".',
                'Donnez un nom au dossier.',
                'Choisissez sa visibilité (Personnel ou Organisation).',
                'Pour déplacer un fichier dans un dossier, faites un clic long ou utilisez le menu "…" à côté du fichier.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'telecharger',
        title: 'Télécharger un fichier partagé',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans Documents, trouvez le fichier que vous souhaitez télécharger.',
                'Cliquez sur le fichier pour l\'ouvrir.',
                'Cliquez sur "Télécharger" (icône en haut à droite).',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>Vous pouvez aussi télécharger un fichier directement depuis un message en cliquant sur la pièce jointe.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'agenda-reunions',
    title: 'Agenda et réunions',
    items: [
      {
        id: 'planifier-reunion',
        title: 'Comment planifier une réunion ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans l\'Agenda, cliquez sur "Nouvel événement" ou sur une date dans le calendrier.',
                'Donnez un titre à la réunion.',
                'Sélectionnez la date, l\'heure de début et de fin.',
                'Ajoutez une description ou un lien de réunion si nécessaire.',
                'Cliquez sur "Créer". Les participants sélectionnés reçoivent une notification.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'ajouter-participants',
        title: 'Ajouter des participants à un événement',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p>Lors de la création ou de la modification d'un événement, cliquez sur le champ <strong className="text-ink">Participants</strong> et sélectionnez les membres à inviter.</p>
            <p>Chaque participant invité reçoit une notification dans l'application. L'événement apparaît dans leur agenda.</p>
            <p>Vous pouvez modifier les participants d'un événement existant en cliquant dessus → "Modifier".</p>
          </div>
        ),
      },
      {
        id: 'compte-rendu',
        title: 'Rédiger un compte-rendu de réunion',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Dans l\'Agenda, cliquez sur l\'événement concerné.',
                'Cliquez sur "Compte-rendu" ou "Ajouter un compte-rendu".',
                'Rédigez les points clés, décisions et actions à suivre.',
                'Cliquez sur "Enregistrer". Le compte-rendu est visible par tous les participants.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>Les comptes-rendus peuvent être recherchés via AXIS (menu Assistant → onglet Recherche).</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'profil-securite',
    title: 'Profil et sécurité',
    items: [
      {
        id: 'modifier-profil',
        title: 'Modifier mon profil',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Cliquez sur votre avatar en bas à gauche dans le menu principal.',
                'Cliquez sur "Modifier le profil" dans l\'onglet "Moi".',
                'Modifiez votre prénom, nom ou photo de profil.',
                'Cliquez sur "Enregistrer".',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: 'changer-pin',
        title: 'Changer mon code PIN',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Cliquez sur votre avatar → onglet "Sécurité".',
                'Cliquez sur "Modifier mon code PIN".',
                'Entrez votre code PIN actuel (6 chiffres).',
                'Entrez et confirmez le nouveau code.',
                'Cliquez sur "Enregistrer".',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-faint">Votre code PIN protège vos clés de chiffrement. Il est différent de votre mot de passe de connexion.</p>
          </div>
        ),
      },
      {
        id: 'recuperer-compte',
        title: 'Comment récupérer mon compte ?',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <p><strong className="text-ink">Si vous avez oublié votre mot de passe :</strong></p>
            <ol className="space-y-2 mb-4">
              {[
                'Sur la page de connexion, cliquez sur "Mot de passe oublié".',
                'Entrez votre email. Un lien de réinitialisation vous sera envoyé.',
                'Cliquez sur le lien dans l\'email et choisissez un nouveau mot de passe.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p><strong className="text-ink">Si vous avez aussi oublié votre code PIN :</strong> vous aurez besoin de la <strong className="text-ink">phrase de récupération</strong> de votre organisation pour régénérer vos clés de chiffrement. Contactez le support si vous avez besoin d'aide.</p>
          </div>
        ),
      },
      {
        id: 'appareils-connectes',
        title: 'Voir et gérer mes appareils connectés',
        body: (
          <div className="space-y-3 text-sm text-muted leading-relaxed">
            <ol className="space-y-3">
              {[
                'Cliquez sur votre avatar → onglet "Sécurité".',
                'La liste de vos appareils connectés s\'affiche (nom, navigateur, dernière activité).',
                'Pour fermer une session à distance, cliquez sur "Révoquer" à côté de l\'appareil concerné.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p>L'appareil sur lequel vous êtes actuellement connecté est marqué comme "Cet appareil". Vous ne pouvez pas révoquer votre propre session depuis cette liste.</p>
          </div>
        ),
      },
    ],
  },
]

/* ────────────────────────────────────────────────────────────
   SUPPORT PAGE
   ──────────────────────────────────────────────────────────── */

function SupportPage() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-navy mb-2">Support</h1>
      <p className="text-muted mb-8 leading-relaxed">
        Une question, un problème ou une suggestion ? Notre équipe vous répond directement.
      </p>
      <div className="space-y-4">
        <a href="mailto:support@kouma.app"
          className="flex items-center gap-4 p-5 bg-surface border border-border rounded-2xl hover:border-indigo/30 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0 group-hover:bg-indigo/20 transition-colors">
            <MessageSquare size={18} className="text-indigo" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Écrire au support</div>
            <div className="text-xs text-muted mt-0.5">support@kouma.app — réponse sous 24h</div>
          </div>
          <ChevronRight size={16} className="text-faint ml-auto" />
        </a>
        <div className="p-5 bg-surface border border-border rounded-2xl">
          <div className="text-sm font-semibold text-ink mb-3">Avant d'écrire, avez-vous consulté…</div>
          <ul className="space-y-2">
            <li>
              <Link to="/resources/guides" className="flex items-center gap-2 text-sm text-indigo hover:underline">
                <FileText size={14} /> Le guide utilisateur
              </Link>
            </li>
            <li>
              <Link to="/resources/documentation" className="flex items-center gap-2 text-sm text-indigo hover:underline">
                <BookOpen size={14} /> La documentation
              </Link>
            </li>
          </ul>
        </div>
        <div className="p-4 bg-indigo-pale rounded-xl">
          <p className="text-xs text-indigo leading-relaxed">
            <span className="font-semibold">AXIS</span>, le guide intégré de Kouma, peut aussi répondre à vos questions directement depuis votre espace de travail — menu "Assistant".
          </p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   SHARED COMPONENTS
   ──────────────────────────────────────────────────────────── */

function Sidebar({ sections }: { sections: typeof DOC_SECTIONS }) {
  return (
    <nav className="space-y-5">
      {sections.map(section => (
        <div key={section.id}>
          <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1.5 px-2">{section.title}</p>
          <ul className="space-y-0.5">
            {section.items.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`}
                  className="block px-2 py-1.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-bg transition-colors leading-snug">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────── */

export function Resources() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const current = slug ?? 'documentation'

  const isGuide = current === 'guides'
  const sections = isGuide ? GUIDE_SECTIONS : DOC_SECTIONS
  const pageTitle = isGuide ? 'Guide utilisateur' : 'Documentation'
  const pageDesc = isGuide
    ? 'Des guides pratiques pour utiliser chaque fonctionnalité de Kouma, étape par étape.'
    : 'Documentation complète de la plateforme Kouma — modules, administration, sécurité et facturation.'

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      {/* Tab nav */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map(({ slug: s, label, icon: Icon }) => (
            <button key={s} onClick={() => navigate(`/resources/${s}`)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                current === s ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-bg">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {current === 'support' ? (
            <SupportPage />
          ) : (
            <div className="flex gap-10">
              {/* Sidebar — desktop only */}
              <aside className="w-56 shrink-0 hidden lg:block">
                <div className="sticky top-20">
                  <p className="text-xs font-bold text-navy mb-4 uppercase tracking-wide">{pageTitle}</p>
                  <Sidebar sections={sections} />
                </div>
              </aside>

              {/* Content */}
              <main className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-navy mb-2">{pageTitle}</h1>
                <p className="text-muted mb-10 leading-relaxed">{pageDesc}</p>

                <div className="space-y-10">
                  {sections.map(section => (
                    <div key={section.id} id={section.id}>
                      <h2 className="text-base font-bold text-ink mb-5 pb-2 border-b border-border">{section.title}</h2>
                      <div className="space-y-8">
                        {section.items.map(item => (
                          <div key={item.id} id={item.id} className="scroll-mt-24">
                            <h3 className="text-sm font-bold text-navy mb-3">{item.title}</h3>
                            {item.body}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-14 p-5 bg-indigo-pale rounded-2xl border border-indigo/10">
                  <p className="text-sm text-indigo leading-relaxed">
                    <span className="font-semibold">Vous ne trouvez pas ce que vous cherchez ?</span>{' '}
                    <Link to="/resources/support" className="underline hover:no-underline">Contactez le support</Link> — nous vous répondons sous 24h.
                  </p>
                </div>
              </main>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
