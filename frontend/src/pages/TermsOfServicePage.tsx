import { useState, useEffect } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { legalApi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

export default function TermsOfServicePage() {
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('Regulamin Usługi')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadPage()
    }, [])

    const loadPage = async () => {
        try {
            setLoading(true)
            const { data } = await legalApi.get('terms-of-service')
            setTitle(data.data.title)
            setContent(data.data.content)
        } catch (err) {
            setError('Nie udało się załadować strony')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Powrót do SprintSale
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <FileText className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">{title}</h1>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                    </div>
                ) : (
                    <article className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </article>
                )}

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
