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
          <div className="prose-sm text-muted leading-relaxed space-y-4">{children}</div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

export function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales">
      <p>Cette page sera complétée avec les mentions légales de Kouma Workspace.</p>
      <p>Pour toute question légale, contactez-nous à l'adresse mentionnée sur notre page support.</p>
    </LegalPage>
  )
}

export function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <p>Les conditions générales d'utilisation de Kouma Workspace seront disponibles prochainement.</p>
    </LegalPage>
  )
}

export function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p>Kouma Workspace ne collecte que les données nécessaires au fonctionnement du service.</p>
      <p>Nous ne vendons pas vos données et ne les utilisons pas à des fins commerciales ou publicitaires.</p>
      <p>La politique de confidentialité complète sera disponible prochainement.</p>
    </LegalPage>
  )
}

export function Cookies() {
  return (
    <LegalPage title="Politique cookies">
      <p>Kouma Workspace utilise uniquement des cookies techniques nécessaires au fonctionnement de l'application.</p>
      <p>Aucun cookie publicitaire ou de traçage tiers n'est utilisé.</p>
    </LegalPage>
  )
}
