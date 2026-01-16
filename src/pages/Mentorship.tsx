import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

export const Mentorship: FC = () => {
  const mentor = {
    name: 'Ainara Sterling',
    title: 'Life Coach & Mentora de Transformación',
    bio: 'Con más de 10 años de experiencia en coaching de vida y desarrollo personal, Ainara ha guiado a cientos de personas hacia su mejor versión. Su enfoque combina neurociencia, filosofía práctica y técnicas de mindfulness para crear transformaciones duraderas.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9i3nexY3inrasR-S2laQ4cg7Ty2B7RsZwwNTA3k26CMTFEPvSpRrdejYY-12gM0SSnW-iYtah1e0g1dZtK7lxOVUu-BvORRIqQPIVjOnsYXxIDfiYmuwhg3U9L5Jt_nuYO6CMo34fsT1_vxJB8UUa2p_6qpBoGSWNKp45CK2kAnivBWzrM-brraBckdfQ5EQcKZwXIr64obombBVBTmvxslHLK93TmkXXrcux-_fGJ0yjObt8NRAzZfo_J3GJuYkkvRJpmApN26Lb',
    specialties: ['Mindset de crecimiento', 'Gestión emocional', 'Propósito de vida', 'Liderazgo personal', 'Productividad consciente'],
    sessionPrice: 150,
    sessionDuration: 60,
    sessionsCompleted: 248
  }

  return (
    <div class="flex flex-col min-h-screen bg-soft-bg">
      <Header activePage="mentorship" />
      
      <main class="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-12">
        {/* Page Header */}
        <div class="text-center mb-12">
          <h1 class="text-3xl lg:text-4xl font-bold text-charcoal serif-font mb-4">
            Mentoría Personal con Ainara
          </h1>
          <p class="text-lg text-charcoal-muted max-w-2xl mx-auto">
            Sesiones individuales diseñadas para acelerar tu transformación personal y profesional.
          </p>
        </div>
        
        <div class="grid grid-cols-12 gap-8">
          {/* Mentor Profile Card */}
          <div class="col-span-12 lg:col-span-5">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              {/* Cover Image */}
              <div class="h-32 hero-gradient relative">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              
              {/* Profile */}
              <div class="px-6 pb-6">
                <div class="-mt-16 mb-4">
                  <div 
                    class="size-32 rounded-2xl bg-cover bg-center border-4 border-white shadow-lg mx-auto"
                    style={`background-image: url("${mentor.avatar}");`}
                  ></div>
                </div>
                
                <div class="text-center mb-6">
                  <h2 class="text-2xl font-bold text-charcoal mb-1">{mentor.name}</h2>
                  <p class="text-primary font-medium text-sm">{mentor.title}</p>
                </div>
                
                <p class="text-charcoal-muted text-sm leading-relaxed mb-6">
                  {mentor.bio}
                </p>
                
                {/* Specialties */}
                <div class="mb-6">
                  <h3 class="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Especialidades</h3>
                  <div class="flex flex-wrap gap-2">
                    {mentor.specialties.map((specialty) => (
                      <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Stats */}
                <div class="grid grid-cols-3 gap-4 p-4 bg-soft-bg rounded-xl">
                  <div class="text-center">
                    <p class="text-2xl font-bold text-charcoal">{mentor.sessionsCompleted}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Sesiones</p>
                  </div>
                  <div class="text-center border-x border-gray-200">
                    <p class="text-2xl font-bold text-charcoal">{mentor.sessionDuration}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Minutos</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary">€{mentor.sessionPrice}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Por sesión</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking Section */}
          <div class="col-span-12 lg:col-span-7 space-y-8">
            {/* How it works */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 class="text-xl font-bold text-charcoal mb-6">¿Cómo funciona?</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                  <div class="size-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                  </div>
                  <h4 class="font-semibold text-charcoal mb-2">1. Elige tu horario</h4>
                  <p class="text-sm text-charcoal-muted">Selecciona la fecha y hora que mejor se adapte a tu agenda.</p>
                </div>
                <div class="text-center">
                  <div class="size-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-primary text-2xl">edit_note</span>
                  </div>
                  <h4 class="font-semibold text-charcoal mb-2">2. Comparte tu objetivo</h4>
                  <p class="text-sm text-charcoal-muted">Cuéntanos qué te gustaría trabajar en la sesión.</p>
                </div>
                <div class="text-center">
                  <div class="size-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-primary text-2xl">video_call</span>
                  </div>
                  <h4 class="font-semibold text-charcoal mb-2">3. Conéctate</h4>
                  <p class="text-sm text-charcoal-muted">Recibe el enlace y disfruta de tu sesión transformadora.</p>
                </div>
              </div>
            </div>
            
            {/* Calendar Section */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 class="text-xl font-bold text-charcoal mb-6">Reservar Sesión</h3>
              
              {/* Week Navigation */}
              <div class="flex items-center justify-between mb-6">
                <button id="prev-week" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span class="material-symbols-outlined text-charcoal-muted">chevron_left</span>
                </button>
                <h4 id="current-week" class="text-lg font-semibold text-charcoal">20 - 26 Enero 2026</h4>
                <button id="next-week" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span class="material-symbols-outlined text-charcoal-muted">chevron_right</span>
                </button>
              </div>
              
              {/* Days Grid */}
              <div id="days-grid" class="grid grid-cols-5 gap-3 mb-6">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, index) => (
                  <div class="text-center">
                    <p class="text-xs text-charcoal-muted uppercase mb-2">{day}</p>
                    <button 
                      class={`w-full aspect-square rounded-xl border-2 font-bold text-lg transition-all ${
                        index === 1 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-gray-200 text-charcoal hover:border-primary hover:text-primary'
                      }`}
                    >
                      {20 + index}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Time Slots */}
              <div class="mb-6">
                <h4 class="text-sm font-bold text-charcoal uppercase tracking-wider mb-4">Horarios disponibles</h4>
                <div id="time-slots" class="grid grid-cols-4 gap-3">
                  {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'].map((time, index) => (
                    <button 
                      class={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        index === 2 
                          ? 'border-primary bg-primary text-white' 
                          : time === '12:00'
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 text-charcoal hover:border-primary hover:text-primary'
                      }`}
                      disabled={time === '12:00'}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p class="text-xs text-charcoal-muted mt-2">* Los horarios en gris ya están reservados</p>
              </div>
              
              {/* Notes Section */}
              <div class="mb-6">
                <label class="block text-sm font-bold text-charcoal mb-2">
                  ¿Qué te gustaría trabajar en esta sesión?
                </label>
                <textarea 
                  id="session-notes"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-charcoal placeholder:text-charcoal-muted/50 min-h-[120px] resize-none"
                  placeholder="Ejemplo: Me gustaría trabajar en gestionar mejor mi ansiedad antes de presentaciones importantes..."
                ></textarea>
              </div>
              
              {/* Summary & Book Button */}
              <div class="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-sm text-charcoal-muted">Sesión seleccionada</p>
                    <p id="selected-datetime" class="text-lg font-bold text-charcoal">Martes, 21 Enero - 11:00</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-charcoal-muted">Total</p>
                    <p class="text-2xl font-bold text-primary">€{mentor.sessionPrice}</p>
                  </div>
                </div>
                <button 
                  id="book-session-btn"
                  class="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  Reservar Sesión
                </button>
                <p class="text-xs text-charcoal-muted text-center mt-3">
                  Cancelación gratuita hasta 24 horas antes de la sesión
                </p>
              </div>
            </div>
            
            {/* My Sessions */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-charcoal">Mis Sesiones</h3>
                <div class="flex gap-2">
                  <button class="px-4 py-2 text-sm font-semibold text-primary border-b-2 border-primary">Próximas</button>
                  <button class="px-4 py-2 text-sm font-semibold text-charcoal-muted hover:text-charcoal">Pasadas</button>
                </div>
              </div>
              
              <div id="my-sessions" class="space-y-4">
                {/* Example upcoming session */}
                <div class="p-5 bg-soft-bg rounded-xl border border-gray-100">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div 
                        class="size-12 rounded-full bg-cover bg-center"
                        style={`background-image: url("${mentor.avatar}");`}
                      ></div>
                      <div>
                        <p class="font-semibold text-charcoal">{mentor.name}</p>
                        <p class="text-sm text-charcoal-muted">Mentoría 1:1</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      Confirmada
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm">
                    <span class="flex items-center gap-1 text-charcoal">
                      <span class="material-symbols-outlined text-lg text-primary">calendar_today</span>
                      17 Enero 2026
                    </span>
                    <span class="flex items-center gap-1 text-charcoal">
                      <span class="material-symbols-outlined text-lg text-primary">schedule</span>
                      10:00 - 11:00
                    </span>
                  </div>
                  <div class="flex gap-3 mt-4">
                    <button class="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
                      Unirse a la llamada
                    </button>
                    <button class="px-4 py-2 border border-gray-200 text-charcoal-muted text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
                
                {/* Empty state */}
                <div class="hidden text-center py-8">
                  <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">event_available</span>
                  <p class="text-charcoal-muted">No tienes sesiones programadas</p>
                  <p class="text-sm text-charcoal-muted">Reserva tu primera sesión arriba</p>
                </div>
              </div>
            </div>
            
            {/* Testimonials */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 class="text-xl font-bold text-charcoal mb-6">Lo que dicen los alumnos</h3>
              <div class="space-y-4">
                <div class="p-5 bg-soft-bg rounded-xl">
                  <p class="text-charcoal italic mb-3">
                    "Ainara tiene un don para ver lo que otros no ven. En una sola sesión me ayudó a desbloquear un patrón que llevaba años limitándome."
                  </p>
                  <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span class="text-primary font-bold text-sm">MR</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-charcoal">María R.</p>
                      <p class="text-xs text-charcoal-muted">Emprendedora</p>
                    </div>
                  </div>
                </div>
                <div class="p-5 bg-soft-bg rounded-xl">
                  <p class="text-charcoal italic mb-3">
                    "Las sesiones con Ainara son un antes y un después. Su enfoque es profundo pero práctico, sales con herramientas que puedes aplicar ese mismo día."
                  </p>
                  <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span class="text-primary font-bold text-sm">CL</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-charcoal">Carlos L.</p>
                      <p class="text-xs text-charcoal-muted">Director de Marketing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Booking confirmation modal */}
      <div id="booking-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div class="size-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
          </div>
          <h3 class="text-2xl font-bold text-charcoal mb-2">¡Sesión Reservada!</h3>
          <p class="text-charcoal-muted mb-6">
            Recibirás un email de confirmación con los detalles y el enlace para la videollamada.
          </p>
          <button 
            onclick="document.getElementById('booking-modal').classList.add('hidden')"
            class="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <footer class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 grid grid-cols-4 items-center justify-items-center z-40">
        <a href="/" class="text-charcoal-muted">
          <span class="material-symbols-outlined">dashboard</span>
        </a>
        <a href="/library" class="text-charcoal-muted">
          <span class="material-symbols-outlined">library_books</span>
        </a>
        <a href="/taberna" class="text-charcoal-muted">
          <span class="material-symbols-outlined">forum</span>
        </a>
        <a href="/profile" class="text-charcoal-muted">
          <span class="material-symbols-outlined">person</span>
        </a>
      </footer>
      
      {/* JavaScript for booking functionality */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          const MENTOR_ID = 'mentor_ainara';
          let availableSlots = [];
          let selectedDate = null;
          let selectedTime = null;
          let currentWeekStart = new Date();
          currentWeekStart.setHours(0,0,0,0);
          
          // Ajustar al lunes de la semana actual
          const dayOfWeek = currentWeekStart.getDay();
          const diff = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 1 - dayOfWeek);
          currentWeekStart.setDate(currentWeekStart.getDate() + diff);
          
          const token = localStorage.getItem('accessToken');
          
          async function loadAvailability() {
            try {
              const response = await fetch(\`/api/mentorship/mentors/\${MENTOR_ID}/availability?weeks=4\`);
              const data = await response.json();
              if (data.success) {
                availableSlots = data.data.slots;
                renderWeek();
              }
            } catch (error) {
              console.error('Error loading availability:', error);
            }
          }
          
          async function loadMySessions() {
            if (!token) return;
            
            try {
              const response = await fetch('/api/mentorship/sessions?status=upcoming', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              const data = await response.json();
              if (data.success) {
                renderMySessions(data.data);
              }
            } catch (error) {
              console.error('Error loading sessions:', error);
            }
          }
          
          function renderMySessions(sessions) {
            const container = document.getElementById('my-sessions');
            if (!container) return;
            
            if (sessions.length === 0) {
              container.innerHTML = \`
                <div class="text-center py-8">
                  <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">event_available</span>
                  <p class="text-charcoal-muted">No tienes sesiones programadas</p>
                  <p class="text-sm text-charcoal-muted">Reserva tu primera sesión arriba</p>
                </div>
              \`;
              return;
            }
            
            container.innerHTML = sessions.map(session => {
              const date = new Date(session.scheduled_at);
              const statusColors = {
                pending: 'bg-amber-100 text-amber-700',
                confirmed: 'bg-emerald-100 text-emerald-700',
                completed: 'bg-blue-100 text-blue-700',
                cancelled: 'bg-red-100 text-red-700'
              };
              const statusLabels = {
                pending: 'Pendiente',
                confirmed: 'Confirmada',
                completed: 'Completada',
                cancelled: 'Cancelada'
              };
              
              return \`
                <div class="p-5 bg-soft-bg rounded-xl border border-gray-100">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span class="text-primary font-bold">\${session.mentor_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p class="font-semibold text-charcoal">\${session.mentor_name}</p>
                        <p class="text-sm text-charcoal-muted">Mentoría 1:1</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 \${statusColors[session.status] || statusColors.pending} text-xs font-semibold rounded-full">
                      \${statusLabels[session.status] || session.status}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm">
                    <span class="flex items-center gap-1 text-charcoal">
                      <span class="material-symbols-outlined text-lg text-primary">calendar_today</span>
                      \${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span class="flex items-center gap-1 text-charcoal">
                      <span class="material-symbols-outlined text-lg text-primary">schedule</span>
                      \${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  \${session.status === 'confirmed' && session.meeting_link ? \`
                    <div class="flex gap-3 mt-4">
                      <a href="\${session.meeting_link}" target="_blank" class="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center">
                        Unirse a la llamada
                      </a>
                      <button onclick="cancelSession('\${session.id}')" class="px-4 py-2 border border-gray-200 text-charcoal-muted text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  \` : session.status === 'pending' ? \`
                    <div class="flex gap-3 mt-4">
                      <p class="flex-1 py-2 text-amber-600 text-sm text-center">Esperando confirmación...</p>
                      <button onclick="cancelSession('\${session.id}')" class="px-4 py-2 border border-gray-200 text-charcoal-muted text-sm font-semibold rounded-lg hover:border-red-300 hover:text-red-500 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  \` : ''}
                </div>
              \`;
            }).join('');
          }
          
          function renderWeek() {
            const daysGrid = document.getElementById('days-grid');
            const currentWeekEl = document.getElementById('current-week');
            if (!daysGrid || !currentWeekEl) return;
            
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
            const endOfWeek = new Date(currentWeekStart);
            endOfWeek.setDate(endOfWeek.getDate() + 4);
            
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            currentWeekEl.textContent = \`\${currentWeekStart.getDate()} - \${endOfWeek.getDate()} \${monthNames[currentWeekStart.getMonth()]} \${currentWeekStart.getFullYear()}\`;
            
            let html = '';
            for (let i = 0; i < 5; i++) {
              const date = new Date(currentWeekStart);
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().slice(0, 10);
              
              const hasSlots = availableSlots.some(s => s.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isPast = date < new Date();
              
              html += \`
                <div class="text-center">
                  <p class="text-xs text-charcoal-muted uppercase mb-2">\${days[i]}</p>
                  <button 
                    class="w-full aspect-square rounded-xl border-2 font-bold text-lg transition-all \${
                      isPast ? 'border-gray-100 text-gray-300 cursor-not-allowed' :
                      isSelected ? 'border-primary bg-primary text-white' :
                      hasSlots ? 'border-gray-200 text-charcoal hover:border-primary hover:text-primary' :
                      'border-gray-100 text-gray-300 cursor-not-allowed'
                    }"
                    \${!hasSlots || isPast ? 'disabled' : ''}
                    onclick="selectDate('\${dateStr}')"
                  >
                    \${date.getDate()}
                  </button>
                </div>
              \`;
            }
            daysGrid.innerHTML = html;
            
            // Renderizar slots de tiempo si hay fecha seleccionada
            if (selectedDate) {
              renderTimeSlots();
            }
          }
          
          function renderTimeSlots() {
            const slotsContainer = document.getElementById('time-slots');
            if (!slotsContainer) return;
            
            const daySlots = availableSlots.filter(s => s.date === selectedDate);
            
            if (daySlots.length === 0) {
              slotsContainer.innerHTML = '<p class="text-charcoal-muted col-span-4">No hay horarios disponibles para esta fecha</p>';
              return;
            }
            
            slotsContainer.innerHTML = daySlots.map(slot => \`
              <button 
                class="py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all \${
                  selectedTime === slot.time 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200 text-charcoal hover:border-primary hover:text-primary'
                }"
                onclick="selectTime('\${slot.time}', '\${slot.datetime}')"
              >
                \${slot.time}
              </button>
            \`).join('');
          }
          
          window.selectDate = function(dateStr) {
            selectedDate = dateStr;
            selectedTime = null;
            renderWeek();
            updateSummary();
          };
          
          window.selectTime = function(time, datetime) {
            selectedTime = time;
            renderTimeSlots();
            updateSummary();
          };
          
          function updateSummary() {
            const summaryEl = document.getElementById('selected-datetime');
            if (!summaryEl) return;
            
            if (selectedDate && selectedTime) {
              const date = new Date(selectedDate);
              const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
              summaryEl.textContent = \`\${dayNames[date.getDay()]}, \${date.getDate()} \${monthNames[date.getMonth()]} - \${selectedTime}\`;
            } else {
              summaryEl.textContent = 'Selecciona fecha y hora';
            }
          }
          
          window.cancelSession = async function(sessionId) {
            if (!confirm('¿Estás seguro de que quieres cancelar esta sesión?')) return;
            
            try {
              const response = await fetch(\`/api/mentorship/sessions/\${sessionId}/cancel\`, {
                method: 'PUT',
                headers: { 
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Cancelado por el usuario' })
              });
              const data = await response.json();
              if (data.success) {
                loadMySessions();
                loadAvailability();
              } else {
                alert(data.error || 'Error al cancelar la sesión');
              }
            } catch (error) {
              alert('Error de conexión');
            }
          };
          
          // Book session
          document.getElementById('book-session-btn')?.addEventListener('click', async function() {
            if (!token) {
              window.location.href = '/login?redirect=/mentorship';
              return;
            }
            
            if (!selectedDate || !selectedTime) {
              alert('Por favor, selecciona una fecha y hora');
              return;
            }
            
            const notes = document.getElementById('session-notes')?.value || '';
            const datetime = \`\${selectedDate}T\${selectedTime}:00\`;
            
            try {
              const response = await fetch('/api/mentorship/sessions', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  mentor_id: MENTOR_ID,
                  scheduled_at: datetime,
                  user_notes: notes
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                document.getElementById('booking-modal')?.classList.remove('hidden');
                selectedDate = null;
                selectedTime = null;
                document.getElementById('session-notes').value = '';
                loadAvailability();
                loadMySessions();
              } else {
                alert(data.error || 'Error al reservar la sesión');
              }
            } catch (error) {
              alert('Error de conexión');
            }
          });
          
          // Week navigation
          document.getElementById('prev-week')?.addEventListener('click', function() {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderWeek();
          });
          
          document.getElementById('next-week')?.addEventListener('click', function() {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderWeek();
          });
          
          // Initialize
          loadAvailability();
          loadMySessions();
        })();
      `}} />
    </div>
  )
}
