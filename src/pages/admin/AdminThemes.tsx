// =====================================================
// Leader Blueprint - Admin Themes Store Management
// =====================================================

import { AdminLayout } from './AdminLayout'
import type { Profile } from '../../lib/supabase'
import type { Tables } from '../../lib/database.types'

interface ThemeWithStats extends Tables<'themes'> {
    unlocked_count: number
}

interface AdminThemesProps {
    profile: Profile
    themes: ThemeWithStats[]
}

export const AdminThemes = ({ profile, themes }: AdminThemesProps) => {
    return (
        <AdminLayout title="Tienda de Temas" activePage="themes" profile={profile}>
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <p class="text-gray-500">
                    {themes.length} temas disponibles
                </p>
                <a
                    href="/dashboard/admin/themes/new"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                    <span class="material-symbols-outlined">add</span>
                    Nuevo Tema
                </a>
            </div>

            {/* Themes Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(theme => {
                    const colors = theme.colors as { primary: string; secondary: string; accent: string; background: string }

                    return (
                        <div class="bg-white rounded-xl shadow-sm overflow-hidden group">
                            {/* Theme Preview */}
                            <div
                                class="h-32 relative"
                                style={`background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);`}
                            >
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div
                                        class="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={`background: ${colors.background}; color: ${colors.primary};`}
                                    >
                                        {theme.name}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div class="absolute top-3 right-3 flex gap-2">
                                    {theme.is_default && (
                                        <span class="px-2 py-0.5 bg-white/90 text-xs font-medium rounded-full text-charcoal">
                                            Por defecto
                                        </span>
                                    )}
                                    <span class={`px-2 py-0.5 text-xs font-medium rounded-full ${theme.is_active
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-500 text-white'
                                        }`}>
                                        {theme.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                {/* Color Swatches */}
                                <div class="absolute bottom-3 left-3 flex gap-1">
                                    <div
                                        class="size-5 rounded-full border-2 border-white shadow"
                                        style={`background: ${colors.primary};`}
                                        title="Primary"
                                    ></div>
                                    <div
                                        class="size-5 rounded-full border-2 border-white shadow"
                                        style={`background: ${colors.secondary};`}
                                        title="Secondary"
                                    ></div>
                                    <div
                                        class="size-5 rounded-full border-2 border-white shadow"
                                        style={`background: ${colors.accent};`}
                                        title="Accent"
                                    ></div>
                                    <div
                                        class="size-5 rounded-full border-2 border-white shadow"
                                        style={`background: ${colors.background};`}
                                        title="Background"
                                    ></div>
                                </div>
                            </div>

                            {/* Theme Info */}
                            <div class="p-4">
                                <div class="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 class="font-semibold text-charcoal">{theme.name}</h3>
                                        <p class="text-sm text-gray-500 line-clamp-2">{theme.description}</p>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-1 text-amber-600">
                                            <span class="material-symbols-outlined text-lg">stars</span>
                                            <span class="font-semibold">{theme.xp_cost.toLocaleString()}</span>
                                            <span class="text-xs text-gray-500">XP</span>
                                        </div>
                                        <div class="flex items-center gap-1 text-gray-500">
                                            <span class="material-symbols-outlined text-lg">group</span>
                                            <span class="text-sm">{theme.unlocked_count}</span>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2">
                                        <a
                                            href={`/dashboard/admin/themes/${theme.id}/edit`}
                                            class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            title="Editar"
                                        >
                                            <span class="material-symbols-outlined text-lg">edit</span>
                                        </a>
                                        <button
                                            type="button"
                                            data-action="toggle-active"
                                            data-theme-id={theme.id}
                                            class={`p-2 rounded-lg transition ${theme.is_active
                                                ? 'text-red-600 hover:bg-red-50'
                                                : 'text-green-600 hover:bg-green-50'
                                                }`}
                                            title={theme.is_active ? 'Desactivar' : 'Activar'}
                                        >
                                            <span class="material-symbols-outlined text-lg">
                                                {theme.is_active ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Add New Theme Card */}
                <a
                    href="/dashboard/admin/themes/new"
                    class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 min-h-[240px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-primary hover:text-primary transition group"
                >
                    <span class="material-symbols-outlined text-4xl group-hover:scale-110 transition">add_circle</span>
                    <span class="font-medium">Nuevo Tema</span>
                </a>
            </div>

            {/* Create Theme Modal */}
            <div id="theme-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-100">
                        <h3 class="text-lg font-semibold text-charcoal">Nuevo Tema</h3>
                    </div>
                    <form method="post" action="/api/admin/themes" class="p-6 space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    name="slug"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                    pattern="[a-z0-9-]+"
                                />
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                ></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Color Primario</label>
                                <input
                                    type="color"
                                    name="color_primary"
                                    class="w-full h-10 rounded-lg cursor-pointer"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Color Secundario</label>
                                <input
                                    type="color"
                                    name="color_secondary"
                                    class="w-full h-10 rounded-lg cursor-pointer"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Color Accent</label>
                                <input
                                    type="color"
                                    name="color_accent"
                                    class="w-full h-10 rounded-lg cursor-pointer"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Color Fondo</label>
                                <input
                                    type="color"
                                    name="color_background"
                                    value="#FDFCFB"
                                    class="w-full h-10 rounded-lg cursor-pointer"
                                    required
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Costo XP</label>
                                <input
                                    type="number"
                                    name="xp_cost"
                                    min="0"
                                    step="50"
                                    value="500"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div class="flex items-end">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="is_active" checked class="rounded" />
                                    <span class="text-sm text-gray-700">Activo</span>
                                </label>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                id="close-theme-modal"
                                class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                            >
                                Crear Tema
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    )
}
