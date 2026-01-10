import { Outlet } from 'react-router-dom'
import { Car } from 'lucide-react'

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex">
            {/* Left side - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Car className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">SprintSale</h1>
                            <p className="text-white/70 text-sm">Created by monx</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold mb-4 leading-tight">
                        Znajdź swoje<br />
                        <span className="text-white/90">wymarzone auto</span>
                    </h2>

                    <p className="text-white/80 text-lg max-w-md">
                        Agregator ogłoszeń samochodowych z powiadomieniami w czasie rzeczywistym.
                        Nigdy więcej nie przegapisz okazji.
                    </p>

                    <div className="mt-12 grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl font-bold">5+</div>
                            <div className="text-sm text-white/70">Serwisów</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl font-bold">&lt;10s</div>
                            <div className="text-sm text-white/70">Do powiadomienia</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl font-bold">24/7</div>
                            <div className="text-sm text-white/70">Monitoring</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Car className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">SprintSale</h1>
                            <p className="text-muted-foreground text-xs">Created by monx</p>
                        </div>
                    </div>

                    <Outlet />
                </div>
            </div>
        </div>
    )
}
