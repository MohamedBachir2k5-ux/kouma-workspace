import { Link } from 'react-router-dom'
import { Calendar, Bell, Users, RefreshCw, ArrowRight } from 'lucide-react'
import { PublicNav } from '../../components/layout/PublicNav'
import { SiteFooter } from '../Landing'

export function SolutionAgenda() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      <section className="py-20 px-4 bg-gradient-to-b from-surface to-bg">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-10 transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Retour à l'accueil
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-amber flex items-center justify-center mb-6">
            <Calendar size={22} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-5">Agenda</h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl">
            Organisez vos réunions et activités dans un agenda partagé. Chaque événement est un objet vivant qui notifie les participants en cas de changement.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: Calendar, title: 'Agenda personnel et d\'équipe', desc: 'Chaque collaborateur a son agenda personnel. Les équipes disposent de leur propre calendrier d\'activités.' },
            { icon: Users, title: 'Invitations de participants', desc: 'Invitez vos collègues directement depuis la création d\'un événement. Ils reçoivent une notification immédiatement.' },
            { icon: RefreshCw, title: 'États et modifications', desc: 'Un événement peut être créé, modifié, annulé ou marqué comme terminé. Chaque changement notifie les participants concernés.' },
            { icon: Bell, title: 'Rappels automatiques', desc: 'Les participants sont notifiés avant chaque réunion. Plus besoin de relancer manuellement.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-amber" />
              </div>
              <h3 className="font-bold text-ink mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="font-bold text-ink mb-3">Exemple de cycle d'une réunion</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Créée', color: 'bg-indigo-pale text-indigo' },
                { label: '→' , color: 'text-faint' },
                { label: 'Modifiée (heure changée)', color: 'bg-amber/10 text-amber' },
                { label: '→', color: 'text-faint' },
                { label: 'Participants notifiés', color: 'bg-success/10 text-success' },
                { label: '→', color: 'text-faint' },
                { label: 'Terminée', color: 'bg-navy/10 text-navy' },
              ].map((item, i) => (
                <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Des réunions mieux organisées pour toute l'équipe.</h2>
          <Link to="/creer" className="inline-flex items-center gap-2 px-6 py-3.5 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors">
            Créer mon espace <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
