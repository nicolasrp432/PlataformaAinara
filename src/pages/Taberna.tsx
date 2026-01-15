import type { FC } from 'hono/jsx'
import { Header } from '../components/Header'

export const Taberna: FC = () => {
  const reflections = [
    {
      id: 1,
      author: 'Elena Rodriguez',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJZQtRaQ2qTTECKAy5Ez39lRHLglsGoKBf48HUwMgK-3nI6QkFIyIAy3d7h1aos_-7FVvH0sxqInt8PMbGKyb2i46Z_KrJLYRQoN6kVBxQcTXMBKJuUi001sgpgz3UvjacW6WUhMb6kKw8YP2jCtdvnfgD2dUP_lbQ4cYcJsQ3oCXVyCInkgLyWptOJzlfObWnJfn9mlIjlwAuS8BimicIoTXt5uy-LJr1yw92ooZX-GqIGBnPBr8jXQwnoWJwLW2FunCYSOdCJwy6',
      time: 'Hace 2 horas',
      path: 'Camino Mindful',
      content: 'Hoy me di cuenta de que "no saber" es en realidad una posición de poder. Cuando dejamos de necesitar ser el experto, abrimos espacio para una verdadera transformación. Mi momento "¡Ajá!" fue abrazar el silencio entre las notas.',
      resonates: 12,
      supports: 4
    },
    {
      id: 2,
      author: 'Julian Thorne',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTSTQurc_QuwRWnY0x5xYICw7V-NnbrpkaSASkA4kAgqgRKDT0LwiDt5OyB0KO0UsxjKpA9ewosT4G9OP_6UXTWLViLRCDJhkyGt3YkvjHFN8tysSnb4b8jH4r2kJx5EdwRzkAOG_5MWJIyG-uFcvJn9ZRE3z6aHqdvWPRRxEYiIVbabSbL33cYBMHZdjLDfwInx3iYe8noHluvAawlUsgNUBYoKgMNYoIrq-wIfWlQ5i4Uv1FqJ9CMemO9nqv3ANvXxLwUGxigb1v',
      time: 'Hace 5 horas',
      path: 'Deep-Dive Creativo',
      content: 'La arquitectura de nuestros pensamientos define el paisaje de nuestras vidas. Si construimos con gratitud, la vista siempre es impresionante.',
      resonates: 28,
      supports: 9
    },
    {
      id: 3,
      author: 'Marcus Chen',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLs153YQJ0Im3SL3p6qjf298lkdj7nlvBOzt6bokNAlUgR_QzMB2xlLHb-8B2JCAmHUIcn-1F0jWMwgmkA3SXdo_epCyFuHwHOMf18CKUQC-o_bIEDL2DfCkxabr-ta_6vJKBz4PzlqmTVrBdTOGIu_3e5SdZ8VeQaqvMKbAn3tQK6Hc2UK-WPOZO0lsvwPx-P95-TKsATAeQGmvF_3YrevVnYxtEe3cCX4wS2eijibQn2kCqZwmuL4vGvww6k666Ma8x4SD0B7Tuf',
      time: 'Hace 8 horas',
      path: 'Resiliencia Estoica',
      content: 'La práctica de esta mañana me enseñó algo profundo: la resistencia no es rigidez, es flexibilidad con dirección. Como el bambú que se dobla pero no se rompe.',
      resonates: 45,
      supports: 15
    }
  ]

  const companions = [
    { name: 'Sofia Chen', status: 'Deep Flow State', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHU-IlE8MyD71jwcjTVrk9pLfE7fzIlMRzVHKnpl6Y_tGYQMi7n7__aH3fSK3XuhiZN0TeMY0hSRwwmXGxVobTjpoNDFHMJVcNNyxqjR23Ty4Iv6qsl8mfkZG0QX4rpggKagKLoKaspZb9_gRKvGpPtNvE5zTbeq1qe666-7qjTCP__U-zdjj3LvjRert9yGg5IK150Lf4Cn63c6Hhysgd2tzkNhuDfUepcgj9Sbj6oqwkV150jpVOqn27mIvOtjOE3P_eQNnPH4RI' },
    { name: 'Marcus Valdes', status: 'Journaling', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLs153YQJ0Im3SL3p6qjf298lkdj7nlvBOzt6bokNAlUgR_QzMB2xlLHb-8B2JCAmHUIcn-1F0jWMwgmkA3SXdo_epCyFuHwHOMf18CKUQC-o_bIEDL2DfCkxabr-ta_6vJKBz4PzlqmTVrBdTOGIu_3e5SdZ8VeQaqvMKbAn3tQK6Hc2UK-WPOZO0lsvwPx-P95-TKsATAeQGmvF_3YrevVnYxtEe3cCX4wS2eijibQn2kCqZwmuL4vGvww6k666Ma8x4SD0B7Tuf' },
    { name: "Liam O'Brien", status: 'Reflecting', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHdLroAbiLaxq1pd1FBSjDzAzJhiXndM5D3sSd7jp2djvL_L521-jbakzunv8lL2Iil3Z3fHKffIZk8XLnx9df6-Qmu8_vC5xX7liHRyuP6D64sZ0Lb-FCj1HnlOLXsG4l3hX3BdXhuM-LNe9mX7dRBxjgFHQnr2ne4aKsq4WzZ8CFhpJdTiZT4S62hOKyjlF_ChewbitJCyLgSSp9EfygxVR3nanjOdPhGYjlt17_nAT1N6TLQBMMrkPe7YM2oJjltqo58a1W9U-O' },
  ]

  return (
    <div class="flex flex-col min-h-screen bg-soft-bg">
      <Header activePage="taberna" />
      
      <main class="max-w-[1440px] mx-auto grid grid-cols-12 gap-8 px-6 lg:px-20 py-10">
        {/* Left Sidebar */}
        <aside class="col-span-3 hidden lg:flex flex-col gap-8 h-fit sticky top-24">
          <div class="flex flex-col gap-2">
            <h1 class="text-charcoal text-lg font-bold">Espacio Comunitario</h1>
            <p class="text-primary text-xs font-medium tracking-widest uppercase">Transformación Personal</p>
          </div>
          
          {/* Navigation */}
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-4 px-4 py-3 rounded-xl bg-primary/10 border-r-4 border-primary text-primary">
              <span class="material-symbols-outlined">home</span>
              <p class="text-sm font-bold">Feed Principal</p>
            </div>
            <a href="/meditation" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white transition-colors group">
              <span class="material-symbols-outlined text-charcoal-muted group-hover:text-charcoal">self_improvement</span>
              <p class="text-charcoal-muted text-sm font-medium group-hover:text-charcoal">Sala de Meditación</p>
            </a>
            <a href="/groups" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white transition-colors group">
              <span class="material-symbols-outlined text-charcoal-muted group-hover:text-charcoal">group</span>
              <p class="text-charcoal-muted text-sm font-medium group-hover:text-charcoal">Grupos de Estudio</p>
            </a>
            <a href="/messages" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white transition-colors group">
              <span class="material-symbols-outlined text-charcoal-muted group-hover:text-charcoal">forum</span>
              <p class="text-charcoal-muted text-sm font-medium group-hover:text-charcoal">Mensajes Directos</p>
            </a>
            <a href="/library" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white transition-colors group">
              <span class="material-symbols-outlined text-charcoal-muted group-hover:text-charcoal">menu_book</span>
              <p class="text-charcoal-muted text-sm font-medium group-hover:text-charcoal">Recursos de Biblioteca</p>
            </a>
          </div>
          
          {/* Today's Focus */}
          <div class="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex flex-col gap-4">
            <div class="flex items-center gap-2 text-primary">
              <span class="material-symbols-outlined">auto_awesome</span>
              <span class="text-xs font-bold uppercase tracking-wider">Enfoque de Hoy</span>
            </div>
            <p class="text-charcoal text-sm italic leading-relaxed">
              "La cueva que temes entrar contiene el tesoro que buscas."
            </p>
          </div>
        </aside>
        
        {/* Main Feed */}
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Page Header */}
          <div class="flex flex-col gap-2 mb-2">
            <h2 class="text-charcoal text-3xl lg:text-4xl font-black tracking-tight serif-font">
              La Taberna Community
            </h2>
            <p class="text-charcoal-muted text-lg font-light">
              Un espacio sagrado para reflexiones compartidas y crecimiento colectivo.
            </p>
          </div>
          
          {/* Composer */}
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6 luxury-shadow">
            <div class="flex gap-4">
              <div 
                class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shrink-0 border border-primary/20"
                style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdBPYimsudXj8yUyTV3f55OCLbjh2plonIl0Y3qu-xw3quIQfp2ibh-WLxRoXtCPFVd9J0MD6efyQVM8gtRSIuhw8qdVFufSFTxkSgcvvBoXZ4geuuKYWSEx7_v1SUTVwnT3Iqs1QlGqEs9Zm9oKCANmPVvDubly5wi6UMCYyV7StrxUwXqvjxViMSDgPNfuxjwB_7OIJcdg13F_c1PH1nP7bnGS3vovXO5Q7nTvLZXorvIBWBeclAZm3lFWwQGWgG_7PDtUam_4Ne");'
              ></div>
              <div class="flex-1 flex flex-col gap-4">
                <textarea 
                  class="w-full min-h-[100px] border-none focus:ring-0 bg-transparent text-lg text-charcoal placeholder:text-charcoal-muted/50 resize-none p-0"
                  placeholder="Comparte tu último momento '¡Ajá!'..."
                ></textarea>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div class="flex gap-2">
                    <button class="p-2 text-charcoal-muted hover:bg-primary/10 rounded-lg transition-colors">
                      <span class="material-symbols-outlined">colors_spark</span>
                    </button>
                    <button class="p-2 text-charcoal-muted hover:bg-primary/10 rounded-lg transition-colors">
                      <span class="material-symbols-outlined">image</span>
                    </button>
                    <button class="p-2 text-charcoal-muted hover:bg-primary/10 rounded-lg transition-colors">
                      <span class="material-symbols-outlined">link</span>
                    </button>
                  </div>
                  <button class="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20">
                    Compartir Reflexión
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div class="flex border-b border-gray-200 mt-2">
            <button class="px-6 py-4 border-b-2 border-primary text-primary text-sm font-bold tracking-wide">
              Todas las Reflexiones
            </button>
            <button class="px-6 py-4 text-charcoal-muted text-sm font-bold tracking-wide hover:text-charcoal transition-colors">
              Mi Viaje
            </button>
            <button class="px-6 py-4 text-charcoal-muted text-sm font-bold tracking-wide hover:text-charcoal transition-colors">
              Resonados
            </button>
          </div>
          
          {/* Reflections Feed */}
          <div class="flex flex-col gap-6">
            {reflections.map((reflection) => (
              <article class="bg-white p-8 rounded-2xl border border-gray-200 luxury-shadow flex flex-col gap-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div 
                      class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                      style={`background-image: url("${reflection.avatar}");`}
                    ></div>
                    <div>
                      <h4 class="text-charcoal font-bold text-sm">{reflection.author}</h4>
                      <p class="text-charcoal-muted text-xs">{reflection.time} • {reflection.path}</p>
                    </div>
                  </div>
                  <button class="text-charcoal-muted hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <p class="text-charcoal text-lg leading-relaxed font-light">
                  {reflection.content}
                </p>
                <div class="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <button class="flex items-center gap-2 text-charcoal-muted hover:text-primary transition-colors group">
                    <span class="material-symbols-outlined text-xl">favorite</span>
                    <span class="text-sm font-semibold">Resonar ({reflection.resonates})</span>
                  </button>
                  <button class="flex items-center gap-2 text-charcoal-muted hover:text-primary transition-colors group">
                    <span class="material-symbols-outlined text-xl">comment</span>
                    <span class="text-sm font-semibold">Apoyar ({reflection.supports})</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        
        {/* Right Sidebar */}
        <aside class="col-span-3 hidden xl:flex flex-col gap-8 h-fit sticky top-24">
          {/* Meditation Room CTA */}
          <button class="group relative w-full overflow-hidden rounded-2xl bg-charcoal p-8 text-center transition-all hover:shadow-xl hover:shadow-primary/10">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50"></div>
            <div class="relative z-10 flex flex-col items-center gap-4">
              <span class="material-symbols-outlined text-primary text-4xl">air</span>
              <h3 class="text-white text-lg font-bold tracking-tight">Sala de Meditación</h3>
              <p class="text-gray-400 text-xs leading-relaxed">Únete a 12 personas en reflexión silenciosa</p>
              <div class="mt-2 w-full py-3 bg-primary text-charcoal font-extrabold text-sm rounded-lg hover:bg-yellow-400 transition-colors">
                Entrar al Espacio
              </div>
            </div>
          </button>
          
          {/* Companions */}
          <div class="flex flex-col gap-6">
            <div class="flex items-center justify-between">
              <h3 class="text-charcoal font-bold text-sm">Compañeros de Viaje</h3>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded text-charcoal-muted">24 Online</span>
            </div>
            <div class="flex flex-col gap-4">
              {companions.map((companion) => (
                <div class="flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <div 
                        class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                        style={`background-image: url("${companion.avatar}");`}
                      ></div>
                      <div class="absolute bottom-0 right-0 size-3 bg-primary rounded-full border-2 border-white"></div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-charcoal group-hover:text-primary transition-colors">
                        {companion.name}
                      </span>
                      <span class="text-[10px] text-charcoal-muted uppercase font-bold tracking-tighter">
                        {companion.status}
                      </span>
                    </div>
                  </div>
                  <span class="material-symbols-outlined text-gray-300 text-lg">chat_bubble</span>
                </div>
              ))}
            </div>
            <button class="mt-2 text-center text-xs font-bold text-primary hover:underline transition-all">
              Ver Todos los Miembros
            </button>
          </div>
          
          {/* Community Support */}
          <div class="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col gap-4 luxury-shadow">
            <h4 class="text-sm font-bold">Soporte Comunitario</h4>
            <p class="text-xs text-charcoal-muted leading-relaxed">
              Sin juicios, solo crecimiento. Nuestros moderadores están aquí para asegurar un espacio seguro para tu vulnerabilidad.
            </p>
            <div class="flex items-center gap-2 text-primary">
              <span class="material-symbols-outlined text-sm">shield_with_heart</span>
              <span class="text-[10px] font-bold uppercase tracking-wider">Espacio Seguro Certificado</span>
            </div>
          </div>
        </aside>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <footer class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 grid grid-cols-4 items-center justify-items-center z-50">
        <a href="/" class="text-charcoal-muted">
          <span class="material-symbols-outlined">dashboard</span>
        </a>
        <a href="/library" class="text-charcoal-muted">
          <span class="material-symbols-outlined">library_books</span>
        </a>
        <a href="/taberna" class="text-primary">
          <span class="material-symbols-outlined">forum</span>
        </a>
        <a href="/profile" class="text-charcoal-muted">
          <span class="material-symbols-outlined">person</span>
        </a>
      </footer>
    </div>
  )
}
