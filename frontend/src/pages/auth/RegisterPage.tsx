import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const registerSchema = z.object({
    name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    email: z.string().email('Podaj prawidłowy adres email'),
    password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)
    const { toast } = useToast()

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true)
        try {
            const response = await authApi.register({
                email: data.email,
                password: data.password,
                name: data.name,
            })
            const { user, tokens } = response.data.data

            login(user, tokens.accessToken, tokens.refreshToken)

            toast({
                title: 'Konto utworzone!',
                description: 'Witaj w SprintSale',
                variant: 'success',
            })

            navigate('/dashboard')
        } catch (error: any) {
            toast({
                title: 'Błąd rejestracji',
                description: error.response?.data?.error?.message || 'Nie udało się utworzyć konta',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-in">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Utwórz konto</h2>
                <p className="text-muted-foreground">
                    Dołącz do SprintSale i zacznij śledzić ogłoszenia
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Imię</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="name"
                            type="text"
                            placeholder="Jan Kowalski"
                            className="pl-10"
                            {...register('name')}
                            error={errors.name?.message}
                        />
                    </div>
                </div>

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
                            placeholder="Min. 8 znaków"
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

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Powtórz hasło"
                            className="pl-10"
                            {...register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Utwórz konto
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Masz już konto? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                    Zaloguj się
                </Link>
            </div>
        </div>
    )
}
