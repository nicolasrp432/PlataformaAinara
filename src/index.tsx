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

// APIs
import authApi from './api/auth'
import usersApi from './api/users'
import contentApi from './api/content'
import mentorshipApi from './api/mentorship'
import reflectionsApi from './api/reflections'

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

// Profile
app.get('/profile', (c) => {
  return c.render(<Profile />, { title: 'Mi Perfil | Leader Blueprint' })
})

// Mentorship
app.get('/mentorship', (c) => {
  return c.render(<Mentorship />, { title: 'Mentoría con Ainara | Leader Blueprint' })
})

// Login page
app.get('/login', (c) => {
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-luxury-ivory p-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <div class="size-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-white text-2xl">architecture</span>
          </div>
          <h1 class="text-2xl font-bold text-charcoal">Bienvenido de vuelta</h1>
          <p class="text-charcoal-muted">Inicia sesión en Leader Blueprint</p>
        </div>
        
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Email</label>
            <input 
              type="email" 
              id="email"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Contraseña</label>
            <input 
              type="password" 
              id="password"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>
          <div id="error-message" class="hidden text-red-500 text-sm"></div>
          <button 
            type="submit"
            class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-charcoal-muted">
            ¿No tienes cuenta? <a href="/register" class="text-primary font-semibold hover:underline">Regístrate</a>
          </p>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('login-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorDiv = document.getElementById('error-message');
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              localStorage.setItem('accessToken', data.data.tokens.accessToken);
              localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
              localStorage.setItem('user', JSON.stringify(data.data.user));
              window.location.href = '/';
            } else {
              errorDiv.textContent = data.error || 'Error al iniciar sesión';
              errorDiv.classList.remove('hidden');
            }
          } catch (error) {
            errorDiv.textContent = 'Error de conexión';
            errorDiv.classList.remove('hidden');
          }
        });
      `}} />
    </div>,
    { title: 'Iniciar Sesión | Leader Blueprint' }
  )
})

// Register page
app.get('/register', (c) => {
  return c.render(
    <div class="min-h-screen flex items-center justify-center bg-luxury-ivory p-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <div class="size-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-white text-2xl">architecture</span>
          </div>
          <h1 class="text-2xl font-bold text-charcoal">Crear Cuenta</h1>
          <p class="text-charcoal-muted">Únete a Leader Blueprint</p>
        </div>
        
        <form id="register-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Nombre</label>
            <input 
              type="text" 
              id="name"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Email</label>
            <input 
              type="email" 
              id="email"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Contraseña</label>
            <input 
              type="password" 
              id="password"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              required
            />
            <p class="text-xs text-charcoal-muted mt-1">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
          </div>
          <div id="error-message" class="hidden text-red-500 text-sm"></div>
          <button 
            type="submit"
            class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Crear Cuenta
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-charcoal-muted">
            ¿Ya tienes cuenta? <a href="/login" class="text-primary font-semibold hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('register-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorDiv = document.getElementById('error-message');
          
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              localStorage.setItem('accessToken', data.data.tokens.accessToken);
              localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
              localStorage.setItem('user', JSON.stringify(data.data.user));
              window.location.href = '/';
            } else {
              errorDiv.textContent = data.error || 'Error al registrar';
              errorDiv.classList.remove('hidden');
            }
          } catch (error) {
            errorDiv.textContent = 'Error de conexión';
            errorDiv.classList.remove('hidden');
          }
        });
      `}} />
    </div>,
    { title: 'Registro | Leader Blueprint' }
  )
})

// =====================================================
// API Routes
// =====================================================

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: c.env.ENVIRONMENT || 'development'
  })
})

// Mount API routers
app.route('/api/auth', authApi)
app.route('/api/users', usersApi)
app.route('/api/content', contentApi)
app.route('/api/mentorship', mentorshipApi)
app.route('/api/reflections', reflectionsApi)

// =====================================================
// 404 Handler
// =====================================================

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
