// =====================================================
// Leader Blueprint - API de Autenticación
// =====================================================

import { Hono } from 'hono'
import { 
  hashPassword, 
  verifyPassword, 
  generateAuthTokens, 
  generateRefreshToken,
  getRefreshTokenExpiry,
  validateEmail, 
  validatePassword,
  sanitizeUser 
} from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import type { Bindings, Variables, User, RegisterRequest, LoginRequest } from '../types'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// POST /api/auth/register - Registro de Usuario
// =====================================================

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<RegisterRequest>()
    const { email, password, name } = body

    // Validaciones
    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Email, contraseña y nombre son requeridos' }, 400)
    }

    if (!validateEmail(email)) {
      return c.json({ success: false, error: 'Email inválido' }, 400)
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json({ success: false, error: passwordValidation.errors.join('. ') }, 400)
    }

    // Verificar si el email ya existe
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first()

    if (existingUser) {
      return c.json({ success: false, error: 'Este email ya está registrado' }, 409)
    }

    // Crear usuario
    const userId = crypto.randomUUID()
    const passwordHash = await hashPassword(password)

    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status)
      VALUES (?, ?, ?, ?, 'user', 'active')
    `).bind(userId, email.toLowerCase(), passwordHash, name).run()

    // Crear acceso gratuito por defecto
    await c.env.DB.prepare(`
      INSERT INTO user_access (id, user_id, access_type, is_active)
      VALUES (?, ?, 'free', 1)
    `).bind(crypto.randomUUID(), userId).run()

    // Crear registro de racha
    await c.env.DB.prepare(`
      INSERT INTO user_streaks (id, user_id, current_streak, longest_streak, total_xp, level)
      VALUES (?, ?, 0, 0, 0, 1)
    `).bind(crypto.randomUUID(), userId).run()

    // Obtener usuario creado
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first<User>()

    // Generar tokens
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    const tokens = await generateAuthTokens(user!, secret)

    // Guardar refresh token
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      tokens.refreshToken,
      getRefreshTokenExpiry().toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run()

    // Obtener acceso
    const access = await c.env.DB.prepare(
      'SELECT * FROM user_access WHERE user_id = ? AND is_active = 1'
    ).bind(userId).first()

    return c.json({
      success: true,
      message: 'Registro exitoso',
      data: {
        user: sanitizeUser(user),
        tokens,
        access
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
    const body = await c.req.json<LoginRequest>()
    const { email, password } = body

    if (!email || !password) {
      return c.json({ success: false, error: 'Email y contraseña son requeridos' }, 400)
    }

    // Buscar usuario
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first<User & { password_hash: string }>()

    if (!user) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401)
    }

    // Verificar estado
    if (user.status !== 'active') {
      return c.json({ success: false, error: 'Cuenta suspendida o inactiva' }, 403)
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401)
    }

    // Generar tokens
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    const tokens = await generateAuthTokens(user, secret)

    // Guardar sesión
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.id,
      tokens.refreshToken,
      getRefreshTokenExpiry().toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run()

    // Obtener acceso actual
    const access = await c.env.DB.prepare(`
      SELECT * FROM user_access 
      WHERE user_id = ? AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.id).first()

    return c.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: sanitizeUser(user),
        tokens,
        access
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Error al iniciar sesión' }, 500)
  }
})

// =====================================================
// POST /api/auth/refresh - Refrescar Token
// =====================================================

auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json<{ refreshToken: string }>()
    const { refreshToken } = body

    if (!refreshToken) {
      return c.json({ success: false, error: 'Refresh token requerido' }, 400)
    }

    // Buscar sesión válida
    const session = await c.env.DB.prepare(`
      SELECT us.*, u.* FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.refresh_token = ? AND us.expires_at > datetime('now')
    `).bind(refreshToken).first<any>()

    if (!session) {
      return c.json({ success: false, error: 'Refresh token inválido o expirado' }, 401)
    }

    // Eliminar sesión antigua
    await c.env.DB.prepare(
      'DELETE FROM user_sessions WHERE refresh_token = ?'
    ).bind(refreshToken).run()

    // Generar nuevos tokens
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    const user: User = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatar_url: session.avatar_url,
      role: session.role,
      status: session.status,
      email_verified: Boolean(session.email_verified),
      created_at: session.created_at,
      updated_at: session.updated_at
    }
    const tokens = await generateAuthTokens(user, secret)

    // Crear nueva sesión
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.id,
      tokens.refreshToken,
      getRefreshTokenExpiry().toISOString(),
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run()

    return c.json({
      success: true,
      data: { tokens }
    })

  } catch (error) {
    console.error('Refresh error:', error)
    return c.json({ success: false, error: 'Error al refrescar token' }, 500)
  }
})

// =====================================================
// POST /api/auth/logout - Cerrar Sesión
// =====================================================

auth.post('/logout', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<{ refreshToken?: string }>().catch(() => ({}))

    if (body.refreshToken) {
      // Eliminar sesión específica
      await c.env.DB.prepare(
        'DELETE FROM user_sessions WHERE user_id = ? AND refresh_token = ?'
      ).bind(user.id, body.refreshToken).run()
    } else {
      // Eliminar todas las sesiones del usuario
      await c.env.DB.prepare(
        'DELETE FROM user_sessions WHERE user_id = ?'
      ).bind(user.id).run()
    }

    return c.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ success: false, error: 'Error al cerrar sesión' }, 500)
  }
})

// =====================================================
// GET /api/auth/me - Obtener Usuario Actual
// =====================================================

auth.get('/me', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const access = c.get('userAccess')

    // Obtener racha
    const streak = await c.env.DB.prepare(
      'SELECT * FROM user_streaks WHERE user_id = ?'
    ).bind(user.id).first()

    return c.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        access,
        streak
      }
    })

  } catch (error) {
    console.error('Get me error:', error)
    return c.json({ success: false, error: 'Error al obtener información del usuario' }, 500)
  }
})

export default auth
