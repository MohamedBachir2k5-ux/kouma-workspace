import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PublicNav } from '../../components/layout/PublicNav'
import { SiteFooter } from '../Landing'

/* ─────────────────────────────────────────
   LAYOUT WRAPPER
───────────────────────────────────────── */
interface LegalPageProps {
  title: string
  subtitle?: string
  version?: string
  updated?: string
  children: React.ReactNode
}

export function LegalPage({ title, subtitle, version, updated, children }: LegalPageProps) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <PublicNav />
      <section className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">

          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-10">
            ← {t('legal.back')}
          </Link>

          {/* Document header */}
          <div className="mb-10 pb-8 border-b-2 border-navy/10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {version && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo bg-indigo/8 px-2.5 py-1 rounded-full">
                  {version}
                </span>
              )}
              {updated && (
                <span className="text-[10px] text-muted">
                  Dernière mise à jour : {updated}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">{title}</h1>
            {subtitle && <p className="text-sm text-muted leading-relaxed">{subtitle}</p>}
          </div>

          <div className="space-y-10">{children}</div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

/* ─────────────────────────────────────────
   COMPOSANTS PARTAGÉS
───────────────────────────────────────── */
function Article({ num, title, children }: { num?: string | number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        {num && <span className="text-xs font-bold text-indigo uppercase tracking-widest shrink-0">Art. {num}</span>}
        <h2 className="text-base font-bold text-navy leading-snug">{title}</h2>
      </div>
      <div className="space-y-3 pl-0">{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted leading-relaxed">{children}</p>
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted">
      {children}
    </ul>
  )
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo/40 shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-navy uppercase tracking-wider">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoCard({ color, title, children }: { color: 'blue' | 'green' | 'amber'; title?: string; children: React.ReactNode }) {
  const styles = {
    blue:  'bg-indigo/5 border-indigo/20 text-indigo',
    green: 'bg-success/5 border-success/20 text-success',
    amber: 'bg-amber/5 border-amber/20 text-amber',
  }
  return (
    <div className={`rounded-xl border p-4 space-y-1.5 ${styles[color]}`}>
      {title && <p className="text-xs font-bold uppercase tracking-wider">{title}</p>}
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </div>
  )
}

function IdentityCard() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3 bg-navy/4 border-b border-border">
        <p className="text-xs font-bold text-navy uppercase tracking-widest">Identité légale</p>
      </div>
      <dl className="divide-y divide-border">
        {[
          ['Dénomination', 'SILY TAA'],
          ['Forme juridique', 'Entreprise Individuelle'],
          ['RCCM', 'GN.TCC.2025.A.00676'],
          ['NIF', '780696041'],
          ['Siège social', 'Lambanyi, Ratoma, Conakry, République de Guinée'],
          ['Directeur de publication', <Placeholder key="dir" label="NOM PRÉNOM DU RESPONSABLE LÉGAL" />],
          ['Email professionnel', <Placeholder key="mail" label="EMAIL_PROFESSIONNEL_À_CRÉER" />],
          ['Téléphone', <Placeholder key="tel" label="TÉLÉPHONE_PROFESSIONNEL_À_CRÉER" />],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex flex-col sm:flex-row sm:items-center px-5 py-3 gap-1 sm:gap-4">
            <dt className="text-xs font-semibold text-muted uppercase tracking-wide w-44 shrink-0">{label}</dt>
            <dd className="text-sm text-ink font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-amber/10 border border-amber/30 rounded text-xs font-mono text-amber">
      {label}
    </span>
  )
}

function Divider() {
  return <hr className="border-border" />
}

/* ─────────────────────────────────────────
   MENTIONS LÉGALES
───────────────────────────────────────── */
export function MentionsLegales() {
  return (
    <LegalPage
      title="Mentions légales"
      subtitle="Conformément aux dispositions légales en vigueur, les informations suivantes identifient l'éditeur responsable de l'application Kouma Workspace."
      version="v1.0"
      updated="Août 2026"
    >

      <Article num={1} title="Éditeur de l'application">
        <P>
          L'application <strong>Kouma Workspace</strong> est éditée et exploitée par l'entreprise <strong>SILY TAA</strong>,
          dont les informations d'identification légale sont les suivantes :
        </P>
        <IdentityCard />
      </Article>

      <Divider />

      <Article num={2} title="Hébergement et infrastructures techniques">
        <P>
          L'application Kouma Workspace repose sur les prestataires d'hébergement suivants, conformément aux exigences de
          sécurité et de conformité applicables :
        </P>
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-4 space-y-1">
            <p className="text-sm font-semibold text-navy">Vercel Inc. — Distribution & Edge Network</p>
            <p className="text-sm text-muted">340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis.</p>
            <p className="text-xs text-muted">Responsable de la livraison des fichiers statiques de l'application (CDN mondial).</p>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-1">
            <p className="text-sm font-semibold text-navy">Supabase Inc. — Base de données, Auth & Stockage</p>
            <p className="text-sm text-muted">970 Toa Payoh North, Singapour.</p>
            <p className="text-xs text-muted">
              L'intégralité des données utilisateurs est hébergée dans la région <strong>Europe (Irlande — eu-west-1)</strong>,
              soumise au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).
            </p>
          </div>
        </div>
      </Article>

      <Divider />

      <Article num={3} title="Propriété intellectuelle">
        <P>
          L'ensemble des éléments constitutifs de Kouma Workspace — architecture logicielle, interface utilisateur,
          identité visuelle, marques, logos, typographies, textes et contenus éditoriaux — est la propriété exclusive
          de <strong>SILY TAA</strong>, sauf mention contraire explicite.
        </P>
        <P>
          Toute reproduction, représentation, modification, adaptation, diffusion ou exploitation, totale ou partielle,
          par quelque procédé et sur quelque support que ce soit, sans l'autorisation écrite préalable de SILY TAA,
          est strictement interdite et constitue une contrefaçon sanctionnée par les lois applicables.
        </P>
      </Article>

      <Divider />

      <Article num={4} title="Liens hypertextes">
        <P>
          L'application peut contenir des liens vers des sites ou services tiers. SILY TAA ne saurait être tenu responsable
          du contenu, des pratiques de confidentialité ou de la disponibilité de ces ressources externes. La présence d'un
          lien ne vaut pas approbation ou partenariat.
        </P>
      </Article>

      <Divider />

      <Article num={5} title="Contact légal">
        <P>
          Pour toute question relative aux présentes mentions légales, toute demande d'autorisation de reproduction ou
          toute réclamation d'ordre juridique, vous pouvez contacter SILY TAA aux coordonnées suivantes :
        </P>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Email</p>
            <p className="text-sm text-ink"><Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Téléphone</p>
            <p className="text-sm text-ink"><Placeholder label="TÉLÉPHONE_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Adresse</p>
            <p className="text-sm text-ink">Lambanyi, Ratoma, Conakry, Guinée</p>
          </div>
        </div>
      </Article>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   CONDITIONS GÉNÉRALES D'UTILISATION
───────────────────────────────────────── */
export function CGU() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      subtitle="Les présentes conditions régissent l'accès et l'utilisation de la plateforme Kouma Workspace. Elles constituent un contrat juridiquement contraignant entre SILY TAA et toute personne accédant au service."
      version="v1.0"
      updated="Août 2026"
    >

      <InfoCard color="blue" title="Acceptation des conditions">
        En accédant à Kouma Workspace ou en l'utilisant, vous reconnaissez avoir lu, compris et accepté sans réserve
        les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous devez cesser
        immédiatement toute utilisation du service.
      </InfoCard>

      <Article num={1} title="Objet et champ d'application">
        <P>
          Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») définissent les modalités et conditions
          dans lesquelles <strong>SILY TAA</strong> (ci-après « l'Éditeur ») met à disposition la plateforme
          <strong> Kouma Workspace</strong> (ci-après « le Service »), et les conditions dans lesquelles les utilisateurs
          peuvent y accéder et l'utiliser.
        </P>
        <P>
          Kouma Workspace est une plateforme de collaboration professionnelle sécurisée permettant aux organisations
          d'échanger des messages chiffrés de bout en bout, de partager des documents, de gérer des événements et
          d'organiser leurs équipes au sein d'un espace de travail privé et cloisonné.
        </P>
        <P>
          L'accès au Service est exclusivement réservé aux organisations ayant souscrit un abonnement et aux
          collaborateurs expressément invités par celles-ci. Il n'existe pas d'inscription publique ouverte.
        </P>
      </Article>

      <Divider />

      <Article num={2} title="Définitions">
        <UL>
          <LI><strong>« Service »</strong> désigne la plateforme Kouma Workspace, accessible via navigateur web ou application mobile progressive (PWA).</LI>
          <LI><strong>« Éditeur »</strong> désigne SILY TAA, Entreprise Individuelle, RCCM GN.TCC.2025.A.00676, dont le siège est à Conakry, Guinée.</LI>
          <LI><strong>« Organisation »</strong> désigne toute entité morale ou physique ayant souscrit un abonnement au Service et administrant un espace de travail.</LI>
          <LI><strong>« Administrateur »</strong> désigne le représentant de l'Organisation disposant des droits de gestion complets sur l'espace de travail.</LI>
          <LI><strong>« Utilisateur »</strong> désigne toute personne physique accédant au Service dans le cadre de son organisation.</LI>
          <LI><strong>« Contenu »</strong> désigne l'ensemble des données, messages, documents, fichiers et informations créés ou partagés par les Utilisateurs.</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={3} title="Accès au service et gestion des comptes">
        <SubSection title="3.1 Conditions d'accès">
          <UL>
            <LI>L'accès au Service requiert une invitation formelle émise par l'Administrateur de l'Organisation. Aucune auto-inscription n'est possible.</LI>
            <LI>Chaque compte est strictement personnel et nominatif. Un seul compte est autorisé par adresse e-mail.</LI>
            <LI>L'accès est sécurisé par un code PIN chiffré côté client. L'Utilisateur est seul responsable de la confidentialité de ce code.</LI>
          </UL>
        </SubSection>
        <SubSection title="3.2 Sécurité du compte">
          <UL>
            <LI>Toute suspicion de compromission de compte doit être immédiatement signalée à l'Administrateur et à l'Éditeur.</LI>
            <LI>L'Éditeur ne peut être tenu responsable des dommages résultant de la divulgation volontaire ou involontaire du code PIN par l'Utilisateur.</LI>
            <LI>L'Éditeur se réserve le droit de suspendre un compte présentant des signaux de compromission, sans préavis.</LI>
          </UL>
        </SubSection>
      </Article>

      <Divider />

      <Article num={4} title="Obligations et responsabilités de l'utilisateur">
        <P>En accédant au Service, l'Utilisateur s'engage à respecter les obligations suivantes :</P>
        <SubSection title="4.1 Utilisation licite">
          <UL>
            <LI>Utiliser le Service exclusivement dans le cadre professionnel de son Organisation et conformément aux présentes CGU.</LI>
            <LI>Ne pas utiliser le Service à des fins illicites, frauduleuses, diffamatoires, ou contraires à l'ordre public et aux bonnes mœurs.</LI>
            <LI>Ne pas publier de Contenu portant atteinte aux droits de propriété intellectuelle, à la vie privée ou à l'honneur de tiers.</LI>
          </UL>
        </SubSection>
        <SubSection title="4.2 Intégrité du système">
          <UL>
            <LI>Ne pas tenter de contourner, désactiver ou compromettre les mécanismes de sécurité, de chiffrement ou d'authentification.</LI>
            <LI>Ne pas partager ses identifiants d'accès avec des tiers non autorisés.</LI>
            <LI>Ne pas procéder à des tentatives d'accès non autorisées aux données d'autres Organisations ou Utilisateurs.</LI>
            <LI>Ne pas perturber le fonctionnement du Service ou des infrastructures sous-jacentes.</LI>
          </UL>
        </SubSection>
        <P>
          L'Utilisateur est seul responsable du Contenu qu'il publie. L'Éditeur, ne disposant d'aucune clé de déchiffrement,
          ne peut techniquement accéder aux messages et documents échangés, et ne saurait en être tenu responsable.
        </P>
      </Article>

      <Divider />

      <Article num={5} title="Obligations de l'organisation abonnée">
        <P>
          L'Organisation, représentée par son Administrateur, assume l'entière responsabilité de la gestion de son
          espace de travail et s'engage à :
        </P>
        <UL>
          <LI>S'assurer que chaque Utilisateur invité a pris connaissance des présentes CGU et les accepte avant toute utilisation.</LI>
          <LI>Gérer rigoureusement les droits d'accès : invitation des collaborateurs autorisés, révocation immédiate en cas de départ ou de changement de statut.</LI>
          <LI>Respecter les réglementations applicables en matière de traitement des données personnelles de ses collaborateurs (notamment le RGPD pour les organisations concernées).</LI>
          <LI>S'acquitter des abonnements dans les conditions et délais convenus. Tout impayé peut entraîner la suspension du Service.</LI>
          <LI>Informer l'Éditeur de tout incident de sécurité constaté dans son espace de travail.</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={6} title="Propriété des données et confidentialité">
        <InfoCard color="green" title="Principe fondamental — vos données vous appartiennent">
          SILY TAA ne revendique aucun droit de propriété sur les messages, documents ou tout autre Contenu
          créé ou partagé par les Utilisateurs au sein de leur espace de travail.
        </InfoCard>
        <P>
          L'architecture de Kouma Workspace repose sur un chiffrement de bout en bout (E2EE). Les clés de chiffrement
          sont générées et conservées exclusivement côté client. L'Éditeur ne dispose d'aucun moyen technique
          permettant d'accéder au Contenu des échanges, même en cas d'injonction judiciaire.
        </P>
        <P>
          En cas de résiliation de l'abonnement, l'Organisation peut solliciter l'export de ses données dans un délai
          de <strong>30 jours</strong> suivant la demande, adressée à <Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" />.
          Passé ce délai, les données sont définitivement supprimées des serveurs.
        </P>
      </Article>

      <Divider />

      <Article num={7} title="Disponibilité et niveaux de service">
        <P>
          L'Éditeur s'engage à maintenir le Service opérationnel avec un niveau de qualité raisonnable et à déployer
          ses meilleurs efforts pour assurer sa continuité. Toutefois, SILY TAA ne garantit pas une disponibilité
          ininterrompue à 100 %.
        </P>
        <P>Des interruptions planifiées ou imprévues peuvent survenir pour les motifs suivants :</P>
        <UL>
          <LI>Opérations de maintenance et mises à jour planifiées (annoncées avec un préavis raisonnable).</LI>
          <LI>Défaillances des prestataires d'infrastructure (Vercel, Supabase).</LI>
          <LI>Événements de force majeure (catastrophes naturelles, attaques informatiques, pannes réseau majeures).</LI>
        </UL>
        <P>
          L'Éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant d'une interruption
          de service, quelle qu'en soit la cause.
        </P>
      </Article>

      <Divider />

      <Article num={8} title="Limitation de responsabilité">
        <P>Dans les limites autorisées par la législation applicable :</P>
        <UL>
          <LI>L'Éditeur n'est pas responsable des Contenus échangés entre Utilisateurs, ces données étant chiffrées et techniquement inaccessibles à SILY TAA.</LI>
          <LI>L'Éditeur n'est pas responsable des pertes de données résultant d'une action de l'Utilisateur ou de l'Administrateur (suppression volontaire, perte de PIN, etc.).</LI>
          <LI>L'Éditeur n'est pas responsable des dommages indirects, pertes d'exploitation ou manque à gagner résultant de l'utilisation ou de l'indisponibilité du Service.</LI>
          <LI>La responsabilité totale de l'Éditeur, toutes causes confondues, est limitée au montant des abonnements effectivement versés par l'Organisation au cours des douze (12) derniers mois précédant le sinistre.</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={9} title="Résiliation et suspension">
        <SubSection title="9.1 À l'initiative de l'Utilisateur">
          <P>
            Tout Utilisateur peut demander la suppression de son compte à tout moment, en adressant une demande à son
            Administrateur ou directement à <Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" />.
            La suppression est effective dans un délai de 30 jours.
          </P>
        </SubSection>
        <SubSection title="9.2 À l'initiative de l'Organisation">
          <P>
            L'Organisation peut résilier son abonnement à tout moment en contactant l'Éditeur. Les données de l'Organisation
            sont conservées pendant 30 jours après la date effective de résiliation, puis supprimées de façon permanente
            et irréversible.
          </P>
        </SubSection>
        <SubSection title="9.3 À l'initiative de l'Éditeur">
          <P>
            L'Éditeur se réserve le droit de suspendre ou résilier l'accès au Service, sans préavis ni remboursement,
            en cas de violation grave ou répétée des présentes CGU, d'impayé caractérisé ou de comportement préjudiciable
            à l'intégrité de la plateforme ou à d'autres utilisateurs.
          </P>
        </SubSection>
      </Article>

      <Divider />

      <Article num={10} title="Modifications des conditions générales">
        <P>
          L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment, afin de refléter les évolutions
          du Service, de la réglementation applicable ou des pratiques de l'industrie.
        </P>
        <P>
          Toute modification substantielle sera notifiée aux Utilisateurs par e-mail et par notification dans l'application,
          avec un <strong>préavis minimum de 15 jours</strong> avant son entrée en vigueur. La version en vigueur est
          toujours accessible à l'adresse <em>/legal/cgu</em>.
        </P>
        <P>
          La poursuite de l'utilisation du Service après l'entrée en vigueur des nouvelles conditions vaut acceptation
          sans réserve de celles-ci. Dans le cas contraire, l'Utilisateur ou l'Organisation dispose du droit de résilier
          conformément à l'article 9.
        </P>
      </Article>

      <Divider />

      <Article num={11} title="Droit applicable et règlement des litiges">
        <P>
          Les présentes CGU sont soumises au <strong>droit guinéen</strong>. En cas de difficulté d'interprétation,
          la version française fait foi.
        </P>
        <P>
          En cas de litige relatif à la validité, l'interprétation, l'exécution ou la résiliation des présentes CGU,
          les parties s'engagent à rechercher en priorité une solution amiable dans un délai de 30 jours à compter de
          la notification du différend par la partie la plus diligente.
        </P>
        <P>
          À défaut de résolution amiable, tout litige sera soumis à la compétence exclusive des <strong>tribunaux
          compétents de Conakry, République de Guinée</strong>.
        </P>
      </Article>

      <Divider />

      <Article num={12} title="Contact">
        <P>Pour toute question relative aux présentes Conditions Générales d'Utilisation :</P>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Email</p>
            <p className="text-sm text-ink"><Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Téléphone</p>
            <p className="text-sm text-ink"><Placeholder label="TÉLÉPHONE_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Courrier</p>
            <p className="text-sm text-ink">SILY TAA — Lambanyi, Ratoma, Conakry, Guinée</p>
          </div>
        </div>
      </Article>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   POLITIQUE DE CONFIDENTIALITÉ
───────────────────────────────────────── */
const RIGHTS_REGIONS = [
  'eu_eea', 'uk', 'ch',
  'africa_west_uemoa', 'guinea',
  'africa_west_en', 'africa_north', 'africa_sub',
  'canada', 'brazil', 'americas_other',
  'russia', 'middleeast_au', 'other',
] as const

export function Confidentialite() {
  const { t } = useTranslation()
  return (
    <LegalPage
      title={t('confid.title')}
      subtitle="Ce document décrit de façon transparente quelles données SILY TAA collecte, pourquoi, comment elles sont protégées, et quels droits vous disposez à leur égard."
      version="v1.0"
      updated={t('confid.effectivePre')}
    >

      <InfoCard color="blue" title="Garantie technique — chiffrement de bout en bout">
        {t('confid.e2eText')}
      </InfoCard>

      <Article num={1} title={t('confid.s1Title')}>
        <P>{t('confid.s1p1')}</P>
        <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Coordonnées du responsable de traitement</p>
          <p className="text-sm text-ink font-semibold">SILY TAA — Entreprise Individuelle</p>
          <p className="text-sm text-muted">Lambanyi, Ratoma, Conakry, République de Guinée</p>
          <p className="text-sm text-muted">RCCM : GN.TCC.2025.A.00676 · NIF : 780696041</p>
          <p className="text-sm text-muted">Contact : <Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" /></p>
        </div>
      </Article>

      <Divider />

      <Article num={2} title={t('confid.s2Title')}>
        <P>{t('confid.s2intro')}</P>

        <SubSection title="2.1 Données de compte (fournies par l'Utilisateur)">
          <UL>
            <LI>{t('confid.s2a1')}</LI>
            <LI>{t('confid.s2a2')}</LI>
            <LI>{t('confid.s2a3')}</LI>
            <LI>{t('confid.s2a4')}</LI>
            <LI>{t('confid.s2a5')}</LI>
            <LI>{t('confid.s2a6')}</LI>
          </UL>
        </SubSection>

        <SubSection title="2.2 Données de l'Organisation (fournies par l'Administrateur)">
          <UL>
            <LI>{t('confid.s2o1')}</LI>
            <LI>{t('confid.s2o2')}</LI>
            <LI>{t('confid.s2o3')}</LI>
          </UL>
        </SubSection>

        <SubSection title="2.3 Données techniques (collectées automatiquement)">
          <UL>
            <LI>{t('confid.s2m1')}</LI>
            <LI>{t('confid.s2m2')}</LI>
            <LI>{t('confid.s2m3')}</LI>
            <LI>{t('confid.s2m4')}</LI>
          </UL>
        </SubSection>

        <InfoCard color="green">
          {t('confid.s2notCollected')}
        </InfoCard>
      </Article>

      <Divider />

      <Article num={3} title={t('confid.s3Title')}>
        <P>{t('confid.s3p1')}</P>
        <P>{t('confid.s3p2')}</P>
      </Article>

      <Divider />

      <Article num={4} title={t('confid.s4Title')}>
        <UL>
          <LI>{t('confid.s4l1')}</LI>
          <LI>{t('confid.s4l2')}</LI>
          <LI>{t('confid.s4l3')}</LI>
          <LI>{t('confid.s4l4')}</LI>
          <LI>{t('confid.s4l5')}</LI>
        </UL>
        <P>{t('confid.s4footer')}</P>
      </Article>

      <Divider />

      <Article num={5} title={t('confid.s5Title')}>
        <UL>
          <LI>{t('confid.s5l1')}</LI>
          <LI>{t('confid.s5l2')}</LI>
          <LI>{t('confid.s5l3')}</LI>
          <LI>{t('confid.s5l4')}</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={6} title={t('confid.s6Title')}>
        <P>{t('confid.s6intro')}</P>
        <div className="space-y-2">
          {RIGHTS_REGIONS.map(key => (
            <div key={key} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm text-muted leading-relaxed">{t(`confid.r_${key}`)}</p>
            </div>
          ))}
        </div>
        <P>
          {t('confid.s6contactPre')}{' '}
          <Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" />
          {'. '}{t('confid.s6contactPost')}
        </P>
      </Article>

      <Divider />

      <Article num={7} title={t('confid.s7Title')}>
        <P>{t('confid.s7intro')}</P>
        <UL>
          <LI>{t('confid.s7l1')}</LI>
          <LI>{t('confid.s7l2')}</LI>
          <LI>{t('confid.s7l3')}</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={8} title={t('confid.s8Title')}>
        <P>{t('confid.s8p1')}</P>
        <P>{t('confid.s8p2')}</P>
      </Article>

      <Divider />

      <Article num={9} title={t('confid.s9Title')}>
        <P>
          {t('confid.s9pre')}{' '}
          <Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" />
        </P>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Email DPO / Contact données</p>
            <p className="text-sm text-ink"><Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Délai de réponse</p>
            <p className="text-sm text-ink">30 jours ouvrés maximum</p>
          </div>
        </div>
      </Article>

    </LegalPage>
  )
}

/* ─────────────────────────────────────────
   POLITIQUE DE COOKIES
───────────────────────────────────────── */
export function Cookies() {
  return (
    <LegalPage
      title="Politique de cookies"
      subtitle="Une explication simple et honnête de ce qu'on utilise — et de ce qu'on n'utilise pas."
      version="v1.0"
      updated="Août 2026"
    >

      <InfoCard color="green" title="En résumé">
        Kouma ne vous suit pas, ne vous profile pas, et ne revend aucune de vos données.
        On utilise uniquement ce qui est strictement nécessaire pour que l'application fonctionne.
      </InfoCard>

      <Article num={1} title="C'est quoi un cookie ?">
        <P>
          Un cookie, c'est un petit fichier que l'application enregistre sur votre téléphone ou ordinateur
          pour se souvenir de vous. Ça sert par exemple à rester connecté sans avoir à retaper votre mot
          de passe à chaque fois. Certaines applications utilisent aussi des cookies pour vous espionner
          à des fins publicitaires. Kouma ne fait pas ça.
        </P>
      </Article>

      <Divider />

      <Article num={2} title="Ce qu'on utilise — et pourquoi">

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Cookie de connexion</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full">Obligatoire</span>
            </div>
            <p className="text-sm text-muted">
              Quand vous vous connectez à Kouma, on enregistre un petit code de session sur votre appareil.
              Sans ça, vous seriez déconnecté à chaque page. Ce cookie disparaît quand vous vous déconnectez.
            </p>
            <p className="text-xs text-faint">Durée : le temps de votre session</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Préférences locales</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted bg-bg px-2 py-0.5 rounded-full border border-border">Facultatif</span>
            </div>
            <p className="text-sm text-muted">
              On mémorise aussi vos préférences directement sur votre appareil : la langue que vous avez
              choisie, le thème clair ou sombre. Ces informations ne quittent jamais votre téléphone —
              on ne les envoie pas à nos serveurs.
            </p>
            <p className="text-xs text-faint">Durée : jusqu'à ce que vous vidiez le cache de votre navigateur</p>
          </div>
        </div>
      </Article>

      <Divider />

      <Article num={3} title="Ce qu'on ne fait pas">
        <P>On ne fait rien de tout ça, et on s'y engage :</P>
        <UL>
          <LI>Pas de publicité ciblée ni de profil publicitaire vous concernant</LI>
          <LI>Pas de Google Analytics ni d'aucun autre outil qui mesure votre comportement pour des tiers</LI>
          <LI>Pas de boutons « J'aime » Facebook ou LinkedIn qui vous traquent en arrière-plan</LI>
          <LI>Pas de caméra cachée qui enregistre comment vous bougez dans l'application</LI>
          <LI>Aucune donnée vendue ou partagée avec des partenaires commerciaux</LI>
        </UL>
      </Article>

      <Divider />

      <Article num={4} title="Vous voulez tout effacer ?">
        <P>
          C'est votre droit. Vous pouvez supprimer les cookies et préférences enregistrés par Kouma
          depuis les paramètres de votre navigateur ou application :
        </P>
        <UL>
          <LI><strong>Sur téléphone</strong> : Paramètres de l'appli → Effacer les données</LI>
          <LI><strong>Sur Chrome</strong> : Menu (⋮) → Paramètres → Confidentialité → Effacer les données</LI>
          <LI><strong>Sur Safari</strong> : Réglages → Safari → Effacer l'historique et les données</LI>
        </UL>
        <InfoCard color="amber">
          Si vous supprimez le cookie de connexion, vous serez déconnecté de Kouma et devrez vous
          reconnecter. L'application restera 100 % fonctionnelle.
        </InfoCard>
      </Article>

      <Divider />

      <Article num={5} title="Contact">
        <P>Des questions sur ce qu'on collecte ? Écrivez-nous :</P>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Email</p>
            <p className="text-sm text-ink"><Placeholder label="EMAIL_PROFESSIONNEL_À_CRÉER" /></p>
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Responsable</p>
            <p className="text-sm text-ink">SILY TAA — Conakry, Guinée</p>
          </div>
        </div>
      </Article>

    </LegalPage>
  )
}
