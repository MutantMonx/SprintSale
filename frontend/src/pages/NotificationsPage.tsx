import { useEffect, useState } from 'react'
import {
    Bell,
    Check,
    CheckCheck,
    ExternalLink,
    Phone
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatPrice, formatRelativeTime } from '@/lib/utils'

interface Notification {
    id: string
    channel: string
    status: string
    readAt: string | null
    createdAt: string
    listing: {
        id: string
        title: string
        price: number | null
        currency: string
        listingUrl: string
        phone: string | null
        images: string[]
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const { toast } = useToast()

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                notificationsApi.list({ limit: 50 }),
                notificationsApi.unreadCount(),
            ])
            setNotifications(notifsRes.data.data)
            setUnreadCount(countRes.data.data.count)
        } catch (error) {
            console.error('Failed to load notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkRead = async (id: string) => {
        try {
            await notificationsApi.markRead(id)
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n
            ))
            setUnreadCount(Math.max(0, unreadCount - 1))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead()
            setNotifications(notifications.map(n => ({
                ...n,
                readAt: n.readAt || new Date().toISOString(),
                status: 'READ'
            })))
            setUnreadCount(0)
            toast({
                title: 'Wszystkie powiadomienia oznaczone jako przeczytane',
            })
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message,
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Powiadomienia</h1>
                    <p className="text-muted-foreground mt-1">
                        {unreadCount > 0
                            ? `Masz ${unreadCount} nieprzeczytanych powiadomień`
                            : 'Wszystkie powiadomienia przeczytane'
                        }
                    </p>
                </div>

                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllRead}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Oznacz wszystkie
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-muted rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={`transition-all duration-200 hover:shadow-md ${!notif.readAt ? 'border-primary/50 bg-primary/5' : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                        {notif.listing.images.length > 0 ? (
                                            <img
                                                src={notif.listing.images[0]}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Bell className="w-6 h-6 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-medium line-clamp-2">
                                                {notif.listing.title}
                                            </h3>
                                            {!notif.readAt && (
                                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>

                                        <p className="text-lg font-bold text-primary mt-1">
                                            {notif.listing.price
                                                ? formatPrice(notif.listing.price, notif.listing.currency)
                                                : 'Brak ceny'
                                            }
                                        </p>

                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formatRelativeTime(notif.createdAt)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            asChild
                                        >
                                            <a href={notif.listing.listingUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>

                                        {notif.listing.phone && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={`tel:${notif.listing.phone}`}>
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}

                                        {!notif.readAt && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkRead(notif.id)}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Brak powiadomień</h3>
                        <p className="text-muted-foreground">
                            Powiadomienia o nowych ogłoszeniach pojawią się tutaj
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
