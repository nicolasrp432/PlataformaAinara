import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'
import type { Tables } from '../lib/database.types'

interface ProfileProps {
  profile: Tables<'profiles'>
  access: Tables<'user_access'> | null
  streak: Tables<'user_streaks'>
  stats: {
    lessonsCompleted: number
    totalReflections: number
    upcomingSessions: number
  }
  activity: Array<{
    id: string
    type: 'xp' | 'lesson' | 'reflection'
    description: string
    date: string
    xp?: number
  }>
  email: string
}

export const Profile: FC<ProfileProps> = ({
  profile,
  access,
  streak,
  stats,
  activity = [],
  email
}) => {
  const level = streak?.level || 1
  const xp = streak?.total_xp || 0
  const nextLevelXp = level * 3000
  const levelProgress = ((xp % 3000) / 3000) * 100
  const remainingXp = 3000 - (xp % 3000)

  return (
    <div class="flex flex-col min-h-screen">
      <Header
        activePage="dashboard"
        userName={profile.name}
        userAvatar={profile.avatar_url || undefined}
      />

      <main class="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-12">
        <div class="grid grid-cols-12 gap-8">
          {/* Profile Header */}
          <div class="col-span-12">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Cover */}
              <div class="h-32 hero-gradient relative">
                <div class="absolute bottom-0 right-4 top-4">
                  <button class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors backdrop-blur-sm">
                    <span class="material-symbols-outlined text-sm mr-1 align-middle">edit</span>
                    Editar Portada
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div class="px-8 pb-8">
                <div class="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
                  {/* Avatar */}
                  <div class="relative">
                    <div
                      id="user-avatar"
                      class="size-32 rounded-2xl bg-cover bg-center border-4 border-white shadow-lg"
                      style={`background-image: url("${profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}");`}
                    ></div>
                    <button
                      id="change-avatar-btn"
                      class="absolute bottom-2 right-2 size-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors shadow-md"
                      onclick="document.getElementById('edit-profile-form').classList.remove('hidden'); document.getElementById('edit-avatar').focus();"
                    >
                      <span class="material-symbols-outlined text-lg">photo_camera</span>
                    </button>
                  </div>

                  {/* Name & Email */}
                  <div class="flex-1 pt-4">
                    <div class="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      <div>
                        <h1 id="user-name" class="text-2xl font-bold text-charcoal">{profile.name}</h1>
                        <p id="user-email" class="text-charcoal-muted">{email}</p>
                      </div>
                      <div class="flex gap-3">
                        <button
                          id="edit-profile-btn"
                          class="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                          onclick="document.getElementById('edit-profile-form').classList.toggle('hidden')"
                        >
                          Editar Perfil
                        </button>
                        <form method="post" action="/api/auth/logout" class="inline">
                          <button
                            type="submit"
                            class="px-5 py-2 border border-gray-200 text-charcoal-muted text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                          >
                            Cerrar Sesión
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Status */}
                <div id="access-status" class="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-4">
                  <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">verified</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-charcoal">
                      {access?.access_type === 'free' ? 'Acceso Gratuito' : 'Acceso Premium Activo'}
                    </p>
                    <p class="text-xs text-charcoal-muted">
                      {access?.access_type === 'free'
                        ? 'Actualiza para acceder a todo el contenido'
                        : 'Tienes acceso completo a todo el contenido'}
                    </p>
                  </div>
                  {access?.access_type === 'free' && (
                    <a href="/pricing" class="ml-auto px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
                      Actualizar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div class="col-span-12 lg:col-span-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-streak" class="text-3xl font-bold text-charcoal">{streak.current_streak}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Días de Racha</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-xp" class="text-3xl font-bold text-primary">{xp.toLocaleString()}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">XP Total</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-lessons" class="text-3xl font-bold text-charcoal">{stats.lessonsCompleted}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Lecciones</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-reflections" class="text-3xl font-bold text-charcoal">{stats.totalReflections}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Reflexiones</p>
              </div>
            </div>

            {/* Edit Profile Form (hidden by default) */}
            <div id="edit-profile-form" class="hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
              <h2 class="text-xl font-bold text-charcoal mb-6">Editar Perfil</h2>
              <form id="profile-form" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">Nombre</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={profile.name}
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-charcoal"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">URL del Avatar</label>
                  <input
                    type="url"
                    id="edit-avatar"
                    value={profile.avatar_url || ''}
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-charcoal"
                    placeholder="https://ejemplo.com/tu-imagen.jpg"
                  />
                  <p class="text-xs text-charcoal-muted mt-1">Ingresa la URL de tu imagen de perfil</p>
                </div>
                <div class="flex gap-4">
                  <button
                    type="submit"
                    class="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onclick="document.getElementById('edit-profile-form').classList.add('hidden')"
                    class="px-6 py-3 border border-gray-200 text-charcoal-muted font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Section */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
              <h2 class="text-xl font-bold text-charcoal mb-6">Cambiar Contraseña</h2>
              <form id="password-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="new-password"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                    required
                  />
                  <p class="text-xs text-charcoal-muted mt-1">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    id="confirm-password"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  class="px-6 py-3 bg-charcoal text-white font-semibold rounded-lg hover:bg-black transition-colors"
                >
                  Actualizar Contraseña
                </button>
              </form>
            </div>

            {/* Recent Activity */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 class="text-xl font-bold text-charcoal mb-6">Actividad Reciente</h2>
              <div id="activity-list" class="space-y-4">
                {activity.length > 0 ? (
                  activity.map(item => (
                    <div class="flex items-center gap-4 p-4 bg-soft-bg rounded-xl">
                      <div class={`size-10 rounded-lg flex items-center justify-center ${item.type === 'lesson' ? 'bg-emerald-100 text-emerald-600' :
                        item.type === 'reflection' ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'
                        }`}>
                        <span class="material-symbols-outlined text-xl">
                          {item.type === 'lesson' ? 'check_circle' : item.type === 'reflection' ? 'edit_note' : 'local_fire_department'}
                        </span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-charcoal">{item.description}</p>
                        <p class="text-xs text-charcoal-muted">
                          {item.xp ? `+${item.xp} XP • ` : ''}
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p class="text-sm text-charcoal-muted italic text-center py-4">No hay actividad reciente.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div class="col-span-12 lg:col-span-4 space-y-6">
            {/* Current Level */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-charcoal">Tu Nivel</h3>
                <span id="user-level" class="text-2xl font-bold text-primary">{level}</span>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-xs text-charcoal-muted">
                  <span>{xp.toLocaleString()} XP</span>
                  <span>{nextLevelXp.toLocaleString()} XP</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full" style={`width: ${levelProgress}%;`}></div>
                </div>
                <p class="text-xs text-charcoal-muted text-center">{remainingXp.toLocaleString()} XP para Nivel {level + 1}</p>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 class="font-bold text-charcoal mb-4">Próximas Sesiones</h3>
              <div id="upcoming-sessions" class="space-y-3">
                {stats.upcomingSessions > 0 ? (
                  <div class="p-4 bg-soft-bg rounded-xl">
                    <div class="flex items-center gap-3 mb-2">
                      <div
                        class="size-10 rounded-full bg-cover bg-center"
                        style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9i3nexY3inrasR-S2laQ4cg7Ty2B7RsZwwNTA3k26CMTFEPvSpRrdejYY-12gM0SSnW-iYtah1e0g1dZtK7lxOVUu-BvORRIqQPIVjOnsYXxIDfiYmuwhg3U9L5Jt_nuYO6CMo34fsT1_vxJB8UUa2p_6qpBoGSWNKp45CK2kAnivBWzrM-brraBckdfQ5EQcKZwXIr64obombBVBTmvxslHLK93TmkXXrcux-_fGJ0yjObt8NRAzZfo_J3GJuYkkvRJpmApN26Lb");'
                      ></div>
                      <div>
                        <p class="text-sm font-semibold text-charcoal">Ainara Sterling</p>
                        <p class="text-xs text-charcoal-muted">Mentoría 1:1</p>
                      </div>
                    </div>
                    <p class="text-xs text-primary font-semibold">Programada</p>
                  </div>
                ) : (
                  <div class="p-4 bg-soft-bg rounded-xl text-center">
                    <p class="text-xs text-charcoal-muted mb-2">No tienes sesiones programadas</p>
                    <a href="/mentorship" class="text-xs text-primary font-bold hover:underline">Agendar ahora</a>
                  </div>
                )}
                <a href="/mentorship" class="block text-center text-sm text-primary font-medium hover:underline">
                  Ver todas las sesiones
                </a>
              </div>
            </div>

            {/* Danger Zone */}
            <div class="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
              <h3 class="font-bold text-red-600 mb-4">Zona de Peligro</h3>
              <p class="text-sm text-charcoal-muted mb-4">
                Estas acciones son permanentes y no se pueden deshacer.
              </p>
              <button class="w-full px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* JavaScript for interactive parts */}
      <script dangerouslySetInnerHTML={{
        __html: `
        (function() {
          // Profile update handler
          document.getElementById('profile-form')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('edit-name').value;
            const avatar_url = document.getElementById('edit-avatar').value;
            
            try {
              const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar_url })
              });
              const data = await response.json();
              if (data.success) {
                alert('Perfil actualizado. Recargando...');
                window.location.reload();
              } else {
                alert(data.error);
              }
            } catch (err) { alert('Error de red'); }
          });

          // Password update handler
          document.getElementById('password-form')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
              alert('Las contraseñas no coinciden');
              return;
            }
            
            try {
              const response = await fetch('/api/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
              });
              const data = await response.json();
              if (data.success) {
                alert('Contraseña actualizada correctamente');
                this.reset();
              } else {
                alert(data.error);
              }
            } catch (err) { alert('Error de red'); }
          });
        })();
      ` }} />

      {/* Mobile Bottom Navigation */}
      <footer class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 grid grid-cols-4 items-center justify-items-center z-50">
        <a href="/" class="text-charcoal-muted">
          <span class="material-symbols-outlined">dashboard</span>
        </a>
        <a href="/library" class="text-charcoal-muted">
          <span class="material-symbols-outlined">library_books</span>
        </a>
        <a href="/taberna" class="text-charcoal-muted">
          <span class="material-symbols-outlined">forum</span>
        </a>
        <a href="/profile" class="text-primary">
          <span class="material-symbols-outlined">person</span>
        </a>
      </footer>
    </div>
  )
}
