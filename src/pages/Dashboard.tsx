import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'
import type { Tables } from '../lib/database.types'

interface DashboardProps {
  profile: Tables<'profiles'>
  streak: Tables<'user_streaks'>
  progress: {
    completedQuests: number
    totalQuests: number
    learningHours: number
    totalReflections: number
  }
  recommendedLesson?: {
    id: string
    title: string
    description: string
    duration: string
    category: string
    slug: string
  }
  upcomingInsights: Array<{
    id: string
    title: string
    duration: string
    category: string
    icon: string
    slug: string
  }>
}

export const Dashboard: FC<DashboardProps> = ({
  profile,
  streak,
  progress,
  recommendedLesson = {
    id: 'default',
    title: 'Dominando la Granularidad Emocional',
    description: 'Mejora tu toma de decisiones identificando cambios emocionales sutiles.',
    duration: '8 min',
    category: 'Ciencia Cognitiva',
    slug: 'emotional-granularity'
  },
  upcomingInsights = []
}) => {
  const level = Math.floor((streak.total_xp || 0) / 3000) + 1
  const levelXp = (streak.total_xp || 0) % 3000
  const xpProgress = (levelXp / 3000) * 100
  const remainingXp = 3000 - levelXp

  return (
    <div class="flex flex-col min-h-screen">
      <Header
        activePage="dashboard"
        userName={profile.name}
        userAvatar={profile.avatar_url || undefined}
      />

      <main class="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-12 grid grid-cols-12 gap-8">
        {/* Main Content - Left Side */}
        <div class="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {/* Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consistency Card */}
            <div class="flex flex-col gap-4 p-6 rounded-xl border border-gray-100 bg-soft-bg gold-glow">
              <div class="flex justify-between items-center">
                <p class="text-charcoal-muted text-sm font-medium tracking-wide uppercase">Consistencia</p>
                <span class="material-symbols-outlined text-primary">local_fire_department</span>
              </div>
              <div>
                <p class="text-charcoal text-3xl font-bold leading-none">{streak.current_streak} Días</p>
                <p class="text-emerald-600 text-xs font-medium mt-1">Sigue así para aumentar tu racha</p>
              </div>
            </div>

            {/* XP Card */}
            <div class="flex flex-col gap-3 p-6 rounded-xl border border-gray-100 bg-soft-bg gold-glow">
              <div class="flex justify-between items-center">
                <p class="text-charcoal-muted text-sm font-medium tracking-wide uppercase">XP Cognitivo</p>
                <p class="text-charcoal text-xs font-semibold">Nivel {level}</p>
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex justify-between text-[10px] text-charcoal-muted uppercase tracking-tighter">
                  <span>{streak.total_xp?.toLocaleString()} XP</span>
                  <span>{(level * 3000).toLocaleString()} XP</span>
                </div>
                <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(197,160,89,0.3)]" style={`width: ${xpProgress}%;`}></div>
                </div>
                <p class="text-charcoal-muted text-[11px] italic">{remainingXp.toLocaleString()} XP para dominar el Nivel {level + 1}</p>
              </div>
            </div>
          </div>

          {/* Hero Card - Recommended Module */}
          <div class="relative overflow-hidden rounded-2xl hero-gradient p-8 lg:p-12 shadow-xl">
            <div class="relative z-10 flex flex-col gap-6 max-w-xl">
              <div class="flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-lg">auto_awesome</span>
                <span class="text-xs font-bold tracking-[0.2em] uppercase">Recomendado para ti</span>
              </div>
              <div class="space-y-3">
                <h1 class="text-white text-3xl lg:text-4xl font-bold tracking-tight leading-tight serif-font">
                  {recommendedLesson.title}
                </h1>
                <p class="text-gray-300 text-lg leading-relaxed font-light">
                  {recommendedLesson.description}
                </p>
              </div>
              <div class="flex items-center gap-6 py-2">
                <div class="flex items-center gap-2 text-white/70 text-sm">
                  <span class="material-symbols-outlined text-primary/70 text-sm">schedule</span>
                  <span>{recommendedLesson.duration}</span>
                </div>
                <div class="flex items-center gap-2 text-white/70 text-sm">
                  <span class="material-symbols-outlined text-primary/70 text-sm">psychology</span>
                  <span>{recommendedLesson.category}</span>
                </div>
              </div>
              <div class="pt-4">
                <a
                  href={`/quest/${recommendedLesson.slug}`}
                  class="inline-flex bg-primary hover:bg-primary-dark text-white font-bold px-10 py-4 rounded-lg items-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg shadow-black/20"
                >
                  <span>Continuar tu viaje</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
            <div class="absolute right-[-10%] top-[-20%] size-96 bg-primary/5 rounded-full blur-[100px]"></div>
            <div class="absolute right-bottom-0 opacity-10 pointer-events-none p-4">
              <span class="material-symbols-outlined text-white text-[120px]">mindfulness</span>
            </div>
          </div>

          {/* Upcoming Insights */}
          <div class="space-y-4">
            <div class="flex justify-between items-end px-2">
              <h3 class="text-charcoal text-xl font-bold">Próximos Insights</h3>
              <a href="/library" class="text-primary text-sm font-medium hover:underline">Ver Roadmap</a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingInsights.length > 0 ? (
                upcomingInsights.map(insight => (
                  <a href={`/quest/${insight.slug}`} class="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
                    <div class="size-16 rounded-lg bg-soft-bg flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span class="material-symbols-outlined text-charcoal-muted group-hover:text-primary">{insight.icon || 'database'}</span>
                    </div>
                    <div class="flex flex-col justify-center">
                      <p class="text-charcoal font-semibold text-sm">{insight.title}</p>
                      <p class="text-charcoal-muted text-xs">{insight.duration} • {insight.category}</p>
                    </div>
                  </a>
                ))
              ) : (
                <div class="col-span-full p-8 text-center text-gray-400 italic">
                  No hay nuevos insights disponibles en este momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Taberna Card */}
          <div class="p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-4 relative overflow-hidden group">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">forum</span>
              </div>
              <div>
                <h4 class="text-charcoal font-bold">Taberna</h4>
                <p class="text-charcoal-muted text-[10px] uppercase tracking-widest font-bold">Sabiduría Compartida</p>
              </div>
            </div>
            <p class="text-charcoal-muted text-sm leading-relaxed">
              Únete a la comunidad y comparte tus reflexiones con otros miembros Elite.
            </p>
            <a href="/taberna" class="w-full py-2.5 rounded-lg border border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all text-center">
              Entrar al Espacio
            </a>
            <div class="absolute -right-4 -bottom-4 size-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          </div>

          {/* Introspection Card */}
          <div class="p-6 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col gap-6">
            <div class="flex justify-between items-center">
              <h4 class="text-charcoal font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">self_improvement</span>
                Introspección
              </h4>
              <span class="text-[10px] text-charcoal-muted uppercase tracking-widest font-bold">Ritual Diario</span>
            </div>
            <div class="bg-soft-bg p-4 rounded-lg border border-gray-100 italic text-sm text-charcoal-muted text-center">
              "¿Qué es una cosa que puedes simplificar en tu liderazgo hoy?"
            </div>
            <div class="flex flex-col gap-3">
              <form method="post" action="/api/reflections" class="flex flex-col gap-3">
                <textarea
                  name="content"
                  class="w-full bg-soft-bg border-gray-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm text-charcoal placeholder:text-charcoal-muted/50 min-h-[100px] resize-none p-3"
                  placeholder="Captura tu reflexión..."
                  required
                ></textarea>
                <button type="submit" class="flex items-center justify-center gap-2 text-xs font-bold text-charcoal-muted hover:text-primary transition-colors py-2 uppercase tracking-widest">
                  <span>Guardar en Diario</span>
                  <span class="material-symbols-outlined text-sm">history_edu</span>
                </button>
              </form>
            </div>
          </div>

          {/* Mentor Card */}
          <div class="flex flex-col gap-4 p-6 rounded-xl border border-gray-100 bg-soft-bg gold-glow">
            <p class="text-charcoal-muted text-[10px] font-bold uppercase tracking-[0.2em]">Tu Mentor</p>
            <div class="flex items-center gap-4">
              <div
                class="size-12 rounded-full bg-center bg-cover border-2 border-white shadow-sm"
                style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9i3nexY3inrasR-S2laQ4cg7Ty2B7RsZwwNTA3k26CMTFEPvSpRrdejYY-12gM0SSnW-iYtah1e0g1dZtK7lxOVUu-BvORRIqQPIVjOnsYXxIDfiYmuwhg3U9L5Jt_nuYO6CMo34fsT1_vxJB8UUa2p_6qpBoGSWNKp45CK2kAnivBWzrM-brraBckdfQ5EQcKZwXIr64obombBVBTmvxslHLK93TmkXXrcux-_fGJ0yjObt8NRAzZfo_J3GJuYkkvRJpmApN26Lb");'
              ></div>
              <div>
                <p class="text-charcoal text-sm font-bold leading-none">Dra. Elena Sterling</p>
                <p class="text-primary text-[10px] font-bold mt-1 uppercase">Mentoría Personalizada</p>
              </div>
            </div>
            <a href="/mentorship" class="bg-charcoal hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition-colors text-center">
              Agendar Sesión
            </a>
          </div>

          {/* Progress Summary */}
          <div class="p-6 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col gap-4">
            <h4 class="text-charcoal font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">insights</span>
              Resumen de Progreso
            </h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-charcoal-muted">Quests Completados</span>
                <span class="text-sm font-bold text-charcoal">{progress.completedQuests} / {progress.totalQuests}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-charcoal-muted">Horas de Aprendizaje</span>
                <span class="text-sm font-bold text-charcoal">{progress.learningHours}h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-charcoal-muted">Reflexiones Guardadas</span>
                <span class="text-sm font-bold text-charcoal">{progress.totalReflections}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <footer class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 grid grid-cols-4 items-center justify-items-center z-50">
        <a href="/" class="text-primary">
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
    </div>
  )
}
