import { Hono } from 'hono'
import { renderer } from './renderer'
import { Dashboard } from './pages/Dashboard'
import { Quest } from './pages/Quest'
import { Taberna } from './pages/Taberna'
import { Library } from './pages/Library'

const app = new Hono()

app.use(renderer)

// Dashboard - Home
app.get('/', (c) => {
  return c.render(<Dashboard />, { title: 'Dashboard | Leader Blueprint' })
})

// Quest/Learning Module
app.get('/quest/:id', (c) => {
  const questId = c.req.param('id')
  return c.render(<Quest questId={questId} />, { title: 'Micro-Learning Quest | Leader Blueprint' })
})

// Default Quest Route
app.get('/quest', (c) => {
  return c.redirect('/quest/morning-ritual')
})

// La Taberna - Community
app.get('/taberna', (c) => {
  return c.render(<Taberna />, { title: 'La Taberna | Comunidad Leader Blueprint' })
})

// Library
app.get('/library', (c) => {
  return c.render(<Library />, { title: 'Biblioteca | Leader Blueprint' })
})

// API Routes
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API - Get User Progress
app.get('/api/user/progress', (c) => {
  return c.json({
    consistency: {
      days: 14,
      streak: true,
      changePercent: 2
    },
    xp: {
      current: 12450,
      nextLevel: 15000,
      level: 4
    },
    completedQuests: 12,
    totalQuests: 24,
    learningHours: 18.5,
    reflections: 47
  })
})

// API - Get Quests
app.get('/api/quests', (c) => {
  return c.json({
    quests: [
      {
        id: 'morning-ritual',
        title: 'El Ritual Matutino',
        category: 'Mindset',
        duration: '40 min',
        lessons: 4,
        progress: 65,
        status: 'in-progress'
      },
      {
        id: 'emotional-granularity',
        title: 'Granularidad Emocional',
        category: 'Neurociencia',
        duration: '35 min',
        lessons: 5,
        progress: 0,
        status: 'not-started'
      },
      {
        id: 'stoic-resilience',
        title: 'Resiliencia Estoica',
        category: 'Filosofía',
        duration: '45 min',
        lessons: 6,
        progress: 100,
        status: 'completed'
      }
    ]
  })
})

// API - Get Community Reflections
app.get('/api/reflections', (c) => {
  return c.json({
    reflections: [
      {
        id: 1,
        author: 'Elena Rodriguez',
        time: 'Hace 2 horas',
        path: 'Camino Mindful',
        content: 'Hoy me di cuenta de que "no saber" es en realidad una posición de poder.',
        resonates: 12,
        supports: 4
      },
      {
        id: 2,
        author: 'Julian Thorne',
        time: 'Hace 5 horas',
        path: 'Deep-Dive Creativo',
        content: 'La arquitectura de nuestros pensamientos define el paisaje de nuestras vidas.',
        resonates: 28,
        supports: 9
      }
    ]
  })
})

// API - Save Reflection
app.post('/api/reflections', async (c) => {
  const body = await c.req.json()
  return c.json({
    success: true,
    message: 'Reflexión guardada',
    reflection: {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    }
  })
})

// API - Save Journal Entry
app.post('/api/journal', async (c) => {
  const body = await c.req.json()
  return c.json({
    success: true,
    message: 'Entrada de diario guardada',
    entry: {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    }
  })
})

// 404 Handler
app.notFound((c) => {
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-luxury-ivory">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-primary mb-4">404</h1>
        <p class="text-xl text-charcoal-muted mb-8">Página no encontrada</p>
        <a href="/" class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">
          Volver al Dashboard
        </a>
      </div>
    </div>,
    { title: '404 | Leader Blueprint' }
  )
})

export default app
