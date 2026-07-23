import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export function UserLogin() {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [step, setStep] = useState<'email' | 'pin'>('email')
  const [loading, setLoading] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) setStep('pin')
  }

  function handlePinChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...pin]
    next[idx] = val.slice(-1)
    setPin(next)
    if (val && idx < 5) {
      pinRefs.current[idx + 1]?.focus()
    }
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      pinRefs.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = pin.join('')
    if (code.length !== 6) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    navigate('/app/messages')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>

        {step === 'email' ? (
          <form onSubmit={handleEmailNext}>
            <h1 className="text-2xl font-bold text-navy mb-1">Connexion</h1>
            <p className="text-muted text-sm mb-8">Entrez votre email professionnel.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="fatou@entreprise.gn"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors"
              >
                Continuer
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors"
            >
              <ArrowLeft size={15} />
              Changer d'email
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-pale rounded-lg mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo" />
                <span className="text-indigo text-xs font-medium truncate max-w-[220px]">{email}</span>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-1">Entrez votre PIN</h1>
              <p className="text-muted text-sm">Code à 6 chiffres créé lors de votre activation.</p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-2.5">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { pinRefs.current[idx] = el }}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(idx, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    className="w-11 h-13 text-center text-lg font-bold bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition-all text-ink"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="p-2 rounded-lg text-muted hover:text-ink transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={pin.join('').length !== 6 || loading}
              className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
