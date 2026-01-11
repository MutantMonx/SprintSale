import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
    Car,
    LayoutDashboard,
    Globe,
    Search,
    FileText,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/services', icon: Globe, label: 'Serwisy' },
    { to: '/searches', icon: Search, label: 'Wyszukiwania' },
    { to: '/listings', icon: FileText, label: 'Ogłoszenia' },
    { to: '/notifications', icon: Bell, label: 'Powiadomienia' },
    { to: '/settings', icon: Settings, label: 'Ustawienia' },
]

const adminNavItems = [
    { to: '/admin', icon: Shield, label: 'Panel Admina' },
]

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, refreshToken, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await authApi.logout(refreshToken)
            }
        } finally {
            logout()
            navigate('/login')
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-40 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-accent rounded-lg"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 ml-4">
                    <Car className="w-6 h-6 text-primary" />
                    <span className="font-semibold">SprintSale</span>
                </div>
            </header>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                'fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transition-transform duration-300',
                'lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">SprintSale</h1>
                            <p className="text-xs text-muted-foreground">by monx</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-accent rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                'hover:bg-accent',
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Admin section - only for admins */}
                    {user?.isAdmin && (
                        <>
                            <div className="pt-4 pb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                                    Administracja
                                </p>
                            </div>
                            {adminNavItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                        'hover:bg-accent',
                                        isActive
                                            ? 'bg-blue-500/10 text-blue-500 font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">
                                        {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium truncate">{user?.name || 'Użytkownik'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate('/settings')}>
                                <Settings className="w-4 h-4 mr-2" />
                                Ustawienia
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                <LogOut className="w-4 h-4 mr-2" />
                                Wyloguj
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
