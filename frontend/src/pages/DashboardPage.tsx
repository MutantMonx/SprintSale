import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Search,
    FileText,
    Bell,
    TrendingUp,
    Plus,
    ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { searchConfigsApi, listingsApi, notificationsApi } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

interface DashboardStats {
    activeSearches: number
    totalListings: number
    unreadNotifications: number
    recentListings: Array<{
        id: string
        title: string
        price: number
        currency: string
        detectedAt: string
    }>
}

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user)
    const [stats, setStats] = useState<DashboardStats>({
        activeSearches: 0,
        totalListings: 0,
        unreadNotifications: 0,
        recentListings: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const [searchesRes, listingsRes, notifCountRes] = await Promise.all([
                searchConfigsApi.list(1, 100),
                listingsApi.list({ limit: 5 }),
                notificationsApi.unreadCount(),
            ])

            const activeSearches = searchesRes.data.data.filter((s: any) => s.isActive).length

            setStats({
                activeSearches,
                totalListings: listingsRes.data.pagination?.total || 0,
                unreadNotifications: notifCountRes.data.data.count,
                recentListings: listingsRes.data.data,
            })
        } catch (error) {
            console.error('Failed to load dashboard stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        {
            title: 'Aktywne wyszukiwania',
            value: stats.activeSearches,
            icon: Search,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            link: '/searches',
        },
        {
            title: 'Znalezione ogłoszenia',
            value: stats.totalListings,
            icon: FileText,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            link: '/listings',
        },
        {
            title: 'Nieprzeczytane',
            value: stats.unreadNotifications,
            icon: Bell,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            link: '/notifications',
        },
        {
            title: 'Trend tygodnia',
            value: '+12%',
            icon: TrendingUp,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            link: '/listings',
        },
    ]

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        Witaj, {user?.name?.split(' ')[0] || 'Użytkowniku'}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Oto przegląd Twoich wyszukiwań i powiadomień
                    </p>
                </div>

                <Button asChild>
                    <Link to="/searches">
                        <Plus className="w-4 h-4 mr-2" />
                        Nowe wyszukiwanie
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Link key={stat.title} to={stat.link}>
                        <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loading ? '...' : stat.value}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent Listings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ostatnie ogłoszenia</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/listings">
                            Zobacz wszystkie
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : stats.recentListings.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentListings.map((listing) => (
                                <Link
                                    key={listing.id}
                                    to={`/listings`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{listing.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRelativeTime(listing.detectedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-bold text-primary">
                                            {listing.price?.toLocaleString('pl-PL')} {listing.currency}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Brak ogłoszeń</p>
                            <p className="text-sm">Dodaj wyszukiwanie, aby zacząć śledzić oferty</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
