import { Link } from 'react-router-dom'
import { PublicNav } from '../../components/layout/PublicNav'
import { SiteFooter } from '../Landing'

interface LegalPageProps {
  title: string
  children: React.ReactNode
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />
      <section className="flex-1 py-16 px-4 bg-bg">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="text-xs text-muted hover:text-ink transition-colors mb-8 inline-block">← Retour à l'accueil</Link>
          <h1 className="text-3xl font-bold text-navy mb-8">{title}</h1>
          <div className="prose-sm text-muted leading-relaxed space-y-6">{children}</div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

/* ── Composants de mise en forme partagés ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-navy">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted leading-relaxed">{children}</p>
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1 text-sm text-muted">{children}</ul>
}

function Placeholder({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-amber/10 border border-amber/30 rounded text-xs font-mono text-amber">
      [À COMPLÉTER — {label}]
    </span>
  )
}

/* ─────────────────────────────────────────
   MENTIONS LÉGALES
───────────────────────────────────────── */
export function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales">

      <div className="p-4 bg-amber/5 border border-amber/20 rounded-xl text-xs text-amber leading-relaxed">
        <strong>Note :</strong> Ce document contient des espaces réservés <span className="font-mono">[À COMPLÉTER]</span> qui doivent être renseignés avant publication officielle, et doit faire l'objet d'une relecture par un juriste pour s'assurer de sa conformité avec les lois guinéennes et internationales applicables.
      </div>

      <Section title="Éditeur de l'application">
        <P>
          L'application Kouma Workspace est éditée par <strong>Gundo</strong>,{' '}
          <Placeholder label="forme juridique : SARL, SAS, etc." />{', '}
          au capital de <Placeholder label="montant du capital" />.
        </P>
        <UL>
          <li>Siège social : <Placeholder label="adresse complète" /></li>
          <li>Numéro RCCM / immatriculation : <Placeholder label="numéro d'immatriculation" /></li>
          <li>Numéro de contribuable / NIF : <Placeholder label="NIF" /></li>
          <li>Directeur de publication : <Placeholder label="nom et prénom du responsable légal" /></li>
          <li>Contact : <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a></li>
        </UL>
      </Section>

      <Section title="Hébergement technique">
        <P>L'application Kouma Workspace est hébergée sur les infrastructures suivantes :</P>
        <UL>
          <li>
            <strong>Vercel Inc.</strong> — 340 Pine Street Suite 701, San Francisco, CA 94104, États-Unis.
            Utilisé pour la distribution de l'application (fichiers statiques, edge network).
          </li>
          <li>
            <strong>Supabase</strong> — base de données, authentification, stockage de fichiers.
            Les données sont hébergées dans la région <strong>Europe (Irlande)</strong>, soumises au droit européen (RGPD).
          </li>
        </UL>
      </Section>

      <Section title="Propriété intellectuelle">
        <P>
          L'ensemble du contenu de Kouma Workspace — interface, code, marque, logo, textes — est la propriété exclusive de Gundo, sauf mention contraire. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable de Gundo est interdite.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Pour toute question d'ordre légal ou toute demande relative à vos données personnelles, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a>
        </P>
      </Section>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   POLITIQUE DE CONFIDENTIALITÉ
───────────────────────────────────────── */
export function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité">

      <div className="p-4 bg-amber/5 border border-amber/20 rounded-xl text-xs text-amber leading-relaxed">
        <strong>Note :</strong> Ce document doit faire l'objet d'une relecture par un juriste qualifié avant toute publication officielle, notamment pour sa conformité au droit guinéen et au RGPD européen.
      </div>

      <P>Dernière mise à jour : juillet 2026. Responsable du traitement : <strong>Gundo</strong> — <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a></P>

      {/* Bloc E2E mis en avant */}
      <div className="p-5 bg-indigo-pale border border-indigo/20 rounded-2xl space-y-2">
        <p className="text-sm font-bold text-navy">Ce que Gundo ne peut pas lire — et c'est une garantie, pas une promesse</p>
        <p className="text-sm text-ink leading-relaxed">
          Le contenu de vos messages et de vos documents échangés sur Kouma est <strong>chiffré de bout en bout</strong>. Cela signifie concrètement qu'il est rendu illisible avant même de quitter votre appareil, et qu'il ne peut être déchiffré que par les destinataires légitimes. <strong>Gundo, en tant qu'opérateur de la plateforme, ne dispose d'aucune clé permettant de lire ce contenu</strong> — même en cas de demande judiciaire ou administrative, nous ne pouvons pas fournir le contenu des messages, parce que nous ne l'avons techniquement pas.
        </p>
      </div>

      <Section title="1. Qui sommes-nous ?">
        <P>
          Gundo est l'entreprise qui développe et opère Kouma Workspace. Nous agissons en tant que responsable du traitement de vos données personnelles, dans le respect des réglementations applicables.
        </P>
      </Section>

      <Section title="2. Quelles données collectons-nous ?">
        <P>Nous collectons uniquement les données nécessaires au fonctionnement du service :</P>

        <p className="text-sm font-semibold text-ink">Données de compte :</p>
        <UL>
          <li>Nom, prénom</li>
          <li>Adresse e-mail professionnelle</li>
          <li>Numéro de téléphone (optionnel)</li>
          <li>Photo de profil (optionnelle)</li>
          <li>Poste / intitulé de fonction</li>
          <li>Département au sein de l'organisation</li>
        </UL>

        <p className="text-sm font-semibold text-ink mt-3">Données d'organisation :</p>
        <UL>
          <li>Nom de l'organisation, secteur d'activité, pays, ville</li>
          <li>Logo (optionnel)</li>
          <li>Paramètres de sécurité et de configuration</li>
        </UL>

        <p className="text-sm font-semibold text-ink mt-3">Métadonnées techniques :</p>
        <UL>
          <li>Date et heure des connexions</li>
          <li>Type d'appareil et navigateur utilisé</li>
          <li>Journal des actions administratives (audit log)</li>
          <li>Métadonnées de messagerie : qui a envoyé un message à qui, à quelle heure — mais <strong>pas le contenu</strong></li>
        </UL>

        <div className="p-3 bg-success/5 border border-success/20 rounded-xl">
          <p className="text-xs text-success font-medium">Ce que nous ne collectons <em>pas</em> : le contenu de vos messages, le contenu de vos documents. Ces données sont chiffrées de bout en bout et nous sont techniquement inaccessibles.</p>
        </div>
      </Section>

      <Section title="3. Comment vos données sont-elles stockées ?">
        <P>
          Vos données sont stockées sur les serveurs <strong>Supabase</strong>, dans la région <strong>Europe (Irlande)</strong>. Cette région est soumise au Règlement Général sur la Protection des Données (RGPD) de l'Union européenne, qui est l'un des cadres légaux les plus stricts au monde en matière de protection des données personnelles.
        </P>
        <P>
          Vos données sont protégées par des mesures de sécurité techniques (chiffrement au repos, connexions HTTPS, contrôles d'accès stricts) et organisationnelles.
        </P>
      </Section>

      <Section title="4. Pourquoi utilisons-nous vos données ?">
        <UL>
          <li>Créer et gérer votre compte et celui de votre organisation</li>
          <li>Vous permettre de communiquer avec vos collègues via la messagerie</li>
          <li>Assurer la sécurité du service (détection de fraude, blocage d'accès non autorisés)</li>
          <li>Améliorer le service (statistiques d'usage anonymisées)</li>
          <li>Respecter nos obligations légales</li>
        </UL>
        <P>Nous n'utilisons pas vos données à des fins publicitaires. Nous ne les vendons jamais à des tiers.</P>
      </Section>

      <Section title="5. Combien de temps conservons-nous vos données ?">
        <UL>
          <li>Données de compte actif : pendant toute la durée d'utilisation du service</li>
          <li>Après fermeture de compte : 30 jours (période permettant la réactivation), puis suppression définitive</li>
          <li>Journaux d'audit : 12 mois maximum</li>
          <li>Données de facturation : <Placeholder label="durée légale applicable (ex. 5 ans)" /></li>
        </UL>
      </Section>

      <Section title="6. Vos droits">
        <P>Conformément aux réglementations applicables, vous disposez des droits suivants sur vos données personnelles :</P>
        <UL>
          <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> — corriger des données inexactes (possible directement dans votre profil)</li>
          <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte et de vos données</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible par machine</li>
          <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
        </UL>
        <P>
          Pour exercer ces droits, contactez-nous à <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a>. Nous répondons dans un délai maximum de 30 jours.
        </P>
      </Section>

      <Section title="7. Partage des données avec des tiers">
        <P>Nous ne vendons pas vos données. Nous les partageons uniquement avec :</P>
        <UL>
          <li><strong>Supabase</strong> — hébergement et infrastructure de données (sous-traitant)</li>
          <li><strong>Vercel</strong> — distribution de l'application (pas accès aux données personnelles)</li>
          <li>Autorités légales, uniquement si nous y sommes légalement contraints — et uniquement des métadonnées, le contenu des messages étant chiffré et inaccessible pour nous</li>
        </UL>
      </Section>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   CONDITIONS GÉNÉRALES D'UTILISATION
───────────────────────────────────────── */
export function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation">

      <div className="p-4 bg-amber/5 border border-amber/20 rounded-xl text-xs text-amber leading-relaxed">
        <strong>Note :</strong> Ce document doit faire l'objet d'une relecture par un juriste qualifié avant toute publication officielle, notamment pour sa conformité au droit guinéen applicable.
      </div>

      <P>Dernière mise à jour : juillet 2026. En utilisant Kouma Workspace, vous acceptez les présentes conditions.</P>

      <Section title="1. Objet du service">
        <P>
          Kouma Workspace est une plateforme de collaboration professionnelle sécurisée éditée par Gundo. Elle permet aux organisations d'échanger des messages chiffrés, de partager des documents, de gérer des agendas et des équipes au sein d'un espace de travail privé.
        </P>
        <P>
          L'accès à Kouma Workspace est réservé aux organisations ayant souscrit un abonnement (pour les administrateurs) et aux collaborateurs invités par ces organisations.
        </P>
      </Section>

      <Section title="2. Création de compte et accès">
        <UL>
          <li>L'accès à l'application requiert une invitation de votre organisation — il n'y a pas d'inscription publique ouverte.</li>
          <li>Vous êtes responsable de la confidentialité de votre code PIN d'accès. Ne le partagez avec personne.</li>
          <li>En cas de suspicion de compromission de votre compte, informez immédiatement votre administrateur.</li>
          <li>Un seul compte par adresse e-mail est autorisé.</li>
        </UL>
      </Section>

      <Section title="3. Obligations de l'utilisateur">
        <P>En utilisant Kouma Workspace, vous vous engagez à :</P>
        <UL>
          <li>Utiliser le service uniquement dans le cadre professionnel de votre organisation</li>
          <li>Ne pas partager votre accès avec des tiers non autorisés</li>
          <li>Ne pas utiliser le service à des fins illégales, frauduleuses ou contraires à l'ordre public</li>
          <li>Ne pas tenter de contourner les mécanismes de sécurité ou de chiffrement</li>
          <li>Ne pas publier de contenu portant atteinte aux droits de tiers (contenu diffamatoire, illégal, protégé par des droits d'auteur sans autorisation)</li>
          <li>Respecter les règles d'utilisation définies par votre organisation</li>
        </UL>
      </Section>

      <Section title="4. Obligations de l'organisation abonnée">
        <P>L'organisation (représentée par son administrateur) est responsable de :</P>
        <UL>
          <li>S'assurer que les utilisateurs invités ont connaissance et acceptent les présentes CGU</li>
          <li>Gérer les accès (invitation, révocation) de façon appropriée</li>
          <li>Respecter les lois applicables en matière de traitement des données de ses collaborateurs</li>
          <li>Payer les abonnements dans les délais convenus</li>
        </UL>
      </Section>

      <Section title="5. Propriété des données">
        <P>
          <strong>Vos données vous appartiennent.</strong> Kouma Workspace ne revendique aucun droit de propriété sur les messages, documents ou contenus que vous créez au sein de votre espace de travail. En cas de résiliation, vos données peuvent être exportées sur demande adressée à <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a>, dans un délai de 30 jours suivant la demande.
        </P>
      </Section>

      <Section title="6. Disponibilité du service">
        <P>
          Gundo s'engage à maintenir le service disponible avec un niveau de qualité raisonnable. Des interruptions ponctuelles peuvent survenir pour maintenance, mise à jour ou en cas d'événements imprévisibles. Gundo ne garantit pas une disponibilité de 100 % et ne pourra être tenu responsable des dommages causés par une interruption de service.
        </P>
      </Section>

      <Section title="7. Limitation de responsabilité">
        <P>Dans les limites autorisées par la loi :</P>
        <UL>
          <li>Gundo n'est pas responsable des contenus échangés entre utilisateurs (qui sont chiffrés et inaccessibles à Gundo)</li>
          <li>Gundo n'est pas responsable des pertes ou dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
          <li>La responsabilité de Gundo est limitée au montant payé par l'organisation au cours des 12 derniers mois</li>
        </UL>
      </Section>

      <Section title="8. Résiliation">
        <UL>
          <li><strong>Par l'utilisateur :</strong> vous pouvez demander la suppression de votre compte à tout moment auprès de votre administrateur, ou en nous contactant directement.</li>
          <li><strong>Par l'organisation :</strong> l'organisation peut résilier son abonnement en nous contactant. Les données sont conservées 30 jours après résiliation, puis supprimées définitivement.</li>
          <li><strong>Par Gundo :</strong> nous nous réservons le droit de suspendre ou résilier un accès en cas de violation grave des présentes CGU, sans préavis ni remboursement dans ce cas.</li>
        </UL>
      </Section>

      <Section title="9. Modifications des CGU">
        <P>
          Gundo peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications significatives par e-mail ou notification dans l'application, avec un préavis minimum de 15 jours. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.
        </P>
      </Section>

      <Section title="10. Droit applicable et litiges">
        <P>
          Les présentes CGU sont soumises au droit <Placeholder label="guinéen / du pays de siège de Gundo" />. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux compétents seront ceux du siège de Gundo.
        </P>
      </Section>

      <Section title="Contact">
        <P>Pour toute question relative aux présentes CGU : <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a></P>
      </Section>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   POLITIQUE DE COOKIES
───────────────────────────────────────── */
export function Cookies() {
  return (
    <LegalPage title="Politique de cookies">

      <P>Dernière mise à jour : juillet 2026.</P>

      <div className="p-5 bg-success/5 border border-success/20 rounded-2xl">
        <p className="text-sm font-bold text-navy mb-1">Résumé en une phrase</p>
        <p className="text-sm text-ink">
          Kouma Workspace n'utilise <strong>aucun cookie publicitaire, aucun cookie de traçage, et aucun outil d'analyse tiers</strong>. Uniquement des cookies techniques indispensables au fonctionnement de l'application.
        </p>
      </div>

      <Section title="Qu'est-ce qu'un cookie ?">
        <P>
          Un cookie est un petit fichier texte déposé sur votre appareil par un site web ou une application, permettant de mémoriser des informations entre deux visites. Tous les cookies ne se ressemblent pas : certains sont indispensables au fonctionnement du service, d'autres servent à vous suivre à des fins publicitaires. Kouma n'utilise que les premiers.
        </P>
      </Section>

      <Section title="Les cookies que nous utilisons">

        <p className="text-sm font-semibold text-ink">Cookies de session et d'authentification</p>
        <P>Utilisés pour maintenir votre connexion active pendant votre utilisation de l'application. Sans ce cookie, vous seriez déconnecté à chaque page.</P>
        <UL>
          <li>Nom : <span className="font-mono text-xs">sb-*</span> (générés par Supabase)</li>
          <li>Durée : session ou jusqu'à déconnexion explicite</li>
          <li>Obligatoire : oui — le service ne peut pas fonctionner sans</li>
        </UL>

        <p className="text-sm font-semibold text-ink mt-4">Stockage local (localStorage)</p>
        <P>Kouma utilise le stockage local de votre navigateur (localStorage) — techniquement différent des cookies — pour mémoriser vos préférences :</P>
        <UL>
          <li>Thème d'affichage (clair / sombre)</li>
          <li>Langue de l'interface</li>
          <li>Préférence d'installation PWA (bannière dismissée)</li>
        </UL>
        <P>Ces données ne quittent jamais votre appareil et ne sont pas transmises à nos serveurs.</P>
      </Section>

      <Section title="Ce que nous n'utilisons pas">
        <UL>
          <li>Pas de Google Analytics ni d'autre outil de statistiques tiers</li>
          <li>Pas de cookies publicitaires</li>
          <li>Pas de pixels de traçage réseaux sociaux</li>
          <li>Pas d'outils de heat mapping ou d'enregistrement de session</li>
        </UL>
      </Section>

      <Section title="Comment gérer les cookies ?">
        <P>
          Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies à tout moment. Cependant, le refus des cookies de session rendra l'application inutilisable (vous ne pourrez pas vous connecter). Les préférences stockées en localStorage peuvent être effacées via les outils développeur de votre navigateur ou en vidant le cache de l'application.
        </P>
      </Section>

      <Section title="Contact">
        <P>Pour toute question sur notre utilisation des cookies : <a href="mailto:contact@gundo.africa" className="text-indigo hover:underline">contact@gundo.africa</a></P>
      </Section>

    </LegalPage>
  )
}
