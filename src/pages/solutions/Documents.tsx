import { Link } from 'react-router-dom'
import { FileText, FolderOpen, Shield, Share2, ArrowRight } from 'lucide-react'
import { PublicNav } from '../../components/layout/PublicNav'
import { SiteFooter } from '../Landing'

export function SolutionDocuments() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      <section className="py-20 px-4 bg-gradient-to-b from-surface to-bg">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-10 transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Retour à l'accueil
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-success flex items-center justify-center mb-6">
            <FileText size={22} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-5">Documents</h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl">
            Centralisez vos documents professionnels dans un espace organisé. Chaque fichier appartient à votre organisation, pas à un individu.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg">
        <div className="max-w-4xl mx-auto">
          <div className="bg-indigo-pale border border-indigo/10 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-navy mb-2">Documents organisationnels vs pièces jointes</h3>
            <p className="text-sm text-muted leading-relaxed">
              Kouma distingue les <strong className="text-ink">documents du workspace</strong>, qui appartiennent à l'organisation et sont gérés dans la bibliothèque, des <strong className="text-ink">pièces jointes de conversations</strong>, qui restent liées à la discussion dans laquelle elles ont été envoyées. Vous pouvez toujours promouvoir une pièce jointe en document officiel si nécessaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: FolderOpen, title: 'Organisation par dossiers', desc: 'Structurez vos documents par département, équipe ou projet. La bibliothèque reste lisible et navigable.' },
              { icon: Shield, title: 'Contrôle des accès', desc: 'Chaque document peut être restreint aux membres concernés. Aucun contenu ne fuite entre équipes.' },
              { icon: Share2, title: 'Partage interne', desc: 'Partagez un document avec un collaborateur ou une équipe directement depuis la bibliothèque.' },
              { icon: FileText, title: 'Conservation à long terme', desc: 'Quand un collaborateur quitte l\'organisation, ses documents partagés restent disponibles pour l\'équipe.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface rounded-xl p-6 border border-border">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-success" />
                </div>
                <h3 className="font-bold text-ink mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-surface">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Vos documents appartiennent à votre organisation.</h2>
          <Link to="/creer" className="inline-flex items-center gap-2 px-6 py-3.5 bg-navy text-white font-semibold rounded-full text-sm hover:bg-navy-light transition-colors">
            Créer mon espace <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
