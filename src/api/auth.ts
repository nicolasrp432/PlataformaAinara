
// =====================================================
// Leader Blueprint - API de Autenticación (D1 + Custom JWT)
// =====================================================

import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { hashPassword, verifyPassword, generateAccessToken } from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import type { Bindings, Variables, RegisterRequest, LoginRequest, User } from '../types'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper to set session cookies
const setSessionCookies = (c: any, accessToken: string) => {
  const isProd = c.env.ENVIRONMENT === 'production'

  setCookie(c, 'sb-access-token', accessToken, {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    maxAge: 15 * 60 // 15 minutes
  })
  
  // Refresh token logic is simplified here (just re-using access token or needing a separate table)
  // For now, let's stick to access token or use a long-lived one for dev simplicity if needed.
  // But ideally we should implement refresh tokens.
}

// =====================================================
// POST /api/auth/register - Registro de Usuario
// =====================================================

auth.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json<RegisterRequest>()

    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Email, contraseña y nombre son requeridos' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>()
    if (existingUser) {
      return c.json({ success: false, error: 'El usuario ya existe' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)
    const userId = crypto.randomUUID()

    // Insert user
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, name, 'user', 'active', 0).run()

    // Create user_access (Free plan by default)
    await c.env.DB.prepare(
      'INSERT INTO user_access (id, user_id, plan_id, access_type, is_active) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), userId, 'plan_free', 'free', 1).run()

    const newUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>()
    
    if (!newUser) throw new Error('Error creating user')

    const token = await generateAccessToken(newUser, c.env.JWT_SECRET)
    setSessionCookies(c, token)

    return c.json({
      success: true,
      message: 'Registro exitoso',
      data: {
        user: newUser,
        session: { access_token: token }
      }
    }, 201)

  } catch (error) {
    console.error('Register error:', error)
    return c.json({ success: false, error: 'Error al registrar usuario' }, 500)
  }
})

// =====================================================
// POST /api/auth/login - Inicio de Sesión
// =====================================================

auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json<LoginRequest>()

    if (!email || !password) {
      return c.json({ success: false, error: 'Email y contraseña son requeridos' }, 400)
    }

    // Find user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User & { password_hash: string }>()

    if (!user) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      // Log failed attempt (TODO: Implement logging table)
      console.log(`Failed login attempt for ${email}`)
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401)
    }

    // Generate token
    const token = await generateAccessToken(user, c.env.JWT_SECRET)
    setSessionCookies(c, token)

    // Update last login (optional)
    // await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run()

    // Remove sensitive data
    const { password_hash, ...safeUser } = user

    return c.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: safeUser,
        session: { access_token: token }
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Error al iniciar sesión' }, 500)
  }
})

// =====================================================
// POST /api/auth/logout - Cerrar Sesión
// =====================================================

auth.post('/logout', (c) => {
  deleteCookie(c, 'sb-access-token')
  deleteCookie(c, 'sb-refresh-token')
  return c.json({ success: true, message: 'Sesión cerrada' })
})

// =====================================================
// GET /api/auth/me - Usuario Actual
// =====================================================

auth.get('/me', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ success: true, data: { user } })
})

export default auth
