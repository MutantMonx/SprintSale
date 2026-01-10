import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { authApi } from '../../src/lib/api';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, refreshToken, logout } = useAuthStore();

    const handleLogout = async () => {
        Alert.alert(
            'Wyloguj',
            'Czy na pewno chcesz się wylogować?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyloguj',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (refreshToken) {
                                await authApi.logout(refreshToken);
                            }
                        } finally {
                            logout();
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        label,
        value,
        onPress,
        destructive = false
    }: {
        icon: string;
        label: string;
        value?: string;
        onPress?: () => void;
        destructive?: boolean;
    }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.itemLeft}>
                <Ionicons
                    name={icon as any}
                    size={22}
                    color={destructive ? '#ef4444' : '#9ca3af'}
                />
                <Text style={[styles.itemLabel, destructive && styles.destructiveText]}>
                    {label}
                </Text>
            </View>
            {value && <Text style={styles.itemValue}>{value}</Text>}
            {onPress && !value && (
                <Ionicons name="chevron-forward" size={20} color="#4b5563" />
            )}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profil</Text>
                <View style={styles.card}>
                    <View style={styles.profile}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.name}>{user?.name || 'Użytkownik'}</Text>
                            <Text style={styles.email}>{user?.email}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <SettingItem
                        icon="ribbon-outline"
                        label="Plan"
                        value={user?.tier === 'PREMIUM' ? 'Premium' : 'Darmowy'}
                    />
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Powiadomienia</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="notifications-outline"
                        label="Powiadomienia push"
                        value="Włączone"
                    />
                </View>
            </View>

            {/* App Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aplikacja</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="information-circle-outline"
                        label="Wersja"
                        value="1.0.0"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="document-text-outline"
                        label="Polityka prywatności"
                        onPress={() => { }}
                    />
                </View>
            </View>

            {/* Logout */}
            <View style={styles.section}>
                <View style={styles.card}>
                    <SettingItem
                        icon="log-out-outline"
                        label="Wyloguj się"
                        onPress={handleLogout}
                        destructive
                    />
                </View>
            </View>

            <Text style={styles.footer}>Created by monx</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionTitle: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        overflow: 'hidden',
    },
    profile: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#22c55e',
        fontSize: 24,
        fontWeight: '600',
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    email: {
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 2,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemLabel: {
        color: '#fff',
        fontSize: 16,
    },
    itemValue: {
        color: '#9ca3af',
        fontSize: 15,
    },
    destructiveText: {
        color: '#ef4444',
    },
    divider: {
        height: 1,
        backgroundColor: '#374151',
        marginLeft: 50,
    },
    footer: {
        color: '#4b5563',
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 32,
    },
});
