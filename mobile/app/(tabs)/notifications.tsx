import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert
} from 'react-native';
import { notificationsApi } from '../../src/lib/api';

interface Notification {
    id: string;
    status: string;
    readAt: string | null;
    createdAt: string;
    listing: {
        id: string;
        title: string;
        price: number | null;
        currency: string;
        listingUrl: string;
    };
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const response = await notificationsApi.list({ limit: 50 });
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, readAt: new Date().toISOString() })));
            Alert.alert('Sukces', 'Wszystkie powiadomienia oznaczone jako przeczytane');
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się oznaczyć powiadomień');
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const formatTime = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 60) return `${minutes} min`;
        if (hours < 24) return `${hours} godz.`;
        return `${Math.floor(hours / 24)} dni`;
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.card, !item.readAt && styles.unread]}
            onPress={() => handleMarkRead(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.listing.title}
                    </Text>
                    {!item.readAt && <View style={styles.dot} />}
                </View>

                <Text style={styles.price}>
                    {item.listing.price
                        ? `${item.listing.price.toLocaleString('pl-PL')} ${item.listing.currency}`
                        : 'Brak ceny'
                    }
                </Text>

                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
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

    const unreadCount = notifications.filter(n => !n.readAt).length;

    return (
        <View style={styles.container}>
            {unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
                    <Text style={styles.markAllText}>
                        Oznacz wszystkie jako przeczytane ({unreadCount})
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={notifications}
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
                        <Text style={styles.emptyText}>🔔</Text>
                        <Text style={styles.emptyTitle}>Brak powiadomień</Text>
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
        gap: 12,
    },
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
    },
    unread: {
        borderLeftWidth: 3,
        borderLeftColor: '#22c55e',
    },
    content: {
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
        marginTop: 4,
    },
    price: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: '700',
    },
    time: {
        color: '#9ca3af',
        fontSize: 13,
    },
    markAllButton: {
        backgroundColor: '#1f2937',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    markAllText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
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
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
