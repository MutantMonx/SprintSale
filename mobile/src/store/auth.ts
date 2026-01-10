import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface User {
    id: string;
    email: string;
    name: string | null;
    tier: 'FREE' | 'PREMIUM';
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

// Secure storage adapter for Zustand
const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,

            setUser: (user) => set({ user }),

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            login: (user, accessToken, refreshToken) =>
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'sprintsale-auth',
            storage: createJSONStorage(() => secureStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
