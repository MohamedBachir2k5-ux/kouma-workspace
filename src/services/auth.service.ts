import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../lib/database.types'
import { friendlyError } from '../lib/errors'

export interface SignUpParams {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  country?: string
  language?: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface AuthResult {
  userId: string | null
  error: string | null
}

export const AuthService = {
  async signUp(params: SignUpParams): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        // Pass all profile fields here so the handle_new_user trigger (SECURITY DEFINER)
        // can write them directly — no post-signUp client upsert needed, which would fail
        // if the Supabase project has email confirmation enabled (session = null after signup).
        data: {
          firstname: params.firstName ?? '',
          lastname: params.lastName ?? '',
          phone: params.phone ?? '',
          country: params.country ?? '',
          language: params.language ?? 'fr',
        },
      },
    })

    if (error) {
      const msg = /already registered|already been registered/i.test(error.message)
        ? 'Cette adresse email est déjà utilisée.'
        : friendlyError(error.message) ?? error.message
      return { userId: null, error: msg }
    }
    if (!data.user) return { userId: null, error: 'Création du compte échouée.' }

    // If email confirmation is required in Supabase, session is null here.
    // All subsequent DB operations (key generation, org creation) require a session —
    // they will fail. Supabase Cloud must have "Confirm email" disabled for this flow to work.
    if (!data.session) {
      return { userId: null, error: 'La confirmation par email est activée sur ce projet Supabase. Désactivez-la dans Authentication → Configuration → Email → Confirm email.' }
    }

    return { userId: data.user.id, error: null }
  },

  async signIn(params: SignInParams): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (error) {
      const msg = error.message
      const normalized = /invalid.*credentials/i.test(msg) ? 'Email ou mot de passe incorrect.'
        : /email.*confirmed/i.test(msg) ? 'Votre email n\'est pas encore confirmé.'
        : /too many requests/i.test(msg) ? 'Trop de tentatives. Veuillez réessayer dans quelques minutes.'
        : friendlyError(msg) ?? msg
      return { userId: null, error: normalized }
    }
    return { userId: data.user?.id ?? null, error: null }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getCurrentUser(): Promise<ProfileRow | null> {
    const session = await this.getSession()
    if (!session?.user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    return data ?? null
  },

  async sendPasswordReset(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    })
    return { error: friendlyError(error?.message) }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: friendlyError(error?.message) }
  },

  onAuthChange(callback: (userId: string | null, event: string) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is already handled by the getSession() call above the listener.
      // Skipping it prevents a double hydrateFromSession on every page load.
      if (event === 'INITIAL_SESSION') return
      callback(session?.user?.id ?? null, event)
    })
  },
}
