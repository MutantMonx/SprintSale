import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Globe,
    Plus,
    Edit,
    Power,
    Search as SearchIcon,
    FileText,
    Users,
    ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface Service {
    id: string
    name: string
    baseUrl: string
    logoUrl: string | null
    isActive: boolean
    defaultConfig: Record<string, unknown> | null
    createdAt: string
    _count: {
        userServices: number
        searchConfigs: number
        listings: number
    }
}

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        baseUrl: '',
        logoUrl: '',
        isActive: true
    })

    useEffect(() => {
        loadServices()
    }, [])

    const loadServices = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.services.list()
            setServices(data.data)
        } catch (err) {
            console.error('Failed to load services:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingService) {
                await adminApi.services.update(editingService.id, formData)
            } else {
                await adminApi.services.create(formData)
            }
            setShowAddForm(false)
            setEditingService(null)
            setFormData({ name: '', baseUrl: '', logoUrl: '', isActive: true })
            loadServices()
        } catch (err) {
            console.error('Failed to save service:', err)
        }
    }

    const handleEdit = (service: Service) => {
        setEditingService(service)
        setFormData({
            name: service.name,
            baseUrl: service.baseUrl,
            logoUrl: service.logoUrl || '',
            isActive: service.isActive
        })
        setShowAddForm(true)
    }

    const handleToggleActive = async (service: Service) => {
        try {
            await adminApi.services.update(service.id, { isActive: !service.isActive })
            loadServices()
        } catch (err) {
            console.error('Failed to toggle service:', err)
        }
    }

    const handleCancel = () => {
        setShowAddForm(false)
        setEditingService(null)
        setFormData({ name: '', baseUrl: '', logoUrl: '', isActive: true })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Globe className="h-8 w-8" />
                            Zarządzanie serwisami
                        </h1>
                        <p className="text-muted-foreground">
                            {services.length} serwisów w systemie
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj serwis
                </Button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingService ? 'Edytuj serwis' : 'Nowy serwis'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Nazwa</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="np. OLX.pl"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Base URL</label>
                                    <Input
                                        value={formData.baseUrl}
                                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                        placeholder="https://www.olx.pl"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Logo URL</label>
                                <Input
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="isActive" className="text-sm">Aktywny</label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">
                                    {editingService ? 'Zapisz zmiany' : 'Dodaj serwis'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Anuluj
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Services List */}
            <div className="grid gap-4">
                {loading ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </CardContent>
                    </Card>
                ) : services.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Brak serwisów. Dodaj pierwszy!
                        </CardContent>
                    </Card>
                ) : (
                    services.map((service) => (
                        <Card key={service.id} className={!service.isActive ? 'opacity-50' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {service.logoUrl ? (
                                            <img
                                                src={service.logoUrl}
                                                alt={service.name}
                                                className="h-12 w-12 object-contain rounded"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                                <Globe className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {service.name}
                                                {!service.isActive && (
                                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded">
                                                        Nieaktywny
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{service.baseUrl}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {service._count.userServices}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <SearchIcon className="h-4 w-4" />
                                                {service._count.searchConfigs}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {service._count.listings}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(service)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(service)}
                                                title={service.isActive ? 'Wyłącz' : 'Włącz'}
                                            >
                                                <Power className={`h-4 w-4 ${service.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Info */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Info:</strong> Konfiguracja kroków scrapowania (selektory CSS, workflow)
                        będzie dostępna w następnej wersji. Na razie możesz dodawać/edytować podstawowe dane serwisów.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
