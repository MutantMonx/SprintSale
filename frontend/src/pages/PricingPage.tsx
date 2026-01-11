import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, ArrowLeft, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { subscriptionsApi } from '@/lib/api'

interface Plan {
    id: string
    name: string
    displayName: string
    description: string
    priceMonthly: number
    priceQuarterly: number
    priceYearly: number
    currency: string
    maxServices: number
    maxSearchConfigs: number
    dailySearchMinutes: number
    maxNotificationsDay: number
    canAddCustomService: boolean
    hasEmailReports: boolean
    hasPrioritySupport: boolean
}

export default function PricingPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY')

    useEffect(() => {
        loadPlans()
    }, [])

    const loadPlans = async () => {
        try {
            const { data } = await subscriptionsApi.plans()
            setPlans(data.data)
        } catch (err) {
            console.error('Failed to load plans:', err)
        } finally {
            setLoading(false)
        }
    }

    const getPrice = (plan: Plan) => {
        switch (billingPeriod) {
            case 'YEARLY': return plan.priceYearly
            case 'QUARTERLY': return plan.priceQuarterly
            default: return plan.priceMonthly
        }
    }

    const getMonthlyEquivalent = (plan: Plan) => {
        switch (billingPeriod) {
            case 'YEARLY': return (plan.priceYearly / 12).toFixed(2)
            case 'QUARTERLY': return (plan.priceQuarterly / 3).toFixed(2)
            default: return plan.priceMonthly.toFixed(2)
        }
    }

    const renderLimit = (value: number, unit: string = '') => {
        if (value === 0) return <span className="flex items-center gap-1"><Infinity className="h-4 w-4" /> Bez limitu</span>
        return `${value}${unit}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Powrót do SprintSale
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Wybierz swój plan</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Znajdź najlepsze oferty szybciej niż konkurencja.
                        Automatyczne monitorowanie ogłoszeń samochodowych.
                    </p>
                </div>

                {/* Billing Period Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-muted rounded-lg p-1">
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingPeriod === 'MONTHLY' ? 'bg-background shadow' : ''
                                }`}
                            onClick={() => setBillingPeriod('MONTHLY')}
                        >
                            Miesięcznie
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingPeriod === 'QUARTERLY' ? 'bg-background shadow' : ''
                                }`}
                            onClick={() => setBillingPeriod('QUARTERLY')}
                        >
                            Kwartalnie
                            <span className="ml-1 text-xs text-green-600">-12%</span>
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingPeriod === 'YEARLY' ? 'bg-background shadow' : ''
                                }`}
                            onClick={() => setBillingPeriod('YEARLY')}
                        >
                            Rocznie
                            <span className="ml-1 text-xs text-green-600">-33%</span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative ${plan.name === 'PREMIUM' ? 'border-yellow-500 border-2 shadow-xl' : ''}`}
                        >
                            {plan.name === 'PREMIUM' && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        POLECANY
                                    </span>
                                </div>
                            )}
                            <CardHeader className="text-center">
                                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                                    {plan.name === 'PREMIUM' && <Crown className="h-6 w-6 text-yellow-500" />}
                                    {plan.displayName}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">
                                        {getPrice(plan) === 0 ? 'Darmowy' : `${getPrice(plan)} ${plan.currency}`}
                                    </span>
                                    {getPrice(plan) > 0 && (
                                        <span className="text-muted-foreground">
                                            {billingPeriod === 'MONTHLY' ? '/mies.' :
                                                billingPeriod === 'QUARTERLY' ? '/kwart.' : '/rok'}
                                        </span>
                                    )}
                                </div>
                                {billingPeriod !== 'MONTHLY' && getPrice(plan) > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        czyli {getMonthlyEquivalent(plan)} {plan.currency}/mies.
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span>Serwisy: {renderLimit(plan.maxServices)}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span>Wyszukiwania: {renderLimit(plan.maxSearchConfigs)}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span>
                                            Czas działania dziennie: {
                                                plan.dailySearchMinutes === 0
                                                    ? <span className="flex items-center gap-1 inline"><Infinity className="h-4 w-4" /> 24h</span>
                                                    : `${Math.floor(plan.dailySearchMinutes / 60)}h`
                                            }
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span>Powiadomienia/dzień: {renderLimit(plan.maxNotificationsDay)}</span>
                                    </li>
                                    {plan.canAddCustomService && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                                            <span>Własny serwis (Allegro, eBay...)</span>
                                        </li>
                                    )}
                                    {plan.hasEmailReports && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                                            <span>Raporty email</span>
                                        </li>
                                    )}
                                    {plan.hasPrioritySupport && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                                            <span>Priorytetowe wsparcie</span>
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/register" className="w-full">
                                    <Button
                                        className="w-full"
                                        variant={plan.name === 'PREMIUM' ? 'default' : 'outline'}
                                        size="lg"
                                    >
                                        {plan.name === 'FREE' ? 'Zacznij za darmo' : 'Wybierz Premium'}
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Masz pytania?</h2>
                    <p className="text-muted-foreground mb-4">
                        Napisz do nas na <a href="mailto:support@sprintsale.pl" className="text-primary hover:underline">support@sprintsale.pl</a>
                    </p>
                </div>

                <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} SprintSale. Wszelkie prawa zastrzeżone.</p>
                    <div className="mt-2 space-x-4">
                        <Link to="/privacy-policy" className="hover:text-primary">Polityka prywatności</Link>
                        <Link to="/terms-of-service" className="hover:text-primary">Regulamin</Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
