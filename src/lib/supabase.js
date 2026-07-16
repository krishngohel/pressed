import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('[pressed] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — auth disabled until configured.')
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
