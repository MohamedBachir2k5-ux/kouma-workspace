import { useState, useRef } from 'react'
import { Bell, Smartphone, LogOut, ChevronRight, Moon, X, Check, Camera, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { UserService } from '../../services/user.service'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { Avatar } from '../../components/ui/Avatar'
import i18n from '../../i18n/index'

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
]

export function Profile() {
  const { currentUser, currentOrg, signOut } = useAuth()
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const [profile, setProfile] = useState({
    firstName: currentUser.firstName,
    lastName:  currentUser.lastName,
    phone:     currentUser.phone ?? '',
    language:  i18n.language as string,
  })
  const [draft, setDraft] = useState(profile)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState<string | null>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
    const { avatarUrl, error } = await UserService.uploadAvatar(currentUser.id, currentOrg.id, file)
    if (!error && avatarUrl) setPhotoPreview(avatarUrl)
  }

  function openEdit() { setDraft(profile); setEditing(true) }

  async function saveEdit() {
    await UserService.updateProfile(currentUser.id, {
      firstname: draft.firstName,
      lastname: draft.lastName,
      phone: draft.phone || null,
      language: draft.language,
    })
    setProfile(draft)
    if (draft.language !== i18n.language) {
      i18n.changeLanguage(draft.language)
    }
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function savePassword() {
    setPwError(null)
    const { error } = await AuthService.updatePassword(pwForm.next)
    if (error) { setPwError(error); return }
    // Re-wrap private key so next login can unwrap with the new secret
    const { error: keyError } = await KeyService.rewrapPrivateKey(currentUser.id, pwForm.next)
    if (keyError) { setPwError('Mot de passe mis à jour, mais la clé de chiffrement n\'a pas pu être re-chiffrée. Reconnectez-vous.'); return }
    setPwForm({ current: '', next: '', confirm: '' })
    setChangingPassword(false)
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  const pwValid = pwForm.current.length >= 6 && pwForm.next.length >= 8 && pwForm.next === pwForm.confirm

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-xl">

        {/* Profile card */}
        <div className="bg-surface rounded-2xl border border-border p-6 mb-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
              ) : (
                <Avatar firstName={profile.firstName} lastName={profile.lastName} id={currentUser.id} size="xl" />
              )}
              <button
                onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo rounded-full flex items-center justify-center border-2 border-surface hover:bg-indigo/90 transition-colors"
              >
                <Camera size={11} className="text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-navy">{profile.firstName} {profile.lastName}</h2>
              <p className="text-sm text-muted">{currentUser.role}</p>
              <p className="text-xs text-faint mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bg rounded-xl p-3">
              <div className="text-xs text-muted mb-0.5">Organisation</div>
              <div className="text-sm font-semibold text-ink">{currentOrg.name}</div>
            </div>
            <div className="bg-bg rounded-xl p-3">
              <div className="text-xs text-muted mb-0.5">Département</div>
              <div className="text-sm font-semibold text-ink">{currentUser.department}</div>
            </div>
          </div>

          <button onClick={openEdit}
            className={`w-full py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              saved ? 'border-success/30 bg-success/5 text-success' : 'border-border text-muted hover:bg-bg'
            }`}>
            {saved
              ? <span className="flex items-center justify-center gap-2"><Check size={14} /> Profil mis à jour</span>
              : 'Modifier le profil'}
          </button>
        </div>

        {/* Security */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Sécurité</h3>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button onClick={() => setChangingPassword(true)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                <KeyRound size={16} className="text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${pwSaved ? 'text-success' : 'text-ink'}`}>
                  {pwSaved ? 'Mot de passe mis à jour' : 'Changer le mot de passe'}
                </div>
                <div className="text-xs text-muted">Modifier votre mot de passe de connexion</div>
              </div>
              <ChevronRight size={15} className="text-faint" />
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                <Smartphone size={16} className="text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">Appareils de confiance</div>
                <div className="text-xs text-muted">1 appareil enregistré</div>
              </div>
              <ChevronRight size={15} className="text-faint" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Préférences</h3>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                <Bell size={16} className="text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">Notifications</div>
                <div className="text-xs text-muted">Gérer les alertes et sons</div>
              </div>
              <ChevronRight size={15} className="text-faint" />
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                <Moon size={16} className="text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">Apparence</div>
                <div className="text-xs text-muted">Thème clair / sombre</div>
              </div>
              <ChevronRight size={15} className="text-faint" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-danger/5 border border-danger/20 rounded-xl text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
          <LogOut size={17} />
          Se déconnecter
        </button>

        <p className="text-center text-xs text-faint mt-6">Kouma v1.0</p>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">Modifier le profil</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Prénom</label>
                  <input value={draft.firstName} onChange={e => setDraft(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom</label>
                  <input value={draft.lastName} onChange={e => setDraft(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Email</label>
                <input value={currentUser.email} disabled
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-faint cursor-not-allowed" />
                <p className="mt-1 text-[10px] text-faint">La modification de l'email nécessite une vérification.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Téléphone</label>
                <input type="tel" value={draft.phone} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+224 620 00 00 00"
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Langue</label>
                <div className="grid grid-cols-4 gap-2">
                  {languages.map(l => (
                    <button key={l.value} type="button" onClick={() => setDraft(p => ({ ...p, language: l.value }))}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                        draft.language === l.value ? 'border-navy bg-navy text-white' : 'border-border bg-bg text-muted hover:border-navy/30'
                      }`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">Annuler</button>
              <button onClick={saveEdit} disabled={!draft.firstName.trim() || !draft.lastName.trim()}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {changingPassword && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setChangingPassword(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">Changer le mot de passe</h3>
              <button onClick={() => setChangingPassword(false)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              {[
                { field: 'current', label: 'Mot de passe actuel',   placeholder: '••••••••' },
                { field: 'next',    label: 'Nouveau mot de passe',   placeholder: 'Min. 8 caractères' },
                { field: 'confirm', label: 'Confirmer le nouveau',   placeholder: '••••••••' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm[field as keyof typeof pwForm]}
                      onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2.5 pr-10 bg-bg border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                        field === 'confirm' && pwForm.confirm && pwForm.next !== pwForm.confirm
                          ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {field === 'current' && (
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                  {field === 'confirm' && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                    <p className="mt-1 text-xs text-danger">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
              ))}
            </div>

            {pwError && <p className="px-5 pb-2 text-xs text-danger">{pwError}</p>}
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setChangingPassword(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">Annuler</button>
              <button onClick={savePassword} disabled={!pwValid}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
