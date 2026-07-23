import { Link } from 'react-router-dom'
import { MessageSquare, FileText, Calendar, Shield, Building2, Globe, Users, ArrowRight } from 'lucide-react'
import { PublicNav } from '../components/layout/PublicNav'

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
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[280px]">
      <div className="bg-navy px-4 py-3">
        <span className="text-white text-xs font-semibold">Console administration</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { label: 'Utilisateurs actifs', value: '47', color: 'bg-success' },
          { label: 'Stockage', value: '4,2 Go / 10 Go', color: 'bg-indigo' },
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

function AgendaMockup() {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-navy/10 w-full max-w-[200px]">
      <div className="p-3 border-b border-border">
        <div className="text-[10px] font-bold text-navy mb-2">Juillet 2025</div>
        <div className="grid grid-cols-7 gap-0.5">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[8px] text-faint">{d}</div>
          ))}
          {[...Array(6)].map((_, i) => <div key={`e${i}`} />)}
          {[...Array(31)].map((_, i) => {
            const d = i + 1
            const isToday = d === 22
            const hasEvent = [5, 14, 22, 25].includes(d)
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
        {['Réunion budget — 10h00', 'Comité RH — 14h30'].map(e => (
          <div key={e} className="flex items-center gap-1.5 p-1.5 bg-indigo-pale rounded-lg">
            <div className="w-1 h-1 rounded-full bg-indigo shrink-0" />
            <span className="text-[9px] text-indigo font-medium">{e}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
          Votre espace de travail privé pour communiquer et collaborer.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
          Votre espace de travail pour communiquer, partager vos documents et organiser vos équipes dans un environnement professionnel appartenant à votre organisation.
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

        {/* Product previews */}
        <div className="mt-16 md:mt-20 relative w-full max-w-5xl">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-4">
            {/* Messaging — main */}
            <div className="animate-[fadeUp_0.6s_ease_0.1s_both] z-10">
              <MessagingMockup />
            </div>
            {/* Agenda — offset */}
            <div className="animate-[fadeUp_0.6s_ease_0.3s_both] md:mt-12 hidden sm:block">
              <AgendaMockup />
            </div>
            {/* Admin — offset other side */}
            <div className="animate-[fadeUp_0.6s_ease_0.5s_both] hidden md:block">
              <AdminMockup />
            </div>
          </div>

          {/* Gradient fade bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Solutions</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
              Trois piliers pour votre organisation.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                color: 'bg-indigo text-white',
                title: 'Communication interne',
                desc: 'Messagerie professionnelle entre collaborateurs, espaces d\'équipe et groupes de discussion au sein de votre organisation.',
                to: '/solutions/communication',
              },
              {
                icon: FileText,
                color: 'bg-success text-white',
                title: 'Documents',
                desc: 'Centralisez et partagez vos documents professionnels. Chaque fichier appartient à votre organisation, classé et accessible aux bonnes personnes.',
                to: '/solutions/documents',
              },
              {
                icon: Calendar,
                color: 'bg-amber text-white',
                title: 'Agenda',
                desc: 'Organisez vos réunions et activités. Agendas personnels et d\'équipe synchronisés, avec notifications automatiques pour chaque changement.',
                to: '/solutions/agenda',
              },
            ].map(({ icon: Icon, color, title, desc, to }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col gap-5 p-8 rounded-2xl border border-border bg-surface hover:shadow-lg hover:border-indigo/20 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-ink text-lg mb-2">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo group-hover:gap-2.5 transition-all">
                  En savoir plus <ArrowRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHOM ── */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Pour qui</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
              Conçu pour les organisations professionnelles.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                label: 'Entreprises',
                desc: 'Sécurisez vos communications internes et gardez le contrôle de vos données professionnelles, quelle que soit la taille de votre structure.',
              },
              {
                icon: Globe,
                label: 'Institutions publiques',
                desc: 'Dotez-vous d\'un environnement numérique propre à votre institution, avec une gestion rigoureuse des accès et des contenus.',
              },
              {
                icon: Users,
                label: 'Organisations',
                desc: 'Pour toute structure qui a besoin d\'un espace professionnel commun : associations, cabinets, fédérations, collectifs de travail.',
              },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col gap-4 p-7 rounded-2xl bg-bg border border-border">
                <div className="w-11 h-11 rounded-xl bg-indigo-pale flex items-center justify-center">
                  <Icon size={20} className="text-indigo" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base mb-2">{label}</h3>
                  <p className="text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY (simple) ── */}
      <section className="py-20 px-4 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={26} className="text-indigo-light" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
            Vos données restent sous le contrôle de votre organisation.
          </h2>
          <p className="text-indigo-light text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            KUMA ne lit pas vos conversations et ne vend pas vos données. Chaque workspace est un espace privé isolé — vous en êtes le seul propriétaire.
          </p>
          <Link
            to="/security"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-sm transition-colors border border-white/20"
          >
            Découvrir notre approche <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-bg text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight mb-5">
          Votre organisation mérite son propre espace.
        </h2>
        <p className="text-muted text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Créez votre workspace en quelques minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/creer"
            className="px-8 py-4 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors shadow-lg shadow-navy/20"
          >
            Créer mon espace
          </Link>
          <Link
            to="/tarifs"
            className="px-8 py-4 bg-surface text-ink font-semibold rounded-full text-sm border border-border hover:bg-bg transition-colors"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export function SiteFooter() {
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
            Workspace professionnel privé pour les organisations.
          </p>
          <p className="text-xs text-indigo-light/40 mt-2">by Goundo</p>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Solutions</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/solutions/communication', label: 'Communication' },
              { to: '/solutions/documents', label: 'Documents' },
              { to: '/solutions/agenda', label: 'Agenda' },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Ressources</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/resources', label: 'Documentation' },
              { to: '/resources/guides', label: 'Guides utilisateurs' },
              { to: '/security', label: 'Sécurité' },
              { to: '/resources/support', label: 'Support' },
              { to: '/tarifs', label: 'Tarifs' },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Légal</h4>
          <ul className="space-y-2.5">
            {[
              { to: '/legal/mentions', label: 'Mentions légales' },
              { to: '/legal/cgu', label: 'Conditions générales' },
              { to: '/legal/confidentialite', label: 'Politique de confidentialité' },
              { to: '/legal/cookies', label: 'Politique de cookies' },
            ].map(l => (
              <li key={l.to}><Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-indigo-light/50">© 2025 Kouma Workspace — by Goundo. Tous droits réservés.</p>
          <p className="text-xs text-indigo-light/50">Fait pour les organisations qui avancent.</p>
        </div>
      </div>
    </footer>
  )
}
