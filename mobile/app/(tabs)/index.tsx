import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Image,
    Linking
} from 'react-native';
import { listingsApi } from '../../src/lib/api';

interface Listing {
    id: string;
    title: string;
    price: number | null;
    currency: string;
    location: string | null;
    listingUrl: string;
    images: string[];
    detectedAt: string;
    service: { name: string };
}

export default function ListingsScreen() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadListings = useCallback(async () => {
        try {
            const response = await listingsApi.list({ limit: 50 });
            setListings(response.data.data);
        } catch (error) {
            console.error('Failed to load listings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const onRefresh = () => {
        setRefreshing(true);
        loadListings();
    };

    const openListing = (url: string) => {
        Linking.openURL(url);
    };

    const formatPrice = (price: number | null, currency: string) => {
        if (!price) return 'Brak ceny';
        return `${price.toLocaleString('pl-PL')} ${currency}`;
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 60) return `${minutes} min temu`;
        if (hours < 24) return `${hours} godz. temu`;
        return `${Math.floor(hours / 24)} dni temu`;
    };

    const renderItem = ({ item }: { item: Listing }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openListing(item.listingUrl)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Text style={styles.placeholderText}>📷</Text>
                    </View>
                )}
                <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{item.service.name}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>

                <View style={styles.meta}>
                    {item.location && (
                        <Text style={styles.metaText}>📍 {item.location}</Text>
                    )}
                    <Text style={styles.metaText}>{formatRelativeTime(item.detectedAt)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Ładowanie...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={listings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#22c55e"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Brak ogłoszeń</Text>
                        <Text style={styles.emptySubtext}>
                            Pociągnij w dół, aby odświeżyć
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    list: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 160,
        backgroundColor: '#374151',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
    },
    serviceBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    serviceBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    content: {
        padding: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    price: {
        color: '#22c55e',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    meta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaText: {
        color: '#9ca3af',
        fontSize: 13,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111827',
    },
    loadingText: {
        color: '#9ca3af',
        fontSize: 16,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtext: {
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 8,
    },
});
