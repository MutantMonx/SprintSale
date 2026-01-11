import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    MoreVertical,
    Crown,
    Shield,
    Trash2,
    Edit,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface User {
    id: string
    email: string
    name: string | null
    tier: string
    isAdmin: boolean
    emailVerified: boolean
    createdAt: string
    updatedAt: string
    plan: { name: string; displayName: string } | null
    _count: {
        searchConfigs: number
        userServices: number
    }
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)

    useEffect(() => {
        loadUsers()
    }, [pagination.page, search, tierFilter])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.users.list({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                tier: tierFilter || undefined,
            })
            setUsers(data.data)
            setPagination(data.pagination)
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, page: 1 }))
        loadUsers()
    }

    const handleToggleAdmin = async (user: User) => {
        try {
            await adminApi.users.update(user.id, { isAdmin: !user.isAdmin })
            loadUsers()
        } catch (err) {
            console.error('Failed to update user:', err)
        }
    }

    const handleToggleTier = async (user: User) => {
        try {
            const newTier = user.tier === 'PREMIUM' ? 'FREE' : 'PREMIUM'
            await adminApi.users.update(user.id, { tier: newTier })
            loadUsers()
        } catch (err) {
            console.error('Failed to update user:', err)
        }
    }

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${user.email}?`)) return

        try {
            await adminApi.users.delete(user.id)
            loadUsers()
        } catch (err) {
            console.error('Failed to delete user:', err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Zarządzanie użytkownikami
                    </h1>
                    <p className="text-muted-foreground">
                        {pagination.total} użytkowników w systemie
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Szukaj po email lub nazwie..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={tierFilter}
                            onChange={(e) => setTierFilter(e.target.value)}
                            className="px-3 py-2 border rounded-md bg-background"
                        >
                            <option value="">Wszystkie plany</option>
                            <option value="FREE">Free</option>
                            <option value="PREMIUM">Premium</option>
                        </select>
                        <Button type="submit">Szukaj</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-4 font-medium">Użytkownik</th>
                                    <th className="text-left p-4 font-medium">Plan</th>
                                    <th className="text-left p-4 font-medium">Status</th>
                                    <th className="text-left p-4 font-medium">Zasoby</th>
                                    <th className="text-left p-4 font-medium">Data rejestracji</th>
                                    <th className="text-right p-4 font-medium">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                                            Nie znaleziono użytkowników
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-muted/30">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {user.email}
                                                        {user.isAdmin && (
                                                            <Shield className="h-4 w-4 text-blue-500" title="Admin" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {user.name || 'Bez nazwy'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.tier === 'PREMIUM'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {user.tier === 'PREMIUM' && <Crown className="h-3 w-3" />}
                                                    {user.plan?.displayName || user.tier}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${user.emailVerified
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                                    }`}>
                                                    {user.emailVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    <div>{user._count.userServices} serwisów</div>
                                                    <div>{user._count.searchConfigs} wyszukiwań</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleTier(user)}
                                                        title={user.tier === 'PREMIUM' ? 'Zmień na Free' : 'Zmień na Premium'}
                                                    >
                                                        <Crown className={`h-4 w-4 ${user.tier === 'PREMIUM' ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleAdmin(user)}
                                                        title={user.isAdmin ? 'Usuń uprawnienia admina' : 'Nadaj uprawnienia admina'}
                                                    >
                                                        <Shield className={`h-4 w-4 ${user.isAdmin ? 'text-blue-500' : 'text-gray-400'}`} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Strona {pagination.page} z {pagination.pages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
