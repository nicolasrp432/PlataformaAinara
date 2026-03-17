
// =====================================================
// Leader Blueprint - API de Usuarios (D1)
// =====================================================

import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../middleware/auth'
import type { Bindings, Variables, UpdateProfileRequest } from '../types'

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/users/profile - Obtener Perfil Completo
// =====================================================

users.get('/profile', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const access = c.get('userAccess')

    // Obtener racha y estadísticas
    const streak = await c.env.DB.prepare('SELECT * FROM user_streaks WHERE id = ?').bind(user.id).first<any>()

    // Obtener conteo de progreso
    const { count: completedLessons } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'"
    ).bind(user.id).first<{ count: number }>()

    const { count: startedLessons } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?"
    ).bind(user.id).first<{ count: number }>()

    // Obtener reflexiones
    const { count: reflectionCount } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM reflections WHERE user_id = ?"
    ).bind(user.id).first<{ count: number }>()

    // Obtener sesiones de mentoría
    const { count: completedSessions } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM mentorship_sessions WHERE user_id = ? AND status = 'completed'"
    ).bind(user.id).first<{ count: number }>()

    const { count: upcomingSessions } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM mentorship_sessions WHERE user_id = ? AND status IN ('pending', 'confirmed')"
    ).bind(user.id).first<{ count: number }>()

    return c.json({
      success: true,
      data: {
        user,
        access: {
          ...access,
          has_premium: access?.access_type !== 'free'
        },
        stats: {
          streak: streak || { current_streak: 0, longest_streak: 0, total_xp: 0, level: 1 },
          lessons_completed: completedLessons || 0,
          lessons_started: startedLessons || 0,
          reflections: reflectionCount || 0,
          mentorship_sessions: {
            completed: completedSessions || 0,
            upcoming: upcomingSessions || 0
          }
        }
      }
    })

  } catch (error: any) {
    console.error('Get profile error:', error)
    return c.json({ success: false, error: error.message || 'Error al obtener perfil' }, 500)
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

    if (body.avatar_url) {
        updates.push('avatar_url = ?')
        values.push(body.avatar_url)
    }

    if (updates.length === 0) {
        return c.json({ success: true, message: 'Nada que actualizar' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    
    // Add ID to values for WHERE clause
    values.push(user.id)

    await c.env.DB.prepare(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    return c.json({
      success: true,
      message: 'Perfil actualizado'
    })

  } catch (error: any) {
    console.error('Update profile error:', error)
    return c.json({ success: false, error: error.message || 'Error al actualizar perfil' }, 500)
  }
})

export default users
