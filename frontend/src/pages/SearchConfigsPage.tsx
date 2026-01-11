import { useEffect, useState } from 'react'
import {
    Search,
    Plus,
    Play,
    Pause,
    Trash2,
    Clock,
    X,
    Edit
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchConfigsApi, servicesApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/utils'

interface SearchConfig {
    id: string
    name: string
    keywords: string[]
    priceMin: number | null
    priceMax: number | null
    location: string | null
    intervalSeconds: number
    isActive: boolean
    lastRunAt: string | null
    nextRunAt: string | null
    service: {
        id: string
        name: string
        logoUrl: string | null
    }
}

interface Service {
    id: string
    name: string
    logoUrl: string | null
}

interface FormData {
    name: string
    serviceId: string
    keywords: string
    priceMin: string
    priceMax: string
    location: string
    intervalMinutes: string
}

const defaultFormData: FormData = {
    name: '',
    serviceId: '',
    keywords: '',
    priceMin: '',
    priceMax: '',
    location: '',
    intervalMinutes: '5'
}

export default function SearchConfigsPage() {
    const [configs, setConfigs] = useState<SearchConfig[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const { toast } = useToast()

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingConfig, setEditingConfig] = useState<SearchConfig | null>(null)
    const [formData, setFormData] = useState<FormData>(defaultFormData)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        loadConfigs()
        loadServices()
    }, [])

    const loadConfigs = async () => {
        try {
            const response = await searchConfigsApi.list(1, 50)
            setConfigs(response.data.data)
        } catch (error) {
            console.error('Failed to load search configs:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadServices = async () => {
        try {
            const response = await servicesApi.subscribed()
            setServices(response.data.data || [])
        } catch (error) {
            console.error('Failed to load services:', error)
        }
    }

    const handleToggle = async (id: string) => {
        setActionLoading(id)
        try {
            await searchConfigsApi.toggle(id)
            toast({
                title: 'Status zmieniony',
                variant: 'success',
            })
            loadConfigs()
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message || 'Nie udało się zmienić statusu',
                variant: 'destructive',
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleRun = async (id: string) => {
        setActionLoading(id)
        try {
            await searchConfigsApi.run(id)
            toast({
                title: 'Wyszukiwanie uruchomione',
                description: 'Wyniki pojawią się wkrótce',
                variant: 'success',
            })
            loadConfigs()
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message || 'Nie udało się uruchomić wyszukiwania',
                variant: 'destructive',
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć to wyszukiwanie?')) return

        setActionLoading(id)
        try {
            await searchConfigsApi.delete(id)
            toast({
                title: 'Wyszukiwanie usunięte',
            })
            setConfigs(configs.filter(c => c.id !== id))
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message || 'Nie udało się usunąć wyszukiwania',
                variant: 'destructive',
            })
        } finally {
            setActionLoading(null)
        }
    }

    const openCreateModal = () => {
        setEditingConfig(null)
        setFormData(defaultFormData)
        setFormError('')
        setShowModal(true)
    }

    const openEditModal = (config: SearchConfig) => {
        setEditingConfig(config)
        setFormData({
            name: config.name,
            serviceId: config.service.id,
            keywords: config.keywords.join(', '),
            priceMin: config.priceMin?.toString() || '',
            priceMax: config.priceMax?.toString() || '',
            location: config.location || '',
            intervalMinutes: String(Math.round(config.intervalSeconds / 60))
        })
        setFormError('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingConfig(null)
        setFormData(defaultFormData)
        setFormError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        setFormLoading(true)

        try {
            if (!formData.name) {
                setFormError('Nazwa jest wymagana')
                setFormLoading(false)
                return
            }

            const keywords = formData.keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0)

            const payload = {
                name: formData.name,
                keywords,
                priceMin: formData.priceMin ? parseFloat(formData.priceMin) : null,
                priceMax: formData.priceMax ? parseFloat(formData.priceMax) : null,
                location: formData.location || null,
                intervalSeconds: (parseInt(formData.intervalMinutes) || 5) * 60,
            }

            if (editingConfig) {
                // Update existing
                await searchConfigsApi.update(editingConfig.id, payload)
                toast({
                    title: 'Wyszukiwanie zaktualizowane',
                    variant: 'success'
                })
            } else {
                // Create new
                if (!formData.serviceId) {
                    setFormError('Serwis jest wymagany')
                    setFormLoading(false)
                    return
                }
                await searchConfigsApi.create({
                    ...payload,
                    serviceId: formData.serviceId,
                    isActive: true
                })
                toast({
                    title: 'Wyszukiwanie utworzone',
                    description: 'Twoje nowe wyszukiwanie zostało dodane',
                    variant: 'success'
                })
            }

            closeModal()
            loadConfigs()
        } catch (error: any) {
            const errData = error.response?.data?.error
            const errMessage = typeof errData === 'string' ? errData : (errData?.message || 'Nie udało się zapisać wyszukiwania')
            setFormError(errMessage)
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Wyszukiwania</h1>
                    <p className="text-muted-foreground mt-1">
                        Zarządzaj swoimi automatycznymi wyszukiwaniami
                    </p>
                </div>

                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nowe wyszukiwanie
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-20 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : configs.length > 0 ? (
                <div className="space-y-4">
                    {configs.map((config) => (
                        <Card
                            key={config.id}
                            className={`transition-all duration-200 ${config.isActive
                                ? 'border-primary/50 shadow-sm'
                                : 'opacity-75'
                                }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Service info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                            }`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">{config.name}</h3>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {config.service.name}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {config.keywords.length > 0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        🔍 {config.keywords.join(', ')}
                                                    </span>
                                                )}
                                                {(config.priceMin || config.priceMax) && (
                                                    <span className="text-sm text-muted-foreground">
                                                        💰 {config.priceMin || '0'} - {config.priceMax || '∞'} PLN
                                                    </span>
                                                )}
                                                {config.location && (
                                                    <span className="text-sm text-muted-foreground">
                                                        📍 {config.location}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Co {Math.round(config.intervalSeconds / 60)} min
                                                </span>
                                                {config.lastRunAt && (
                                                    <span>
                                                        Ostatnio: {formatRelativeTime(config.lastRunAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(config)}
                                            title="Edytuj"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRun(config.id)}
                                            disabled={actionLoading === config.id || !config.isActive}
                                            title="Uruchom teraz"
                                        >
                                            <Play className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant={config.isActive ? 'secondary' : 'default'}
                                            size="sm"
                                            onClick={() => handleToggle(config.id)}
                                            disabled={actionLoading === config.id}
                                        >
                                            {config.isActive ? (
                                                <>
                                                    <Pause className="w-4 h-4 mr-1" />
                                                    Wstrzymaj
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-1" />
                                                    Uruchom
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(config.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Search className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Brak wyszukiwań</h3>
                        <p className="text-muted-foreground mb-4">
                            Utwórz swoje pierwsze wyszukiwanie, aby zacząć śledzić ogłoszenia
                        </p>
                        <Button onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nowe wyszukiwanie
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Search Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingConfig ? 'Edytuj wyszukiwanie' : 'Nowe wyszukiwanie'}</CardTitle>
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
                                    <Label htmlFor="name">Nazwa wyszukiwania *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="np. Audi A4 Kraków"
                                        required
                                    />
                                </div>

                                {!editingConfig && (
                                    <div className="space-y-2">
                                        <Label htmlFor="serviceId">Serwis *</Label>
                                        <select
                                            id="serviceId"
                                            value={formData.serviceId}
                                            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-md bg-background"
                                            required
                                        >
                                            <option value="">Wybierz serwis...</option>
                                            {services.map(service => (
                                                <option key={service.id} value={service.id}>
                                                    {service.name}
                                                </option>
                                            ))}
                                        </select>
                                        {services.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Najpierw subskrybuj serwis w zakładce "Serwisy"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {editingConfig && (
                                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                        Serwis: <strong>{editingConfig.service.name}</strong>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="keywords">Słowa kluczowe</Label>
                                    <Input
                                        id="keywords"
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                        placeholder="audi, a4, kombi (oddziel przecinkami)"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Oddziel słowa kluczowe przecinkami
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="priceMin">Cena min (PLN)</Label>
                                        <Input
                                            id="priceMin"
                                            type="number"
                                            min="0"
                                            value={formData.priceMin}
                                            onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                                            placeholder="np. 10000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priceMax">Cena max (PLN)</Label>
                                        <Input
                                            id="priceMax"
                                            type="number"
                                            min="0"
                                            value={formData.priceMax}
                                            onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                                            placeholder="np. 50000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Lokalizacja</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="np. Kraków"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="intervalMinutes">Częstotliwość sprawdzania</Label>
                                    <select
                                        id="intervalMinutes"
                                        value={formData.intervalMinutes}
                                        onChange={(e) => setFormData({ ...formData, intervalMinutes: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="1">Co 1 minutę</option>
                                        <option value="5">Co 5 minut</option>
                                        <option value="15">Co 15 minut</option>
                                        <option value="30">Co 30 minut</option>
                                        <option value="60">Co godzinę</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" disabled={formLoading} className="flex-1">
                                        {formLoading ? 'Zapisywanie...' : (editingConfig ? 'Zapisz zmiany' : 'Utwórz wyszukiwanie')}
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
