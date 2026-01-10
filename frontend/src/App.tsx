import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/layout/Layout'
import AuthLayout from '@/components/layout/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ServicesPage from '@/pages/ServicesPage'
import SearchConfigsPage from '@/pages/SearchConfigsPage'
import ListingsPage from '@/pages/ListingsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}

export default function App() {
    return (
        <>
            <Routes>
                {/* Public auth routes */}
                <Route element={<AuthLayout />}>
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        }
                    />
                </Route>

                {/* Protected app routes */}
                <Route
                    element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/searches" element={<SearchConfigsPage />} />
                    <Route path="/listings" element={<ListingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Redirect root to dashboard or login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            <Toaster />
        </>
    )
}
