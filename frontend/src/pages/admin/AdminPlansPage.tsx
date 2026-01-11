import { useState, useEffect } from 'react'
import { Crown, Save, Check, X, Infinity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface SubscriptionPlan {
    id: string
    name: string
    displayName: string
    description: string | null
    priceMonthly: number
    priceQuarterly: number
    priceYearly: number
    currency: string
    maxServices: number
    maxCustomServices: number
    maxSearchConfigs: number
    dailySearchMinutes: number
    maxNotificationsDay: number
    canAddCustomService: boolean
    hasBonusService: boolean
    hasEmailReports: boolean
    hasPrioritySupport: boolean
    isActive: boolean
    displayOrder: number
    _count: {
        users: number
        subscriptions: number
    }
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPlan, setEditingPlan] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadPlans()
    }, [])

    const loadPlans = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.plans.list()
            setPlans(data.data)
        } catch (err) {
            console.error('Failed to load plans:', err)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (plan: SubscriptionPlan) => {
        setEditingPlan(plan.id)
        setEditForm({
            displayName: plan.displayName,
            description: plan.description || '',
            priceMonthly: plan.priceMonthly,
            priceQuarterly: plan.priceQuarterly,
            priceYearly: plan.priceYearly,
            maxServices: plan.maxServices,
            maxSearchConfigs: plan.maxSearchConfigs,
            dailySearchMinutes: plan.dailySearchMinutes,
            maxNotificationsDay: plan.maxNotificationsDay,
            canAddCustomService: plan.canAddCustomService,
            hasBonusService: plan.hasBonusService,
            hasEmailReports: plan.hasEmailReports,
            hasPrioritySupport: plan.hasPrioritySupport,
        })
    }

    const cancelEditing = () => {
        setEditingPlan(null)
        setEditForm({})
    }

    const savePlan = async () => {
        if (!editingPlan) return

        try {
            setSaving(true)
            await adminApi.plans.update(editingPlan, editForm)
            await loadPlans()
            setEditingPlan(null)
            setEditForm({})
        } catch (err) {
            console.error('Failed to save plan:', err)
        } finally {
            setSaving(false)
        }
    }

    const renderLimit = (value: number) => {
        if (value === 0) return <Infinity className="h-4 w-4 text-green-500" />
        return value
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    Plany subskrypcyjne
                </h1>
                <p className="text-muted-foreground">
                    Konfiguruj limity i ceny planów Free i Premium
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {plans.map((plan) => (
                    <Card key={plan.id} className={plan.name === 'PREMIUM' ? 'border-yellow-500' : ''}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {plan.name === 'PREMIUM' && <Crown className="h-5 w-5 text-yellow-500" />}
                                    <CardTitle>{plan.displayName}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    {editingPlan === plan.id ? (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" onClick={savePlan} disabled={saving}>
                                                <Save className="h-4 w-4 mr-1" />
                                                {saving ? 'Zapisuję...' : 'Zapisz'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => startEditing(plan)}>
                                            Edytuj
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardDescription>
                                {plan._count.users} użytkowników • {plan._count.subscriptions} subskrypcji
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {editingPlan === plan.id ? (
                                // Edit Form
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Nazwa wyświetlana</label>
                                        <Input
                                            value={editForm.displayName || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Opis</label>
                                        <Input
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-sm font-medium">Cena/mies.</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.priceMonthly || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, priceMonthly: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Cena/kwart.</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.priceQuarterly || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, priceQuarterly: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Cena/rok</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.priceYearly || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, priceYearly: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-sm font-medium">Max serwisów (0=∞)</label>
                                            <Input
                                                type="number"
                                                value={editForm.maxServices || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, maxServices: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Max wyszukiwań (0=∞)</label>
                                            <Input
                                                type="number"
                                                value={editForm.maxSearchConfigs || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, maxSearchConfigs: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-sm font-medium">Minuty/dzień (0=∞)</label>
                                            <Input
                                                type="number"
                                                value={editForm.dailySearchMinutes || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, dailySearchMinutes: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Powiadomień/dzień (0=∞)</label>
                                            <Input
                                                type="number"
                                                value={editForm.maxNotificationsDay || 0}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, maxNotificationsDay: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.canAddCustomService || false}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, canAddCustomService: e.target.checked }))}
                                            />
                                            <span className="text-sm">Może dodać własny serwis</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.hasBonusService || false}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, hasBonusService: e.target.checked }))}
                                            />
                                            <span className="text-sm">Bonus serwis</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.hasEmailReports || false}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, hasEmailReports: e.target.checked }))}
                                            />
                                            <span className="text-sm">Raporty email</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.hasPrioritySupport || false}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, hasPrioritySupport: e.target.checked }))}
                                            />
                                            <span className="text-sm">Priorytetowe wsparcie</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                // Display View
                                <>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-3 gap-2 text-center bg-muted/50 rounded-lg p-3">
                                        <div>
                                            <div className="text-lg font-bold">{plan.priceMonthly} {plan.currency}</div>
                                            <div className="text-xs text-muted-foreground">/miesiąc</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold">{plan.priceQuarterly} {plan.currency}</div>
                                            <div className="text-xs text-muted-foreground">/kwartał</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold">{plan.priceYearly} {plan.currency}</div>
                                            <div className="text-xs text-muted-foreground">/rok</div>
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Limity</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Serwisy:</span>
                                                <span className="font-medium">{renderLimit(plan.maxServices)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Wyszukiwania:</span>
                                                <span className="font-medium">{renderLimit(plan.maxSearchConfigs)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Czas/dzień:</span>
                                                <span className="font-medium">
                                                    {plan.dailySearchMinutes === 0 ? <Infinity className="h-4 w-4 inline text-green-500" /> : `${plan.dailySearchMinutes} min`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Powiadomienia:</span>
                                                <span className="font-medium">{renderLimit(plan.maxNotificationsDay)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Funkcje</h4>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            <div className="flex items-center gap-1">
                                                {plan.canAddCustomService ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-400" />
                                                )}
                                                <span>Własny serwis</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {plan.hasBonusService ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-400" />
                                                )}
                                                <span>Bonus serwis</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {plan.hasEmailReports ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-400" />
                                                )}
                                                <span>Raporty email</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {plan.hasPrioritySupport ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-400" />
                                                )}
                                                <span>Priorytet</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
