// =====================================================
// Leader Blueprint - Admin Dashboard Page
// =====================================================

import { AdminLayout } from './AdminLayout'
import type { Profile } from '../../lib/supabase'

interface AdminDashboardProps {
    profile: Profile
    stats: {
        totalUsers: number
        premiumUsers: number
        activeFormations: number
        totalLessons: number
        upcomingSessions: number
        totalXpAwarded: number
    }
    recentUsers: Array<{
        id: string
        name: string
        email: string
        access_type: string
        created_at: string
    }>
}

export const AdminDashboard = ({ profile, stats, recentUsers }: AdminDashboardProps) => {
    const statCards = [
        { label: 'Usuarios Totales', value: stats.totalUsers, icon: 'group', color: 'bg-blue-500' },
        { label: 'Usuarios Premium', value: stats.premiumUsers, icon: 'workspace_premium', color: 'bg-amber-500' },
        { label: 'Formaciones Activas', value: stats.activeFormations, icon: 'school', color: 'bg-green-500' },
        { label: 'Lecciones Totales', value: stats.totalLessons, icon: 'play_circle', color: 'bg-purple-500' },
        { label: 'Sesiones Próximas', value: stats.upcomingSessions, icon: 'event', color: 'bg-pink-500' },
        { label: 'XP Total Otorgado', value: stats.totalXpAwarded.toLocaleString(), icon: 'stars', color: 'bg-indigo-500' },
    ]

    return (
        <AdminLayout title="Dashboard" activePage="dashboard" profile={profile}>
            {/* Stats Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map(card => (
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                        <div class={`${card.color} size-14 rounded-xl flex items-center justify-center`}>
                            <span class="material-symbols-outlined text-white text-2xl">{card.icon}</span>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-charcoal">{card.value}</p>
                            <p class="text-sm text-gray-500">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h3 class="text-lg font-semibold text-charcoal mb-4">Acciones Rápidas</h3>
                <div class="flex flex-wrap gap-3">
                    <a
                        href="/dashboard/admin/content?action=new-formation"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                        <span class="material-symbols-outlined text-lg">add</span>
                        Nueva Formación
                    </a>
                    <a
                        href="/dashboard/admin/users?action=grant-access"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <span class="material-symbols-outlined text-lg">verified</span>
                        Conceder Acceso Premium
                    </a>
                    <a
                        href="/dashboard/admin/themes?action=new-theme"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <span class="material-symbols-outlined text-lg">palette</span>
                        Nuevo Tema
                    </a>
                </div>
            </div>

            {/* Recent Users */}
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-charcoal">Usuarios Recientes</h3>
                    <a href="/dashboard/admin/users" class="text-primary text-sm font-medium hover:underline">
                        Ver todos →
                    </a>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceso</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {recentUsers.map(user => (
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="size-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span class="material-symbols-outlined text-primary text-sm">person</span>
                                            </div>
                                            <span class="font-medium text-charcoal">{user.name}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td class="px-6 py-4">
                                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.access_type === 'paid' || user.access_type === 'manual'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.access_type === 'paid' ? 'Premium' : user.access_type === 'manual' ? 'Manual' : 'Free'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                </tr>
                            ))}
                            {recentUsers.length === 0 && (
                                <tr>
                                    <td colspan={4} class="px-6 py-8 text-center text-gray-500">
                                        No hay usuarios registrados aún
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
