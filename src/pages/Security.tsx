import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, UserX, Key, Building2, ArrowRight } from 'lucide-react'
import { PublicNav } from '../components/layout/PublicNav'
import { SiteFooter } from './Landing'

export function Security() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      <section className="py-20 px-4 bg-gradient-to-b from-surface to-bg">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-6">
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-5">Sécurité</h1>
          <p className="text-lg text-muted leading-relaxed max-w-xl mx-auto">
            Vos données restent sous le contrôle de votre organisation. Voici comment Kouma protège votre workspace.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {[
            {
              icon: Eye,
              title: 'Kouma ne lit pas vos conversations',
              desc: 'Aucun accès au contenu de votre workspace depuis nos équipes. C\'est un principe de conception, pas une promesse.',
            },
            {
              icon: Building2,
              title: 'Isolation complète entre organisations',
              desc: 'Chaque workspace est entièrement cloisonné. Aucune donnée ne peut traverser la frontière entre deux organisations.',
            },
            {
              icon: Lock,
              title: 'Contrôle des accès centralisé',
              desc: 'L\'administrateur de votre organisation contrôle qui accède à quoi. Les permissions sont configurables au niveau de chaque espace.',
            },
            {
              icon: UserX,
              title: 'Gestion des départs sécurisée',
              desc: 'Quand un collaborateur quitte l\'organisation, son accès est révoqué immédiatement. Toutes les sessions sont fermées automatiquement.',
            },
            {
              icon: Key,
              title: 'Authentification par PIN',
              desc: 'Les collaborateurs se connectent avec leur email et un code PIN personnel. Le PIN n\'est jamais stocké en clair.',
            },
            {
              icon: Shield,
              title: 'Vos données vous appartiennent',
              desc: 'Kouma ne vend pas vos données et ne les utilise pas à des fins commerciales. Votre workspace est privé.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center mb-4">
                <Icon size={18} className="text-navy" />
              </div>
              <h3 className="font-bold text-ink mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-navy">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Des questions sur la sécurité de votre workspace ?</h2>
          <p className="text-indigo-light mb-8 leading-relaxed">Notre équipe est disponible pour répondre à vos questions et vous accompagner.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/resources/support" className="px-6 py-3 bg-white text-navy font-semibold rounded-full text-sm hover:bg-bg transition-colors">
              Nous contacter
            </Link>
            <Link to="/creer" className="px-6 py-3 border border-white/20 text-white font-semibold rounded-full text-sm hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              Créer mon espace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
