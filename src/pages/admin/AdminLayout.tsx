// =====================================================
// Leader Blueprint - Admin Layout Component
// =====================================================

import type { Profile } from '../../lib/supabase'

interface AdminLayoutProps {
    title: string
    activePage: 'dashboard' | 'content' | 'users' | 'themes' | 'analytics'
    profile: Profile
    children: any
}

export const AdminLayout = ({ title, activePage, profile, children }: AdminLayoutProps) => {
    const navItems = [
        { id: 'dashboard' as const, label: 'Dashboard', icon: 'dashboard', href: '/dashboard/admin' },
        { id: 'content' as const, label: 'Contenido', icon: 'school', href: '/dashboard/admin/content' },
        { id: 'users' as const, label: 'Usuarios', icon: 'group', href: '/dashboard/admin/users' },
        { id: 'themes' as const, label: 'Tienda Temas', icon: 'palette', href: '/dashboard/admin/themes' },
        { id: 'analytics' as const, label: 'Analíticas', icon: 'analytics', href: '/dashboard/admin/analytics' },
    ]

    return (
        <div class="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside class="w-64 bg-charcoal text-white fixed left-0 top-0 h-full z-40">
                <div class="p-6 border-b border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="size-10 bg-primary rounded-lg flex items-center justify-center">
                            <span class="material-symbols-outlined text-white">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 class="font-bold text-lg">Admin Panel</h1>
                            <p class="text-xs text-gray-400">Leader Blueprint</p>
                        </div>
                    </div>
                </div>

                <nav class="p-4 space-y-2">
                    {navItems.map(item => (
                        <a
                            href={item.href}
                            class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activePage === item.id
                                    ? 'bg-primary text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span class="material-symbols-outlined text-xl">{item.icon}</span>
                            <span class="font-medium">{item.label}</span>
                        </a>
                    ))}
                </nav>

                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                            {profile.avatar_url
                                ? <img src={profile.avatar_url} alt="" class="size-10 rounded-full object-cover" />
                                : <span class="material-symbols-outlined text-primary">person</span>
                            }
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">{profile.name}</p>
                            <p class="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <a href="/" class="flex-1 text-center text-xs py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                            Ver sitio
                        </a>
                        <a href="/api/auth/logout" class="flex-1 text-center text-xs py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition">
                            Salir
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main class="flex-1 ml-64">
                {/* Header */}
                <header class="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <h2 class="text-xl font-bold text-charcoal">{title}</h2>
                    <div class="flex items-center gap-4">
                        <button class="p-2 hover:bg-gray-100 rounded-lg transition">
                            <span class="material-symbols-outlined text-gray-600">notifications</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div class="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
