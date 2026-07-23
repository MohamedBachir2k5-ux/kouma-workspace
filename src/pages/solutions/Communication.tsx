import { Link } from 'react-router-dom'
import { MessageSquare, Hash, Lock, Search, ArrowRight } from 'lucide-react'
import { PublicNav } from '../../components/layout/PublicNav'
import { SiteFooter } from '../Landing'

export function SolutionCommunication() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      <section className="py-20 px-4 bg-gradient-to-b from-surface to-bg">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-10 transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Retour à l'accueil
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-indigo flex items-center justify-center mb-6">
            <MessageSquare size={22} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-5">Communication interne</h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl">
            Un espace de communication professionnel entièrement dédié à votre organisation. Vos échanges restent dans votre workspace.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { icon: MessageSquare, title: 'Messages directs', desc: 'Échangez en privé avec n\'importe quel collaborateur. La conversation n\'est visible que par les deux participants.' },
            { icon: Hash, title: 'Espaces d\'équipe', desc: 'Chaque équipe dispose de son espace de discussion. Toutes les conversations et fichiers y sont organisés.' },
            { icon: Lock, title: 'Groupes privés', desc: 'Créez des groupes informels pour coordonner entre collègues, sans que cela apparaisse dans la structure officielle.' },
            { icon: Search, title: 'Recherche', desc: 'Retrouvez n\'importe quel message ou fichier partagé dans vos conversations grâce à la recherche intégrée.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-9 h-9 rounded-lg bg-indigo-pale flex items-center justify-center mb-4">
                <Icon size={18} className="text-indigo" />
              </div>
              <h3 className="font-bold text-ink mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Prêt à donner à votre organisation son propre espace ?</h2>
          <Link to="/creer" className="inline-flex items-center gap-2 px-6 py-3.5 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors">
            Créer mon espace <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
