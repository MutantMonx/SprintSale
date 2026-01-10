import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - attach access token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refreshToken,
                    });

                    useAuthStore.getState().setTokens(
                        data.data.accessToken,
                        data.data.refreshToken
                    );

                    originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                    return api(originalRequest);
                } catch {
                    useAuthStore.getState().logout();
                }
            }
        }

        return Promise.reject(error);
    }
);

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
};

export const listingsApi = {
    list: (params?: { page?: number; limit?: number }) =>
        api.get('/listings', { params }),
    get: (id: string) => api.get(`/listings/${id}`),
};

export const notificationsApi = {
    list: (params?: { page?: number; limit?: number }) =>
        api.get('/notifications', { params }),
    unreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
};

export const devicesApi = {
    register: (data: { deviceToken: string; platform: 'IOS' | 'ANDROID'; deviceName?: string }) =>
        api.post('/devices', data),
    unregister: (id: string) => api.delete(`/devices/${id}`),
};
