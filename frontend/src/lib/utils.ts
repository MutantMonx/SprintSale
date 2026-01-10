import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Przed chwilą'
    if (minutes < 60) return `${minutes} min temu`
    if (hours < 24) return `${hours} godz. temu`
    if (days < 7) return `${days} dni temu`

    return formatDate(date)
}
