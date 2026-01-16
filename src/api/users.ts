// =====================================================
// Leader Blueprint - API de Usuarios
// =====================================================

import { Hono } from 'hono'
import { hashPassword, verifyPassword, sanitizeUser } from '../lib/auth'
import { requireAuth, requireAdmin } from '../middleware/auth'
import type { Bindings, Variables, User, UpdateProfileRequest } from '../types'

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/users/profile - Obtener Perfil Completo
// =====================================================

users.get('/profile', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const access = c.get('userAccess')

    // Obtener racha y estadísticas
    const streak = await c.env.DB.prepare(
      'SELECT * FROM user_streaks WHERE user_id = ?'
    ).bind(user.id).first()

    // Obtener conteo de progreso
    const progressStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(*) as total_started
      FROM user_progress 
      WHERE user_id = ?
    `).bind(user.id).first<{ completed_lessons: number; total_started: number }>()

    // Obtener reflexiones
    const reflectionCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM reflections WHERE user_id = ?'
    ).bind(user.id).first<{ count: number }>()

    // Obtener sesiones de mentoría
    const sessionsCount = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('pending', 'confirmed') THEN 1 END) as upcoming
      FROM mentorship_sessions 
      WHERE user_id = ?
    `).bind(user.id).first<{ completed: number; upcoming: number }>()

    return c.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        access: access ? {
          ...access,
          has_premium: access.access_type !== 'free'
        } : { access_type: 'free', has_premium: false },
        stats: {
          streak: streak || { current_streak: 0, longest_streak: 0, total_xp: 0, level: 1 },
          lessons_completed: progressStats?.completed_lessons || 0,
          lessons_started: progressStats?.total_started || 0,
          reflections: reflectionCount?.count || 0,
          mentorship_sessions: {
            completed: sessionsCount?.completed || 0,
            upcoming: sessionsCount?.upcoming || 0
          }
        }
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ success: false, error: 'Error al obtener perfil' }, 500)
  }
})

// =====================================================
// PUT /api/users/profile - Actualizar Perfil
// =====================================================

users.put('/profile', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<UpdateProfileRequest>()
    
    const updates: string[] = []
    const values: any[] = []

    if (body.name && body.name.trim()) {
      updates.push('name = ?')
      values.push(body.name.trim())
    }

    if (body.avatar_url !== undefined) {
      updates.push('avatar_url = ?')
      values.push(body.avatar_url || null)
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No hay campos para actualizar' }, 400)
    }

    updates.push('updated_at = datetime("now")')
    values.push(user.id)

    await c.env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run()

    // Obtener usuario actualizado
    const updatedUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(user.id).first<User>()

    return c.json({
      success: true,
      message: 'Perfil actualizado',
      data: { user: sanitizeUser(updatedUser!) }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ success: false, error: 'Error al actualizar perfil' }, 500)
  }
})

// =====================================================
// PUT /api/users/password - Cambiar Contraseña
// =====================================================

users.put('/password', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<{ currentPassword: string; newPassword: string }>()

    if (!body.currentPassword || !body.newPassword) {
      return c.json({ success: false, error: 'Contraseña actual y nueva son requeridas' }, 400)
    }

    // Obtener hash actual
    const userData = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(user.id).first<{ password_hash: string }>()

    // Verificar contraseña actual
    const isValid = await verifyPassword(body.currentPassword, userData!.password_hash)
    if (!isValid) {
      return c.json({ success: false, error: 'Contraseña actual incorrecta' }, 401)
    }

    // Hash nueva contraseña
    const newHash = await hashPassword(body.newPassword)

    // Actualizar
    await c.env.DB.prepare(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newHash, user.id).run()

    // Invalidar todas las sesiones excepto la actual
    await c.env.DB.prepare(
      'DELETE FROM user_sessions WHERE user_id = ?'
    ).bind(user.id).run()

    return c.json({
      success: true,
      message: 'Contraseña actualizada. Por favor, inicia sesión de nuevo.'
    })

  } catch (error) {
    console.error('Update password error:', error)
    return c.json({ success: false, error: 'Error al cambiar contraseña' }, 500)
  }
})

// =====================================================
// GET /api/users/progress - Obtener Progreso Detallado
// =====================================================

users.get('/progress', requireAuth, async (c) => {
  try {
    const user = c.get('user')!

    // Obtener progreso por formación
    const formationProgress = await c.env.DB.prepare(`
      SELECT 
        f.id,
        f.title,
        f.slug,
        f.thumbnail_url,
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN l.id END) as completed_lessons,
        MAX(up.updated_at) as last_activity
      FROM formations f
      LEFT JOIN modules m ON m.formation_id = f.id AND m.is_published = 1
      LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = 1
      LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
      WHERE f.is_published = 1
      GROUP BY f.id
      ORDER BY last_activity DESC NULLS LAST
    `).bind(user.id).all()

    // Calcular porcentajes
    const formationsWithProgress = formationProgress.results.map((f: any) => ({
      ...f,
      progress_percent: f.total_lessons > 0 
        ? Math.round((f.completed_lessons / f.total_lessons) * 100) 
        : 0
    }))

    return c.json({
      success: true,
      data: { formations: formationsWithProgress }
    })

  } catch (error) {
    console.error('Get progress error:', error)
    return c.json({ success: false, error: 'Error al obtener progreso' }, 500)
  }
})

// =====================================================
// GET /api/users/activity - Historial de Actividad
// =====================================================

users.get('/activity', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const limit = parseInt(c.req.query('limit') || '20')

    // Obtener XP log reciente
    const xpLog = await c.env.DB.prepare(`
      SELECT * FROM xp_log 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(user.id, limit).all()

    // Obtener lecciones completadas recientemente
    const recentCompletions = await c.env.DB.prepare(`
      SELECT 
        up.*,
        l.title as lesson_title,
        m.title as module_title,
        f.title as formation_title
      FROM user_progress up
      JOIN lessons l ON l.id = up.lesson_id
      JOIN modules m ON m.id = l.module_id
      JOIN formations f ON f.id = m.formation_id
      WHERE up.user_id = ? AND up.status = 'completed'
      ORDER BY up.completed_at DESC
      LIMIT ?
    `).bind(user.id, limit).all()

    return c.json({
      success: true,
      data: {
        xp_history: xpLog.results,
        recent_completions: recentCompletions.results
      }
    })

  } catch (error) {
    console.error('Get activity error:', error)
    return c.json({ success: false, error: 'Error al obtener actividad' }, 500)
  }
})

// =====================================================
// ADMIN: GET /api/users - Listar Todos los Usuarios
// =====================================================

users.get('/', requireAuth, requireAdmin, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search') || ''
    const role = c.req.query('role') || ''
    const offset = (page - 1) * limit

    let whereClause = '1=1'
    const params: any[] = []

    if (search) {
      whereClause += ' AND (email LIKE ? OR name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (role) {
      whereClause += ' AND role = ?'
      params.push(role)
    }

    // Contar total
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`
    ).bind(...params).first<{ total: number }>()

    // Obtener usuarios
    const usersResult = await c.env.DB.prepare(`
      SELECT u.*, ua.access_type, ua.is_active as access_active, ua.expires_at
      FROM users u
      LEFT JOIN user_access ua ON ua.user_id = u.id AND ua.is_active = 1
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const sanitizedUsers = usersResult.results.map((u: any) => ({
      ...sanitizeUser(u),
      access: {
        type: u.access_type || 'free',
        is_active: Boolean(u.access_active),
        expires_at: u.expires_at
      }
    }))

    return c.json({
      success: true,
      data: sanitizedUsers,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('List users error:', error)
    return c.json({ success: false, error: 'Error al listar usuarios' }, 500)
  }
})

// =====================================================
// ADMIN: PUT /api/users/:id/access - Gestionar Acceso
// =====================================================

users.put('/:id/access', requireAuth, requireAdmin, async (c) => {
  try {
    const adminUser = c.get('user')!
    const userId = c.req.param('id')
    const body = await c.req.json<{
      access_type: 'free' | 'paid' | 'manual' | 'trial'
      expires_at?: string
      reason?: string
    }>()

    // Verificar que el usuario existe
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!targetUser) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 404)
    }

    // Desactivar accesos anteriores
    await c.env.DB.prepare(
      'UPDATE user_access SET is_active = 0, updated_at = datetime("now") WHERE user_id = ?'
    ).bind(userId).run()

    // Crear nuevo acceso
    await c.env.DB.prepare(`
      INSERT INTO user_access (id, user_id, access_type, access_granted_by, access_reason, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      crypto.randomUUID(),
      userId,
      body.access_type,
      adminUser.id,
      body.reason || null,
      body.expires_at || null
    ).run()

    return c.json({
      success: true,
      message: 'Acceso actualizado'
    })

  } catch (error) {
    console.error('Update access error:', error)
    return c.json({ success: false, error: 'Error al actualizar acceso' }, 500)
  }
})

export default users
