# Plataforma Ainara

> Plataforma educativa integral de desarrollo personal, autoconocimiento y sabiduría consciente, impulsada por inteligencia artificial en tiempo real y arquitectura moderna.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange?style=flat&logo=google)](https://ai.google.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Características Principales

### 1. Formaciones y Aprendizaje Consciente
- **Catálogo Estructurado**: Formaciones organizadas por módulos y lecciones secuenciales con control de progreso.
- **Seguimiento Dinámico**: Registro de lecciones completadas, cálculo de porcentajes y acumulación de experiencia (XP) y niveles.
- **Reproductor Adaptativo**: Soporte para streaming de video con persistencia del avance del estudiante.

### 2. Tutor y Asistente IA en Tiempo Real (Google Gemini)
- **Acompañamiento Pedagógico**: Tutor interactivo impulsado por Google Gemini (`gemini-3.5-flash`) con streaming SSE fluido.
- **Contexto Curricular Completo**: Conocimiento en tiempo real de la lección activa, módulos y catálogo global de cursos para responder dudas formativas.
- **Resiliencia Multi-Nivel**: Arquitectura tolerante a fallos con fallback secundario y generador autónomo de contingencia.

### 3. Sistema de Mensajería Instantánea Multi-Transporte
- **Comunicación en Tiempo Real**: Mensajería directa entre usuarios con entrega sub-50ms mediante WebSockets y Supabase Broadcast.
- **Diseño Split-Screen & Mobile**: Bandeja lateral reactiva con buscador dinámico en escritorio y navegación fluida en dispositivos móviles.
- **Confirmaciones de Lectura y Estado**: Indicadores de envío (`✓`), lectura (`✓✓`), escritura en vivo y separadores cronológicos.
- **Alertas Sonoras Nativas**: Sintetizador armónico mediante **Web Audio API** (sin dependencias de archivos externos) y notificaciones interactivas *in-app*.

### 4. La Taberna (Comunidad de Reflexión)
- **Espacio Social de Crecimiento**: Publicaciones y debates organizados por temas y etiquetas interactivas.
- **Interacción y Resonancia**: Sistema de reacciones ("Resonar"), comentarios en hilo y perfiles conectables.

### 5. Diario Personal de Introspección
- **Espacio Íntimo del Estudiante**: Editor enriquecido para asentar aprendizajes y revelaciones diarias.
- **Métricas y Clima Emocional**: Conteo de palabras, tiempo estimado de lectura y categorización por estados de ánimo.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Diseño & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Backend & BD** | [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Realtime Engine, Supabase Auth) |
| **Inteligencia Artificial** | [Google Gemini API](https://ai.google.dev/) (`gemini-3.5-flash`), Server-Sent Events (SSE) |
| **Pagos & Facturación** | [Stripe](https://stripe.com/) (Checkout & Webhooks) |
| **Audio** | Pure Web Audio API (sintetizador armónico nativo) |

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos previos
- **Node.js** 20.x o superior
- **npm**, **pnpm** o **yarn**
- Proyecto en **Supabase** (PostgreSQL)

### 1. Clonar el repositorio
```bash
git clone https://github.com/nicolasrp432/PlataformaAinara.git
cd PlataformaAinara
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia la plantilla de configuración:
```bash
cp .env.example .env.local
```
Edita `.env.local` con las credenciales de tu proyecto Supabase y servicios correspondientes:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Asistente IA (Google Gemini)
GEMINI_API_KEY=tu-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
```

> [!IMPORTANT]
> Nunca incluyas credenciales reales en repositorios públicos. El archivo `.env.local` está ignorado por `.gitignore` por defecto.

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 🔒 Seguridad y Control de Acceso

- **Row Level Security (RLS)**: Cada tabla en Supabase cuenta con políticas RLS que aíslan los datos de cada usuario y restringen la edición administrativa.
- **Roles del Sistema**:
  - `student`: Acceso a formaciones inscritas, diario personal, comunidad y mensajería.
  - `mentor`: Capacidades de tutoría y seguimiento.
  - `admin`: Panel de control de contenidos, formaciones y métricas globales.
- **Gestión de Secretos**: Todas las llamadas a modelos de IA y servicios de pago se gestionan desde el servidor mediante Next.js Route Handlers y Server Actions, evitando exponer credenciales en el cliente.

---

## 📁 Estructura del Proyecto

```
PlataformaAinara/
├── app/                        # Next.js 15 App Router
│   ├── (admin)/                # Panel de administración
│   ├── (auth)/                 # Autenticación (login, registro)
│   ├── (platform)/             # Área privada de estudiantes
│   │   ├── assistant/          # Tutor IA Ainara
│   │   ├── formations/         # Catálogo y detalle de cursos
│   │   ├── learn/              # Visor interactivo de clases
│   │   ├── messages/           # Mensajería instantánea
│   │   ├── reflexion/          # Diario de reflexión
│   │   └── taberna/            # Comunidad social
│   └── api/                    # Endpoints y webhooks (AI, Stripe, etc.)
├── components/                 # Componentes de UI modulares y accesibles
├── lib/                        # Clientes de BD, servicios y utilidades
├── migrations/                 # Migraciones SQL para Supabase
└── public/                     # Recursos estáticos
```

---

## 📄 Licencia

Este proyecto es propiedad privada de **Ainara Plataforma**. Todos los derechos reservados.
