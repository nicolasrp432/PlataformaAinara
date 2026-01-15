import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

export const Library: FC = () => {
  const categories = [
    { id: 'all', name: 'Todos', count: 24 },
    { id: 'mindset', name: 'Mindset', count: 8 },
    { id: 'productivity', name: 'Productividad', count: 6 },
    { id: 'philosophy', name: 'Filosofía', count: 5 },
    { id: 'neuroscience', name: 'Neurociencia', count: 5 },
  ]

  const quests = [
    {
      id: 'morning-ritual',
      title: 'El Ritual Matutino',
      description: 'Establece una rutina matutina poderosa que transforme tu día y tu vida.',
      category: 'Mindset',
      duration: '40 min',
      lessons: 4,
      progress: 65,
      status: 'in-progress',
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop'
    },
    {
      id: 'emotional-granularity',
      title: 'Granularidad Emocional',
      description: 'Mejora tu inteligencia emocional identificando matices sutiles en tus sentimientos.',
      category: 'Neurociencia',
      duration: '35 min',
      lessons: 5,
      progress: 0,
      status: 'not-started',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
    },
    {
      id: 'stoic-resilience',
      title: 'Resiliencia Estoica',
      description: 'Aplica principios estoicos milenarios para enfrentar los desafíos modernos.',
      category: 'Filosofía',
      duration: '45 min',
      lessons: 6,
      progress: 100,
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1604480132736-44c188fe4d20?w=400&h=300&fit=crop'
    },
    {
      id: 'pattern-recognition',
      title: 'Reconocimiento de Patrones',
      description: 'Desarrolla tu capacidad de identificar patrones en información compleja.',
      category: 'Productividad',
      duration: '25 min',
      lessons: 4,
      progress: 25,
      status: 'in-progress',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    },
    {
      id: 'neural-rewiring',
      title: 'Recableado Neural',
      description: 'Comprende cómo reprogramar tu cerebro para nuevos hábitos y comportamientos.',
      category: 'Neurociencia',
      duration: '50 min',
      lessons: 7,
      progress: 0,
      status: 'not-started',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
    },
    {
      id: 'visual-thinking',
      title: 'Pensamiento Visual',
      description: 'Aprende a usar diagramas y mapas mentales para resolver problemas complejos.',
      category: 'Productividad',
      duration: '30 min',
      lessons: 5,
      progress: 0,
      status: 'not-started',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop'
    }
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
              class={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                index === 0 
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
                <p class="text-2xl font-bold text-charcoal">1</p>
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
                <p class="text-2xl font-bold text-charcoal">2</p>
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
                <p class="text-2xl font-bold text-charcoal">3</p>
                <p class="text-xs text-charcoal-muted uppercase tracking-wide">Por Comenzar</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quests Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <a 
              href={`/quest/${quest.id}`}
              class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              {/* Image */}
              <div class="relative h-48 overflow-hidden">
                <div 
                  class="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                  style={`background-image: url("${quest.image}");`}
                ></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Status Badge */}
                <div class="absolute top-4 right-4">
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
                  {quest.status === 'not-started' && (
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
                        class={`h-full rounded-full ${
                          quest.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={`width: ${quest.progress}%;`}
                      ></div>
                    </div>
                  </div>
                )}
                
                {quest.status === 'not-started' && (
                  <button class="w-full py-2.5 border border-primary text-primary text-sm font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                    Comenzar Quest
                  </button>
                )}
              </div>
            </a>
          ))}
        </div>
        
        {/* Load More */}
        <div class="flex justify-center mt-10">
          <button class="px-8 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-charcoal-muted hover:border-primary hover:text-primary transition-colors">
            Cargar más quests
          </button>
        </div>
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
    </div>
  )
}
