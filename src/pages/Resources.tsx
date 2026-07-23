import { PublicNav } from '../components/layout/PublicNav'
import { SiteFooter } from './Landing'

export function Resources() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />
      <section className="flex-1 py-16 px-4 bg-bg">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold text-navy mb-4">Ressources</h1>
          <p className="text-muted leading-relaxed">La documentation, les guides utilisateurs et le support seront disponibles prochainement.</p>
          <p className="text-muted mt-3 text-sm">Pour toute question, écrivez-nous directement.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
