import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

interface LibraryProps {
  formations?: Array<{
    id: string
    slug: string
    title: string
    description: string
    category: string
    duration: string
    lessons: number
    progress: number
    status: 'not-started' | 'in-progress' | 'completed'
    image: string
    is_locked: boolean
  }>
  stats?: {
    completed: number
    inProgress: number
    notStarted: number
  }
}

export const Library: FC<LibraryProps> = ({
  formations = [],
  stats = { completed: 0, inProgress: 0, notStarted: 0 }
}) => {
  const categories = [
    { id: 'all', name: 'Todos', count: formations.length },
    { id: 'fundamentos', name: 'Fundamentos', count: formations.filter(f => f.category === 'Fundamentos').length },
    { id: 'mastery', name: 'Mastery', count: formations.filter(f => f.category === 'Mastery').length },
    { id: 'expert', name: 'Expert', count: formations.filter(f => f.category === 'Expert').length },
  ]

  return (
    <div class="flex flex-col min-h-screen">
      <Header activePage="library" />

      <main class="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-12">
        {/* Page Header */}
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h1 class="text-charcoal text-3xl lg:text-4xl font-bold tracking-tight serif-font mb-2">
              Biblioteca de Transformación
            </h1>
            <p class="text-charcoal-muted text-lg">
              Micro-módulos diseñados para una maestría just-in-time.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center bg-soft-bg rounded-lg px-4 py-2 border border-gray-100">
              <span class="material-symbols-outlined text-charcoal-muted text-xl mr-2">search</span>
              <input
                type="text"
                placeholder="Buscar quests..."
                class="bg-transparent border-none focus:ring-0 text-sm text-charcoal placeholder:text-charcoal-muted/50 w-48"
                id="search-input"
              />
            </div>
            <button class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-charcoal-muted hover:border-primary hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-lg">filter_list</span>
              Filtrar
            </button>
          </div>
        </div>

        {/* Categories */}
        <div class="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map((cat, index) => (
            <button
              class={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${index === 0
                  ? 'bg-primary text-white'
                  : 'bg-soft-bg text-charcoal-muted hover:bg-primary/10 hover:text-primary'
                }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="size-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-emerald-600">check_circle</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-charcoal">{stats.completed}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Completados</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">play_circle</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-charcoal">{stats.inProgress}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">En Progreso</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="size-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-charcoal-muted">lock</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-charcoal">{stats.notStarted}</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Por Comenzar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quests Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="quests-grid">
          {formations.map((quest) => (
            <a
              href={quest.is_locked ? 'javascript:void(0)' : `/quest/${quest.id}`}
              class={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group ${quest.is_locked ? 'opacity-75 cursor-not-allowed' : 'hover:border-primary/30'}`}
              onclick={quest.is_locked ? "alert('Esta formación requiere suscripción Premium.')" : ""}
            >
              {/* Image */}
              <div class="relative h-48 overflow-hidden">
                <div
                  class="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                  style={`background-image: url("${quest.image}");`}
                ></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Status Badge */}
                <div class="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  {quest.is_locked && (
                    <span class="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">lock</span>
                      Premium
                    </span>
                  )}
                  {quest.status === 'completed' && (
                    <span class="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Completado
                    </span>
                  )}
                  {quest.status === 'in-progress' && (
                    <span class="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      En Progreso
                    </span>
                  )}
                  {quest.status === 'not-started' && !quest.is_locked && (
                    <span class="px-3 py-1 bg-gray-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Nuevo
                    </span>
                  )}
                </div>

                {/* Category */}
                <div class="absolute bottom-4 left-4">
                  <span class="text-white/80 text-xs font-medium">{quest.category}</span>
                </div>
              </div>

              {/* Content */}
              <div class="p-6">
                <h3 class="text-charcoal font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {quest.title}
                </h3>
                <p class="text-charcoal-muted text-sm mb-4 line-clamp-2">
                  {quest.description}
                </p>

                {/* Meta Info */}
                <div class="flex items-center gap-4 text-xs text-charcoal-muted mb-4">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    {quest.duration}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">menu_book</span>
                    {quest.lessons} lecciones
                  </span>
                </div>

                {/* Progress Bar */}
                {quest.status !== 'not-started' && (
                  <div class="space-y-2">
                    <div class="flex justify-between text-[10px] text-charcoal-muted uppercase">
                      <span>Progreso</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class={`h-full rounded-full ${quest.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                        style={`width: ${quest.progress}%;`}
                      ></div>
                    </div>
                  </div>
                )}

                {quest.status === 'not-started' && (
                  <button class={`w-full py-2.5 border text-sm font-bold rounded-lg transition-all ${quest.is_locked ? 'border-gray-300 text-gray-400' : 'border-primary text-primary group-hover:bg-primary group-hover:text-white'}`}>
                    {quest.is_locked ? 'Bloqueado' : 'Comenzar Quest'}
                  </button>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* Load More/Empty State */}
        {formations.length === 0 && (
          <div class="text-center py-20">
            <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">library_books</span>
            <p class="text-charcoal-muted">No se encontraron formaciones disponibles.</p>
          </div>
        )}

        {formations.length > 0 && (
          <div class="flex justify-center mt-10">
            <button class="px-8 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-charcoal-muted hover:border-primary hover:text-primary transition-colors">
              Cargar más quests
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <footer class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 grid grid-cols-4 items-center justify-items-center z-50">
        <a href="/" class="text-charcoal-muted">
          <span class="material-symbols-outlined">dashboard</span>
        </a>
        <a href="/library" class="text-primary">
          <span class="material-symbols-outlined">library_books</span>
        </a>
        <a href="/taberna" class="text-charcoal-muted">
          <span class="material-symbols-outlined">forum</span>
        </a>
        <a href="/profile" class="text-charcoal-muted">
          <span class="material-symbols-outlined">person</span>
        </a>
      </footer>

      <script dangerouslySetInnerHTML={{
        __html: `
        // Simple client-side search
        document.getElementById('search-input')?.addEventListener('input', (e) => {
          const term = e.target.value.toLowerCase();
          const cards = document.querySelectorAll('#quests-grid > a');
          
          cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            if (title.includes(term) || desc.includes(term)) {
              card.style.display = 'block';
            } else {
              card.style.display = 'none';
            }
          });
        });
      `}} />
    </div>
  )
}
