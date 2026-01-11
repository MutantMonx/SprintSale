import { useState, useEffect } from 'react'
import { Settings, Save, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface SettingsData {
    [key: string]: {
        value: string
        description: string | null
        isPublic: boolean
    }
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SettingsData>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.settings.get()
            setSettings(data.data)

            // Initialize edit state with current values
            const initial: Record<string, string> = {}
            Object.entries(data.data).forEach(([key, val]) => {
                initial[key] = (val as { value: string }).value
            })
            setEditedSettings(initial)
        } catch (err) {
            console.error('Failed to load settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key: string, value: string) => {
        setEditedSettings(prev => ({ ...prev, [key]: value }))
    }

    const saveSettings = async () => {
        try {
            setSaving(true)
            await adminApi.settings.update(editedSettings)
            await loadSettings()
            setMessage({ type: 'success', text: 'Ustawienia zapisane!' })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            console.error('Failed to save settings:', err)
            setMessage({ type: 'error', text: 'Nie udało się zapisać ustawień' })
        } finally {
            setSaving(false)
        }
    }

    // Group settings by category
    const groupedSettings = Object.entries(editedSettings).reduce((acc, [key, value]) => {
        const category = key.split('.')[0]
        if (!acc[category]) acc[category] = []
        acc[category].push({
            key,
            value,
            description: settings[key]?.description,
            isPublic: settings[key]?.isPublic
        })
        return acc
    }, {} as Record<string, Array<{ key: string; value: string; description: string | null; isPublic: boolean }>>)

    const categoryNames: Record<string, string> = {
        'app': 'Aplikacja',
        'subscription': 'Subskrypcje',
        'notifications': 'Powiadomienia',
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        Ustawienia aplikacji
                    </h1>
                    <p className="text-muted-foreground">
                        Globalne ustawienia SprintSale
                    </p>
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Zapisuję...' : 'Zapisz wszystko'}
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    <Check className="h-5 w-5" />
                    {message.text}
                </div>
            )}

            {Object.entries(groupedSettings).map(([category, items]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle>{categoryNames[category] || category}</CardTitle>
                        <CardDescription>
                            Ustawienia sekcji {categoryNames[category]?.toLowerCase() || category}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item) => (
                            <div key={item.key} className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        {item.key}
                                        {item.isPublic && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                                publiczny
                                            </span>
                                        )}
                                    </label>
                                </div>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                                <Input
                                    value={item.value}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Add New Setting */}
            <Card>
                <CardHeader>
                    <CardTitle>Dodaj nowe ustawienie</CardTitle>
                    <CardDescription>
                        Dodaj własne ustawienie konfiguracyjne
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddSettingForm onAdd={loadSettings} />
                </CardContent>
            </Card>
        </div>
    )
}

function AddSettingForm({ onAdd }: { onAdd: () => void }) {
    const [key, setKey] = useState('')
    const [value, setValue] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!key || !value) return

        try {
            setSaving(true)
            await adminApi.settings.update({ [key]: value })
            setKey('')
            setValue('')
            onAdd()
        } catch (err) {
            console.error('Failed to add setting:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
                <Input
                    placeholder="Klucz (np. feature.new_option)"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
            </div>
            <div className="flex-1">
                <Input
                    placeholder="Wartość"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
            <Button type="submit" disabled={saving || !key || !value}>
                {saving ? 'Dodawanie...' : 'Dodaj'}
            </Button>
        </form>
    )
}
