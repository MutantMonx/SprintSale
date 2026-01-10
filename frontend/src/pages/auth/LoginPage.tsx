import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
    email: z.string().email('Podaj prawidłowy adres email'),
    password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)
    const { toast } = useToast()

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginForm) => {
        setLoading(true)
        try {
            const response = await authApi.login(data)
            const { user, tokens } = response.data.data

            login(user, tokens.accessToken, tokens.refreshToken)

            toast({
                title: 'Witaj z powrotem!',
                description: `Zalogowano jako ${user.email}`,
                variant: 'success',
            })

            navigate('/dashboard')
        } catch (error: any) {
            toast({
                title: 'Błąd logowania',
                description: error.response?.data?.error?.message || 'Nieprawidłowy email lub hasło',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-in">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Zaloguj się</h2>
                <p className="text-muted-foreground">
                    Wprowadź swoje dane, aby uzyskać dostęp do konta
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="twoj@email.pl"
                            className="pl-10"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Hasło</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...register('password')}
                            error={errors.password?.message}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Zaloguj się
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Nie masz jeszcze konta? </span>
                <Link to="/register" className="text-primary hover:underline font-medium">
                    Zarejestruj się
                </Link>
            </div>
        </div>
    )
}
