import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    email: string
    name: string | null
    tier: 'FREE' | 'PREMIUM'
    emailVerified: boolean
    createdAt: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean

    setUser: (user: User) => void
    setTokens: (accessToken: string, refreshToken: string) => void
    login: (user: User, accessToken: string, refreshToken: string) => void
    logout: () => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            setUser: (user) => set({ user }),

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            login: (user, accessToken, refreshToken) =>
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'sprintsale-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
