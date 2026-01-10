import { useEffect, useState } from 'react'
import {
    FileText,
    ExternalLink,
    Phone,
    AlertTriangle,
    CheckCircle,
    Filter
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listingsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatPrice, formatRelativeTime } from '@/lib/utils'

interface Listing {
    id: string
    title: string
    description: string | null
    price: number | null
    currency: string
    location: string | null
    phone: string | null
    listingUrl: string
    images: string[]
    isAd: boolean
    previousPrice: number | null
    detectedAt: string
    service: {
        id: string
        name: string
        logoUrl: string | null
    }
}

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        loadListings()
    }, [])

    const loadListings = async (pageNum = 1) => {
        try {
            const response = await listingsApi.list({ page: pageNum, limit: 20 })
            const newListings = response.data.data

            if (pageNum === 1) {
                setListings(newListings)
            } else {
                setListings([...listings, ...newListings])
            }

            setHasMore(newListings.length === 20)
            setPage(pageNum)
        } catch (error) {
            console.error('Failed to load listings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkSpam = async (id: string) => {
        try {
            await listingsApi.markSpam(id)
            setListings(listings.map(l => l.id === id ? { ...l, isAd: true } : l))
            toast({
                title: 'Oznaczono jako spam',
            })
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message,
                variant: 'destructive',
            })
        }
    }

    const handleMarkSuccess = async (id: string) => {
        try {
            await listingsApi.markSuccess(id)
            toast({
                title: 'Oznaczono jako sukces',
                description: 'Gratulacje!',
                variant: 'success',
            })
        } catch (error: any) {
            toast({
                title: 'Błąd',
                description: error.response?.data?.error?.message,
                variant: 'destructive',
            })
        }
    }

    const getPriceChange = (listing: Listing) => {
        if (!listing.previousPrice || !listing.price) return null
        const diff = listing.previousPrice - listing.price
        const percent = Math.round((diff / listing.previousPrice) * 100)
        return { diff, percent }
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Ogłoszenia</h1>
                    <p className="text-muted-foreground mt-1">
                        Znalezione ogłoszenia z Twoich wyszukiwań
                    </p>
                </div>

                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtry
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-0">
                                <div className="h-48 bg-muted rounded-t-xl" />
                                <div className="p-4 space-y-2">
                                    <div className="h-5 bg-muted rounded w-3/4" />
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : listings.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listings.map((listing) => {
                            const priceChange = getPriceChange(listing)

                            return (
                                <Card
                                    key={listing.id}
                                    className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${listing.isAd ? 'opacity-50' : ''
                                        }`}
                                >
                                    <CardContent className="p-0">
                                        {/* Image */}
                                        <div className="relative h-48 bg-muted">
                                            {listing.images.length > 0 ? (
                                                <img
                                                    src={listing.images[0]}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-12 h-12 text-muted-foreground/50" />
                                                </div>
                                            )}

                                            {/* Service badge */}
                                            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium">
                                                {listing.service.name}
                                            </div>

                                            {/* Price change badge */}
                                            {priceChange && priceChange.diff > 0 && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-md px-2 py-1 text-xs font-bold">
                                                    -{priceChange.percent}%
                                                </div>
                                            )}

                                            {listing.isAd && (
                                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                                    <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
                                                        SPAM
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold line-clamp-2 mb-2">{listing.title}</h3>

                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-xl font-bold text-primary">
                                                    {listing.price ? formatPrice(listing.price, listing.currency) : 'Brak ceny'}
                                                </span>
                                                {priceChange && priceChange.diff > 0 && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        {formatPrice(listing.previousPrice!, listing.currency)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                                {listing.location && <span>📍 {listing.location}</span>}
                                                <span>• {formatRelativeTime(listing.detectedAt)}</span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="flex-1"
                                                    asChild
                                                >
                                                    <a href={listing.listingUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Otwórz
                                                    </a>
                                                </Button>

                                                {listing.phone && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a href={`tel:${listing.phone}`}>
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkSuccess(listing.id)}
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                </Button>

                                                {!listing.isAd && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkSpam(listing.id)}
                                                    >
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => loadListings(page + 1)}
                            >
                                Załaduj więcej
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Brak ogłoszeń</h3>
                        <p className="text-muted-foreground">
                            Ogłoszenia pojawią się tutaj po uruchomieniu wyszukiwań
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
