import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

interface MentorshipProps {
  mentors?: Array<{
    id: string
    name: string
    title: string
    bio: string
    avatar_url: string
    specialties: string[]
    session_price_cents: number
    session_duration_minutes: number
    sessions_completed?: number
  }>
  userSessions?: Array<{
    id: string
    mentor_id: string
    scheduled_at: string
    status: string
    meeting_link?: string
    mentor?: {
      name: string
      title: string
      avatar_url: string
    }
  }>
}

export const Mentorship: FC<MentorshipProps> = ({
  mentors = [],
  userSessions = []
}) => {
  // Default to first mentor if none selected
  const defaultMentor = mentors[0] || {
    id: 'placeholder',
    name: 'Ainara Sterling',
    title: 'Life Coach & Mentora',
    bio: 'Cargando perfil...',
    avatar_url: '',
    specialties: [],
    session_price_cents: 15000,
    session_duration_minutes: 60,
    sessions_completed: 0
  }

  return (
    <div class="flex flex-col min-h-screen bg-soft-bg">
      <Header activePage="mentorship" />

      <main class="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-12">
        {/* Page Header */}
        <div class="text-center mb-12">
          <h1 class="text-3xl lg:text-4xl font-bold text-charcoal serif-font mb-4">
            Mentoría de Alto Impacto
          </h1>
          <p class="text-lg text-charcoal-muted max-w-2xl mx-auto">
            Sesiones individuales diseñadas para acelerar tu transformación personal y profesional.
          </p>
        </div>

        <div class="grid grid-cols-12 gap-8">
          {/* Mentor Profile Card */}
          <div class="col-span-12 lg:col-span-5">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              <div class="h-32 hero-gradient relative">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>

              <div class="px-6 pb-6">
                <div class="-mt-16 mb-4">
                  <div
                    class="size-32 rounded-2xl bg-cover bg-center border-4 border-white shadow-lg mx-auto bg-gray-100"
                    style={`background-image: url("${defaultMentor.avatar_url}");`}
                  ></div>
                </div>

                <div class="text-center mb-6">
                  <h2 class="text-2xl font-bold text-charcoal mb-1">{defaultMentor.name}</h2>
                  <p class="text-primary font-medium text-sm">{defaultMentor.title}</p>
                </div>

                <p class="text-charcoal-muted text-sm leading-relaxed mb-6">
                  {defaultMentor.bio}
                </p>

                <div class="mb-6">
                  <h3 class="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Especialidades</h3>
                  <div class="flex flex-wrap gap-2">
                    {defaultMentor.specialties?.map((specialty) => (
                      <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4 p-4 bg-soft-bg rounded-xl">
                  <div class="text-center">
                    <p class="text-2xl font-bold text-charcoal">{defaultMentor.sessions_completed || 0}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Sesiones</p>
                  </div>
                  <div class="text-center border-x border-gray-200">
                    <p class="text-2xl font-bold text-charcoal">{defaultMentor.session_duration_minutes}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Minutos</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold text-primary">€{defaultMentor.session_price_cents / 100}</p>
                    <p class="text-[10px] text-charcoal-muted uppercase">Por sesión</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div class="col-span-12 lg:col-span-7 space-y-8">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 class="text-xl font-bold text-charcoal mb-6">Reservar Mi Sesión</h3>

              <div class="flex items-center justify-between mb-6">
                <button id="prev-week" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span class="material-symbols-outlined text-charcoal-muted">chevron_left</span>
                </button>
                <h4 id="current-week" class="text-lg font-semibold text-charcoal">Cargando fechas...</h4>
                <button id="next-week" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span class="material-symbols-outlined text-charcoal-muted">chevron_right</span>
                </button>
              </div>

              <div id="days-grid" class="grid grid-cols-5 gap-3 mb-6 font-sans">
                {/* Dynamically populated */}
              </div>

              <div id="time-slots-container" class="hidden mb-6">
                <h4 class="text-sm font-bold text-charcoal uppercase tracking-wider mb-4">Horarios disponibles</h4>
                <div id="time-slots" class="grid grid-cols-4 gap-3">
                  {/* Dynamically populated */}
                </div>
              </div>

              <div id="booking-form" class="hidden space-y-6">
                <div>
                  <label class="block text-sm font-bold text-charcoal mb-2">
                    ¿Qué quieres trabajar hoy?
                  </label>
                  <textarea
                    id="user-notes"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-charcoal placeholder:text-charcoal-muted/50 min-h-[100px] resize-none"
                    placeholder="Describe brevemente tus objetivos para esta sesión..."
                  ></textarea>
                </div>

                <div class="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <p class="text-sm text-charcoal-muted">Confirmación de Sesión</p>
                      <p id="selected-summary" class="text-lg font-bold text-charcoal serif-font">--</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-charcoal-muted">Inversión</p>
                      <p class="text-2xl font-bold text-primary">€{defaultMentor.session_price_cents / 100}</p>
                    </div>
                  </div>
                  <button
                    id="confirm-booking-btn"
                    class="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </div>

              <div id="calendar-placeholder" class="py-12 text-center text-charcoal-muted italic">
                Selecciona un día para ver horarios disponibles.
              </div>
            </div>

            {/* My Sessions List */}
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-charcoal">Mis Próximas Sesiones</h3>
                <span class="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Historial
                </span>
              </div>

              <div id="sessions-list" class="space-y-4">
                {userSessions.length > 0 ? userSessions.map(session => {
                  const date = new Date(session.scheduled_at)
                  const isUpcoming = date > new Date()
                  const statusLabel = session.status === 'confirmed' ? 'Confirmada' : (session.status === 'pending' ? 'Pendiente' : (session.status === 'cancelled' ? 'Cancelada' : 'Completada'))
                  const statusClass = session.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : (session.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700')

                  return (
                    <div class="p-5 bg-soft-bg rounded-xl border border-gray-100">
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                          <div class="size-10 rounded-full bg-cover bg-center bg-gray-200" style={`background-image: url("${session.mentor?.avatar_url}");`}></div>
                          <div>
                            <p class="font-semibold text-charcoal text-sm">{session.mentor?.name}</p>
                            <p class="text-[10px] text-charcoal-muted uppercase">{session.mentor?.title}</p>
                          </div>
                        </div>
                        <span class={`px-3 py-1 ${statusClass} text-[10px] font-bold uppercase rounded-full`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div class="flex items-center gap-4 text-xs font-medium text-charcoal mb-4">
                        <span class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                          {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isUpcoming && session.status !== 'cancelled' && (
                        <div class="flex gap-2">
                          {session.meeting_link ? (
                            <a href={session.meeting_link} target="_blank" class="flex-1 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest text-center rounded-lg hover:bg-primary-dark transition-colors">
                              Unirse a Videollamada
                            </a>
                          ) : (
                            <div class="flex-1 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center rounded-lg cursor-not-allowed">
                              Esperando Enlace
                            </div>
                          )}
                          <button
                            onclick={`handleCancelSession("${session.id}")`}
                            class="px-4 py-2 border border-gray-200 text-charcoal-muted text-[10px] font-bold uppercase tracking-widest rounded-lg hover:border-red-200 hover:text-red-500 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }) : (
                  <div class="text-center py-8">
                    <span class="material-symbols-outlined text-5xl text-gray-200 mb-2">event_available</span>
                    <p class="text-charcoal-muted text-sm italic">No tienes sesiones reservadas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
        const MENTOR_ID = "${defaultMentor.id}";
        let selectedDate = null;
        let selectedTime = null;
        let mentorData = null;
        let currentWeekStart = new Date();
        currentWeekStart.setHours(0,0,0,0);
        
        // Adjust to Monday
        const day = currentWeekStart.getDay();
        const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
        currentWeekStart.setDate(diff);

        async function init() {
          try {
            const res = await fetch('/api/mentorship/mentors/' + MENTOR_ID);
            const data = await res.json();
            if (data.success) {
              mentorData = data.data;
              renderWeek();
            }
          } catch(e) { console.error(e); }
        }

        function renderWeek() {
          const grid = document.getElementById('days-grid');
          const weekLabel = document.getElementById('current-week');
          if (!grid || !weekLabel) return;

          const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
          const endOfWeek = new Date(currentWeekStart);
          endOfWeek.setDate(endOfWeek.getDate() + 4);
          
          weekLabel.textContent = currentWeekStart.getDate() + " - " + endOfWeek.getDate() + " " + currentWeekStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

          let html = '';
          for (let i = 0; i < 5; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().slice(0, 10);
            const isSelected = selectedDate === dateStr;
            const isBlocked = mentorData?.blocked_dates?.includes(dateStr);
            const isPast = date < new Date(new Date().setHours(0,0,0,0));

            html += \`
              <div class="text-center">
                <p class="text-[10px] text-charcoal-muted uppercase mb-2 font-bold">\${days[i]}</p>
                <button 
                  onclick="handleDateSelect('\${dateStr}')"
                  class="w-full aspect-square rounded-xl border-2 font-bold transition-all \${
                    isPast || isBlocked ? 'border-gray-50 text-gray-200 cursor-not-allowed' :
                    isSelected ? 'border-primary bg-primary text-white' : 'border-gray-100 text-charcoal hover:border-primary hover:text-primary'
                  }"
                  \${isPast || isBlocked ? 'disabled' : ''}
                >
                  \${date.getDate()}
                </button>
              </div>
            \`;
          }
          grid.innerHTML = html;
        }

        window.handleDateSelect = function(dateStr) {
          selectedDate = dateStr;
          selectedTime = null;
          renderWeek();
          renderTimeSlots();
          document.getElementById('calendar-placeholder').classList.add('hidden');
          document.getElementById('time-slots-container').classList.remove('hidden');
          document.getElementById('booking-form').classList.add('hidden');
        }

        function renderTimeSlots() {
          const container = document.getElementById('time-slots');
          if (!container || !mentorData) return;

          const date = new Date(selectedDate);
          const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
          
          // Get availability for this day
          const avail = mentorData.availability.filter(a => a.day_of_week === dayOfWeek);
          const booked = mentorData.booked_slots.filter(s => s.scheduled_at.startsWith(selectedDate));

          let slots = [];
          avail.forEach(a => {
            let start = a.start_time.split(':').map(Number);
            let end = a.end_time.split(':').map(Number);
            let current = start[0] * 60 + start[1];
            let limit = end[0] * 60 + end[1];

            while (current + mentorData.session_duration_minutes <= limit) {
              const h = Math.floor(current / 60);
              const m = current % 60;
              const timeStr = (h < 10 ? '0' : '') + h + ":" + (m < 10 ? '0' : '') + m;
              const isBooked = booked.some(s => s.scheduled_at.includes(timeStr));
              
              slots.push({ time: timeStr, isBooked });
              current += mentorData.session_duration_minutes;
            }
          });

          container.innerHTML = slots.map(s => \`
            <button 
              onclick="handleTimeSelect('\${s.time}')"
              class="py-3 px-2 rounded-lg border-2 text-[11px] font-bold uppercase transition-all \${
                s.isBooked ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                selectedTime === s.time ? 'border-primary bg-primary text-white' : 'border-gray-100 text-charcoal hover:border-primary hover:text-primary'
              }"
              \${s.isBooked ? 'disabled' : ''}
            >
              \${s.time}
            </button>
          \`).join('') || '<p class="col-span-4 text-xs italic text-charcoal-muted">No hay horarios disponibles.</p>';
        }

        window.handleTimeSelect = function(time) {
          selectedTime = time;
          renderTimeSlots();
          document.getElementById('booking-form').classList.remove('hidden');
          
          const date = new Date(selectedDate);
          const summary = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + " - " + selectedTime;
          document.getElementById('selected-summary').textContent = summary.charAt(0).toUpperCase() + summary.slice(1);
        }

        document.getElementById('confirm-booking-btn')?.addEventListener('click', async () => {
          const notes = document.getElementById('user-notes').value;
          const scheduledAt = \`\${selectedDate}T\${selectedTime}:00\`;
          
          try {
            const res = await fetch('/api/mentorship/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mentor_id: MENTOR_ID,
                scheduled_at: scheduledAt,
                user_notes: notes
              })
            });
            const data = await res.json();
            if (data.success) {
              alert('¡Reserva confirmada! Recibirás un enlace pronto.');
              window.location.reload();
            } else {
              alert(data.error || 'Error al reservar');
            }
          } catch(e) { console.error(e); }
        });

        window.handleCancelSession = async function(id) {
          if (!confirm('¿Seguro que quieres cancelar tu sesión?')) return;
          try {
            const res = await fetch('/api/mentorship/sessions/' + id + '/cancel', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Cancelado por el usuario' })
            });
            const data = await res.json();
            if (data.success) {
              window.location.reload();
            } else {
              alert(data.error || 'No se pudo cancelar');
            }
          } catch(e) { console.error(e); }
        }

        document.getElementById('next-week')?.addEventListener('click', () => {
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          renderWeek();
        });
        document.getElementById('prev-week')?.addEventListener('click', () => {
          currentWeekStart.setDate(currentWeekStart.getDate() - 7);
          renderWeek();
        });

        init();
      `}} />
    </div>
  )
}
