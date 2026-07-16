// Fetch wrapper — attaches Supabase JWT as Authorization: Bearer,
// surfaces pro-gating as a global event (UpgradeModal listens).

import { supabase } from './supabase'

const BASE = '/api'

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export async function api(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const token = await getToken()
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })

  if (raw) return res

  let payload = null
  try {
    payload = await res.json()
  } catch {}

  if (!res.ok) {
    if (res.status === 403 && payload?.error === 'pro_required') {
      window.dispatchEvent(new CustomEvent('pressed:pro-required', { detail: { path } }))
    }
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status, payload)
  }
  return payload
}

export const get = (path) => api(path)
export const post = (path, body) => api(path, { method: 'POST', body })
export const put = (path, body) => api(path, { method: 'PUT', body })
export const del = (path) => api(path, { method: 'DELETE' })
