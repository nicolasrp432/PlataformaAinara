import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

interface QuestProps {
  lesson: {
    id: string
    title: string
    description: string
    content_type: 'video' | 'audio' | 'text'
    video_url?: string
    video_duration_seconds?: number
    module_title: string
    formation_title: string
    formation_slug: string
    user_progress?: {
      status: string
      progress_percent: number
      last_position_seconds: number
    }
  }
  moduleLessons: Array<{
    id: string
    title: string
    duration: string
    status: 'complete' | 'playing' | 'unlocked' | 'locked'
  }>
  progress: number
  navigation: {
    previous?: { id: string, title: string }
    next?: { id: string, title: string }
  }
}

export const Quest: FC<QuestProps> = ({
  lesson,
  moduleLessons = [],
  progress = 0,
  navigation
}) => {
  const isVideo = lesson.content_type === 'video'
  const isAudio = lesson.content_type === 'audio'

  return (
    <div class="flex flex-col min-h-screen">
      <Header activePage="library" />

      <main class="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6 lg:px-10 py-10 gap-8">
        {/* Breadcrumb */}
        <div class="flex items-center gap-2">
          <a href="/library" class="text-primary text-xs uppercase tracking-widest font-bold hover:underline">
            {lesson.formation_title}
          </a>
          <span class="material-symbols-outlined text-charcoal/30 text-sm">chevron_right</span>
          <span class="text-charcoal/60 text-xs uppercase tracking-widest font-medium">
            {lesson.module_title}
          </span>
        </div>

        <div class="grid grid-cols-12 gap-12">
          {/* Main Content */}
          <div class="col-span-12 lg:col-span-8 flex flex-col gap-10">
            {/* Title Section */}
            <div class="flex flex-wrap justify-between items-end gap-3 border-b border-primary/10 pb-6">
              <div class="flex flex-col gap-2">
                <h1 class="serif-font text-charcoal text-4xl lg:text-5xl font-medium">
                  {lesson.title}
                </h1>
                <p class="text-primary/80 text-xs uppercase tracking-[0.2em] font-bold">
                  {lesson.content_type.toUpperCase()} • {Math.floor((lesson.video_duration_seconds || 0) / 60)} MIN • Maestría Just-in-Time
                </p>
              </div>
              <button class="flex items-center justify-center px-4 py-2 border border-primary/30 text-primary hover:bg-primary hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all duration-300">
                <span class="material-symbols-outlined mr-2 text-[16px]">visibility_off</span>
                <span>Modo Sin Distracciones</span>
              </button>
            </div>

            {/* Player Container */}
            <div class="relative group shadow-2xl rounded-lg overflow-hidden border border-primary/10">
              <div
                id="player-container"
                class="relative flex items-center justify-center bg-stone-900 bg-cover bg-center aspect-video"
                style={`background-image: url("https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=675&fit=crop");`}
              >
                {/* Embed or Placeholder */}
                {lesson.video_url ? (
                  <iframe
                    id="video-frame"
                    src={lesson.video_url}
                    class="absolute inset-0 w-full h-full"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                ) : (
                  <>
                    <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all"></div>
                    <button id="play-btn" class="z-10 flex shrink-0 items-center justify-center rounded-full size-20 gold-gradient text-white shadow-xl hover:scale-105 transition-transform duration-500">
                      <span class="material-symbols-outlined text-[48px] icon-fill">play_arrow</span>
                    </button>
                  </>
                )}

                {/* Simulado: Controles si no hay URL real */}
                {!lesson.video_url && (
                  <div class="absolute inset-x-0 bottom-0 p-6 lg:p-8 bg-gradient-to-t from-black/70 to-transparent">
                    <div class="flex h-1 w-full items-center mb-6 cursor-pointer group/progress bg-white/20" id="progress-bar-bg">
                      <div class="h-full bg-primary relative" id="progress-bar-fill" style={`width: ${lesson.user_progress?.progress_percent || 0}%`}>
                        <div class="progress-handle absolute -right-1.5 -top-1.5 size-4 rounded-full bg-white shadow-md border-2 border-primary opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-white/90">
                      <div class="flex items-center gap-4 lg:gap-6">
                        <button class="hover:text-primary transition-colors" id="play-pause-toggle">
                          <span class="material-symbols-outlined text-2xl">play_circle</span>
                        </button>
                        <button class="hover:text-primary transition-colors">
                          <span class="material-symbols-outlined text-2xl">skip_next</span>
                        </button>
                        <p class="text-[10px] tracking-widest font-bold font-sans">
                          <span id="current-time">00:00</span> / <span id="total-time">{Math.floor((lesson.video_duration_seconds || 0) / 60)}:00</span>
                        </p>
                      </div>
                      <div class="flex items-center gap-4 lg:gap-6">
                        <button class="hover:text-primary transition-colors">
                          <span class="material-symbols-outlined text-xl">fullscreen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transformation Suite */}
            <div class="flex flex-col gap-8">
              <div class="flex items-center gap-3">
                <div class="h-px w-8 bg-primary"></div>
                <h3 class="serif-font text-lg italic text-charcoal font-medium">La Suite de Transformación</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* frequency tool */}
                <div class="bg-white p-6 border border-primary/10 shadow-sm flex flex-col gap-6 rounded-lg">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-charcoal font-bold text-xs uppercase tracking-widest mb-1">Frecuencia de Enfoque</p>
                      <p class="text-primary serif-font italic text-sm">Ondas Alpha</p>
                    </div>
                    <span class="text-primary text-[9px] font-bold border border-primary/40 px-3 py-1 uppercase tracking-tighter rounded">
                      Sincronizado
                    </span>
                  </div>
                  <div class="flex items-center gap-5">
                    <button class="size-12 rounded-full border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                      <span class="material-symbols-outlined icon-fill">graphic_eq</span>
                    </button>
                    <div class="flex-1 flex gap-1 h-8 items-end">
                      <div class="flex-1 bg-primary/20 h-2 animate-pulse"></div>
                      <div class="flex-1 bg-primary/40 h-5 animate-pulse" style="animation-delay: 0.1s"></div>
                      <div class="flex-1 bg-primary/60 h-3 animate-pulse" style="animation-delay: 0.2s"></div>
                      <div class="flex-1 bg-primary/80 h-7 animate-pulse" style="animation-delay: 0.3s"></div>
                      <div class="flex-1 bg-primary h-4 animate-pulse" style="animation-delay: 0.4s"></div>
                      <div class="flex-1 bg-primary/50 h-6 animate-pulse" style="animation-delay: 0.5s"></div>
                    </div>
                  </div>
                </div>

                {/* Reflection: Inner Critic */}
                <div class="bg-white p-6 border-2 border-primary/30 shadow-md flex flex-col gap-4 relative overflow-hidden rounded-lg">
                  <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 -rotate-45 translate-x-8 -translate-y-8"></div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg">edit_note</span>
                    <p class="text-charcoal font-bold text-xs uppercase tracking-widest">Voz del Crítico Interior</p>
                  </div>
                  <form id="reflection-form" class="relative">
                    <input
                      type="text"
                      name="content"
                      class="w-full bg-transparent border-b border-primary/30 border-t-0 border-x-0 px-0 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:ring-0 focus:border-primary outline-none transition-all serif-font italic"
                      placeholder="Externaliza un pensamiento..."
                      required
                    />
                    <button type="submit" class="absolute right-0 top-3 text-primary hover:text-charcoal transition-colors">
                      <span class="material-symbols-outlined text-xl">north_east</span>
                    </button>
                  </form>
                  <p class="text-[10px] text-charcoal/40 italic font-medium">
                    Registrar tus pensamientos reduce su carga emocional.
                  </p>
                </div>
              </div>

              {/* Journal Entry */}
              <div class="bg-soft-bg p-6 border border-gray-100 rounded-lg">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary">history_edu</span>
                  <p class="text-charcoal font-bold text-xs uppercase tracking-widest">Diario de Insights</p>
                </div>
                <textarea
                  id="journal-note"
                  class="w-full bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm text-charcoal placeholder:text-charcoal-muted/50 min-h-[120px] resize-none p-4"
                  placeholder="Captura lo que resuena contigo ahora mismo..."
                ></textarea>
                <div class="flex justify-between items-center mt-3">
                  <span id="journal-status" class="text-[10px] text-emerald-600 font-medium opacity-0 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">done</span> Guardado
                  </span>
                  <button
                    id="save-note-btn"
                    class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Guardar Insights
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div class="col-span-12 lg:col-span-4">
            <div class="bg-white border border-primary/10 shadow-xl sticky top-24 rounded-lg overflow-hidden">
              {/* Progress Header */}
              <div class="p-8 border-b border-primary/10">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="serif-font text-xl font-bold text-charcoal">Tu Camino</h2>
                  <span class="text-primary font-bold text-xs tracking-widest">{progress}% COMPLETADO</span>
                </div>
                <div class="h-0.5 w-full bg-primary/10 overflow-hidden rounded-full">
                  <div class="h-full gold-gradient rounded-full" style={`width: ${progress}%; transition: width 1s ease-in-out;`}></div>
                </div>
              </div>

              {/* Lesson List */}
              <div class="flex flex-col p-4 gap-1">
                {moduleLessons.map((l, idx) => (
                  <a
                    href={l.status === 'locked' ? 'javascript:void(0)' : `/quest/${l.id}`}
                    class={`flex items-center justify-between p-4 transition-colors rounded-lg ${l.status === 'playing'
                        ? 'bg-primary/5 border-l-4 border-primary'
                        : l.status === 'complete'
                          ? 'hover:bg-soft-bg'
                          : 'opacity-40 hover:opacity-100 cursor-not-allowed'
                      }`}
                  >
                    <div class="flex items-center gap-4">
                      <div class={`size-6 flex items-center justify-center ${l.status === 'complete' ? 'text-primary' :
                          l.status === 'playing' ? 'text-primary' : 'text-charcoal/30'
                        }`}>
                        <span class={`material-symbols-outlined text-lg ${l.status === 'complete' ? 'icon-fill' : ''}`}>
                          {l.status === 'complete' ? 'check_circle' :
                            l.status === 'playing' ? 'play_arrow' : 'lock'}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <p class={`text-xs font-bold uppercase tracking-widest ${l.status === 'playing' ? 'text-charcoal' :
                            l.status === 'complete' ? 'text-charcoal/50' : 'text-charcoal'
                          }`}>
                          {idx + 1}. {l.title}
                        </p>
                        <p class={`text-[9px] uppercase font-bold tracking-tighter ${l.status === 'complete' || l.status === 'playing' ? 'text-primary' : 'text-charcoal/60'
                          }`}>
                          {l.duration} {l.status === 'complete' ? '• Completo' : l.status === 'playing' ? '• Reproduciendo' : ''}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Navigation buttons */}
              <div class="p-6 flex flex-col gap-2 border-t border-primary/10">
                {navigation.next && (
                  <a href={`/quest/${navigation.next.id}`} class="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary-dark transition-all">
                    Siguiente Lección
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                )}
                {navigation.previous && (
                  <a href={`/quest/${navigation.previous.id}`} class="w-full flex items-center justify-center gap-2 py-2 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/5 transition-all">
                    <span class="material-symbols-outlined text-sm">arrow_back</span>
                    Lección Anterior
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Logic Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
        const lessonId = "${lesson.id}";
        let progress = ${lesson.user_progress?.progress_percent || 0};
        let isPlaying = false;
        let currentTime = ${lesson.user_progress?.last_position_seconds || 0};
        const totalDuration = ${lesson.video_duration_seconds || 600};
        
        // Progress Updates
        async function updateProgress(status, percent, position) {
          try {
            await fetch('/api/content/lessons/' + lessonId + '/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status,
                progress_percent: Math.round(percent),
                last_position_seconds: Math.round(position)
              })
            });
            if (status === 'completed') {
               // Show celebratory effects or notification if needed
            }
          } catch(e) { console.error(e); }
        }

        // Simula reproducción
        const timer = setInterval(() => {
          if (!isPlaying) return;
          
          currentTime += 1;
          const currentPercent = (currentTime / totalDuration) * 100;
          
          // Update UI
          const fill = document.getElementById('progress-bar-fill');
          if (fill) fill.style.width = currentPercent + '%';
          
          const timeDisp = document.getElementById('current-time');
          if (timeDisp) {
            const mins = Math.floor(currentTime / 60);
            const secs = Math.round(currentTime % 60);
            timeDisp.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
          }

          // Heartbeat update every 10 seconds or when finished
          if (currentTime >= totalDuration) {
            isPlaying = false;
            clearInterval(timer);
            updateProgress('completed', 100, totalDuration);
            alert('¡Lección completada! Has ganado 50 XP.');
          } else if (currentTime % 10 === 0) {
            updateProgress('in_progress', currentPercent, currentTime);
          }
        }, 1000);

        // Controls
        document.getElementById('play-btn')?.addEventListener('click', () => {
          isPlaying = true;
          document.getElementById('play-btn').style.display = 'none';
          document.getElementById('play-pause-toggle')?.querySelector('span').textContent = 'pause_circle';
        });

        document.getElementById('play-pause-toggle')?.addEventListener('click', (e) => {
          isPlaying = !isPlaying;
          e.currentTarget.querySelector('span').textContent = isPlaying ? 'pause_circle' : 'play_circle';
          if (isPlaying) updateProgress('in_progress', (currentTime/totalDuration)*100, currentTime);
        });

        // Reflection Form
        document.getElementById('reflection-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const content = e.target.content.value;
          try {
            const res = await fetch('/api/reflections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                type: 'thought',
                is_public: false,
                lesson_id: lessonId
              })
            });
            const data = await res.json();
            if (data.success) {
              e.target.content.value = '';
              alert('Reflexión guardada. +15 XP');
            }
          } catch(e) { console.error(e); }
        });

        // Journal Saving
        document.getElementById('save-note-btn')?.addEventListener('click', async () => {
          const content = document.getElementById('journal-note').value;
          if (!content) return;
          
          try {
            const res = await fetch('/api/reflections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                type: 'reflection',
                is_public: false,
                lesson_id: lessonId
              })
            });
            const data = await res.json();
            if (data.success) {
              const status = document.getElementById('journal-status');
              status.classList.remove('opacity-0');
              setTimeout(() => status.classList.add('opacity-0'), 3000);
            }
          } catch(e) { console.error(e); }
        });
      `}} />

      <footer class="mt-auto px-6 lg:px-10 py-6 border-t border-primary/10 bg-white">
        <div class="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-charcoal/40 text-[9px] uppercase font-bold tracking-[0.25em]">
          <div class="flex gap-6 lg:gap-10">
            <span>Sincronización en tiempo real activa</span>
            <span class="text-primary uppercase">Leader Blueprint Pro</span>
          </div>
          <div class="flex gap-6 lg:gap-8 items-center">
            <span class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-emerald-500"></span>
              Sesión Segura
            </span>
            <span class="border-l border-primary/20 pl-6 lg:pl-8">Protegido por Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
