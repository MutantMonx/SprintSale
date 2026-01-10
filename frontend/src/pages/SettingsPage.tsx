import { useState } from 'react'
import {
    User,
    Moon,
    Sun,
    Bell,
    Shield,
    Smartphone,
    LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
    const { user, refreshToken, logout } = useAuthStore()
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'))
    const { toast } = useToast()
    const navigate = useNavigate()

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        document.documentElement.classList.toggle('dark', newMode)
        localStorage.setItem('theme', newMode ? 'dark' : 'light')
    }

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await authApi.logout(refreshToken)
            }
        } finally {
            logout()
            navigate('/login')
        }
    }

    return (
        <div className="space-y-6 animate-in max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Ustawienia</h1>
                <p className="text-muted-foreground mt-1">
                    Zarządzaj swoim kontem i preferencjami
                </p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profil
                    </CardTitle>
                    <CardDescription>
                        Podstawowe informacje o Twoim koncie
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Imię</Label>
                        <Input
                            id="name"
                            defaultValue={user?.name || ''}
                            placeholder="Twoje imię"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Plan</p>
                            <p className="text-sm text-muted-foreground">
                                {user?.tier === 'PREMIUM' ? 'Premium' : 'Darmowy'}
                            </p>
                        </div>
                        {user?.tier !== 'PREMIUM' && (
                            <Button variant="outline" size="sm">
                                Ulepsz do Premium
                            </Button>
                        )}
                    </div>
                    <Button className="w-full sm:w-auto">
                        Zapisz zmiany
                    </Button>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        Wygląd
                    </CardTitle>
                    <CardDescription>
                        Dostosuj wygląd aplikacji
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Tryb ciemny</p>
                            <p className="text-sm text-muted-foreground">
                                {darkMode ? 'Włączony' : 'Wyłączony'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={toggleDarkMode}
                        >
                            {darkMode ? (
                                <>
                                    <Sun className="w-4 h-4 mr-2" />
                                    Jasny
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4 mr-2" />
                                    Ciemny
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Powiadomienia
                    </CardTitle>
                    <CardDescription>
                        Zarządzaj preferencjami powiadomień
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Powiadomienia push</p>
                            <p className="text-sm text-muted-foreground">
                                Otrzymuj powiadomienia na urządzenia mobilne
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Konfiguruj
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">
                                Codzienny raport na email
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Wyłączony
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Devices */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Urządzenia
                    </CardTitle>
                    <CardDescription>
                        Zarządzaj zarejestrowanymi urządzeniami
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Brak zarejestrowanych urządzeń
                    </p>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Bezpieczeństwo
                    </CardTitle>
                    <CardDescription>
                        Zarządzaj bezpieczeństwem konta
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Zmień hasło</p>
                            <p className="text-sm text-muted-foreground">
                                Zaktualizuj hasło do konta
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Zmień
                        </Button>
                    </div>
                    <div className="pt-4 border-t">
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full sm:w-auto"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Wyloguj się
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
