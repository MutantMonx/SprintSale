import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    CreditCard,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/lib/api'

interface Payment {
    id: string
    amount: number
    currency: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
    provider: string
    providerPaymentId: string | null
    createdAt: string
    subscription: {
        user: { id: string; email: string; name: string | null }
        plan: { name: string; displayName: string }
    }
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        loadPayments()
    }, [pagination.page, statusFilter])

    const loadPayments = async () => {
        try {
            setLoading(true)
            const { data } = await adminApi.payments.list({
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter || undefined
            })
            setPayments(data.data)
            setPagination(data.pagination)
        } catch (err) {
            console.error('Failed to load payments:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'FAILED':
            case 'CANCELLED':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'PENDING':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'REFUNDED':
                return <RefreshCw className="h-4 w-4 text-blue-500" />
            default:
                return null
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Oczekująca',
            COMPLETED: 'Zakończona',
            FAILED: 'Nieudana',
            REFUNDED: 'Zwrócona',
            CANCELLED: 'Anulowana'
        }
        return labels[status] || status
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'FAILED':
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'REFUNDED':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <CreditCard className="h-8 w-8" />
                            Historia płatności
                        </h1>
                        <p className="text-muted-foreground">
                            {pagination.total} płatności w systemie
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        <span className="text-sm font-medium">Filtruj status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setPagination(prev => ({ ...prev, page: 1 }))
                            }}
                            className="px-3 py-2 border rounded-md bg-background"
                        >
                            <option value="">Wszystkie</option>
                            <option value="PENDING">Oczekujące</option>
                            <option value="COMPLETED">Zakończone</option>
                            <option value="FAILED">Nieudane</option>
                            <option value="REFUNDED">Zwrócone</option>
                            <option value="CANCELLED">Anulowane</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-4 font-medium">ID płatności</th>
                                    <th className="text-left p-4 font-medium">Użytkownik</th>
                                    <th className="text-left p-4 font-medium">Plan</th>
                                    <th className="text-left p-4 font-medium">Kwota</th>
                                    <th className="text-left p-4 font-medium">Status</th>
                                    <th className="text-left p-4 font-medium">Provider</th>
                                    <th className="text-left p-4 font-medium">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center p-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                            Brak płatności
                                            {statusFilter && ' z wybranym statusem'}
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-muted/30">
                                            <td className="p-4">
                                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                    {payment.id.slice(0, 8)}...
                                                </code>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{payment.subscription.user.email}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {payment.subscription.user.name || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {payment.subscription.plan.displayName}
                                            </td>
                                            <td className="p-4 font-medium">
                                                {payment.amount.toFixed(2)} {payment.currency}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(payment.status)}`}>
                                                    {getStatusIcon(payment.status)}
                                                    {getStatusLabel(payment.status)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {payment.provider}
                                                {payment.providerPaymentId && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {payment.providerPaymentId.slice(0, 12)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleDateString('pl-PL')}
                                                <div className="text-xs">
                                                    {new Date(payment.createdAt).toLocaleTimeString('pl-PL')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Strona {pagination.page} z {pagination.pages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info */}
            {payments.length === 0 && !loading && !statusFilter && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Info:</strong> Płatności pojawią się tutaj po skonfigurowaniu
                            dostawców płatności (PayU, PayPal itp.) i włączeniu systemu subskrypcji.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
