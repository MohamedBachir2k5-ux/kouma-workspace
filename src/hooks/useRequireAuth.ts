import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function isConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return Boolean(url && !url.includes('your-project') && (url.startsWith('https://') || url.startsWith('http://')))
}

export function useRequireAuth(loginPath: string) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(isConfigured())

  useEffect(() => {
    if (!isConfigured()) return

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate(loginPath, { replace: true })
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate(loginPath, { replace: true })
    })

    return () => subscription.unsubscribe()
  }, [navigate, loginPath])

  return { checking }
}
