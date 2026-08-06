import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex w-[420px] xl:w-[480px] shrink-0 flex-col relative overflow-hidden bg-navy">
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '-30%', left: '-30%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.28) 0%, transparent 65%)',
          filter: 'blur(65px)',
        }}
        animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%', right: '-20%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
          filter: 'blur(55px)',
        }}
        animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-base leading-none">K</span>
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Kouma</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="my-auto py-10"
        >
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-4">
            Votre organisation,<br />enfin à votre<br />hauteur.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Un espace sécurisé, pensé pour les équipes qui ne font pas de compromis.
          </p>
        </motion.div>

        <p className="text-white/20 text-xs">by Syli taa</p>
      </div>
    </div>
  )
}

export function MobileAuthStrip() {
  return (
    <div
      className="lg:hidden relative bg-navy overflow-hidden px-6 pb-8"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2rem)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(79,70,229,0.22) 0%, transparent 60%)' }}
      />
      <Link to="/" className="relative z-10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white font-bold text-sm leading-none">K</span>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Kouma</span>
      </Link>
    </div>
  )
}
