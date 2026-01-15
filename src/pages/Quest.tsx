import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

interface QuestProps {
  questId?: string
}

export const Quest: FC<QuestProps> = ({ questId = 'morning-ritual' }) => {
  const questData = {
    'morning-ritual': {
      title: 'El Ritual Matutino',
      category: 'Dominio del Mindset',
      path: 'El Camino de la Alineación Interior',
      duration: '12 mins',
      type: 'Micro-Learning Quest',
      progress: 65,
      lessons: [
        { id: 1, title: 'Introducción', duration: '5 mins', status: 'complete' },
        { id: 2, title: 'El Ritual Matutino', duration: '12 mins', status: 'playing' },
        { id: 3, title: 'Recableado Neural', duration: '15 mins', status: 'locked' },
        { id: 4, title: 'Alineación de Frecuencia', duration: '8 mins', status: 'locked' },
      ]
    }
  }

  const currentQuest = questData['morning-ritual']

  return (
    <div class="flex flex-col min-h-screen">
      <Header activePage="quest" />
      
      <main class="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6 lg:px-10 py-10 gap-8">
        {/* Breadcrumb */}
        <div class="flex items-center gap-2">
          <a href="/library" class="text-primary text-xs uppercase tracking-widest font-bold hover:underline">
            {currentQuest.category}
          </a>
          <span class="material-symbols-outlined text-charcoal/30 text-sm">chevron_right</span>
          <span class="text-charcoal/60 text-xs uppercase tracking-widest font-medium">
            {currentQuest.path}
          </span>
        </div>
        
        <div class="grid grid-cols-12 gap-12">
          {/* Main Content */}
          <div class="col-span-12 lg:col-span-8 flex flex-col gap-10">
            {/* Title Section */}
            <div class="flex flex-wrap justify-between items-end gap-3 border-b border-primary/10 pb-6">
              <div class="flex flex-col gap-2">
                <h1 class="serif-font text-charcoal text-4xl lg:text-5xl font-medium">
                  2. {currentQuest.title}
                </h1>
                <p class="text-primary/80 text-xs uppercase tracking-[0.2em] font-bold">
                  {currentQuest.type} • {currentQuest.duration} • Maestría Just-in-Time
                </p>
              </div>
              <button class="flex items-center justify-center px-4 py-2 border border-primary/30 text-primary hover:bg-primary hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all duration-300">
                <span class="material-symbols-outlined mr-2 text-[16px]">visibility_off</span>
                <span>Modo Sin Distracciones</span>
              </button>
            </div>
            
            {/* Video Player */}
            <div class="relative group shadow-2xl rounded-lg overflow-hidden border border-primary/10">
              <div 
                class="relative flex items-center justify-center bg-stone-900 bg-cover bg-center aspect-video"
                style='background-image: url("https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=675&fit=crop");'
              >
                <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all"></div>
                
                {/* Play Button */}
                <button class="z-10 flex shrink-0 items-center justify-center rounded-full size-20 gold-gradient text-white shadow-xl hover:scale-105 transition-transform duration-500">
                  <span class="material-symbols-outlined text-[48px] icon-fill">play_arrow</span>
                </button>
                
                {/* Video Controls */}
                <div class="absolute inset-x-0 bottom-0 p-6 lg:p-8 bg-gradient-to-t from-black/70 to-transparent">
                  {/* Progress Bar */}
                  <div class="flex h-1 w-full items-center mb-6 cursor-pointer group/progress bg-white/20 video-progress">
                    <div class="h-full w-1/3 gold-gradient relative">
                      <div class="progress-handle absolute -right-1.5 -top-1.5 size-4 rounded-full bg-white shadow-md border-2 border-primary"></div>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div class="flex items-center justify-between text-white/90">
                    <div class="flex items-center gap-4 lg:gap-6">
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-2xl">play_circle</span>
                      </button>
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-2xl">skip_next</span>
                      </button>
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-2xl">volume_up</span>
                      </button>
                      <p class="text-[10px] tracking-widest font-bold font-sans">04:12 / 12:00</p>
                    </div>
                    <div class="flex items-center gap-4 lg:gap-6">
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">closed_caption</span>
                      </button>
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">settings</span>
                      </button>
                      <button class="hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">fullscreen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transformation Suite */}
            <div class="flex flex-col gap-8">
              <div class="flex items-center gap-3">
                <div class="h-px w-8 bg-primary"></div>
                <h3 class="serif-font text-lg italic text-charcoal font-medium">La Suite de Transformación</h3>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frequency Alignment */}
                <div class="bg-white p-6 border border-primary/10 shadow-sm flex flex-col gap-6 rounded-lg">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-charcoal font-bold text-xs uppercase tracking-widest mb-1">Alineación de Frecuencia</p>
                      <p class="text-primary serif-font italic text-sm">Ambient Alpha</p>
                    </div>
                    <span class="text-primary text-[9px] font-bold border border-primary/40 px-3 py-1 uppercase tracking-tighter rounded">
                      432Hz Activo
                    </span>
                  </div>
                  <div class="flex items-center gap-5">
                    <button class="size-12 rounded-full border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                      <span class="material-symbols-outlined icon-fill">graphic_eq</span>
                    </button>
                    <div class="flex-1 flex items-center gap-1 h-6">
                      <div class="w-1 bg-primary/30 h-3"></div>
                      <div class="w-1 bg-primary/50 h-5"></div>
                      <div class="w-1 bg-primary/70 h-4"></div>
                      <div class="w-1 bg-primary h-6"></div>
                      <div class="w-1 bg-primary/90 h-8"></div>
                      <div class="w-1 bg-primary/70 h-5"></div>
                      <div class="w-1 bg-primary/40 h-3"></div>
                      <div class="w-1 bg-primary/60 h-4"></div>
                      <div class="w-1 bg-primary h-7"></div>
                      <div class="w-1 bg-primary/50 h-3"></div>
                      <div class="w-1 bg-primary/80 h-5"></div>
                      <div class="w-1 bg-primary/60 h-4"></div>
                    </div>
                  </div>
                </div>
                
                {/* Inner Critic Voice */}
                <div class="bg-white p-6 border-2 border-primary/30 shadow-md flex flex-col gap-4 relative overflow-hidden rounded-lg">
                  <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 -rotate-45 translate-x-8 -translate-y-8"></div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg">edit_note</span>
                    <p class="text-charcoal font-bold text-xs uppercase tracking-widest">Voz del Crítico Interior</p>
                  </div>
                  <div class="relative">
                    <input 
                      type="text"
                      class="w-full bg-transparent border-b border-primary/30 border-t-0 border-x-0 px-0 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:ring-0 focus:border-primary outline-none transition-all serif-font italic"
                      placeholder="Externaliza un pensamiento..."
                    />
                    <button class="absolute right-0 top-3 text-primary hover:text-charcoal transition-colors">
                      <span class="material-symbols-outlined text-xl">north_east</span>
                    </button>
                  </div>
                  <p class="text-[10px] text-charcoal/40 italic font-medium">
                    Registrar tus pensamientos reduce su carga emocional.
                  </p>
                </div>
              </div>
              
              {/* Journal Entry */}
              <div class="bg-soft-bg p-6 border border-gray-100 rounded-lg">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary">history_edu</span>
                  <p class="text-charcoal font-bold text-xs uppercase tracking-widest">Notas de la Lección</p>
                </div>
                <textarea 
                  class="w-full bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm text-charcoal placeholder:text-charcoal-muted/50 min-h-[120px] resize-none p-4"
                  placeholder="Captura tus insights mientras aprendes..."
                ></textarea>
                <div class="flex justify-end mt-3">
                  <button class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors">
                    Guardar Nota
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
                  <h2 class="serif-font text-xl font-bold text-charcoal">Micro-Learning Quest</h2>
                  <span class="text-primary font-bold text-xs tracking-widest">{currentQuest.progress}% COMPLETADO</span>
                </div>
                <div class="h-0.5 w-full bg-primary/10 overflow-hidden rounded-full">
                  <div class="h-full gold-gradient rounded-full" style={`width: ${currentQuest.progress}%;`}></div>
                </div>
              </div>
              
              {/* Lesson List */}
              <div class="flex flex-col p-4 gap-1">
                {currentQuest.lessons.map((lesson) => (
                  <div 
                    class={`flex items-center justify-between p-4 transition-colors cursor-pointer rounded-lg ${
                      lesson.status === 'playing' 
                        ? 'bg-primary/5 border-l-4 border-primary' 
                        : lesson.status === 'complete'
                        ? 'hover:bg-soft-bg'
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <div class="flex items-center gap-4">
                      <div class={`size-6 flex items-center justify-center ${
                        lesson.status === 'complete' ? 'text-primary' : 
                        lesson.status === 'playing' ? 'text-primary' : 'text-charcoal/30'
                      }`}>
                        <span class={`material-symbols-outlined text-lg ${lesson.status === 'complete' ? 'icon-fill' : ''}`}>
                          {lesson.status === 'complete' ? 'check_circle' : 
                           lesson.status === 'playing' ? 'play_arrow' : 'lock'}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <p class={`text-xs font-bold uppercase tracking-widest ${
                          lesson.status === 'playing' ? 'text-charcoal' : 
                          lesson.status === 'complete' ? 'text-charcoal/50' : 'text-charcoal'
                        }`}>
                          {lesson.id}. {lesson.title}
                        </p>
                        <p class={`text-[9px] uppercase font-bold tracking-tighter ${
                          lesson.status === 'complete' || lesson.status === 'playing' ? 'text-primary' : 'text-charcoal/60'
                        }`}>
                          {lesson.duration} {lesson.status === 'complete' ? '• Completo' : lesson.status === 'playing' ? '• Reproduciendo' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Aide-Mémoire */}
              <div class="p-8 border-t border-primary/10 bg-soft-bg/50">
                <h3 class="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Aide-Mémoire</h3>
                <div class="flex flex-col gap-3">
                  <button class="flex items-center gap-3 w-full p-3 border border-primary/10 bg-white hover:border-primary/40 transition-all text-left rounded-lg">
                    <span class="material-symbols-outlined text-primary text-lg">description</span>
                    <span class="text-[10px] uppercase font-bold tracking-widest text-charcoal/70">Checklist Matutino</span>
                  </button>
                  <button class="flex items-center gap-3 w-full p-3 border border-primary/10 bg-white hover:border-primary/40 transition-all text-left rounded-lg">
                    <span class="material-symbols-outlined text-primary text-lg">auto_stories</span>
                    <span class="text-[10px] uppercase font-bold tracking-widest text-charcoal/70">Hoja de Resumen</span>
                  </button>
                  <button class="flex items-center gap-3 w-full p-3 border border-primary/10 bg-white hover:border-primary/40 transition-all text-left rounded-lg">
                    <span class="material-symbols-outlined text-primary text-lg">download</span>
                    <span class="text-[10px] uppercase font-bold tracking-widest text-charcoal/70">Descargar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer class="mt-auto px-6 lg:px-10 py-6 border-t border-primary/10 bg-white">
        <div class="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-charcoal/40 text-[9px] uppercase font-bold tracking-[0.25em]">
          <div class="flex gap-6 lg:gap-10">
            <span>Sesión Activa: 24:12</span>
            <span class="text-primary">Nivel de Enfoque: Alto</span>
          </div>
          <div class="flex gap-6 lg:gap-8 items-center">
            <span class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-green-500"></span>
              Sincronización Cloud Activa
            </span>
            <span class="border-l border-primary/20 pl-6 lg:pl-8">Entorno Seguro</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
