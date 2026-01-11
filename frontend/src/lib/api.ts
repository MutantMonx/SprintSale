import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Request interceptor - attach access token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // If 401 and has refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = useAuthStore.getState().refreshToken
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refreshToken,
                    })

                    useAuthStore.getState().setTokens(
                        data.data.accessToken,
                        data.data.refreshToken
                    )

                    originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
                    return api(originalRequest)
                } catch {
                    // Refresh failed, logout
                    useAuthStore.getState().logout()
                }
            }
        }

        return Promise.reject(error)
    }
)

// API functions
export const authApi = {
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    refresh: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),

    logout: (refreshToken: string) =>
        api.post('/auth/logout', { refreshToken }),

    me: () => api.get('/auth/me'),
}

export const servicesApi = {
    list: () => api.get('/services'),
    get: (id: string) => api.get(`/services/${id}`),
    subscribe: (id: string) => api.post(`/services/${id}/subscribe`),
    unsubscribe: (id: string) => api.delete(`/services/${id}/subscribe`),
    storeCredentials: (id: string, data: { username: string; password: string }) =>
        api.post(`/services/${id}/credentials`, data),
    subscribed: () => api.get('/services/subscribed'),
}

export const searchConfigsApi = {
    list: (page = 1, limit = 20) =>
        api.get('/search-configs', { params: { page, limit } }),
    create: (data: object) => api.post('/search-configs', data),
    get: (id: string) => api.get(`/search-configs/${id}`),
    update: (id: string, data: object) => api.patch(`/search-configs/${id}`, data),
    delete: (id: string) => api.delete(`/search-configs/${id}`),
    toggle: (id: string) => api.patch(`/search-configs/${id}/toggle`),
    run: (id: string) => api.post(`/search-configs/${id}/run`),
}

export const listingsApi = {
    list: (params: { page?: number; limit?: number; serviceId?: string }) =>
        api.get('/listings', { params }),
    get: (id: string) => api.get(`/listings/${id}`),
    markSpam: (id: string) => api.post(`/listings/${id}/mark-spam`),
    markSuccess: (id: string) => api.post(`/listings/${id}/mark-success`),
}

export const notificationsApi = {
    list: (params: { page?: number; limit?: number; unreadOnly?: boolean }) =>
        api.get('/notifications', { params }),
    unreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
}

export const devicesApi = {
    register: (data: { deviceToken: string; platform: 'IOS' | 'ANDROID'; deviceName?: string }) =>
        api.post('/devices', data),
    list: () => api.get('/devices'),
    unregister: (id: string) => api.delete(`/devices/${id}`),
}

// Subscription API
export const subscriptionsApi = {
    plans: () => api.get('/subscriptions/plans'),
    current: () => api.get('/subscriptions/current'),
    canPerform: (action: string) => api.get(`/subscriptions/can-perform/${action}`),
    upgrade: (planId: string, billingPeriod?: string) =>
        api.post('/subscriptions/upgrade', { planId, billingPeriod }),
    cancel: (reason?: string) => api.post('/subscriptions/cancel', { reason }),
}

// Legal API (public)
export const legalApi = {
    list: () => api.get('/legal'),
    get: (slug: string) => api.get(`/legal/${slug}`),
}

// Admin API
export const adminApi = {
    // Dashboard
    dashboard: () => api.get('/admin/dashboard'),

    // Users
    users: {
        list: (params?: { page?: number; limit?: number; search?: string; tier?: string }) =>
            api.get('/admin/users', { params }),
        get: (id: string) => api.get(`/admin/users/${id}`),
        update: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
        delete: (id: string) => api.delete(`/admin/users/${id}`),
    },

    // Plans
    plans: {
        list: () => api.get('/admin/plans'),
        get: (id: string) => api.get(`/admin/plans/${id}`),
        update: (id: string, data: object) => api.put(`/admin/plans/${id}`, data),
    },

    // Payments
    payments: {
        list: (params?: { page?: number; limit?: number; status?: string }) =>
            api.get('/admin/payments', { params }),
    },

    // Services
    services: {
        list: () => api.get('/admin/services'),
        create: (data: { name: string; baseUrl: string; logoUrl?: string; defaultConfig?: object }) =>
            api.post('/admin/services', data),
        update: (id: string, data: object) => api.put(`/admin/services/${id}`, data),
        delete: (id: string) => api.delete(`/admin/services/${id}`),
    },

    // Settings
    settings: {
        get: () => api.get('/admin/settings'),
        update: (data: Record<string, string>) => api.put('/admin/settings', data),
    },

    // Payment Providers
    paymentProviders: {
        list: () => api.get('/admin/payment-providers'),
        update: (provider: string, data: object) =>
            api.put(`/admin/payment-providers/${provider}`, data),
    },

    // Legal Pages
    legal: {
        list: () => api.get('/admin/legal'),
        get: (slug: string) => api.get(`/admin/legal/${slug}`),
        update: (slug: string, data: { title?: string; content?: string; isPublished?: boolean }) =>
            api.put(`/admin/legal/${slug}`, data),
    },
}
