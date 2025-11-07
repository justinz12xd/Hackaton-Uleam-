import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'student' | 'instructor' | 'admin'
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User, profile: UserProfile) => void
  logout: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setProfile: (profile) => set({ profile }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: (user, profile) => set({
        user,
        profile,
        isAuthenticated: true,
        isLoading: false,
      }),

      logout: () => set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      }),

      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({
        // Only persist user and profile, not loading state
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
