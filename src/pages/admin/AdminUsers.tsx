// =====================================================
// Leader Blueprint - Admin Users Management Page
// =====================================================

import { AdminLayout } from './AdminLayout'
import type { Profile } from '../../lib/supabase'

interface UserWithAccess {
    id: string
    name: string
    email: string
    avatar_url: string | null
    role: string
    status: string
    created_at: string
    access_type: string
    expires_at: string | null
    total_xp: number
    current_streak: number
}

interface AdminUsersProps {
    profile: Profile
    users: UserWithAccess[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    filters: {
        search: string
        role: string
        access: string
    }
}

export const AdminUsers = ({ profile, users, pagination, filters }: AdminUsersProps) => {
    return (
        <AdminLayout title="Gestión de Usuarios" activePage="users" profile={profile}>
            {/* Filters */}
            <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
                <form method="get" class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                placeholder="Nombre o email..."
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div class="w-40">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select
                            name="role"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="user" selected={filters.role === 'user'}>Usuario</option>
                            <option value="mentor" selected={filters.role === 'mentor'}>Mentor</option>
                            <option value="admin" selected={filters.role === 'admin'}>Admin</option>
                        </select>
                    </div>
                    <div class="w-40">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Acceso</label>
                        <select
                            name="access"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos</option>
                            <option value="free" selected={filters.access === 'free'}>Free</option>
                            <option value="paid" selected={filters.access === 'paid'}>Pagado</option>
                            <option value="manual" selected={filters.access === 'manual'}>Manual</option>
                            <option value="trial" selected={filters.access === 'trial'}>Trial</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button
                            type="submit"
                            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                        >
                            Filtrar
                        </button>
                    </div>
                </form>
            </div>

            {/* Users Table */}
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceso</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">XP / Racha</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="size-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                                {user.avatar_url
                                                    ? <img src={user.avatar_url} alt="" class="size-10 object-cover" />
                                                    : <span class="material-symbols-outlined text-primary">person</span>
                                                }
                                            </div>
                                            <div>
                                                <p class="font-medium text-charcoal">{user.name}</p>
                                                <p class="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-red-100 text-red-800'
                                                : user.role === 'mentor'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role === 'admin' ? 'Admin' : user.role === 'mentor' ? 'Mentor' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div>
                                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.access_type !== 'free'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.access_type === 'paid' ? 'Premium' :
                                                    user.access_type === 'manual' ? 'Manual' :
                                                        user.access_type === 'trial' ? 'Trial' : 'Free'}
                                            </span>
                                            {user.expires_at && (
                                                <p class="text-xs text-gray-500 mt-1">
                                                    Expira: {new Date(user.expires_at).toLocaleDateString('es-ES')}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-4">
                                            <div class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-amber-500 text-sm">stars</span>
                                                <span class="text-sm font-medium">{user.total_xp.toLocaleString()}</span>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-orange-500 text-sm">local_fire_department</span>
                                                <span class="text-sm font-medium">{user.current_streak}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : user.status === 'suspended'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.status === 'active' ? 'Activo' :
                                                user.status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <button
                                                type="button"
                                                data-action="grant-access"
                                                data-user-id={user.id}
                                                class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                title="Conceder acceso premium"
                                            >
                                                <span class="material-symbols-outlined text-lg">verified</span>
                                            </button>
                                            <button
                                                type="button"
                                                data-action="change-role"
                                                data-user-id={user.id}
                                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Cambiar rol"
                                            >
                                                <span class="material-symbols-outlined text-lg">manage_accounts</span>
                                            </button>
                                            <a
                                                href={`/dashboard/admin/users/${user.id}`}
                                                class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                title="Ver detalles"
                                            >
                                                <span class="material-symbols-outlined text-lg">visibility</span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colspan={6} class="px-6 py-12 text-center text-gray-500">
                                        <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">group_off</span>
                                        <p>No se encontraron usuarios</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p class="text-sm text-gray-500">
                            Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </p>
                        <div class="flex gap-2">
                            {pagination.page > 1 && (
                                <a
                                    href={`?page=${pagination.page - 1}&search=${filters.search}&role=${filters.role}&access=${filters.access}`}
                                    class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                                >
                                    Anterior
                                </a>
                            )}
                            {pagination.page < pagination.totalPages && (
                                <a
                                    href={`?page=${pagination.page + 1}&search=${filters.search}&role=${filters.role}&access=${filters.access}`}
                                    class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                                >
                                    Siguiente
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Grant Access Modal (JavaScript will handle show/hide) */}
            <div id="grant-access-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                    <h3 class="text-lg font-semibold text-charcoal mb-4">Conceder Acceso Premium</h3>
                    <form method="post" action="/api/admin/users/access">
                        <input type="hidden" name="user_id" id="grant-access-user-id" />
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Acceso</label>
                                <select name="access_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="manual">Manual (Admin)</option>
                                    <option value="trial">Trial (Prueba)</option>
                                    <option value="paid">Pagado</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Expiración (opcional)</label>
                                <input
                                    type="date"
                                    name="expires_at"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Razón</label>
                                <textarea
                                    name="access_reason"
                                    rows={2}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Motivo del acceso..."
                                ></textarea>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-6">
                            <button type="button" id="close-modal" class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                                Conceder
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Change Role Modal */}
            <div id="change-role-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
                    <h3 class="text-lg font-semibold text-charcoal mb-4">Cambiar Rol de Usuario</h3>
                    <form id="change-role-form">
                        <input type="hidden" name="user_id" id="change-role-user-id" />
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nuevo Rol</label>
                                <select name="role" id="new-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="user">Usuario</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-6">
                            <button type="button" id="close-role-modal" class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
        // Grant Access Modal
        document.querySelectorAll('[data-action="grant-access"]').forEach(btn => {
          btn.addEventListener('click', function() {
            const modal = document.getElementById('grant-access-modal');
            document.getElementById('grant-access-user-id').value = this.dataset.userId;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
          });
        });
        
        document.getElementById('close-modal')?.addEventListener('click', function() {
          const modal = document.getElementById('grant-access-modal');
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        });

        // Change Role Modal
        document.querySelectorAll('[data-action="change-role"]').forEach(btn => {
          btn.addEventListener('click', function() {
            const modal = document.getElementById('change-role-modal');
            document.getElementById('change-role-user-id').value = this.dataset.userId;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
          });
        });

        document.getElementById('close-role-modal')?.addEventListener('click', function() {
          const modal = document.getElementById('change-role-modal');
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        });

        document.getElementById('change-role-form')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userId = document.getElementById('change-role-user-id').value;
            const role = document.getElementById('new-role').value;
            
            try {
                const res = await fetch(\`/api/admin/users/\${userId}/role\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role })
                });
                
                if (res.ok) {
                    window.location.reload();
                } else {
                    alert('Error al actualizar rol');
                }
            } catch (err) {
                alert('Error de conexión');
            }
        });
      `}} />
        </AdminLayout>
    )
}
