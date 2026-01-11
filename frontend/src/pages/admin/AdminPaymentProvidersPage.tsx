import { useState, useEffect } from 'react'
import { CreditCard, Save, Check, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface PaymentProvider {
    id: string
    provider: string
    isEnabled: boolean
    isSandbox: boolean
    clientId: string | null
    merchantId: string | null
    posId: string | null
    hasClientSecret: boolean
    hasSecondKey: boolean
    hasWebhookSecret: boolean
    config: object | null
    updatedAt: string
}

const providerInfo: Record<string, { name: string; logo: string; color: string; description: string }> = {
    PAYU: {
        name: 'PayU',
        logo: '💳',
        color: 'bg-green-500',
        description: 'Najpopularniejsza bramka płatności w Polsce. Obsługuje karty, BLIK, przelewy bankowe.'
    },
    PAYPAL: {
        name: 'PayPal',
        logo: '🅿️',
        color: 'bg-blue-600',
        description: 'Międzynarodowa platforma płatności. Idealna dla klientów zagranicznych.'
    },
    GOOGLE_PAY: {
        name: 'Google Pay',
        logo: '🔷',
        color: 'bg-white border',
        description: 'Płatności jednym kliknięciem dla użytkowników Android.'
    },
    APPLE_PAY: {
        name: 'Apple Pay',
        logo: '🍎',
        color: 'bg-black',
        description: 'Płatności jednym kliknięciem dla użytkowników Apple.'
    },
    STRIPE: {
        name: 'Stripe',
        logo: '💜',
        color: 'bg-purple-600',
        description: 'Globalna platforma płatności dla firm SaaS.'
    },
}

export default function AdminPaymentProvidersPage() {
    const [providers, setProviders] = useState<PaymentProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [editingProvider, setEditingProvider] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Record<string, string | boolean>>({})
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        loadProviders()
    }, [])

    const loadProviders = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.paymentProviders.list()

            // Merge with all known providers
            const allProviders = Object.keys(providerInfo).map(key => {
                const existing = data.data.find((p: PaymentProvider) => p.provider === key)
                return existing || {
                    id: null,
                    provider: key,
                    isEnabled: false,
                    isSandbox: true,
                    clientId: null,
                    merchantId: null,
                    posId: null,
                    hasClientSecret: false,
                    hasSecondKey: false,
                    hasWebhookSecret: false,
                    config: null,
                }
            })

            setProviders(allProviders)
        } catch (err) {
            console.error('Failed to load providers:', err)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (provider: PaymentProvider) => {
        setEditingProvider(provider.provider)
        setEditForm({
            isEnabled: provider.isEnabled,
            isSandbox: provider.isSandbox,
            clientId: provider.clientId || '',
            merchantId: provider.merchantId || '',
            posId: provider.posId || '',
            clientSecret: '',
            secondKey: '',
            webhookSecret: '',
        })
    }

    const saveProvider = async () => {
        if (!editingProvider) return

        try {
            setSaving(true)
            // Only send non-empty secrets
            const dataToSend: Record<string, unknown> = {
                isEnabled: editForm.isEnabled,
                isSandbox: editForm.isSandbox,
                clientId: editForm.clientId || null,
                merchantId: editForm.merchantId || null,
                posId: editForm.posId || null,
            }

            if (editForm.clientSecret) dataToSend.clientSecret = editForm.clientSecret
            if (editForm.secondKey) dataToSend.secondKey = editForm.secondKey
            if (editForm.webhookSecret) dataToSend.webhookSecret = editForm.webhookSecret

            await adminApi.paymentProviders.update(editingProvider, dataToSend)
            await loadProviders()
            setEditingProvider(null)
            setMessage({ type: 'success', text: 'Ustawienia dostawcy zapisane!' })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            console.error('Failed to save provider:', err)
            setMessage({ type: 'error', text: 'Nie udało się zapisać ustawień' })
        } finally {
            setSaving(false)
        }
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
                    <CreditCard className="h-8 w-8" />
                    Dostawcy płatności
                </h1>
                <p className="text-muted-foreground">
                    Skonfiguruj bramki płatności - PayU, PayPal, Google Pay, Apple Pay
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {message.text}
                </div>
            )}

            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Integracja w trakcie</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Płatności są przygotowane do integracji. Wprowadź dane dostępowe po utworzeniu kont
                            deweloperskich u dostawców. System jest gotowy do aktywacji.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {providers.map((provider) => {
                    const info = providerInfo[provider.provider]
                    const isEditing = editingProvider === provider.provider

                    return (
                        <Card key={provider.provider} className={provider.isEnabled ? 'border-green-500' : ''}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-xl`}>
                                            {info.logo}
                                        </div>
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {info.name}
                                                {provider.isEnabled && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                        Aktywny
                                                    </span>
                                                )}
                                                {provider.isSandbox && provider.isEnabled && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                        Sandbox
                                                    </span>
                                                )}
                                            </CardTitle>
                                            <CardDescription>{info.description}</CardDescription>
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <Button variant="outline" onClick={() => startEditing(provider)}>
                                            Konfiguruj
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            {isEditing && (
                                <CardContent className="space-y-4 border-t pt-4">
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isEnabled as boolean}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <span>Włączony</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isSandbox as boolean}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, isSandbox: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <span>Tryb sandbox (testowy)</span>
                                        </label>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-medium">Client ID / API Key</label>
                                            <Input
                                                value={editForm.clientId as string}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                placeholder="Wprowadź Client ID..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">
                                                Client Secret {provider.hasClientSecret && <span className="text-green-500">(zapisany)</span>}
                                            </label>
                                            <Input
                                                type="password"
                                                value={editForm.clientSecret as string}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                placeholder={provider.hasClientSecret ? '••••••••' : 'Wprowadź Client Secret...'}
                                            />
                                        </div>
                                    </div>

                                    {(provider.provider === 'PAYU') && (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="text-sm font-medium">Merchant ID</label>
                                                <Input
                                                    value={editForm.merchantId as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, merchantId: e.target.value }))}
                                                    placeholder="Wprowadź Merchant ID..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">POS ID</label>
                                                <Input
                                                    value={editForm.posId as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, posId: e.target.value }))}
                                                    placeholder="Wprowadź POS ID..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">
                                                    Second Key (MD5) {provider.hasSecondKey && <span className="text-green-500">(zapisany)</span>}
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={editForm.secondKey as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, secondKey: e.target.value }))}
                                                    placeholder={provider.hasSecondKey ? '••••••••' : 'Wprowadź Second Key...'}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium">
                                            Webhook Secret {provider.hasWebhookSecret && <span className="text-green-500">(zapisany)</span>}
                                        </label>
                                        <Input
                                            type="password"
                                            value={editForm.webhookSecret as string}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, webhookSecret: e.target.value }))}
                                            placeholder={provider.hasWebhookSecret ? '••••••••' : 'Wprowadź Webhook Secret...'}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Webhook URL: {window.location.origin}/api/payments/webhook/{provider.provider.toLowerCase()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={saveProvider} disabled={saving}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {saving ? 'Zapisuję...' : 'Zapisz konfigurację'}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setEditingProvider(null)}>
                                            Anuluj
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
