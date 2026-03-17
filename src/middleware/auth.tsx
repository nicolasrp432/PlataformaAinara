
/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx'
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import { verifyAccessToken } from '../lib/auth'
import type { Bindings, Variables, User, UserAccess } from '../types'

// =====================================================
// Helper: Obtener Sesión Local
// =====================================================

async function getLocalSession(c: Context<{ Bindings: Bindings }>) {
  const token = getCookie(c, 'sb-access-token')
  if (!token) return null

  // Verify JWT
  const payload = await verifyAccessToken(token, c.env.JWT_SECRET)
  if (!payload) return null

  return { ...payload, access_token: token }
}

// =====================================================
// Middleware: Autenticación Requerida
// =====================================================

export const requireAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    // Try to get session from cookie
    const session = await getLocalSession(c)

    if (!session) {
      // Clear cookies if session is invalid
      c.header('Set-Cookie', 'sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
      c.header('Set-Cookie', 'sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

      if (c.req.path.startsWith('/api/')) {
        return c.json({ success: false, error: 'Sesión expirada o no iniciada' }, 401)
      }
      return c.redirect('/login')
    }

    // Get user profile from D1
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first<User>()

    if (!user) {
       // User deleted?
       return c.redirect('/login')
    }

    // Get access info
    const access = await c.env.DB.prepare(
      'SELECT * FROM user_access WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).bind(session.sub).first<UserAccess>()

    // Store in context
    c.set('user', user)
    c.set('userAccess', access || null)
    c.set('session', { 
        access_token: session.access_token,
        user: { id: user.id, email: user.email, role: user.role } 
    } as any)

    await next()
  }
)

// =====================================================
// Middleware: Autenticación Opcional
// =====================================================

export const optionalAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const session = await getLocalSession(c)

    if (session) {
      const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first<User>()

      if (user) {
        const access = await c.env.DB.prepare(
          'SELECT * FROM user_access WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
        ).bind(session.sub).first<UserAccess>()

        c.set('user', user)
        c.set('userAccess', access || null)
        c.set('session', { 
            access_token: session.access_token,
            user: { id: user.id, email: user.email, role: user.role } 
        } as any)
      }
    }

    await next()
  }
)

// =====================================================
// Middleware: Requerir Rol de Admin
// =====================================================

export const requireAdmin = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')

    if (!user) {
      if (c.req.path.startsWith('/api/')) {
        return c.json({ success: false, error: 'Autenticación requerida' }, 401)
      }
      return c.redirect('/login')
    }

    if (user.role !== 'admin') {
      if (c.req.path.startsWith('/api/')) {
        return c.json({ success: false, error: 'Acceso denegado: Se requieren permisos de administrador' }, 403)
      }
      // Redirect to home if not admin
      return c.redirect('/')
    }

    await next()
  }
)

export const hasPremiumAccess = (access: UserAccess | null) => {
  if (!access) return false
  return ['paid', 'manual', 'trial'].includes(access.access_type) && access.is_active
}
