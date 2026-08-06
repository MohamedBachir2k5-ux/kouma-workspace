import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, FolderOpen, CalendarDays, Users,
  ShieldCheck, ArrowRight, Check, Sparkles, Lock,
  LayoutDashboard, Megaphone, Bell, Briefcase, School,
  HeartPulse, Scale, X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PublicNav } from '../components/layout/PublicNav'

/* ── Scroll reveal ── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

/* ── App preview mockups ── */
function MessagingMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl shadow-navy/15 w-full max-w-[280px]">
      <div className="bg-navy px-4 py-3 flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-indigo flex items-center justify-center">
          <span className="text-white font-bold text-[10px]">K</span>
        </div>
        <span className="text-white text-xs font-semibold">Nimba Industries</span>
      </div>
      <div className="px-3 py-2 border-b border-border bg-bg">
        <div className="h-7 bg-border/40 rounded-lg" />
      </div>
      {[
        { name: 'Finance', msg: 'Rapport Q2 validé ✓', time: '14:32', unread: 3, team: true },
        { name: 'Amadou K.', msg: 'Je t\'envoie le contrat.', time: '10:15', unread: 1, team: false },
        { name: 'Direction RH', msg: 'Recrutements confirmés.', time: '09:40', unread: 0, team: true },
        { name: 'Mariam S.', msg: 'Dossier transmis.', time: 'Hier', unread: 0, team: false },
      ].map(item => (
        <div key={item.name} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${item.team ? 'bg-navy' : 'bg-indigo'}`}>
            {item.team ? '#' : item.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-semibold text-ink truncate">{item.name}</span>
              <span className="text-[9px] text-faint ml-1 shrink-0">{item.time}</span>
            </div>
            <span className="text-[10px] text-muted truncate block">{item.msg}</span>
          </div>
          {item.unread > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo text-white text-[8px] font-bold flex items-center justify-center shrink-0">
              {item.unread}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl shadow-navy/15 w-full max-w-[240px]">
      <div className="bg-navy px-4 py-3">
        <span className="text-white text-xs font-semibold">Administration</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { label: 'Membres actifs', value: '47', color: 'text-success' },
          { label: 'Stockage utilisé', value: '4,2 Go / 50 Go', color: 'text-indigo' },
          { label: 'Documents partagés', value: '138', color: 'text-amber' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-2.5 bg-bg rounded-lg">
            <span className="text-[10px] text-muted">{item.label}</span>
            <span className={`text-[10px] font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
        <div className="pt-1">
          <div className="text-[9px] font-semibold text-muted uppercase tracking-wide mb-1.5">Activité récente</div>
          {['Sékou Camara a rejoint', 'Rapport Q2 importé', 'Équipe Finance créée'].map(a => (
            <div key={a} className="flex items-center gap-1.5 py-1">
              <div className="w-1 h-1 rounded-full bg-success" />
              <span className="text-[9px] text-muted">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgendaMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl shadow-navy/15 w-full max-w-[200px]">
      <div className="p-3 border-b border-border">
        <div className="text-[10px] font-bold text-navy mb-2">Juillet 2026</div>
        <div className="grid grid-cols-7 gap-0.5">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[8px] text-faint">{d}</div>
          ))}
          {[...Array(1)].map((_, i) => <div key={`e${i}`} />)}
          {[...Array(31)].map((_, i) => {
            const d = i + 1
            const isToday = d === 15
            const hasEvent = [7, 15, 22, 28].includes(d)
            return (
              <div key={d} className={`flex items-center justify-center w-5 h-5 mx-auto rounded-full text-[8px] font-medium relative ${isToday ? 'bg-navy text-white' : 'text-ink'}`}>
                {d}
                {hasEvent && !isToday && <span className="absolute bottom-0.5 w-0.5 h-0.5 rounded-full bg-indigo" />}
              </div>
            )
          })}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-[9px] font-semibold text-muted uppercase tracking-wide mb-1">Aujourd'hui</div>
        {['Réunion DG · 10h00', 'Revue budgétaire · 14h30'].map(e => (
          <div key={e} className="flex items-center gap-1.5 p-1.5 bg-indigo-pale rounded-lg">
            <div className="w-1 h-1 rounded-full bg-indigo shrink-0" />
            <span className="text-[9px] text-indigo font-medium">{e}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Landing ── */
export function Landing() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-b from-surface via-surface to-bg overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-pale text-indigo text-xs font-semibold mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-pulse" />
          Conçu pour les entreprises africaines
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-navy leading-[1.08] tracking-tight max-w-3xl">
          L'espace de travail que votre organisation mérite.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
          Kouma réunit messagerie sécurisée, documents, agenda et gestion d'équipe dans un espace qui appartient à votre organisation — pas à vos employés.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to="/creer"
            className="px-7 py-3.5 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
          >
            Créer mon espace — c'est gratuit
          </Link>
          <Link
            to="/connexion"
            className="px-7 py-3.5 bg-surface text-ink font-semibold rounded-full text-sm border border-border hover:bg-bg transition-colors"
          >
            Accéder à mon espace →
          </Link>
        </div>
        <p className="mt-3 text-xs text-faint">21 jours d'essai gratuit sur les plans payants · Aucune carte requise</p>

        {/* Mockups */}
        <div className="mt-16 md:mt-20 relative w-full max-w-5xl">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-4">
            <div className="animate-[fadeUp_0.6s_ease_0.1s_both] z-10">
              <MessagingMockup />
            </div>
            <div className="animate-[fadeUp_0.6s_ease_0.3s_both] md:mt-12 hidden sm:block">
              <AgendaMockup />
            </div>
            <div className="animate-[fadeUp_0.6s_ease_0.5s_both] hidden md:block">
              <AdminMockup />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── PROBLÈME ── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Le problème</p>
              <h2 className="text-2xl md:text-3xl font-bold text-navy">
                Les messageries grand public ne sont pas faites pour les entreprises.
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: X,
                color: 'bg-danger/8 text-danger',
                title: 'Zéro contrôle à la sortie',
                desc: 'Quand un employé quitte, il repart avec toutes les conversations, les contacts clients et les fichiers partagés. Votre entreprise ne peut rien y faire.',
              },
              {
                icon: X,
                color: 'bg-danger/8 text-danger',
                title: 'Perso et pro mélangés',
                desc: 'Vos collaborateurs reçoivent les messages de travail sur leur téléphone personnel, au milieu de leurs discussions familiales. Ce n\'est pas professionnel — et c\'est risqué.',
              },
              {
                icon: X,
                color: 'bg-danger/8 text-danger',
                title: 'Aucune trace de vos décisions',
                desc: 'Les décisions importantes disparaissent dans des fils de discussion sans structure. Impossible de retrouver qui a validé quoi, et quand.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="flex flex-col gap-3 p-6 rounded-2xl bg-surface border border-danger/15 h-full">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm mb-1.5">{item.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-widest mb-3">La solution</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                Un espace de travail complet, que vous contrôlez à 100 %.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: MessageSquare,
                color: 'bg-indigo/10 text-indigo',
                title: 'Messagerie d\'équipe sécurisée',
                desc: 'Des espaces dédiés à chaque équipe ou projet. Chiffrement bout-en-bout. Quand un employé part, vous révoquez son accès en un clic.',
              },
              {
                icon: FolderOpen,
                color: 'bg-success/10 text-success',
                title: 'Documents centralisés',
                desc: 'Tous vos fichiers professionnels au même endroit, accessibles aux bonnes personnes. Fini les documents perdus dans des conversations personnelles.',
              },
              {
                icon: CalendarDays,
                color: 'bg-amber/10 text-amber',
                title: 'Agenda d\'organisation',
                desc: 'Planifiez réunions et événements directement dans votre espace. Tout le monde est informé, sans création de groupes supplémentaires.',
              },
              {
                icon: Megaphone,
                color: 'bg-indigo/10 text-indigo',
                title: 'Annonces officielles',
                desc: 'Diffusez les informations importantes à toute l\'organisation d\'un seul envoi. Épinglées, datées, traçables.',
              },
              {
                icon: LayoutDashboard,
                color: 'bg-navy/10 text-navy',
                title: 'Console d\'administration',
                desc: 'Gérez vos équipes, droits d\'accès et paramètres depuis un tableau de bord centralisé. Vous avez le contrôle total.',
              },
              {
                icon: Sparkles,
                color: 'bg-indigo/10 text-indigo',
                title: 'Assistant AXIS intégré',
                desc: 'Un guide intelligent qui répond à vos questions sur la plateforme, directement depuis votre espace. Disponible 24h/24.',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="flex flex-col gap-4 p-7 rounded-2xl bg-bg border border-border h-full hover:shadow-md hover:border-indigo/20 transition-all">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-base mb-1.5">{f.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SÉCURITÉ ── */}
      <section className="py-24 px-4 bg-navy">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-indigo/20 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Lock size={24} className="text-indigo-light" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
                  Ce qui se dit chez vous reste chez vous.
                </h2>
                <p className="text-indigo-light text-base leading-relaxed mb-6">
                  Tous les messages et documents échangés sur Kouma sont chiffrés de bout en bout. Même nous, on ne peut pas les lire. Vos données sont hébergées en Europe, soumises au RGPD — pas sur des serveurs dont vous ne savez rien.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Chiffrement bout-en-bout sur tous les échanges',
                    'Données hébergées en Union Européenne (Irlande)',
                    'Aucun accès tiers — ni publicité, ni revente',
                    'Accès révocable instantanément pour chaque membre',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3">
                      <Check size={14} className="text-success shrink-0" />
                      <span className="text-sm text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/security"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-sm transition-colors border border-white/20"
                >
                  Notre approche de la sécurité <ArrowRight size={14} />
                </Link>
              </div>
              <div className="shrink-0">
                <div className="w-64 bg-navy-light rounded-2xl border border-white/10 p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <ShieldCheck size={20} className="text-success" />
                    <span className="text-white text-sm font-semibold">Garanties de sécurité</span>
                  </div>
                  {[
                    { label: 'Chiffrement', value: 'AES-256 + E2EE' },
                    { label: 'Hébergement', value: 'EU (Irlande)' },
                    { label: 'Norme', value: 'RGPD conforme' },
                    { label: 'Accès Kouma', value: 'Aucun' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs text-white/50">{row.label}</span>
                      <span className="text-xs font-semibold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="py-24 px-4 bg-bg">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-widest mb-3">Pour qui</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                Pour toute organisation qui a besoin d'un espace professionnel sérieux.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Briefcase, label: 'PME & Startups',          desc: 'Structurez vos communications dès le premier jour.' },
              { icon: Scale,     label: 'Cabinets juridiques',      desc: 'Confidentialité et traçabilité des échanges.' },
              { icon: HeartPulse, label: 'Cliniques & Santé',       desc: 'Coordination interne protégée, sans risque.' },
              { icon: School,    label: 'Établissements scolaires', desc: 'Un espace commun pour administration et équipes.' },
              { icon: Users,     label: 'Associations & ONG',       desc: 'Un espace commun pour tous vos membres.' },
              { icon: LayoutDashboard, label: 'Administrations',    desc: 'Rigueur d\'accès et archivage des décisions.' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 70}>
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-border h-full hover:border-indigo/25 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-xl bg-indigo-pale flex items-center justify-center">
                    <item.icon size={17} className="text-indigo" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm mb-1">{item.label}</h3>
                    <p className="text-muted text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-widest mb-3">Tarifs</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight mb-4">
                Simple, transparent, sans surprise.
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Commencez gratuitement. Évoluez quand votre équipe grandit. 21 jours d'essai gratuit sur les plans payants.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Démarrage',
                price: 'Gratuit',
                period: '',
                target: 'Jusqu\'à 25 membres',
                highlight: false,
                badge: null,
                features: [
                  '25 membres inclus',
                  '5 Go de stockage',
                  'Messagerie d\'équipe',
                  'Documents et fichiers',
                  'Agenda partagé',
                  'Support par email',
                ],
                cta: 'Créer mon espace',
                href: '/creer',
              },
              {
                name: 'Business',
                price: 'À partir de 80 €',
                period: '/mois',
                target: 'Jusqu\'à 100 membres',
                highlight: true,
                badge: 'Le plus choisi',
                features: [
                  '100 membres inclus',
                  '50 Go de stockage',
                  'Tout le plan Démarrage',
                  '21 jours d\'essai gratuit',
                  'Accompagnement onboarding',
                  'Support prioritaire',
                ],
                cta: 'Essayer gratuitement',
                href: '/creer',
              },
              {
                name: 'Entreprise',
                price: 'À partir de 170 €',
                period: '/mois',
                target: 'Membres illimités',
                highlight: false,
                badge: null,
                features: [
                  'Membres illimités',
                  '250 Go de stockage',
                  'Tout le plan Business',
                  '21 jours d\'essai gratuit',
                  'SLA personnalisé',
                  'Support dédié 7j/7',
                ],
                cta: 'Nous contacter',
                href: '/creer',
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`flex flex-col p-7 rounded-2xl border h-full ${plan.highlight ? 'bg-navy border-navy shadow-xl shadow-navy/25' : 'bg-bg border-border hover:border-indigo/20 hover:shadow-md transition-all'}`}>
                  {plan.badge && (
                    <span className="inline-flex self-start px-2.5 py-1 rounded-full bg-indigo text-white text-[10px] font-bold uppercase tracking-wide mb-4">
                      {plan.badge}
                    </span>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-0.5 ${plan.highlight ? 'text-white' : 'text-navy'}`}>{plan.name}</h3>
                    <p className={`text-xs mb-3 ${plan.highlight ? 'text-indigo-light' : 'text-indigo'}`}>{plan.target}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-navy'}`}>{plan.price}</span>
                      {plan.period && <span className={`text-sm ${plan.highlight ? 'text-indigo-light' : 'text-muted'}`}>{plan.period}</span>}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check size={13} className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-indigo-light' : 'text-success'}`} />
                        <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-muted'}`}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.href}
                    className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${plan.highlight ? 'bg-white text-navy hover:bg-indigo-pale' : 'bg-navy text-white hover:bg-navy-light'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300}>
            <p className="text-center text-sm text-muted mt-8">
              Disponible en Franc guinéen, CFA, Dollar et plus —{' '}
              <Link to="/tarifs" className="text-indigo hover:underline font-medium">voir la grille tarifaire complète</Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 px-4 bg-gradient-to-b from-bg to-indigo-pale text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-navy leading-tight mb-5">
            Votre espace est prêt en 3 minutes.
          </h2>
          <p className="text-muted text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Créez votre workspace, invitez vos équipes, reprenez le contrôle de vos communications.
          </p>
          <Link
            to="/creer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
          >
            Créer mon espace gratuitement <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-faint">21 jours d'essai gratuit sur les plans payants · Aucune carte bancaire requise</p>
        </Reveal>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Site Footer — shared across all public pages ── */
export function SiteFooter() {
  const { t } = useTranslation()
  return (
    <footer className="bg-navy text-indigo-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-navy border border-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">K</span>
            </div>
            <span className="font-bold text-white text-base tracking-tight">Kouma</span>
          </div>
          <p className="text-sm leading-relaxed text-indigo-light/70 max-w-xs">
            {t('footer.tagline')}
          </p>
          <p className="text-xs text-indigo-light/40 mt-2">{t('footer.bySyliTaa')}</p>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">{t('footer.solutionsTitle')}</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/solutions/communication', label: t('footer.comm') },
              { to: '/solutions/documents', label: t('footer.documents') },
              { to: '/solutions/agenda', label: t('footer.agenda') },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">{t('footer.resourcesTitle')}</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/resources', label: t('footer.docs') },
              { to: '/resources/guides', label: t('footer.guides') },
              { to: '/security', label: t('footer.security') },
              { to: '/resources/support', label: t('footer.support') },
              { to: '/tarifs', label: t('footer.pricing') },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">{t('footer.legalTitle')}</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/legal/mentions', label: t('footer.mentions') },
              { to: '/legal/cgu', label: t('footer.cgu') },
              { to: '/legal/confidentialite', label: t('footer.privacy') },
              { to: '/legal/cookies', label: t('footer.cookies') },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-indigo-light/50">{t('footer.copyright')}</p>
          <p className="text-xs text-indigo-light/50">{t('footer.tagline2')}</p>
        </div>
      </div>
    </footer>
  )
}
