import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { authApi } from '../../src/lib/api';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Błąd', 'Wypełnij wszystkie pola');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Błąd', 'Hasła nie są identyczne');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Błąd', 'Hasło musi mieć co najmniej 8 znaków');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.register({ email, password, name });
            const { user, tokens } = response.data.data;
            login(user, tokens.accessToken, tokens.refreshToken);
        } catch (error: any) {
            Alert.alert(
                'Błąd rejestracji',
                error.response?.data?.error?.message || 'Nie udało się utworzyć konta'
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logo}>
                        <Text style={styles.logoIcon}>🚗</Text>
                        <Text style={styles.logoText}>SprintSale</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.title}>Utwórz konto</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Imię</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Jan Kowalski"
                                placeholderTextColor="#6b7280"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

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
                                placeholder="Min. 8 znaków"
                                placeholderTextColor="#6b7280"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Potwierdź hasło</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Powtórz hasło"
                                placeholderTextColor="#6b7280"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Masz już konto? </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Zaloguj się</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    logo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    logoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
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
