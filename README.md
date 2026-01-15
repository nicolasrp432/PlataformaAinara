# Leader Blueprint - Plataforma de Formación Premium

## Descripción del Proyecto
Leader Blueprint es una plataforma web premium de formación y transformación personal inspirada en la arquitectura de aprendizaje modular (LX Design). Combina micro-learning, gamificación ética y comunidad para crear una experiencia de aprendizaje transformacional.

## URLs
- **Sandbox**: http://localhost:3000
- **Producción**: (Pendiente despliegue a Cloudflare Pages)

## Características Implementadas

### 1. Dashboard Principal (`/`)
- **Métricas de Consistencia**: Racha de días consecutivos de aprendizaje
- **Sistema XP Cognitivo**: Gamificación con niveles y progreso visual
- **Módulo Recomendado**: Hero card con micro-módulo personalizado
- **Próximos Insights**: Grid de módulos próximos a explorar
- **Sidebar**: 
  - Acceso a La Taberna (comunidad)
  - Widget de Introspección diaria
  - Información del Mentor

### 2. Reproductor Micro-Learning (`/quest/:id`)
- **Video Player Premium**: Controles personalizados con estética de lujo
- **Progreso de Quest**: Lista de lecciones con estados (completo/reproduciendo/bloqueado)
- **Suite de Transformación**:
  - Alineación de Frecuencia (432Hz)
  - Voz del Crítico Interior (externalización de pensamientos)
- **Aide-Mémoire**: Recursos descargables del módulo
- **Footer con estadísticas**: Tiempo de sesión, nivel de enfoque, sincronización

### 3. La Taberna - Comunidad (`/taberna`)
- **Feed de Reflexiones**: Publicaciones de la comunidad
- **Composer**: Crear nuevas reflexiones
- **Navegación lateral**: Sala de meditación, grupos, mensajes, biblioteca
- **Compañeros de Viaje**: Usuarios online con estado de actividad
- **Sala de Meditación**: CTA para sesiones de meditación grupal
- **Soporte Comunitario**: Badge de espacio seguro certificado

### 4. Biblioteca (`/library`)
- **Grid de Quests**: Tarjetas con imagen, categoría, progreso
- **Filtros por categoría**: Mindset, Productividad, Filosofía, Neurociencia
- **Estados de Quest**: Completado, En progreso, Nuevo
- **Estadísticas resumen**: Quests completados, en progreso, por comenzar

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/user/progress` | Progreso del usuario |
| GET | `/api/quests` | Lista de quests |
| GET | `/api/reflections` | Reflexiones de la comunidad |
| POST | `/api/reflections` | Crear nueva reflexión |
| POST | `/api/journal` | Guardar entrada de diario |

## Stack Tecnológico
- **Framework**: Hono (Edge-first web framework)
- **Estilos**: Tailwind CSS con configuración premium
- **Iconos**: Material Symbols
- **Tipografías**: 
  - Playfair Display (títulos serif)
  - Manrope (cuerpo sans-serif)
- **Deploy**: Cloudflare Pages

## Principios de Diseño

### Arquitectura de Información (LX Design)
- **Regla de los 3 segundos**: Dashboard con acciones claras e inmediatas
- **Micro-aprendizaje**: Sesiones de 5-15 minutos
- **Carga cognitiva controlada**: Divulgación progresiva de información
- **Patrón de lectura F**: Métricas críticas en cuadrante superior izquierdo

### Paleta de Colores Premium
- **Primary Gold**: `#C5A059`
- **Luxury Gold**: `#D4AF37`
- **Charcoal**: `#2D2D2D`
- **Ivory Background**: `#FDFCFB`

### Gamificación Ética
- XP y niveles para motivación
- La Taberna como espacio no competitivo
- Enfoque en consistencia sobre velocidad

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Iniciar servidor de desarrollo (sandbox)
npm run dev:sandbox

# O con PM2:
pm2 start ecosystem.config.cjs

# Desplegar a Cloudflare Pages
npm run deploy:prod
```

## Próximas Funcionalidades

- [ ] Autenticación de usuarios
- [ ] Base de datos D1 para persistencia
- [ ] Reproductor de video real con streaming
- [ ] Reproductor de audio para frecuencias solfeggio
- [ ] Sistema de mentoría con chat
- [ ] Sistema de pagos con Paddle/Lemon Squeezy
- [ ] PWA con notificaciones push
- [ ] Modo oscuro

## Autor
Desarrollado siguiendo las directrices de diseño instruccional modular para plataformas de transformación personal premium.
