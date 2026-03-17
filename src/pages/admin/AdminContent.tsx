// =====================================================
// Leader Blueprint - Admin Content Management Page
// =====================================================

import { AdminLayout } from './AdminLayout'
import type { Profile, Formation, Module, Lesson } from '../../lib/supabase'

interface FormationWithDetails extends Formation {
    modules: (Module & { lessons: Lesson[] })[]
    totalLessons: number
    totalDuration: number
}

interface AdminContentProps {
    profile: Profile
    formations: FormationWithDetails[]
}

export const AdminContent = ({ profile, formations }: AdminContentProps) => {
    return (
        <AdminLayout title="Gestión de Contenido" activePage="content" profile={profile}>
            {/* Header Actions */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <p class="text-gray-500">
                        {formations.length} formaciones • {formations.reduce((acc, f) => acc + f.totalLessons, 0)} lecciones
                    </p>
                </div>
                <a
                    href="/dashboard/admin/content/formation/new"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                    <span class="material-symbols-outlined">add</span>
                    Nueva Formación
                </a>
            </div>

            {/* Formations List */}
            <div class="space-y-6">
                {formations.map((formation, idx) => (
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Formation Header */}
                        <div class="p-6 border-b border-gray-100">
                            <div class="flex items-start gap-4">
                                <div class="size-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {formation.thumbnail_url
                                        ? <img src={formation.thumbnail_url} alt="" class="size-16 object-cover" />
                                        : <span class="material-symbols-outlined text-primary text-2xl">school</span>
                                    }
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-3 mb-1">
                                        <h3 class="text-lg font-semibold text-charcoal">{formation.title}</h3>
                                        <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${formation.is_published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {formation.is_published ? 'Publicada' : 'Borrador'}
                                        </span>
                                        <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${formation.is_premium
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {formation.is_premium ? 'Premium' : 'Gratis'}
                                        </span>
                                    </div>
                                    <p class="text-gray-500 text-sm line-clamp-2">{formation.short_description || formation.description}</p>
                                    <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span class="flex items-center gap-1">
                                            <span class="material-symbols-outlined text-base">folder</span>
                                            {formation.modules?.length || 0} módulos
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <span class="material-symbols-outlined text-base">play_circle</span>
                                            {formation.totalLessons} lecciones
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <span class="material-symbols-outlined text-base">schedule</span>
                                            {Math.round(formation.totalDuration / 60)} min
                                        </span>
                                        <span class={`flex items-center gap-1 capitalize ${formation.level === 'beginner' ? 'text-green-600' :
                                                formation.level === 'intermediate' ? 'text-blue-600' : 'text-purple-600'
                                            }`}>
                                            <span class="material-symbols-outlined text-base">signal_cellular_alt</span>
                                            {formation.level === 'beginner' ? 'Principiante' :
                                                formation.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <a
                                        href={`/dashboard/admin/content/formation/${formation.id}/edit`}
                                        class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        title="Editar formación"
                                    >
                                        <span class="material-symbols-outlined">edit</span>
                                    </a>
                                    <a
                                        href={`/dashboard/admin/content/formation/${formation.id}/modules/new`}
                                        class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                        title="Añadir módulo"
                                    >
                                        <span class="material-symbols-outlined">add</span>
                                    </a>
                                    <button
                                        type="button"
                                        data-action="toggle-publish"
                                        data-formation-id={formation.id}
                                        class={`p-2 rounded-lg transition ${formation.is_published
                                                ? 'text-yellow-600 hover:bg-yellow-50'
                                                : 'text-green-600 hover:bg-green-50'
                                            }`}
                                        title={formation.is_published ? 'Despublicar' : 'Publicar'}
                                    >
                                        <span class="material-symbols-outlined">
                                            {formation.is_published ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modules Accordion */}
                        {formation.modules && formation.modules.length > 0 && (
                            <div class="divide-y divide-gray-100">
                                {formation.modules.map((module, mIdx) => (
                                    <details class="group" open={mIdx === 0}>
                                        <summary class="px-6 py-4 cursor-pointer hover:bg-gray-50 transition flex items-center gap-4">
                                            <span class="material-symbols-outlined text-gray-400 group-open:rotate-90 transition-transform">
                                                chevron_right
                                            </span>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs text-gray-400 font-mono">#{mIdx + 1}</span>
                                                    <span class="font-medium text-charcoal">{module.title}</span>
                                                    <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${module.is_published
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {module.is_published ? 'Publicado' : 'Borrador'}
                                                    </span>
                                                </div>
                                                <p class="text-sm text-gray-500">{module.lessons?.length || 0} lecciones</p>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <a
                                                    href={`/dashboard/admin/content/module/${module.id}/edit`}
                                                    class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                                                >
                                                    <span class="material-symbols-outlined text-lg">edit</span>
                                                </a>
                                                <a
                                                    href={`/dashboard/admin/content/module/${module.id}/lessons/new`}
                                                    class="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                                >
                                                    <span class="material-symbols-outlined text-lg">add</span>
                                                </a>
                                            </div>
                                        </summary>

                                        {/* Lessons List */}
                                        <div class="bg-gray-50 px-6 pb-4">
                                            <div class="pl-8 space-y-2">
                                                {module.lessons && module.lessons.map((lesson, lIdx) => (
                                                    <div class="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
                                                        <span class="text-xs text-gray-400 font-mono w-6">{lIdx + 1}</span>
                                                        <span class={`material-symbols-outlined text-lg ${lesson.content_type === 'video' ? 'text-red-500' :
                                                                lesson.content_type === 'audio' ? 'text-purple-500' :
                                                                    lesson.content_type === 'text' ? 'text-blue-500' :
                                                                        lesson.content_type === 'quiz' ? 'text-green-500' : 'text-orange-500'
                                                            }`}>
                                                            {lesson.content_type === 'video' ? 'play_circle' :
                                                                lesson.content_type === 'audio' ? 'headphones' :
                                                                    lesson.content_type === 'text' ? 'article' :
                                                                        lesson.content_type === 'quiz' ? 'quiz' : 'fitness_center'}
                                                        </span>
                                                        <div class="flex-1 min-w-0">
                                                            <p class="font-medium text-sm text-charcoal truncate">{lesson.title}</p>
                                                            <p class="text-xs text-gray-400">
                                                                {Math.round((lesson.video_duration_seconds || 0) / 60)} min
                                                                {lesson.is_free_preview && ' • Preview'}
                                                            </p>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <span class={`size-2 rounded-full ${lesson.is_published ? 'bg-green-500' : 'bg-yellow-500'
                                                                }`}></span>
                                                            <a
                                                                href={`/dashboard/admin/content/lesson/${lesson.id}/edit`}
                                                                class="p-1 text-gray-500 hover:bg-gray-100 rounded transition"
                                                            >
                                                                <span class="material-symbols-outlined text-base">edit</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!module.lessons || module.lessons.length === 0) && (
                                                    <div class="py-4 text-center text-gray-400 text-sm">
                                                        No hay lecciones en este módulo
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}

                        {(!formation.modules || formation.modules.length === 0) && (
                            <div class="px-6 py-8 text-center text-gray-400">
                                <span class="material-symbols-outlined text-3xl mb-2">folder_open</span>
                                <p>No hay módulos en esta formación</p>
                                <a
                                    href={`/dashboard/admin/content/formation/${formation.id}/modules/new`}
                                    class="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline"
                                >
                                    <span class="material-symbols-outlined text-base">add</span>
                                    Añadir primer módulo
                                </a>
                            </div>
                        )}
                    </div>
                ))}

                {formations.length === 0 && (
                    <div class="bg-white rounded-xl shadow-sm p-12 text-center">
                        <span class="material-symbols-outlined text-5xl text-gray-300 mb-4">school</span>
                        <h3 class="text-lg font-semibold text-charcoal mb-2">No hay formaciones</h3>
                        <p class="text-gray-500 mb-4">Crea tu primera formación para empezar</p>
                        <a
                            href="/dashboard/admin/content/formation/new"
                            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                        >
                            <span class="material-symbols-outlined">add</span>
                            Nueva Formación
                        </a>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
