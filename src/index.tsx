
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

// Pages
import { Dashboard } from './pages/Dashboard'
import { Quest } from './pages/Quest'
import { Taberna } from './pages/Taberna'
import { Library } from './pages/Library'
import { Profile } from './pages/Profile'
import { Mentorship } from './pages/Mentorship'

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminContent } from './pages/admin/AdminContent'
import { AdminThemes } from './pages/admin/AdminThemes'

// APIs
import authApi from './api/auth'
import usersApi from './api/users'
import contentApi from './api/content'
import mentorshipApi from './api/mentorship'
import reflectionsApi from './api/reflections'
import adminApi from './api/admin'

import { requireAuth, requireAdmin, optionalAuth, hasPremiumAccess } from './middleware/auth'
import type { Bindings, Variables } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}))

// Renderer middleware for pages
app.use(renderer)

// =====================================================
// Page Routes
// =====================================================

// Dashboard - Home
app.get('/', requireAuth, async (c) => {
  const profile = c.get('user')
  if (!profile) return c.redirect('/login')

  // Fetch streak and XP
  const streakData = await c.env.DB.prepare('SELECT * FROM user_streaks WHERE id = ?').bind(profile.id).first<any>()

  const streak = streakData || { current_streak: 0, total_xp: 0 }

  // Fetch progress metrics
  const completedQuestsResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'"
  ).bind(profile.id).first<{ count: number }>()

  const totalQuestsResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM lessons"
  ).first<{ count: number }>()

  const totalReflectionsResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM reflections WHERE user_id = ?"
  ).bind(profile.id).first<{ count: number }>()

  // Fetch upcoming insights (latest published lessons)
  const { results: recommendations } = await c.env.DB.prepare(`
    SELECT l.*, m.slug as module_slug 
    FROM lessons l 
    LEFT JOIN modules m ON l.module_id = m.id 
    WHERE l.is_published = 1 
    ORDER BY l.created_at DESC 
    LIMIT 3
  `).all<any>()

  const formattedInsights = recommendations?.map((l: any) => ({
    id: l.id,
    title: l.title,
    description: l.description || '',
    duration: '10 min',
    category: l.content_type === 'video' ? 'Video Masterclass' : 'Lectura Cognitiva',
    icon: l.content_type === 'video' ? 'play_circle' : 'article',
    slug: l.module_slug // Assuming we want module slug here based on original code 'modules(slug)'
  })) || []

  const dashboardProgress = {
    completedQuests: completedQuestsResult?.count || 0,
    totalQuests: totalQuestsResult?.count || 0,
    learningHours: Math.floor((completedQuestsResult?.count || 0) * 0.5), // Estimate
    currentStreak: streak.current_streak || 0,
    totalXP: streak.total_xp || 0,
    totalReflections: totalReflectionsResult?.count || 0
  }

  return c.render(
    <Dashboard 
      profile={profile as any} 
      streak={streak as any}
      progress={dashboardProgress}
      upcomingInsights={formattedInsights}
    />
  )
})

// Login Page
app.get('/login', (c) => {
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
            <span class="material-symbols-rounded text-3xl">architecture</span>
          </div>
          <h1 class="text-2xl font-serif text-stone-900 mb-2">Bienvenido de vuelta</h1>
          <p class="text-stone-500">Inicia sesión en Leader Blueprint</p>
        </div>

        <form onsubmit="handleLogin(event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="tu@email.com" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">Contraseña</label>
            <input type="password" name="password" required class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" />
          </div>

          <div id="login-error" class="text-red-500 text-sm text-center hidden"></div>

          <button type="submit" class="w-full bg-gold-600 hover:bg-gold-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-gold-500/20">
            Iniciar Sesión
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-stone-500">
          ¿No tienes cuenta? <a href="/register" class="text-gold-600 hover:text-gold-700 font-medium">Regístrate</a>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function handleLogin(e) {
          e.preventDefault()
          const form = e.target
          const email = form.email.value
          const password = form.password.value
          const errorEl = document.getElementById('login-error')
          
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            })
            
            const data = await res.json()
            
            if (data.success) {
              window.location.href = '/'
            } else {
              errorEl.textContent = data.error || 'Error al iniciar sesión'
              errorEl.classList.remove('hidden')
            }
          } catch (err) {
            errorEl.textContent = 'Error de conexión'
            errorEl.classList.remove('hidden')
          }
        }
      ` }} />
    </div>
  )
})

// Register Page
app.get('/register', (c) => {
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
            <span class="material-symbols-rounded text-3xl">person_add</span>
          </div>
          <h1 class="text-2xl font-serif text-stone-900 mb-2">Crear Cuenta</h1>
          <p class="text-stone-500">Únete a Leader Blueprint</p>
        </div>

        <form onsubmit="handleRegister(event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">Nombre Completo</label>
            <input type="text" name="name" required class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Juan Pérez" />
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="tu@email.com" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">Contraseña</label>
            <input type="password" name="password" required class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" />
          </div>

          <div id="register-error" class="text-red-500 text-sm text-center hidden"></div>

          <button type="submit" class="w-full bg-gold-600 hover:bg-gold-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-gold-500/20">
            Registrarse
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-stone-500">
          ¿Ya tienes cuenta? <a href="/login" class="text-gold-600 hover:text-gold-700 font-medium">Inicia Sesión</a>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function handleRegister(e) {
          e.preventDefault()
          const form = e.target
          const name = form.name.value
          const email = form.email.value
          const password = form.password.value
          const errorEl = document.getElementById('register-error')
          
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password })
            })
            
            const data = await res.json()
            
            if (data.success) {
              window.location.href = '/'
            } else {
              errorEl.textContent = data.error || 'Error al registrarse'
              errorEl.classList.remove('hidden')
            }
          } catch (err) {
            errorEl.textContent = 'Error de conexión'
            errorEl.classList.remove('hidden')
          }
        }
      ` }} />
    </div>
  )
})

// =====================================================
// Admin Routes
// =====================================================

app.get('/admin', requireAdmin, async (c) => {
    const profile = c.get('user')!

    // Stats
    const totalUsersResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
    const premiumUsersResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM user_access WHERE access_type != 'free' AND is_active = 1").first<{ count: number }>()
    const activeFormationsResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM formations WHERE is_published = 1').first<{ count: number }>()
    const totalLessonsResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM lessons').first<{ count: number }>()
    const upcomingSessionsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM mentorship_sessions WHERE status IN ('pending', 'confirmed') AND scheduled_at >= ?").bind(new Date().toISOString()).first<{ count: number }>()
    const xpResult = await c.env.DB.prepare('SELECT SUM(total_xp) as xp FROM user_streaks').first<{ xp: number }>()

    const { results: recentUsers } = await c.env.DB.prepare(`
        SELECT u.id, u.name, u.email, u.created_at, a.access_type 
        FROM users u 
        LEFT JOIN user_access a ON u.id = a.user_id AND a.is_active = 1 
        ORDER BY u.created_at DESC 
        LIMIT 5
    `).all<any>()

    return c.render(
        <AdminDashboard 
            profile={profile as any}
            stats={{
                totalUsers: totalUsersResult?.count || 0,
                premiumUsers: premiumUsersResult?.count || 0,
                activeFormations: activeFormationsResult?.count || 0,
                totalLessons: totalLessonsResult?.count || 0,
                upcomingSessions: upcomingSessionsResult?.count || 0,
                totalXpAwarded: xpResult?.xp || 0
            }}
            recentUsers={recentUsers || []}
        />
    )
})

app.get('/admin/users', requireAdmin, async (c) => {
    const profile = c.get('user')!
    const search = c.req.query('search') || ''
    const role = c.req.query('role') || ''
    const access = c.req.query('access') || ''

    let query = `
        SELECT u.*, a.access_type, a.expires_at, s.total_xp, s.current_streak
        FROM users u
        LEFT JOIN user_access a ON u.id = a.user_id AND a.is_active = 1
        LEFT JOIN user_streaks s ON u.id = s.id
        WHERE 1=1
    `
    const params: any[] = []

    if (search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ?)`
        params.push(`%${search}%`, `%${search}%`)
    }

    if (role) {
        query += ` AND u.role = ?`
        params.push(role)
    }

    if (access) {
        query += ` AND a.access_type = ?`
        params.push(access)
    }

    query += ` ORDER BY u.created_at DESC`

    const { results: users } = await c.env.DB.prepare(query).bind(...params).all<any>()

    return c.render(
        <AdminUsers 
            profile={profile as any}
            users={users || []}
            pagination={{ page: 1, limit: 100, total: users?.length || 0, totalPages: 1 }}
            filters={{ search, role, access }}
        />
    )
})

// Mount APIs
app.route('/api/auth', authApi)
app.route('/api/users', usersApi)
app.route('/api/content', contentApi)
app.route('/api/mentorship', mentorshipApi)
app.route('/api/reflections', reflectionsApi)
app.route('/api/admin', adminApi)

export default app
