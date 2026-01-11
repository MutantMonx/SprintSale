import { useState, useEffect } from 'react'
import { FileText, Save, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

interface LegalPage {
    id: string
    slug: string
    title: string
    content: string
    isPublished: boolean
    createdAt: string
    updatedAt: string
}

export default function AdminLegalPage() {
    const [pages, setPages] = useState<LegalPage[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPage, setEditingPage] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<{ title: string; content: string; isPublished: boolean }>({
        title: '',
        content: '',
        isPublished: true,
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        loadPages()
    }, [])

    const loadPages = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.legal.list()
            setPages(data.data)
        } catch (err) {
            console.error('Failed to load pages:', err)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (page: LegalPage) => {
        setEditingPage(page.slug)
        setEditForm({
            title: page.title,
            content: page.content,
            isPublished: page.isPublished,
        })
    }

    const savePage = async () => {
        if (!editingPage) return

        try {
            setSaving(true)
            await adminApi.legal.update(editingPage, editForm)
            await loadPages()
            setEditingPage(null)
            setMessage({ type: 'success', text: 'Strona zapisana!' })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            console.error('Failed to save page:', err)
            setMessage({ type: 'error', text: 'Nie udało się zapisać strony' })
        } finally {
            setSaving(false)
        }
    }

    const togglePublished = async (page: LegalPage) => {
        try {
            await adminApi.legal.update(page.slug, { isPublished: !page.isPublished })
            await loadPages()
        } catch (err) {
            console.error('Failed to toggle page:', err)
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
                    <FileText className="h-8 w-8" />
                    Strony prawne
                </h1>
                <p className="text-muted-foreground">
                    Edytuj politykę prywatności, regulamin i inne strony prawne
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-6">
                {pages.map((page) => {
                    const isEditing = editingPage === page.slug

                    return (
                        <Card key={page.slug}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {page.title}
                                            {page.isPublished ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    Opublikowana
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <EyeOff className="h-3 w-3" />
                                                    Ukryta
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            /{page.slug} • Ostatnia aktualizacja: {new Date(page.updatedAt).toLocaleDateString('pl-PL')}
                                        </CardDescription>
                                    </div>
                                    {!isEditing && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => togglePublished(page)}
                                            >
                                                {page.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="outline" onClick={() => startEditing(page)}>
                                                Edytuj
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Tytuł</label>
                                            <Input
                                                value={editForm.title}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">Treść (Markdown)</label>
                                            <textarea
                                                value={editForm.content}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                                className="w-full h-96 p-3 border rounded-md font-mono text-sm bg-background"
                                                placeholder="# Treść w formacie Markdown..."
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Używaj składni Markdown: # nagłówek, ## podtytuł, - lista, **pogrubienie**
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`published-${page.slug}`}
                                                checked={editForm.isPublished}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={`published-${page.slug}`} className="text-sm">
                                                Opublikowana (widoczna dla użytkowników)
                                            </label>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button onClick={savePage} disabled={saving}>
                                                <Save className="h-4 w-4 mr-2" />
                                                {saving ? 'Zapisuję...' : 'Zapisz'}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setEditingPage(null)}>
                                                Anuluj
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(`/${page.slug}`, '_blank')}
                                            >
                                                Podgląd
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-hidden relative">
                                            <pre className="text-sm whitespace-pre-wrap font-mono">
                                                {page.content.slice(0, 500)}
                                                {page.content.length > 500 && '...'}
                                            </pre>
                                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/50 to-transparent"></div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}

                {pages.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Brak stron prawnych. Uruchom seed bazy danych aby dodać domyślne strony.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
