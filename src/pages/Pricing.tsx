import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { PublicNav } from '../components/layout/PublicNav'
import { SiteFooter } from './Landing'
import {
  PRICING, STORAGE, PLAN_USER_LIMITS, TRIAL_DAYS, CURRENCY_LABELS,
  discountedPrice, formatPrice,
  type SupportedCurrency,
} from '../config/pricing'

const CURRENCIES = Object.keys(CURRENCY_LABELS) as SupportedCurrency[]

const PLAN_FEATURES = {
  free: [
    '25 utilisateurs inclus',
    `${STORAGE.free} de stockage`,
    'Messagerie interne illimitée',
    'Espaces d\'équipe',
    'Groupes de discussion',
    'Documents et partage de fichiers',
    'Agenda collaboratif',
    'Gestion des départements',
    'Journal d\'activité',
    'Support par email',
  ],
  business: [
    'Jusqu\'à 100 utilisateurs',
    `${STORAGE.business} de stockage`,
    'Tout ce que comprend Free',
    'Accompagnement à l\'onboarding',
    'Support prioritaire',
  ],
  enterprise: [
    'Utilisateurs illimités',
    `${STORAGE.enterprise} de stockage`,
    'Tout ce que comprend Business',
    'SLA personnalisé',
    'Support dédié',
  ],
}

export function Pricing() {
  const [currency, setCurrency] = useState<SupportedCurrency | null>(null)

  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      target: 'Jusqu\'à 25 utilisateurs',
      desc: 'Pour les organisations qui lancent leur espace de travail numérique.',
      highlight: false,
      cta: 'Créer mon espace gratuit',
    },
    {
      id: 'business' as const,
      name: 'Business',
      target: `Jusqu'à ${PLAN_USER_LIMITS.business} utilisateurs`,
      desc: 'Pour les organisations qui ont besoin de plus de capacité et d\'espace.',
      highlight: true,
      cta: 'Démarrer l\'essai gratuit',
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      target: 'Utilisateurs illimités',
      desc: 'Pour les grandes organisations sans contrainte de capacité.',
      highlight: false,
      cta: 'Contacter les ventes',
    },
  ]

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />

      <section className="flex-1 py-20 px-4 bg-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-indigo font-semibold text-xs uppercase tracking-wider mb-3">Tarifs</p>
            <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-5">
              Simple et transparent.
            </h1>
            <p className="text-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-6">
              Un abonnement mensuel, toutes les fonctionnalités incluses. La seule différence entre les plans : la capacité.
            </p>
            <div className="inline-flex flex-col sm:flex-row items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs font-semibold rounded-full">
                ✓ {TRIAL_DAYS} jours d'essai gratuit — sans engagement
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-pale text-indigo text-xs font-semibold rounded-full">
                Remise de lancement · première année
              </span>
            </div>
          </div>

          {/* Currency selector */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <select
                value={currency ?? ''}
                onChange={e => setCurrency(e.target.value ? e.target.value as SupportedCurrency : null)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-indigo cursor-pointer"
              >
                <option value="" disabled>Choisir une devise…</option>
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>

          {!currency && (
            <p className="text-center text-muted text-sm py-16">
              Sélectionnez votre devise pour afficher les tarifs.
            </p>
          )}

          {currency && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const p = PRICING[currency][plan.id]
              const discounted = discountedPrice(p.monthly, p.discountPercent)
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col gap-6 ${
                    plan.highlight
                      ? 'bg-navy text-white shadow-xl shadow-navy/25 ring-2 ring-navy'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <div>
                    <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${
                      plan.highlight ? 'bg-indigo text-white' : 'bg-indigo-pale text-indigo'
                    }`}>
                      {plan.target}
                    </div>
                    <h2 className={`text-2xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-navy'}`}>
                      {plan.name}
                    </h2>
                    <p className={`text-sm leading-relaxed mb-5 ${plan.highlight ? 'text-indigo-light' : 'text-muted'}`}>
                      {plan.desc}
                    </p>
                    {p.monthly === 0 ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-navy'}`}>
                            Gratuit
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${plan.highlight ? 'text-indigo-light/80' : 'text-faint'}`}>
                          sans engagement
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mb-1">
                          <span className={`text-xs line-through ${plan.highlight ? 'text-indigo-light/70' : 'text-faint'}`}>
                            {formatPrice(p.monthly, currency)}/mois
                          </span>
                          <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded ${plan.highlight ? 'bg-indigo text-white' : 'bg-indigo-pale text-indigo'}`}>
                            −{p.discountPercent}%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-navy'}`}>
                            {formatPrice(discounted, currency)}
                          </span>
                          <span className={`text-sm font-medium ${plan.highlight ? 'text-indigo-light' : 'text-muted'}`}>
                            /mois
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${plan.highlight ? 'text-indigo-light/80' : 'text-faint'}`}>
                          prix après remise première année
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1">
                    {PLAN_FEATURES[plan.id].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check size={15} className="mt-0.5 shrink-0 text-success" />
                        <span className={plan.highlight ? 'text-white/90' : 'text-muted'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/creer"
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm text-center transition-colors ${
                      plan.highlight
                        ? 'bg-indigo text-white hover:opacity-90'
                        : 'bg-navy text-white hover:bg-navy-light'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
          )}

          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-navy mb-8 text-center">Questions fréquentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Comment régler l\'abonnement ?',
                  a: 'Paiement par Mobile Money (Orange Money, MTN) ou par carte bancaire. Facturation mensuelle avec reçu officiel fourni. La remise de lancement s\'applique automatiquement pendant les 12 premiers mois.',
                },
                {
                  q: 'Que se passe-t-il quand un collaborateur quitte l\'organisation ?',
                  a: 'L\'administrateur révoque l\'accès depuis la console. Le compte est désactivé immédiatement. Les documents et contenus partagés dans les espaces collectifs restent disponibles pour l\'organisation.',
                },
                {
                  q: 'Les fonctionnalités sont-elles les mêmes dans tous les plans ?',
                  a: `Oui. Vous accédez exactement aux mêmes fonctionnalités dans tous les plans. La différence porte sur le nombre d\'utilisateurs (25 / 100 / illimité) et le stockage (${STORAGE.free} / ${STORAGE.business} / ${STORAGE.enterprise}).`,
                },
                {
                  q: 'Comment passer d\'un plan à un autre ?',
                  a: 'Directement depuis les paramètres de votre workspace. La migration est immédiate, vos données et équipes sont conservées intégralement.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-surface rounded-xl p-5 border border-border">
                  <h4 className="font-semibold text-ink mb-2">{q}</h4>
                  <p className="text-muted text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
