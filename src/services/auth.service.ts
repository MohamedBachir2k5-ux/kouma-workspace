import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../lib/database.types'

export interface SignUpParams {
  email: string
  password: string
  firstName: string
  lastName: string
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
        data: {
          firstname: params.firstName,
          lastname: params.lastName,
        },
      },
    })

    if (error) {
      const msg = /already registered|already been registered/i.test(error.message)
        ? 'Cette adresse email est déjà utilisée.'
        : error.message
      return { userId: null, error: msg }
    }
    if (!data.user) return { userId: null, error: 'Création du compte échouée.' }

    // The on_auth_user_created trigger may already have created a basic profile row.
    // Use upsert so additional fields (phone, language…) are always written.
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      firstname: params.firstName,
      lastname: params.lastName,
      email: params.email,
      phone: params.phone ?? null,
      country: params.country ?? null,
      language: params.language ?? 'fr',
      status: 'active',
    }, { onConflict: 'id' })

    if (profileError) return { userId: null, error: profileError.message }

    return { userId: data.user.id, error: null }
  },

  async signIn(params: SignInParams): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (error) return { userId: null, error: error.message }
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
      .single()

    return data ?? null
  },

  async sendPasswordReset(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    })
    return { error: error?.message ?? null }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  },

  onAuthChange(callback: (userId: string | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user?.id ?? null)
    })
  },
}
