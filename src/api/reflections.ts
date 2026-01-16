// =====================================================
// Leader Blueprint - API de Reflexiones/Comunidad
// =====================================================

import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../middleware/auth'
import type { Bindings, Variables, CreateReflectionRequest } from '../types'

const reflections = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/reflections - Listar Reflexiones Públicas
// =====================================================

reflections.get('/', optionalAuth, async (c) => {
  try {
    const user = c.get('user')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const filter = c.req.query('filter') // 'all', 'my_journey', 'resonated'
    const offset = (page - 1) * limit

    let whereClause = 'r.is_public = 1'
    const params: any[] = []

    if (filter === 'my_journey' && user) {
      whereClause = 'r.user_id = ?'
      params.push(user.id)
    } else if (filter === 'resonated' && user) {
      whereClause = `r.id IN (
        SELECT reflection_id FROM reflection_reactions 
        WHERE user_id = ? AND reaction_type = 'resonate'
      )`
      params.push(user.id)
    }

    // Contar total
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM reflections r WHERE ${whereClause}`
    ).bind(...params).first<{ total: number }>()

    // Obtener reflexiones
    const reflectionsResult = await c.env.DB.prepare(`
      SELECT r.*, 
             u.name as author_name, 
             u.avatar_url as author_avatar,
             (SELECT COUNT(*) FROM reflection_reactions rr 
              WHERE rr.reflection_id = r.id AND rr.reaction_type = 'resonate') as resonate_count,
             (SELECT COUNT(*) FROM reflection_reactions rr 
              WHERE rr.reflection_id = r.id AND rr.reaction_type = 'support') as support_count
      FROM reflections r
      JOIN users u ON u.id = r.user_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    // Si hay usuario, agregar si ha reaccionado
    let reflectionsWithUserReactions = reflectionsResult.results
    if (user) {
      reflectionsWithUserReactions = await Promise.all(
        reflectionsResult.results.map(async (r: any) => {
          const userReactions = await c.env.DB.prepare(`
            SELECT reaction_type FROM reflection_reactions
            WHERE reflection_id = ? AND user_id = ?
          `).bind(r.id, user.id).all()

          const reactionTypes = userReactions.results.map((rr: any) => rr.reaction_type)

          return {
            ...r,
            user_resonated: reactionTypes.includes('resonate'),
            user_supported: reactionTypes.includes('support')
          }
        })
      )
    }

    return c.json({
      success: true,
      data: reflectionsWithUserReactions,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get reflections error:', error)
    return c.json({ success: false, error: 'Error al obtener reflexiones' }, 500)
  }
})

// =====================================================
// POST /api/reflections - Crear Reflexión
// =====================================================

reflections.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<CreateReflectionRequest>()

    if (!body.content || body.content.trim().length === 0) {
      return c.json({ success: false, error: 'El contenido es requerido' }, 400)
    }

    if (body.content.length > 2000) {
      return c.json({ success: false, error: 'El contenido no puede exceder 2000 caracteres' }, 400)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO reflections (id, user_id, lesson_id, content, is_public)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      body.lesson_id || null,
      body.content.trim(),
      body.is_public !== false ? 1 : 0
    ).run()

    // Otorgar XP por reflexión
    if (body.is_public !== false) {
      await c.env.DB.prepare(`
        INSERT INTO xp_log (id, user_id, xp_amount, reason, reference_type, reference_id)
        VALUES (?, ?, 10, 'Reflexión compartida', 'reflection', ?)
      `).bind(crypto.randomUUID(), user.id, id).run()

      // Actualizar XP total
      await c.env.DB.prepare(`
        UPDATE user_streaks SET total_xp = total_xp + 10, 
               level = (total_xp + 10) / 1000 + 1,
               updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(user.id).run()
    }

    const reflection = await c.env.DB.prepare(`
      SELECT r.*, u.name as author_name, u.avatar_url as author_avatar
      FROM reflections r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = ?
    `).bind(id).first()

    return c.json({
      success: true,
      message: body.is_public !== false ? '¡Reflexión compartida! +10 XP' : 'Reflexión guardada',
      data: reflection
    }, 201)

  } catch (error) {
    console.error('Create reflection error:', error)
    return c.json({ success: false, error: 'Error al crear reflexión' }, 500)
  }
})

// =====================================================
// DELETE /api/reflections/:id - Eliminar Reflexión
// =====================================================

reflections.delete('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const reflectionId = c.req.param('id')

    const reflection = await c.env.DB.prepare(
      'SELECT id, user_id FROM reflections WHERE id = ?'
    ).bind(reflectionId).first<{ id: string; user_id: string }>()

    if (!reflection) {
      return c.json({ success: false, error: 'Reflexión no encontrada' }, 404)
    }

    // Solo el autor o admin puede eliminar
    if (reflection.user_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso para eliminar esta reflexión' }, 403)
    }

    // Eliminar reacciones primero
    await c.env.DB.prepare(
      'DELETE FROM reflection_reactions WHERE reflection_id = ?'
    ).bind(reflectionId).run()

    // Eliminar reflexión
    await c.env.DB.prepare(
      'DELETE FROM reflections WHERE id = ?'
    ).bind(reflectionId).run()

    return c.json({
      success: true,
      message: 'Reflexión eliminada'
    })

  } catch (error) {
    console.error('Delete reflection error:', error)
    return c.json({ success: false, error: 'Error al eliminar reflexión' }, 500)
  }
})

// =====================================================
// POST /api/reflections/:id/react - Reaccionar
// =====================================================

reflections.post('/:id/react', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const reflectionId = c.req.param('id')
    const body = await c.req.json<{ reaction_type: 'resonate' | 'support' }>()

    if (!body.reaction_type || !['resonate', 'support'].includes(body.reaction_type)) {
      return c.json({ success: false, error: 'Tipo de reacción inválido' }, 400)
    }

    // Verificar que la reflexión existe
    const reflection = await c.env.DB.prepare(
      'SELECT id, user_id FROM reflections WHERE id = ?'
    ).bind(reflectionId).first()

    if (!reflection) {
      return c.json({ success: false, error: 'Reflexión no encontrada' }, 404)
    }

    // Verificar si ya reaccionó
    const existingReaction = await c.env.DB.prepare(`
      SELECT id FROM reflection_reactions 
      WHERE reflection_id = ? AND user_id = ? AND reaction_type = ?
    `).bind(reflectionId, user.id, body.reaction_type).first()

    if (existingReaction) {
      // Quitar reacción
      await c.env.DB.prepare(
        'DELETE FROM reflection_reactions WHERE id = ?'
      ).bind((existingReaction as any).id).run()

      return c.json({
        success: true,
        message: 'Reacción eliminada',
        data: { reacted: false }
      })
    } else {
      // Agregar reacción
      await c.env.DB.prepare(`
        INSERT INTO reflection_reactions (id, reflection_id, user_id, reaction_type)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), reflectionId, user.id, body.reaction_type).run()

      return c.json({
        success: true,
        message: body.reaction_type === 'resonate' ? '¡Resonaste!' : '¡Apoyo enviado!',
        data: { reacted: true }
      })
    }

  } catch (error) {
    console.error('React error:', error)
    return c.json({ success: false, error: 'Error al procesar reacción' }, 500)
  }
})

// =====================================================
// GET /api/reflections/journal - Diario Personal
// =====================================================

reflections.get('/journal', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    // Contar total
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM reflections WHERE user_id = ?'
    ).bind(user.id).first<{ total: number }>()

    // Obtener entradas del diario (todas, públicas y privadas)
    const entries = await c.env.DB.prepare(`
      SELECT r.*, 
             l.title as lesson_title,
             m.title as module_title,
             f.title as formation_title
      FROM reflections r
      LEFT JOIN lessons l ON l.id = r.lesson_id
      LEFT JOIN modules m ON m.id = l.module_id
      LEFT JOIN formations f ON f.id = m.formation_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all()

    return c.json({
      success: true,
      data: entries.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get journal error:', error)
    return c.json({ success: false, error: 'Error al obtener diario' }, 500)
  }
})

export default reflections
