import { useState, useEffect } from 'react'
import {
    Users,
    CreditCard,
    Search,
    FileText,
    Settings,
    Crown,
    TrendingUp,
    AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'

interface DashboardStats {
    users: { total: number; active: number; premium: number }
    searchConfigs: { total: number; active: number }
    listings: { total: number; today: number }
    payments: { total: number; pending: number }
}

interface RecentUser {
    id: string
    email: string
    name: string | null
    tier: string
    createdAt: string
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.dashboard()
            setStats(data.data.stats)
            setRecentUsers(data.data.recentUsers)
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } }
            setError(error.response?.data?.error || 'Nie udało się załadować panelu')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Panel Administracyjny</h1>
                <p className="text-muted-foreground">
                    Zarządzaj użytkownikami, subskrypcjami i ustawieniami aplikacji
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Użytkownicy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.users.active || 0} aktywnych w ciągu 7 dni
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium</CardTitle>
                        <Crown className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.users.premium || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.users.total ? ((stats.users.premium / stats.users.total) * 100).toFixed(1) : 0}% wszystkich użytkowników
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wyszukiwania</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.searchConfigs.active || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.searchConfigs.total || 0} łącznie
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ogłoszenia</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.listings.today || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            dzisiaj / {stats?.listings.total || 0} łącznie
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/users'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">Użytkownicy</h3>
                            <p className="text-sm text-muted-foreground">Zarządzaj kontami</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/plans'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <Crown className="h-8 w-8 text-yellow-500" />
                        <div>
                            <h3 className="font-semibold">Plany</h3>
                            <p className="text-sm text-muted-foreground">Konfiguruj subskrypcje</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/payments'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <CreditCard className="h-8 w-8 text-green-500" />
                        <div>
                            <h3 className="font-semibold">Płatności</h3>
                            <p className="text-sm text-muted-foreground">Historia transakcji</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/settings'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <Settings className="h-8 w-8 text-gray-500" />
                        <div>
                            <h3 className="font-semibold">Ustawienia</h3>
                            <p className="text-sm text-muted-foreground">Konfiguracja aplikacji</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Users */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ostatnio zarejestrowani
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentUsers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Brak nowych użytkowników
                            </p>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                    <div>
                                        <p className="font-medium">{user.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.name || 'Bez nazwy'} • {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.tier === 'PREMIUM'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                        {user.tier}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* More Admin Links */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/services'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <FileText className="h-6 w-6 text-blue-500" />
                        <div>
                            <h3 className="font-semibold">Serwisy</h3>
                            <p className="text-sm text-muted-foreground">Zarządzaj dostępnymi serwisami</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/legal'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <FileText className="h-6 w-6 text-purple-500" />
                        <div>
                            <h3 className="font-semibold">Strony prawne</h3>
                            <p className="text-sm text-muted-foreground">Regulamin, Polityka prywatności</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => window.location.href = '/admin/payment-providers'}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <CreditCard className="h-6 w-6 text-indigo-500" />
                        <div>
                            <h3 className="font-semibold">Dostawcy płatności</h3>
                            <p className="text-sm text-muted-foreground">PayU, PayPal, Google Pay</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
