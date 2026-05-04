# Design System — Plataforma Educativa Premium

## 1. Filosofía del producto

La plataforma debe transmitir:
- **claridad**: el usuario entiende dónde está, qué debe hacer y cuánto progreso lleva.
- **confianza**: la interfaz se percibe sólida, profesional y bien organizada.
- **calidez**: el aprendizaje debe sentirse acogedor, no frío ni corporativo.
- **progreso visible**: cada acción del usuario refuerza avance y motivación.
- **evolución incremental**: construir paso a paso sin reinventar la rueda, aprovechando herramientas probadas y gratuitas cuando agreguen valor real.

### Principios rectores
1. **No reinventar la rueda**  
   Priorizar patrones UI conocidos y fáciles de usar.
2. **Primero la experiencia del alumno**  
   Todo componente debe ayudar a aprender, avanzar o retomar contenido rápido.
3. **Menos fricción, más lectura**  
   Interfaces limpias, jerarquía fuerte, poco ruido visual.
4. **Escalar sin romper la esencia**  
   La base visual debe mantenerse estable mientras se agregan nuevas funciones.
5. **Usar herramientas poderosas y gratuitas cuando aplique**  
   Sin comprometer identidad, rendimiento ni mantenibilidad.

---

## 2. Identidad visual

### Sensación general
La interfaz debe parecer:
- moderna
- elegante
- premium
- cercana
- ordenada
- suave, con microcontraste y profundidad ligera

### Referencias de estilo
Inspiración visual basada en:
- dashboards de alta gama
- tarjetas flotantes
- paneles modulares
- gradientes suaves
- fondos cálidos neutrales
- acentos amarillos/dorados
- tipografía limpia y muy legible

### Evitar
- interfaces demasiado saturadas
- colores muy agresivos
- sombras duras
- bordes rectos fríos
- exceso de líneas divisorias
- estética “enterprise” pesada
- componentes demasiado personalizados que rompan usabilidad

---

## 3. Paleta de color

## 3.1 Colores base

### Fondo principal
- `#F5F1E8` — crema cálido principal
- `#EEE8DB` — crema secundario
- `#E4DECF` — superficie suave

### Superficies
- `#FFFFFF` — tarjetas claras
- `#F8F5EF` — paneles secundarios
- `#2B2B2B` — superficie oscura para estados destacados o cards especiales

### Texto
- `#171717` — texto principal
- `#434343` — texto secundario
- `#6B6B6B` — texto terciario
- `#A1A1A1` — texto deshabilitado

### Acento principal
- `#F6D25C` — amarillo cálido principal
- `#E8C544` — amarillo fuerte para énfasis
- `#FFECA6` — amarillo suave de fondo o highlight

### Neutros de UI
- `#D7D0C2` — bordes suaves
- `#C5BEAE` — divisores / líneas tenues
- `#9E9585` — iconografía secundaria

### Estados
- **Éxito**: `#7BBF6A`
- **Advertencia**: `#E8B84A`
- **Error**: `#D96C6C`
- **Info**: `#6D9EEB`

---

## 3.2 Regla de uso del color

### Proporción recomendada
- **70%** base clara y neutra
- **20%** superficies y tarjetas
- **10%** acentos amarillos/dorados

### Regla clave
El amarillo/dorado se usa para:
- progreso
- estados activos
- botones primarios
- indicadores
- resaltados
- métricas importantes

No debe usarse para todo. Su valor viene de la moderación.

### Gradientes recomendados
Usar gradientes muy suaves y cálidos:
- crema → amarillo pálido
- blanco → beige
- negro suave → gris cálido en paneles especiales

---

## 4. Tipografía

### Familia tipográfica recomendada
Usar una sans moderna, limpia y altamente legible.

Opciones:
- **Inter**
- **Manrope**
- **DM Sans**
- **Plus Jakarta Sans**

### Recomendación principal
**Inter** para máxima claridad y escalabilidad.

### Jerarquía
- **H1**: 40–56 px, peso 500–600, tracking ligero negativo
- **H2**: 28–36 px, peso 500–600
- **H3**: 20–24 px, peso 500–600
- **Body large**: 16–18 px, peso 400–500
- **Body**: 14–16 px, peso 400
- **Caption**: 12–13 px, peso 400
- **Micro label**: 10–11 px, peso 500, mayúsculas suaves si aplica

### Reglas tipográficas
- Evitar demasiados pesos distintos.
- No usar letras extremadamente condensadas.
- El contenido debe leerse cómodamente en pantallas grandes y móviles.
- Títulos cortos, claros, de alta jerarquía.
- Los números de métricas deben verse elegantes y protagonistas.

### Estilo de números y métricas
Las métricas importantes deben ser grandes, limpias y con alto contraste.
Ejemplos:
- progreso
- horas vistas
- módulos completados
- porcentaje finalizado
- sesiones restantes

---

## 5. Espaciado y layout

### Sistema base
Usar una escala de espaciado consistente:
- 4 px
- 8 px
- 12 px
- 16 px
- 24 px
- 32 px
- 40 px
- 48 px
- 64 px

### Regla
Todo el sistema debe alinearse a múltiplos de 8, excepto microajustes visuales.

### Layout
- Dashboard con distribución modular
- tarjetas de tamaños variados, pero alineadas en grilla
- zonas visuales bien separadas
- prioridad al contenido útil sobre la decoración

### Estructura recomendada
1. barra superior de navegación
2. bloque hero con saludo + estado general
3. métricas principales
4. progreso del alumno
5. módulos o cursos activos
6. calendario / agenda / actividad
7. panel lateral de acciones rápidas o estado

---

## 6. Forma y bordes

### Border radius
El sistema debe ser muy redondeado, pero elegante:
- chips: 9999px
- botones: 14–18px
- cards: 20–28px
- paneles grandes: 28–36px

### Regla
Los bordes redondos comunican suavidad, modernidad y cercanía.  
Evitar esquinas duras salvo casos funcionales.

### Bordes
- bordes finos de bajo contraste
- preferir separación por sombra y color antes que líneas duras

---

## 7. Sombras y profundidad

### Estilo de sombra
Las sombras deben ser:
- suaves
- amplias
- poco agresivas
- con sensación de elevación natural

### Ejemplo de enfoque
- sombra pequeña para botones
- sombra media para tarjetas
- sombra suave y amplia para paneles principales

### Regla importante
La sombra nunca debe competir con el contenido. Solo debe ayudar a leer capas.

---

## 8. Componentes principales

## 8.1 Botones

### Botón primario
- fondo amarillo/dorado
- texto oscuro
- border radius alto
- hover con ligera elevación
- uso para CTA principal: comenzar curso, continuar, guardar, completar módulo

### Botón secundario
- fondo claro
- borde sutil
- texto oscuro
- hover suave

### Botón terciario / ghost
- sin fondo
- solo texto o ícono
- para acciones poco prioritarias

### Reglas
- Un solo botón primario por bloque.
- No saturar la interfaz con demasiados CTA iguales.
- El CTA principal debe ser evidente sin gritar.

---

## 8.2 Cards

Las cards son la base del sistema.

### Tipos
- **Card de progreso**
- **Card de curso**
- **Card de lección**
- **Card de métrica**
- **Card de actividad**
- **Card de perfil**
- **Card de calendario**

### Estilo
- fondo claro
- bordes redondeados
- padding generoso
- contenido bien alineado
- iconografía simple
- sombras sutiles

### Regla
Cada card debe tener un propósito único.  
Si una card mezcla demasiadas funciones, se debe dividir.

---

## 8.3 Navegación

### Estilo
- barra superior compacta
- chips o tabs redondeados
- resaltado del estado activo con fondo oscuro o acento cálido
- iconos pequeños y limpios

### Navegación ideal
- Dashboard
- Cursos
- Progreso
- Certificados
- Calendario
- Perfil

### Regla
La navegación debe ayudar a volver rápido al contenido, no imponer complejidad.

---

## 8.4 Progreso

El progreso es el corazón del producto.

### Formas de mostrar progreso
- barra horizontal
- anillo circular
- porcentaje textual
- checklist por pasos
- cronograma de avance
- estado de módulo: pendiente / en curso / completado

### Regla visual
El progreso debe ser:
- fácil de entender en 1 segundo
- visible en varias zonas de la interfaz
- motivador, pero no infantil

### Estados
- completado: amarillo/verde suave
- en curso: amarillo principal
- pendiente: gris cálido
- bloqueado: neutro oscuro

---

## 8.5 Listas y tablas

### Estilo
- filas limpias
- separación suave
- hover sutil
- badges discretos
- acciones al final de la fila

### Uso
Ideal para:
- lista de cursos
- historial de progreso
- alumnos
- pagos
- certificados
- tareas pendientes

### Regla
Las tablas deben seguir siendo amables visualmente.  
No usar densidad extrema a menos que el caso lo requiera.

---

## 8.6 Inputs y formularios

### Estilo
- bordes suaves
- fondo claro
- foco visible pero elegante
- label siempre claro
- ayuda contextual pequeña

### Campos
- texto
- búsqueda
- selección
- fecha
- contraseña
- archivo

### Reglas
- el placeholder no debe reemplazar al label
- el error debe explicarse con lenguaje simple
- el estado de foco debe ser visible sin ser intrusivo

---

## 9. Iconografía

### Estilo
- minimalista
- lineal
- redondeado
- consistente
- tamaño reducido

### Recomendación
Usar una librería gratuita y sólida:
- Lucide
- Heroicons
- Phosphor Icons

### Regla
Los iconos deben apoyar al texto, no reemplazarlo.

---

## 10. Imágenes y avatars

### Estilo fotográfico
- personas reales
- expresiones naturales
- luz cálida
- fondos limpios
- look profesional pero humano

### Avatars
- circulares o levemente redondeados
- bordes suaves
- superposición para equipos o participantes

### Regla
Las imágenes deben reforzar confianza, cercanía y pertenencia.

---

## 11. Microinteracciones

### Animaciones
- suaves
- cortas
- naturales
- nunca exageradas

### Usos
- hover de botones
- transición de cards
- cambio de estado de progreso
- apertura de menú
- carga de contenido
- feedback de completado

### Duración recomendada
- 150 ms a 250 ms para microinteracciones
- 250 ms a 400 ms para transiciones de paneles

### Regla
La animación debe aportar claridad, no espectáculo.

---

## 12. Estados de UI

### Estados obligatorios
- default
- hover
- focus
- active
- disabled
- loading
- success
- warning
- error

### Regla
Todos los componentes importantes deben contemplar estos estados desde el inicio.

---

## 13. Contenido y tono

### Voz del producto
- clara
- motivadora
- cercana
- profesional
- humana

### Evitar
- lenguaje excesivamente técnico
- mensajes fríos
- microcopy genérico
- texto demasiado largo

### Ejemplos de tono
- “Continúa tu aprendizaje”
- “Tu próximo paso”
- “Has completado este módulo”
- “Te falta poco para terminar”
- “Retoma desde donde lo dejaste”

### Regla
Cada texto debe ayudar a avanzar.

---

## 14. Reglas de negocio para la plataforma educativa

## 14.1 Progreso del usuario
Cada usuario debe tener:
- porcentaje global de avance
- progreso por curso
- progreso por módulo
- progreso por lección
- historial de actividad

### Criterio de avance
Una lección se considera completada cuando:
- el usuario la visualizó según el criterio definido
- o marcó explícitamente como completada
- o pasó una validación si aplica

### Regla
El progreso debe ser confiable y no inflarse artificialmente.

---

## 14.2 Reanudación inteligente
Si el usuario abandona un video o módulo:
- guardar el último punto
- permitir retomar fácilmente
- resaltar el contenido pendiente

### Regla
El sistema debe reducir fricción al máximo.

---

## 14.3 Estructura escalable
Diseñar el producto para crecer por etapas:

### Fase 1
- login
- catálogo de cursos
- player de video
- progreso básico
- panel del alumno

### Fase 2
- quizzes
- certificados
- calendario
- actividad reciente
- historial

### Fase 3
- rutas de aprendizaje
- recomendaciones
- analítica avanzada
- dashboards para instructores/admin

### Regla
No construir complejidad antes de validar la necesidad.

---

## 14.4 Reglas de certificación
Un certificado se desbloquea cuando:
- el curso está completado
- y se cumplieron los requisitos definidos

### Regla
Las certificaciones deben ser transparentes y verificables.

---

## 14.5 Reglas para contenido
Cada curso debe poder contener:
- descripción
- nivel
- duración estimada
- módulos
- lecciones
- recursos descargables
- estado de progreso

### Regla
El contenido debe ser fácil de actualizar por el equipo sin tocar diseño base.

---

## 15. Accesibilidad

### Requisitos mínimos
- contraste suficiente
- navegación por teclado
- foco visible
- textos legibles
- tamaños táctiles cómodos
- estados no dependientes solo del color

### Regla
Diseñar para todos desde el inicio.

---

## 16. Responsividad

### En desktop
- máximo aprovechamiento del espacio
- dashboards en múltiples columnas
- panel lateral visible

### En tablet
- colapsar paneles secundarios
- mantener jerarquía clara

### En móvil
- priorizar:
  - progreso
  - curso actual
  - siguiente acción
- convertir grids en una sola columna
- evitar saturar la pantalla

### Regla
La interfaz debe seguir siendo excelente en pantallas pequeñas.

---

## 17. Stack sugerido

Sin reinventar la rueda, usar herramientas probadas y gratuitas cuando aporten valor:

### Frontend
- React / Next.js
- TypeScript
- Tailwind CSS o sistema equivalente
- Radix UI para accesibilidad y base de componentes
- shadcn/ui si encaja con la dirección visual

### UI / iconos / contenido
- Lucide Icons
- React Hook Form para formularios
- Zod para validación
- Framer Motion para microanimaciones suaves

### Video
- player estándar y confiable
- soporte para progreso persistente
- analytics básico de reproducción

### Regla
Elegir herramientas que aceleren, no que compliquen.

---

## 18. Tokens de diseño sugeridos

## 18.1 Colores
- `--bg`: `#F5F1E8`
- `--bg-soft`: `#EEE8DB`
- `--surface`: `#FFFFFF`
- `--surface-strong`: `#2B2B2B`
- `--text`: `#171717`
- `--text-muted`: `#434343`
- `--border`: `#D7D0C2`
- `--primary`: `#F6D25C`
- `--primary-strong`: `#E8C544`
- `--primary-soft`: `#FFECA6`

## 18.2 Radio
- `--radius-sm`: `12px`
- `--radius-md`: `18px`
- `--radius-lg`: `24px`
- `--radius-xl`: `32px`

## 18.3 Sombra
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`

## 18.4 Espaciado
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px

---

## 19. Do / Don't

### Do
- usar fondos suaves
- mantener buena jerarquía
- construir componentes reutilizables
- destacar progreso
- respetar el espacio en blanco
- mantener consistencia visual
- usar acentos con intención

### Don't
- abusar de colores
- llenar la pantalla de widgets sin propósito
- usar sombras duras
- mezclar demasiadas tipografías
- hacer microinteracciones exageradas
- complicar navegación innecesariamente

---

## 20. Criterio final de calidad

La plataforma debe sentirse:
- clara
- elegante
- moderna
- útil
- confiable
- escalable

Si una decisión visual o funcional:
- confunde,
- satura,
- distrae,
- o daña la esencia del producto,

entonces debe simplificarse.

La prioridad es construir una experiencia educativa premium, humana y evolutiva.