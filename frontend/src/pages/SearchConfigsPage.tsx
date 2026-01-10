import { useEffect, useState } from 'react'
import {
    Search,
    Plus,
    Play,
    Pause,
    Trash2,
    ChevronRight,
    Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export default function SearchConfigsPage() {
    const [configs, setConfigs] = useState<SearchConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadConfigs()
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

    return (
        <div className="space-y-8 animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Wyszukiwania</h1>
                    <p className="text-muted-foreground mt-1">
                        Zarządzaj swoimi automatycznymi wyszukiwaniami
                    </p>
                </div>

                <Button>
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
                                                    Co {config.intervalSeconds}s
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
                                            onClick={() => handleRun(config.id)}
                                            loading={actionLoading === config.id}
                                            disabled={!config.isActive}
                                        >
                                            <Play className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant={config.isActive ? 'secondary' : 'default'}
                                            size="sm"
                                            onClick={() => handleToggle(config.id)}
                                            loading={actionLoading === config.id}
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
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nowe wyszukiwanie
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
