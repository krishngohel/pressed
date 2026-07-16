import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { get } from '../lib/api'
import { themeFromProfile } from '../lib/theme'

const AuthContext = createContext(null)

export const PRO_STATUSES = ['pro', 'pro_annual', 'lifetime']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const data = await get('/auth/me')
      setProfile(data)
      if (data?.theme_preset) themeFromProfile(data.theme_preset)
      return data
    } catch {
      setProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null)
      if (data?.session) refreshProfile().finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) refreshProfile()
      else setProfile(null)
    })
    return () => sub?.subscription?.unsubscribe()
  }, [refreshProfile])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const isPro = PRO_STATUSES.includes(profile?.subscription_status)

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user || null, profile, isPro, loading, signUp, signIn, signOut, resetPassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
