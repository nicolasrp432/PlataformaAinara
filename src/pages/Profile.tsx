import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

export const Profile: FC = () => {
  return (
    <div class="flex flex-col min-h-screen">
      <Header activePage="profile" />
      
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
                      style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCNdBJQPBPuZzg_l9QbMtcvwyTyOHMpxnFgtK5Y9dd2-KLLVd8ooHk-XqzeTxf_hPZGsbBinasntYS2Yw51dmN75ddg4l12SX5CD1R_EvzMDpYoTaV9Pznl5TYtRz2SmN_Wz5ZoV88yTbCqdNDCAduxz_TLX61dH-kuabcSVvsLE5Apwo27DoWPC41ChSoTf06Pw3kZt57RJPzM0r6FTlE2ldGYinPbpM-HG4pMEsH9zcaekXxSJHurYqHv28CbOcELvpTRcTpVOdwl");'
                    ></div>
                    <button 
                      id="change-avatar-btn"
                      class="absolute bottom-2 right-2 size-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors shadow-md"
                    >
                      <span class="material-symbols-outlined text-lg">photo_camera</span>
                    </button>
                  </div>
                  
                  {/* Name & Email */}
                  <div class="flex-1 pt-4">
                    <div class="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      <div>
                        <h1 id="user-name" class="text-2xl font-bold text-charcoal">Alex Rivera</h1>
                        <p id="user-email" class="text-charcoal-muted">alex.rivera@email.com</p>
                      </div>
                      <div class="flex gap-3">
                        <button 
                          id="edit-profile-btn"
                          class="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Editar Perfil
                        </button>
                        <button 
                          id="logout-btn"
                          class="px-5 py-2 border border-gray-200 text-charcoal-muted text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          Cerrar Sesión
                        </button>
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
                    <p class="text-sm font-semibold text-charcoal">Acceso Premium Activo</p>
                    <p class="text-xs text-charcoal-muted">Tienes acceso completo a todo el contenido</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div class="col-span-12 lg:col-span-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-streak" class="text-3xl font-bold text-charcoal">14</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Días de Racha</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-xp" class="text-3xl font-bold text-primary">12,450</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">XP Total</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-lessons" class="text-3xl font-bold text-charcoal">24</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Lecciones</p>
              </div>
              <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p id="stat-reflections" class="text-3xl font-bold text-charcoal">47</p>
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
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-charcoal"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">URL del Avatar</label>
                  <input 
                    type="url" 
                    id="edit-avatar"
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
                    id="cancel-edit-btn"
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
                  <label class="block text-sm font-medium text-charcoal mb-2">Contraseña Actual</label>
                  <input 
                    type="password" 
                    id="current-password"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    id="new-password"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
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
                <div class="flex items-center gap-4 p-4 bg-soft-bg rounded-xl">
                  <div class="size-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-emerald-600">check_circle</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-charcoal">Completaste "El Ritual Matutino"</p>
                    <p class="text-xs text-charcoal-muted">+50 XP • Hace 2 horas</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 p-4 bg-soft-bg rounded-xl">
                  <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">edit_note</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-charcoal">Compartiste una reflexión</p>
                    <p class="text-xs text-charcoal-muted">+10 XP • Ayer</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 p-4 bg-soft-bg rounded-xl">
                  <div class="size-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-orange-600">local_fire_department</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-charcoal">14 días de racha</p>
                    <p class="text-xs text-charcoal-muted">+25 XP bonus • Ayer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div class="col-span-12 lg:col-span-4 space-y-6">
            {/* Current Level */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-charcoal">Tu Nivel</h3>
                <span id="user-level" class="text-2xl font-bold text-primary">4</span>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-xs text-charcoal-muted">
                  <span>12,450 XP</span>
                  <span>15,000 XP</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full" style="width: 83%;"></div>
                </div>
                <p class="text-xs text-charcoal-muted text-center">2,550 XP para Nivel 5</p>
              </div>
            </div>
            
            {/* Upcoming Sessions */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 class="font-bold text-charcoal mb-4">Próximas Sesiones</h3>
              <div id="upcoming-sessions" class="space-y-3">
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
                  <p class="text-xs text-primary font-semibold">Mañana, 10:00 AM</p>
                </div>
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
      
      {/* JavaScript for interactions */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          const token = localStorage.getItem('accessToken');
          
          // Redirect to login if not authenticated
          if (!token) {
            window.location.href = '/login?redirect=/profile';
            return;
          }
          
          // Load user profile data
          async function loadProfile() {
            try {
              const response = await fetch('/api/users/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              const data = await response.json();
              
              if (data.success) {
                const { user, access, stats } = data.data;
                
                // Update UI
                document.getElementById('user-name').textContent = user.name || 'Usuario';
                document.getElementById('user-email').textContent = user.email || '';
                document.getElementById('edit-name').value = user.name || '';
                
                if (user.avatar_url) {
                  document.getElementById('user-avatar').style.backgroundImage = 'url("' + user.avatar_url + '")';
                  document.getElementById('edit-avatar').value = user.avatar_url;
                }
                
                // Update stats
                if (stats.streak) {
                  document.getElementById('stat-streak').textContent = stats.streak.current_streak || 0;
                  document.getElementById('stat-xp').textContent = (stats.streak.total_xp || 0).toLocaleString();
                  document.getElementById('user-level').textContent = stats.streak.level || 1;
                }
                document.getElementById('stat-lessons').textContent = stats.lessons_completed || 0;
                document.getElementById('stat-reflections').textContent = stats.reflections || 0;
                
                // Update access status
                const accessEl = document.getElementById('access-status');
                if (access && access.has_premium) {
                  accessEl.innerHTML = \`
                    <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary">verified</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-charcoal">Acceso Premium Activo</p>
                      <p class="text-xs text-charcoal-muted">Tienes acceso completo a todo el contenido</p>
                    </div>
                  \`;
                } else {
                  accessEl.innerHTML = \`
                    <div class="size-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span class="material-symbols-outlined text-charcoal-muted">lock</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-charcoal">Acceso Gratuito</p>
                      <p class="text-xs text-charcoal-muted">Actualiza para acceder a todo el contenido</p>
                    </div>
                    <a href="/pricing" class="ml-auto px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
                      Actualizar
                    </a>
                  \`;
                }
                
                // Save updated user data
                localStorage.setItem('user', JSON.stringify(user));
              }
            } catch (error) {
              console.error('Error loading profile:', error);
            }
          }
          
          // Toggle edit form
          document.getElementById('edit-profile-btn')?.addEventListener('click', function() {
            document.getElementById('edit-profile-form')?.classList.toggle('hidden');
          });
          
          document.getElementById('cancel-edit-btn')?.addEventListener('click', function() {
            document.getElementById('edit-profile-form')?.classList.add('hidden');
          });
          
          document.getElementById('change-avatar-btn')?.addEventListener('click', function() {
            document.getElementById('edit-profile-form')?.classList.remove('hidden');
            document.getElementById('edit-avatar')?.focus();
          });
          
          // Save profile changes
          document.getElementById('profile-form')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('edit-name')?.value;
            const avatar_url = document.getElementById('edit-avatar')?.value;
            
            try {
              const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, avatar_url })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Update UI
                document.getElementById('user-name').textContent = name;
                if (avatar_url) {
                  document.getElementById('user-avatar').style.backgroundImage = 'url("' + avatar_url + '")';
                }
                
                // Update localStorage
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                userData.name = name;
                userData.avatar_url = avatar_url;
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Hide form
                document.getElementById('edit-profile-form')?.classList.add('hidden');
                
                alert('Perfil actualizado correctamente');
              } else {
                alert(data.error || 'Error al actualizar perfil');
              }
            } catch (error) {
              alert('Error de conexión');
            }
          });
          
          // Change password
          document.getElementById('password-form')?.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password')?.value;
            const newPassword = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
              alert('Por favor completa todos los campos');
              return;
            }
            
            if (newPassword !== confirmPassword) {
              alert('Las contraseñas no coinciden');
              return;
            }
            
            try {
              const response = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
              });
              
              const data = await response.json();
              
              if (data.success) {
                alert('Contraseña actualizada correctamente');
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
              } else {
                alert(data.error || 'Error al cambiar contraseña');
              }
            } catch (error) {
              alert('Error de conexión');
            }
          });
          
          // Logout
          document.getElementById('logout-btn')?.addEventListener('click', async function() {
            if (token) {
              try {
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                  }
                });
              } catch (e) {}
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/';
          });
          
          // Initialize
          loadProfile();
        })();
      `}} />
      
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
