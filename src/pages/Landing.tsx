import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, FolderOpen, CalendarDays, Users,
  LayoutDashboard, ShieldCheck, Building2, Landmark,
  ArrowRight, Check, Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PublicNav } from '../components/layout/PublicNav'

/* ── Scroll reveal ── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
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
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[280px]">
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
        { name: 'Finance', msg: 'Rapport Q2 validé.', time: '14:32', unread: 3, team: true },
        { name: 'Amadou K.', msg: 'Je t\'envoie le document.', time: '10:15', unread: 1, team: false },
        { name: 'RH', msg: 'Entretiens confirmés.', time: '09:40', unread: 0, team: true },
        { name: 'Mariam S.', msg: 'Merci, à demain.', time: 'Hier', unread: 0, team: false },
      ].map(item => (
        <div key={item.name} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-0 hover:bg-bg transition-colors">
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
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[240px]">
      <div className="bg-navy px-4 py-3">
        <span className="text-white text-xs font-semibold">Console administration</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { label: 'Membres actifs', value: '47', color: 'bg-success' },
          { label: 'Stockage', value: '4,2 Go / 5 Go', color: 'bg-indigo' },
          { label: 'Documents partagés', value: '38', color: 'bg-amber' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-2.5 bg-bg rounded-lg">
            <span className="text-[10px] text-muted">{item.label}</span>
            <span className="text-[10px] font-bold text-ink">{item.value}</span>
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

function AxisMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[260px]">
      <div className="bg-navy px-4 py-3 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo/20 flex items-center justify-center">
          <Sparkles size={11} className="text-indigo-light" />
        </div>
        <span className="text-white text-xs font-semibold">AXIS</span>
        <span className="text-indigo-light/50 text-[9px] ml-auto">Guide Kouma</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex justify-end">
          <div className="bg-indigo text-white text-[10px] rounded-xl rounded-br-sm px-3 py-2 max-w-[165px] leading-relaxed">
            Comment inviter un collaborateur ?
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-md bg-indigo/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={8} className="text-indigo" />
          </div>
          <div className="bg-bg text-ink text-[10px] rounded-xl rounded-bl-sm px-3 py-2 leading-relaxed">
            Dans la console d'administration → Utilisateurs, cliquez sur <span className="font-semibold">Générer un lien</span> et partagez-le avec votre collaborateur.
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-indigo text-white text-[10px] rounded-xl rounded-br-sm px-3 py-2 max-w-[140px] leading-relaxed">
            Et si le lien expire ?
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-md bg-indigo/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={8} className="text-indigo" />
          </div>
          <div className="bg-bg text-ink text-[10px] rounded-xl rounded-bl-sm px-3 py-2 leading-relaxed">
            Générez-en un nouveau depuis la même page. Les anciens liens sont révoqués automatiquement.
          </div>
        </div>
      </div>
    </div>
  )
}

function AgendaMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[200px]">
      <div className="p-3 border-b border-border">
        <div className="text-[10px] font-bold text-navy mb-2">Juillet 2026</div>
        <div className="grid grid-cols-7 gap-0.5">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[8px] text-faint">{d}</div>
          ))}
          {[...Array(1)].map((_, i) => <div key={`e${i}`} />)}
          {[...Array(31)].map((_, i) => {
            const d = i + 1
            const isToday = d === 29
            const hasEvent = [7, 15, 29, 31].includes(d)
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
        {['Réunion budget · 10h00', 'Comité RH · 14h30'].map(e => (
          <div key={e} className="flex items-center gap-1.5 p-1.5 bg-indigo-pale rounded-lg">
            <div className="w-1 h-1 rounded-full bg-indigo shrink-0" />
            <span className="text-[9px] text-indigo font-medium">{e}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Features ── */
const FEATURES = [
  {
    icon: MessageSquare,
    color: 'bg-indigo/10 text-indigo',
    title: 'Espaces d\'équipe',
    desc: 'Créez des espaces dédiés à chaque équipe ou projet. Fini les fils de discussion mélangés.',
  },
  {
    icon: FolderOpen,
    color: 'bg-success/10 text-success',
    title: 'Documents partagés',
    desc: 'Importez et retrouvez vos fichiers professionnels en un seul endroit, accessibles aux bonnes personnes.',
  },
  {
    icon: CalendarDays,
    color: 'bg-amber/10 text-amber',
    title: 'Agenda collaboratif',
    desc: 'Planifiez vos réunions et activités directement dans votre espace. Tout le monde reste informé.',
  },
  {
    icon: Users,
    color: 'bg-indigo/10 text-indigo',
    title: 'Gestion des membres',
    desc: 'Invitez vos collaborateurs, organisez-les par équipe, contrôlez les accès depuis un seul endroit.',
  },
  {
    icon: LayoutDashboard,
    color: 'bg-navy/10 text-navy',
    title: 'Console d\'administration',
    desc: 'Un tableau de bord pour piloter votre organisation, suivre l\'activité et garder le contrôle.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-success/10 text-success',
    title: 'Espace 100 % privé',
    desc: 'Vos échanges et vos fichiers n\'appartiennent qu\'à vous. Pas de publicité. Pas de revente.',
  },
]

/* ── Plans ── */
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    target: 'Pour démarrer',
    desc: 'Créez votre espace et invitez vos premiers collaborateurs.',
    highlight: false,
    badge: null,
    trial: null,
    features: ['25 membres inclus', '5 Go de stockage', 'Messagerie d\'équipe', 'Documents et fichiers', 'Agenda partagé', 'Support par email'],
    cta: 'Créer mon espace',
    href: '/creer',
  },
  {
    id: 'business',
    name: 'Business',
    target: 'Pour les équipes',
    desc: 'Toutes les fonctionnalités pour une organisation en croissance.',
    highlight: true,
    badge: 'Populaire',
    trial: '3 semaines d\'essai gratuit',
    features: ['100 membres', '50 Go de stockage', 'Tout ce qu\'inclut Gratuit', 'Accompagnement onboarding', 'Support prioritaire'],
    cta: 'Essayer gratuitement',
    href: '/creer',
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    target: 'Pour les grandes organisations',
    desc: 'Capacité illimitée et accompagnement dédié.',
    highlight: false,
    badge: null,
    trial: '3 semaines d\'essai gratuit',
    features: ['Membres illimités', '250 Go de stockage', 'Tout ce qu\'inclut Business', 'SLA personnalisé', 'Support dédié'],
    cta: 'Créer mon espace',
    href: '/creer',
  },
]

/* ── For whom ── */
const FOR_WHOM = [
  {
    icon: Building2,
    title: 'Entreprises et PME',
    desc: 'Gardez le contrôle de vos communications internes sans dépendre d\'outils grand public.',
  },
  {
    icon: Landmark,
    title: 'Institutions et administrations',
    desc: 'Un espace numérique structuré, avec gestion des accès rigoureuse et confidentialité garantie.',
  },
  {
    icon: Users,
    title: 'Associations et organisations',
    desc: 'Pour toute structure qui a besoin d\'un espace professionnel commun pour ses membres.',
  },
]

/* ── Landing page ── */
export function Landing() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-b from-surface via-surface to-bg overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-pale text-indigo text-xs font-semibold mb-8 tracking-wide">
          Workspace professionnel privé
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-navy leading-[1.08] tracking-tight max-w-3xl">
          Votre équipe, vos données, votre espace.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
          Messagerie interne, documents et agenda réunis dans un espace de travail privé qui appartient uniquement à votre organisation.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to="/creer"
            className="px-6 py-3.5 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
          >
            Créer mon espace
          </Link>
          <Link
            to="/connexion"
            className="px-6 py-3.5 bg-surface text-ink font-semibold rounded-full text-sm border border-border hover:bg-bg transition-colors"
          >
            Accéder à mon espace
          </Link>
        </div>

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
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section className="py-24 px-4 bg-bg">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Fonctionnalités</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                Tout ce dont votre organisation a besoin, réuni au même endroit.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="flex flex-col gap-4 p-7 rounded-2xl bg-surface border border-border h-full hover:shadow-md hover:border-indigo/20 transition-all">
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

      {/* ── AXIS ── */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 order-2 md:order-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-pale text-indigo text-xs font-semibold mb-5 tracking-wide">
                  <Sparkles size={11} />
                  Guide intégré
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight mb-5">
                  AXIS répond à vos questions sur Kouma.
                </h2>
                <p className="text-muted text-base leading-relaxed mb-7">
                  Vous avez une question sur la plateforme ? AXIS est votre guide intégré. Il vous explique comment utiliser chaque fonctionnalité, directement depuis votre espace de travail.
                </p>
                <ul className="space-y-3">
                  {[
                    'Réponses immédiates sur l\'utilisation de Kouma',
                    'Guide par fonctionnalité : messagerie, agenda, documents, administration…',
                    'Disponible à tout moment, sans quitter votre espace',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 shrink-0 text-success" />
                      <span className="text-sm text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <AxisMockup />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ ── */}
      <section className="py-24 px-4 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="w-14 h-14 rounded-2xl bg-indigo/20 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={26} className="text-indigo-light" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
              Ce qui se passe dans votre espace reste dans votre espace.
            </h2>
            <p className="text-indigo-light text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              Kouma ne lit pas vos messages, ne vend pas vos données et ne les partage avec personne. Votre organisation est propriétaire de tout ce qui s'y dit et s'y partage.
            </p>
            <Link
              to="/security"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-sm transition-colors border border-white/20"
            >
              Notre approche de la confidentialité <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Tarifs</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight mb-4">
                Simple et transparent.
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Un abonnement mensuel, toutes les fonctionnalités incluses. 3 semaines d'essai gratuit sans engagement.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 100}>
                <div className={`flex flex-col p-7 rounded-2xl border h-full ${plan.highlight ? 'bg-navy border-navy shadow-xl shadow-navy/20' : 'bg-surface border-border hover:border-indigo/20 hover:shadow-md transition-all'}`}>
                  {plan.badge && (
                    <span className="inline-flex self-start px-2.5 py-1 rounded-full bg-indigo text-white text-[10px] font-bold uppercase tracking-wide mb-4">
                      {plan.badge}
                    </span>
                  )}
                  {plan.trial && (
                    <div className={`inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-4 ${plan.badge ? 'mt-0' : ''} ${plan.highlight ? 'bg-white/15 text-white' : 'bg-success/10 text-success'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {plan.trial}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-navy'}`}>{plan.name}</h3>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${plan.highlight ? 'text-indigo-light' : 'text-indigo'}`}>{plan.target}</p>
                    <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-light/80' : 'text-muted'}`}>{plan.desc}</p>
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check size={14} className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-indigo-light' : 'text-success'}`} />
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
              Tarifs disponibles en plusieurs devises,{' '}
              <Link to="/tarifs" className="text-indigo hover:underline font-medium">voir la grille complète</Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="py-24 px-4 bg-bg">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Pour qui</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                Conçu pour les organisations qui ont besoin de sérieux.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FOR_WHOM.map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="flex flex-col gap-4 p-7 rounded-2xl bg-surface border border-border h-full">
                  <div className="w-11 h-11 rounded-xl bg-indigo-pale flex items-center justify-center">
                    <item.icon size={20} className="text-indigo" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-base mb-2">{item.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 px-4 bg-gradient-to-b from-surface to-indigo-pale text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-navy leading-tight mb-5">
            Votre espace est prêt en 3 minutes.
          </h2>
          <p className="text-muted text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Créez votre workspace, invitez vos collègues, commencez à travailler.
          </p>
          <Link
            to="/creer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
          >
            Créer mon espace gratuitement <ArrowRight size={16} />
          </Link>
          <p className="mt-5 text-xs text-faint">3 semaines d'essai gratuit, aucune carte bancaire requise.</p>
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
          <p className="text-xs text-indigo-light/40 mt-2">{t('footer.bySyli taa')}</p>
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
