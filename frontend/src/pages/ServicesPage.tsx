import { useEffect, useState } from 'react'
import { Globe, Check, Plus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { servicesApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Service {
    id: string
    name: string
    baseUrl: string
    logoUrl: string | null
}

interface SubscribedService extends Service {
    hasCredentials: boolean
    subscribedAt: string
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [subscribed, setSubscribed] = useState<SubscribedService[]>([])
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [servicesRes, subscribedRes] = await Promise.all([
                servicesApi.list(),
                servicesApi.subscribed(),
            ])
            setServices(servicesRes.data.data)
            setSubscribed(subscribedRes.data.data)
        } catch (error) {
            console.error('Failed to load services:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (serviceId: string) => {
        setSubscribing(serviceId)
        try {
            await servicesApi.subscribe(serviceId)
            toast({
                title: 'Subskrypcja dodana',
                description: 'Możesz teraz tworzyć wyszukiwania dla tego serwisu',
                variant: 'success',
            })
            loadData()
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message || 'Nie udało się dodać subskrypcji',
                variant: 'destructive',
            })
        } finally {
            setSubscribing(null)
        }
    }

    const handleUnsubscribe = async (serviceId: string) => {
        setSubscribing(serviceId)
        try {
            await servicesApi.unsubscribe(serviceId)
            toast({
                title: 'Subskrypcja usunięta',
                description: 'Serwis został usunięty z Twojej listy',
            })
            loadData()
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message || 'Nie udało się usunąć subskrypcji',
                variant: 'destructive',
            })
        } finally {
            setSubscribing(null)
        }
    }

    const isSubscribed = (serviceId: string) =>
        subscribed.some(s => s.id === serviceId)

    return (
        <div className="space-y-8 animate-in">
            <div>
                <h1 className="text-2xl font-bold">Serwisy</h1>
                <p className="text-muted-foreground mt-1">
                    Zarządzaj serwisami ogłoszeń, które chcesz monitorować
                </p>
            </div>

            {/* Subscribed services */}
            {subscribed.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Twoje serwisy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subscribed.map((service) => (
                            <Card key={service.id} className="border-primary/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                            {service.logoUrl ? (
                                                <img
                                                    src={service.logoUrl}
                                                    alt={service.name}
                                                    className="w-8 h-8 object-contain"
                                                />
                                            ) : (
                                                <Globe className="w-6 h-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate">{service.name}</CardTitle>
                                            <CardDescription className="truncate text-xs">
                                                {service.baseUrl}
                                            </CardDescription>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleUnsubscribe(service.id)}
                                            loading={subscribing === service.id}
                                        >
                                            Usuń
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <a href={service.baseUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Available services */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Dostępne serwisy</h2>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-24" />
                                            <div className="h-3 bg-muted rounded w-32" />
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.filter(s => !isSubscribed(s.id)).map((service) => (
                            <Card key={service.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                            {service.logoUrl ? (
                                                <img
                                                    src={service.logoUrl}
                                                    alt={service.name}
                                                    className="w-8 h-8 object-contain"
                                                />
                                            ) : (
                                                <Globe className="w-6 h-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate">{service.name}</CardTitle>
                                            <CardDescription className="truncate text-xs">
                                                {service.baseUrl}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleSubscribe(service.id)}
                                        loading={subscribing === service.id}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Dodaj
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {services.filter(s => !isSubscribed(s.id)).length === 0 && (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Wszystkie serwisy zostały dodane</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
