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
// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminPlansPage from '@/pages/admin/AdminPlansPage'
import AdminServicesPage from '@/pages/admin/AdminServicesPage'
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminPaymentProvidersPage from '@/pages/admin/AdminPaymentProvidersPage'
import AdminLegalPage from '@/pages/admin/AdminLegalPage'
// Legal pages
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import TermsOfServicePage from '@/pages/TermsOfServicePage'
import PricingPage from '@/pages/PricingPage'

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

                {/* Public legal pages (no layout) */}
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/pricing" element={<PricingPage />} />

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

                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/plans" element={<AdminPlansPage />} />
                    <Route path="/admin/services" element={<AdminServicesPage />} />
                    <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/payment-providers" element={<AdminPaymentProvidersPage />} />
                    <Route path="/admin/legal" element={<AdminLegalPage />} />
                </Route>

                {/* Redirect root to dashboard or login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            <Toaster />
        </>
    )
}

