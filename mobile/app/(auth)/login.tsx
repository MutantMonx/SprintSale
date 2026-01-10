import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { authApi } from '../../src/lib/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Błąd', 'Wypełnij wszystkie pola');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.login({ email, password });
            const { user, tokens } = response.data.data;
            login(user, tokens.accessToken, tokens.refreshToken);
        } catch (error: any) {
            Alert.alert(
                'Błąd logowania',
                error.response?.data?.error?.message || 'Nieprawidłowy email lub hasło'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logo}>
                    <Text style={styles.logoIcon}>🚗</Text>
                    <Text style={styles.logoText}>SprintSale</Text>
                    <Text style={styles.logoSubtext}>by monx</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.title}>Zaloguj się</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="twoj@email.pl"
                            placeholderTextColor="#6b7280"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Hasło</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#6b7280"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Logowanie...' : 'Zaloguj się'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Register link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Nie masz konta? </Text>
                    <Link href="/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.footerLink}>Zarejestruj się</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logo: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    logoText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
    },
    logoSubtext: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#374151',
    },
    button: {
        backgroundColor: '#22c55e',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#9ca3af',
        fontSize: 15,
    },
    footerLink: {
        color: '#22c55e',
        fontSize: 15,
        fontWeight: '600',
    },
});
