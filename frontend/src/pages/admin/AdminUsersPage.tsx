import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    Crown,
    Shield,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Plus,
    Edit,
    X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface UserFormData {
    email: string
    password: string
    name: string
    tier: 'FREE' | 'PREMIUM'
    isAdmin: boolean
    emailVerified: boolean
    // Granular permissions
    customMaxServices: string
    customMaxSearchConfigs: string
    customMaxNotificationsDay: string
    customDailySearchMinutes: string
    canAddCustomService: 'default' | 'true' | 'false'
    notes: string
}

const defaultFormData: UserFormData = {
    email: '',
    password: '',
    name: '',
    tier: 'FREE',
    isAdmin: false,
    emailVerified: false,
    customMaxServices: '',
    customMaxSearchConfigs: '',
    customMaxNotificationsDay: '',
    customDailySearchMinutes: '',
    canAddCustomService: 'default',
    notes: ''
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('')
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<UserFormData>(defaultFormData)
    const [formError, setFormError] = useState('')
    const [formLoading, setFormLoading] = useState(false)

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

    const openCreateModal = () => {
        setEditingUser(null)
        setFormData(defaultFormData)
        setFormError('')
        setShowModal(true)
    }

    const openEditModal = (user: User) => {
        setEditingUser(user)
        setFormData({
            email: user.email,
            password: '', // Don't show password
            name: user.name || '',
            tier: user.tier as 'FREE' | 'PREMIUM',
            isAdmin: user.isAdmin,
            emailVerified: user.emailVerified,
            customMaxServices: (user as any).customMaxServices?.toString() || '',
            customMaxSearchConfigs: (user as any).customMaxSearchConfigs?.toString() || '',
            customMaxNotificationsDay: (user as any).customMaxNotificationsDay?.toString() || '',
            customDailySearchMinutes: (user as any).customDailySearchMinutes?.toString() || '',
            canAddCustomService: (user as any).canAddCustomService === null ? 'default' : (user as any).canAddCustomService ? 'true' : 'false',
            notes: (user as any).notes || ''
        })
        setFormError('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingUser(null)
        setFormData(defaultFormData)
        setFormError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        setFormLoading(true)

        try {
            if (editingUser) {
                // Update existing user - don't send password if empty
                const updateData: Record<string, unknown> = {
                    name: formData.name || null,
                    tier: formData.tier,
                    isAdmin: formData.isAdmin,
                    emailVerified: formData.emailVerified,
                    // Granular permissions - send null to clear, number to set
                    customMaxServices: formData.customMaxServices === '' ? null : parseInt(formData.customMaxServices),
                    customMaxSearchConfigs: formData.customMaxSearchConfigs === '' ? null : parseInt(formData.customMaxSearchConfigs),
                    customMaxNotificationsDay: formData.customMaxNotificationsDay === '' ? null : parseInt(formData.customMaxNotificationsDay),
                    customDailySearchMinutes: formData.customDailySearchMinutes === '' ? null : parseInt(formData.customDailySearchMinutes),
                    canAddCustomService: formData.canAddCustomService === 'default' ? null : formData.canAddCustomService === 'true',
                    notes: formData.notes || null
                }
                await adminApi.users.update(editingUser.id, updateData)
            } else {
                // Create new user
                if (!formData.email || !formData.password) {
                    setFormError('Email i hasło są wymagane')
                    setFormLoading(false)
                    return
                }
                await adminApi.users.create({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name || undefined,
                    tier: formData.tier,
                    isAdmin: formData.isAdmin,
                    emailVerified: formData.emailVerified
                })
            }
            closeModal()
            loadUsers()
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } }
            setFormError(error.response?.data?.error || 'Wystąpił błąd')
        } finally {
            setFormLoading(false)
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
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj użytkownika
                </Button>
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
                                                            <Shield className="h-4 w-4 text-blue-500" aria-label="Admin" />
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
                                                        onClick={() => openEditModal(user)}
                                                        title="Edytuj"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
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

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                {editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={closeModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {formError && (
                                    <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md text-sm">
                                        {formError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!!editingUser}
                                        required={!editingUser}
                                    />
                                </div>

                                {!editingUser && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Hasło</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Nazwa</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tier">Plan</Label>
                                    <select
                                        id="tier"
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'FREE' | 'PREMIUM' })}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="FREE">Free</option>
                                        <option value="PREMIUM">Premium</option>
                                    </select>
                                </div>

                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAdmin}
                                            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Administrator</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.emailVerified}
                                            onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Email zweryfikowany</span>
                                    </label>
                                </div>

                                {/* Granular permissions - only show for editing */}
                                {editingUser && (
                                    <>
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="font-medium mb-3">Uprawnienia niestandardowe</h4>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Pozostaw puste, aby użyć limitów z planu. Wpisz 0 dla nielimitowanego dostępu.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="customMaxServices">Limit serwisów</Label>
                                                    <Input
                                                        id="customMaxServices"
                                                        type="number"
                                                        min="0"
                                                        placeholder="Z planu"
                                                        value={formData.customMaxServices}
                                                        onChange={(e) => setFormData({ ...formData, customMaxServices: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="customMaxSearchConfigs">Limit wyszukiwań</Label>
                                                    <Input
                                                        id="customMaxSearchConfigs"
                                                        type="number"
                                                        min="0"
                                                        placeholder="Z planu"
                                                        value={formData.customMaxSearchConfigs}
                                                        onChange={(e) => setFormData({ ...formData, customMaxSearchConfigs: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="customMaxNotificationsDay">Limit powiadomień/dzień</Label>
                                                    <Input
                                                        id="customMaxNotificationsDay"
                                                        type="number"
                                                        min="0"
                                                        placeholder="Z planu"
                                                        value={formData.customMaxNotificationsDay}
                                                        onChange={(e) => setFormData({ ...formData, customMaxNotificationsDay: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="customDailySearchMinutes">Minuty wyszukiwania/dzień</Label>
                                                    <Input
                                                        id="customDailySearchMinutes"
                                                        type="number"
                                                        min="0"
                                                        placeholder="Z planu"
                                                        value={formData.customDailySearchMinutes}
                                                        onChange={(e) => setFormData({ ...formData, customDailySearchMinutes: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                <Label htmlFor="canAddCustomService">Dodawanie własnych serwisów</Label>
                                                <select
                                                    id="canAddCustomService"
                                                    value={formData.canAddCustomService}
                                                    onChange={(e) => setFormData({ ...formData, canAddCustomService: e.target.value as 'default' | 'true' | 'false' })}
                                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                                >
                                                    <option value="default">Zgodnie z planem</option>
                                                    <option value="true">Zezwól</option>
                                                    <option value="false">Zabroń</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                <Label htmlFor="notes">Notatki (widoczne tylko dla admina)</Label>
                                                <textarea
                                                    id="notes"
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[60px]"
                                                    placeholder="Notatki o użytkowniku..."
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" disabled={formLoading} className="flex-1">
                                        {formLoading ? 'Zapisywanie...' : (editingUser ? 'Zapisz zmiany' : 'Utwórz użytkownika')}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Anuluj
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
