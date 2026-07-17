import { create } from 'zustand'
import { login as apiLogin, signup as apiSignup, type AuthUser } from '@/systems/auth/api'

const SESSION_KEY = 'stillgarden.session.v1'

type AuthState = {
  user: AuthUser | null
  hydrated: boolean
  hydrateSession: () => void
  signup: (username: string) => Promise<void>
  login: (username: string) => Promise<void>
  logout: () => void
}

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.username) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null): void {
  if (!user) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrateSession: () => {
    set({ user: readSession(), hydrated: true })
  },

  signup: async (username) => {
    const user = await apiSignup(username)
    writeSession(user)
    set({ user })
  },

  login: async (username) => {
    const user = await apiLogin(username)
    writeSession(user)
    set({ user })
  },

  logout: () => {
    writeSession(null)
    set({ user: null })
  },
}))
