import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { Shield, Users, Zap, ArrowRight, Menu, X, ChevronDown } from 'lucide-react'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const SOLUTIONS = [
  { to: '/solutions/communication', label: 'Communication', desc: 'Messagerie sécurisée' },
  { to: '/solutions/documents', label: 'Documents', desc: 'Bibliothèque documentaire' },
  { to: '/solutions/agenda', label: 'Agenda', desc: 'Réunions et activités' },
]

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const onScroll = () => setY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return y
}

function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const scrollY = useScrollY()
  const headerSolid = scrollY > 80

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2 })
    let rafId: number
    const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(rafId); lenis.destroy() }
  }, [])

  return (
    <div className="bg-navy text-white overflow-x-hidden">

      {/* ─── HEADER ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerSolid
            ? 'bg-navy/95 backdrop-blur-sm border-b border-white/10 shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">K</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Kouma</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            <div className="relative" onMouseLeave={() => setSolutionsOpen(false)}>
              <button
                onMouseEnter={() => setSolutionsOpen(true)}
                onClick={() => setSolutionsOpen(s => !s)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
              >
                Solutions
                <ChevronDown size={13} className={`transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-navy-light border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
                  >
                    {SOLUTIONS.map(s => (
                      <Link
                        key={s.to}
                        to={s.to}
                        onClick={() => setSolutionsOpen(false)}
                        className="block px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <span className="text-sm font-medium text-white/80 block">{s.label}</span>
                        <span className="text-xs text-white/35">{s.desc}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/tarifs" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Tarifs</Link>
            <Link to="/resources" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Ressources</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/connexion" className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link to="/creer" className="px-4 py-2 bg-white text-navy text-sm font-semibold rounded-full hover:bg-white/90 transition-colors shadow-md">
              Créer mon espace
            </Link>
          </div>

          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-white/70 hover:text-white transition-colors">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-navy-light border-t border-white/10 px-4 py-4 space-y-1 overflow-hidden"
            >
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 py-2">Solutions</p>
              {SOLUTIONS.map(s => (
                <Link
                  key={s.to}
                  to={s.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center min-h-[48px] px-3 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {s.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-1" />
              <Link to="/tarifs" onClick={() => setMobileOpen(false)} className="flex items-center min-h-[48px] px-3 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors">Tarifs</Link>
              <Link to="/resources" onClick={() => setMobileOpen(false)} className="flex items-center min-h-[48px] px-3 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors">Ressources</Link>
              <div className="h-px bg-white/10 my-1" />
              <Link to="/connexion" onClick={() => setMobileOpen(false)} className="flex items-center min-h-[48px] px-3 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors">Connexion</Link>
              <Link to="/creer" onClick={() => setMobileOpen(false)} className="block w-full py-3.5 bg-white text-navy text-sm font-semibold rounded-xl text-center mt-1">
                Créer mon espace
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center px-4 text-center pt-16 overflow-hidden">
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: '-25%', left: '-15%',
            width: '700px', height: '700px',
            background: 'radial-gradient(circle, rgba(79,70,229,0.22) 0%, transparent 65%)',
            filter: 'blur(70px)',
          }}
          animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%', right: '-15%',
            width: '550px', height: '550px',
            background: 'radial-gradient(circle, rgba(129,140,248,0.14) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '55%',
            width: '350px', height: '350px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-light" />
            <span className="text-xs text-white/50 font-medium">L'espace de travail nouvelle génération</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 55 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-tight mb-6"
          >
            Votre organisation,
            <br />
            <span className="text-indigo-light">enfin à votre hauteur.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38, ease: EASE }}
            className="text-lg sm:text-xl text-white/50 max-w-lg mx-auto mb-10 leading-relaxed"
          >
            Un espace de travail sécurisé, pensé pour les équipes qui ne font pas de compromis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/creer"
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-navy font-semibold rounded-full text-sm hover:bg-white/90 transition-all shadow-lg shadow-black/25"
            >
              Créer mon espace <ArrowRight size={16} />
            </Link>
            <Link
              to="/tarifs"
              className="flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white/70 font-medium rounded-full text-sm hover:border-white/40 hover:text-white transition-all"
            >
              Voir les tarifs
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-9 border border-white/20 rounded-full flex items-start justify-center p-1.5"
          >
            <div className="w-0.5 h-2 bg-white/30 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATEMENT ─── */}
      <section
        className="py-28 px-4 relative overflow-hidden"
        style={{ background: '#0d1425' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.07) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-snug text-white">
              Certaines équipes communiquent.
              <br />
              <span className="text-white/25">Les vôtres avancent.</span>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ─── PILLARS ─── */}
      <section className="py-24 px-4 bg-navy">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Tout ce dont vos équipes ont besoin.
              </h2>
              <p className="text-white/40 text-base">Rien de superflu. Tout l'essentiel.</p>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Shield size={22} />,
                title: 'Communiquer en confiance',
                body: "Des échanges fluides et sécurisés pour l'ensemble de vos collaborateurs, où qu'ils soient.",
                delay: 0,
              },
              {
                icon: <Users size={22} />,
                title: 'Organiser sans friction',
                body: "Documents, agendas, équipes — tout ce dont vous avez besoin, au même endroit, dans l'ordre.",
                delay: 0.1,
              },
              {
                icon: <Zap size={22} />,
                title: 'Décider rapidement',
                body: 'Des informations claires, des actions concrètes. Moins de bruit, plus d\'impact au quotidien.',
                delay: 0.2,
              },
            ].map(p => (
              <FadeUp key={p.title} delay={p.delay}>
                <div className="group p-7 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo/30 transition-all cursor-default h-full">
                  <div className="w-10 h-10 rounded-xl bg-indigo/15 flex items-center justify-center text-indigo-light mb-5 group-hover:bg-indigo/25 transition-colors">
                    {p.icon}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{p.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              La confiance n'est pas une option.
            </h2>
            <p className="text-muted text-lg max-w-lg mx-auto mb-12 leading-relaxed">
              Kouma est conçu avec la sécurité au cœur — pas comme une case à cocher.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {[
                'Vos échanges, rien que vos échanges.',
                'Accès maîtrisé par votre organisation.',
                'Vos données restent sous votre contrôle.',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 px-5 py-3 bg-bg border border-border rounded-full text-sm font-medium text-ink"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-32 px-4 overflow-hidden bg-navy">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.18) 0%, transparent 60%)' }}
        />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
              Rejoignez les organisations<br />qui ont fait le choix Kouma.
            </h2>
            <Link
              to="/creer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-navy font-semibold rounded-full text-base hover:bg-white/90 transition-all shadow-xl shadow-black/30"
            >
              Créer mon espace <ArrowRight size={18} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <SiteFooter />
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
              <span className="text-white font-bold text-xs leading-none">K</span>
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">Kouma</span>
              <span className="text-[10px] text-white/25 leading-none">by Syli taa</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { to: '/tarifs', label: 'Tarifs' },
              { to: '/security', label: 'Sécurité' },
              { to: '/resources', label: 'Ressources' },
              { to: '/legal/mentions-legales', label: 'Mentions légales' },
              { to: '/legal/cgu', label: 'CGU' },
              { to: '/legal/confidentialite', label: 'Confidentialité' },
              { to: '/legal/cookies', label: 'Cookies' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-xs text-white/35 hover:text-white/70 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-white/25">© 2025 Syli taa</p>
        </div>
      </footer>
  )
}
