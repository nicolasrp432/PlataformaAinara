// =====================================================
// Leader Blueprint - API de Contenido Educativo
// =====================================================

import { Hono } from 'hono'
import { requireAuth, requireAdmin, optionalAuth, hasPremiumAccess } from '../middleware/auth'
import type { Bindings, Variables, Formation, Module, Lesson } from '../types'

const content = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/content/formations - Listar Formaciones
// =====================================================

content.get('/formations', optionalAuth, async (c) => {
  try {
    const user = c.get('user')
    const isPremium = hasPremiumAccess(c)
    const isAdmin = user?.role === 'admin'

    let query = `
      SELECT f.*, 
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT l.id) as lesson_count,
        SUM(l.video_duration_seconds) as total_duration_seconds
      FROM formations f
      LEFT JOIN modules m ON m.formation_id = f.id ${isAdmin ? '' : 'AND m.is_published = 1'}
      LEFT JOIN lessons l ON l.module_id = m.id ${isAdmin ? '' : 'AND l.is_published = 1'}
    `

    if (!isAdmin) {
      query += ' WHERE f.is_published = 1'
    }

    query += ' GROUP BY f.id ORDER BY f.sort_order ASC'

    const formations = await c.env.DB.prepare(query).all()

    // Si hay usuario, agregar progreso
    let formationsWithProgress = formations.results
    if (user) {
      formationsWithProgress = await Promise.all(formations.results.map(async (f: any) => {
        const progress = await c.env.DB.prepare(`
          SELECT 
            COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN l.id END) as completed,
            COUNT(DISTINCT l.id) as total
          FROM lessons l
          JOIN modules m ON m.id = l.module_id
          LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
          WHERE m.formation_id = ? AND l.is_published = 1 AND m.is_published = 1
        `).bind(user.id, f.id).first<{ completed: number; total: number }>()

        return {
          ...f,
          user_progress: progress ? {
            completed: progress.completed,
            total: progress.total,
            percent: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
          } : null,
          // Ocultar si es premium y usuario no tiene acceso
          is_locked: f.is_premium && !isPremium && !isAdmin
        }
      }))
    }

    return c.json({
      success: true,
      data: formationsWithProgress
    })

  } catch (error) {
    console.error('Get formations error:', error)
    return c.json({ success: false, error: 'Error al obtener formaciones' }, 500)
  }
})

// =====================================================
// GET /api/content/formations/:slug - Detalle de Formación
// =====================================================

content.get('/formations/:slug', optionalAuth, async (c) => {
  try {
    const slug = c.req.param('slug')
    const user = c.get('user')
    const isPremium = hasPremiumAccess(c)
    const isAdmin = user?.role === 'admin'

    // Obtener formación
    const formation = await c.env.DB.prepare(`
      SELECT * FROM formations WHERE slug = ? ${isAdmin ? '' : 'AND is_published = 1'}
    `).bind(slug).first<Formation>()

    if (!formation) {
      return c.json({ success: false, error: 'Formación no encontrada' }, 404)
    }

    // Verificar acceso
    const isLocked = formation.is_premium && !isPremium && !isAdmin

    // Obtener módulos con lecciones
    const modules = await c.env.DB.prepare(`
      SELECT * FROM modules 
      WHERE formation_id = ? ${isAdmin ? '' : 'AND is_published = 1'}
      ORDER BY sort_order ASC
    `).bind(formation.id).all()

    const modulesWithLessons = await Promise.all(modules.results.map(async (m: any) => {
      const lessons = await c.env.DB.prepare(`
        SELECT id, title, slug, description, content_type, video_duration_seconds, 
               is_free_preview, sort_order
        FROM lessons 
        WHERE module_id = ? ${isAdmin ? '' : 'AND is_published = 1'}
        ORDER BY sort_order ASC
      `).bind(m.id).all()

      // Agregar estado de bloqueo y progreso
      const lessonsWithState = await Promise.all(lessons.results.map(async (l: any) => {
        let userProgress = null
        if (user) {
          userProgress = await c.env.DB.prepare(
            'SELECT status, progress_percent, last_position_seconds FROM user_progress WHERE user_id = ? AND lesson_id = ?'
          ).bind(user.id, l.id).first()
        }

        return {
          ...l,
          is_locked: isLocked && !l.is_free_preview,
          user_progress: userProgress
        }
      }))

      // Calcular progreso del módulo
      const completedLessons = lessonsWithState.filter(l => l.user_progress?.status === 'completed').length
      const moduleProgress = lessonsWithState.length > 0 
        ? Math.round((completedLessons / lessonsWithState.length) * 100)
        : 0

      return {
        ...m,
        lessons: lessonsWithState,
        progress_percent: moduleProgress
      }
    }))

    // Calcular progreso total
    const allLessons = modulesWithLessons.flatMap(m => m.lessons)
    const totalCompleted = allLessons.filter(l => l.user_progress?.status === 'completed').length
    const totalProgress = allLessons.length > 0 
      ? Math.round((totalCompleted / allLessons.length) * 100)
      : 0

    return c.json({
      success: true,
      data: {
        ...formation,
        is_locked: isLocked,
        modules: modulesWithLessons,
        user_progress: {
          completed: totalCompleted,
          total: allLessons.length,
          percent: totalProgress
        }
      }
    })

  } catch (error) {
    console.error('Get formation error:', error)
    return c.json({ success: false, error: 'Error al obtener formación' }, 500)
  }
})

// =====================================================
// GET /api/content/lessons/:id - Detalle de Lección
// =====================================================

content.get('/lessons/:id', optionalAuth, async (c) => {
  try {
    const lessonId = c.req.param('id')
    const user = c.get('user')
    const isPremium = hasPremiumAccess(c)
    const isAdmin = user?.role === 'admin'

    // Obtener lección con módulo y formación
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, m.title as module_title, m.formation_id, 
             f.title as formation_title, f.slug as formation_slug, f.is_premium
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN formations f ON f.id = m.formation_id
      WHERE l.id = ? ${isAdmin ? '' : 'AND l.is_published = 1 AND m.is_published = 1 AND f.is_published = 1'}
    `).bind(lessonId).first<any>()

    if (!lesson) {
      return c.json({ success: false, error: 'Lección no encontrada' }, 404)
    }

    // Verificar acceso
    const isLocked = lesson.is_premium && !lesson.is_free_preview && !isPremium && !isAdmin

    if (isLocked) {
      // Devolver info limitada
      return c.json({
        success: true,
        data: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content_type: lesson.content_type,
          video_duration_seconds: lesson.video_duration_seconds,
          module_title: lesson.module_title,
          formation_title: lesson.formation_title,
          is_locked: true,
          upgrade_required: true
        }
      })
    }

    // Obtener progreso del usuario
    let userProgress = null
    if (user) {
      userProgress = await c.env.DB.prepare(
        'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?'
      ).bind(user.id, lesson.id).first()
    }

    // Obtener lección anterior y siguiente
    const navigation = await c.env.DB.prepare(`
      SELECT id, title, slug FROM lessons 
      WHERE module_id = ? AND is_published = 1 AND sort_order < ?
      ORDER BY sort_order DESC LIMIT 1
    `).bind(lesson.module_id, lesson.sort_order).first()

    const nextLesson = await c.env.DB.prepare(`
      SELECT id, title, slug FROM lessons 
      WHERE module_id = ? AND is_published = 1 AND sort_order > ?
      ORDER BY sort_order ASC LIMIT 1
    `).bind(lesson.module_id, lesson.sort_order).first()

    // Parsear recursos si existen
    let resources = []
    if (lesson.resources) {
      try {
        resources = JSON.parse(lesson.resources)
      } catch {}
    }

    return c.json({
      success: true,
      data: {
        ...lesson,
        resources,
        is_locked: false,
        user_progress: userProgress,
        navigation: {
          previous: navigation,
          next: nextLesson
        }
      }
    })

  } catch (error) {
    console.error('Get lesson error:', error)
    return c.json({ success: false, error: 'Error al obtener lección' }, 500)
  }
})

// =====================================================
// POST /api/content/lessons/:id/progress - Actualizar Progreso
// =====================================================

content.post('/lessons/:id/progress', requireAuth, async (c) => {
  try {
    const lessonId = c.req.param('id')
    const user = c.get('user')!
    const body = await c.req.json<{
      status?: 'in_progress' | 'completed'
      progress_percent?: number
      last_position_seconds?: number
    }>()

    // Verificar que la lección existe
    const lesson = await c.env.DB.prepare(
      'SELECT id, module_id FROM lessons WHERE id = ?'
    ).bind(lessonId).first()

    if (!lesson) {
      return c.json({ success: false, error: 'Lección no encontrada' }, 404)
    }

    // Verificar si ya existe progreso
    const existingProgress = await c.env.DB.prepare(
      'SELECT id, status FROM user_progress WHERE user_id = ? AND lesson_id = ?'
    ).bind(user.id, lessonId).first<{ id: string; status: string }>()

    const isCompleting = body.status === 'completed' && existingProgress?.status !== 'completed'

    if (existingProgress) {
      // Actualizar progreso existente
      await c.env.DB.prepare(`
        UPDATE user_progress SET
          status = COALESCE(?, status),
          progress_percent = COALESCE(?, progress_percent),
          last_position_seconds = COALESCE(?, last_position_seconds),
          completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        body.status || null,
        body.progress_percent ?? null,
        body.last_position_seconds ?? null,
        body.status || null,
        existingProgress.id
      ).run()
    } else {
      // Crear nuevo progreso
      await c.env.DB.prepare(`
        INSERT INTO user_progress (id, user_id, lesson_id, status, progress_percent, last_position_seconds, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        user.id,
        lessonId,
        body.status || 'in_progress',
        body.progress_percent || 0,
        body.last_position_seconds || 0,
        body.status === 'completed' ? new Date().toISOString() : null
      ).run()
    }

    // Si completó la lección, otorgar XP
    if (isCompleting) {
      const xpAmount = 50 // XP por lección

      // Registrar XP
      await c.env.DB.prepare(`
        INSERT INTO xp_log (id, user_id, xp_amount, reason, reference_type, reference_id)
        VALUES (?, ?, ?, 'Lección completada', 'lesson', ?)
      `).bind(crypto.randomUUID(), user.id, xpAmount, lessonId).run()

      // Actualizar racha
      await c.env.DB.prepare(`
        INSERT INTO user_streaks (id, user_id, current_streak, longest_streak, total_xp, level, last_activity_date)
        VALUES (?, ?, 1, 1, ?, 1, date('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          total_xp = total_xp + ?,
          level = (total_xp + ?) / 1000 + 1,
          current_streak = CASE 
            WHEN last_activity_date = date('now', '-1 day') THEN current_streak + 1
            WHEN last_activity_date = date('now') THEN current_streak
            ELSE 1
          END,
          longest_streak = MAX(longest_streak, 
            CASE 
              WHEN last_activity_date = date('now', '-1 day') THEN current_streak + 1
              ELSE 1
            END
          ),
          last_activity_date = date('now'),
          updated_at = datetime('now')
      `).bind(crypto.randomUUID(), user.id, xpAmount, xpAmount, xpAmount).run()
    }

    return c.json({
      success: true,
      message: isCompleting ? '¡Lección completada! +50 XP' : 'Progreso guardado'
    })

  } catch (error) {
    console.error('Update progress error:', error)
    return c.json({ success: false, error: 'Error al actualizar progreso' }, 500)
  }
})

// =====================================================
// ADMIN: POST /api/content/formations - Crear Formación
// =====================================================

content.post('/formations', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json<Partial<Formation>>()

    if (!body.title || !body.slug) {
      return c.json({ success: false, error: 'Título y slug son requeridos' }, 400)
    }

    // Verificar slug único
    const existing = await c.env.DB.prepare(
      'SELECT id FROM formations WHERE slug = ?'
    ).bind(body.slug).first()

    if (existing) {
      return c.json({ success: false, error: 'Ya existe una formación con ese slug' }, 409)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO formations (id, title, slug, description, short_description, thumbnail_url, 
                             trailer_url, level, duration_minutes, is_premium, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.slug,
      body.description || null,
      body.short_description || null,
      body.thumbnail_url || null,
      body.trailer_url || null,
      body.level || 'beginner',
      body.duration_minutes || 0,
      body.is_premium ? 1 : 0,
      body.is_published ? 1 : 0,
      body.sort_order || 0
    ).run()

    const formation = await c.env.DB.prepare(
      'SELECT * FROM formations WHERE id = ?'
    ).bind(id).first()

    return c.json({
      success: true,
      message: 'Formación creada',
      data: formation
    }, 201)

  } catch (error) {
    console.error('Create formation error:', error)
    return c.json({ success: false, error: 'Error al crear formación' }, 500)
  }
})

// =====================================================
// ADMIN: PUT /api/content/formations/:id - Actualizar Formación
// =====================================================

content.put('/formations/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const formationId = c.req.param('id')
    const body = await c.req.json<Partial<Formation>>()

    const existing = await c.env.DB.prepare(
      'SELECT id FROM formations WHERE id = ?'
    ).bind(formationId).first()

    if (!existing) {
      return c.json({ success: false, error: 'Formación no encontrada' }, 404)
    }

    const updates: string[] = []
    const values: any[] = []

    const fields = ['title', 'slug', 'description', 'short_description', 'thumbnail_url', 
                   'trailer_url', 'level', 'duration_minutes', 'is_premium', 'is_published', 'sort_order']

    for (const field of fields) {
      if (body[field as keyof Formation] !== undefined) {
        updates.push(`${field} = ?`)
        const value = body[field as keyof Formation]
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value)
      }
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No hay campos para actualizar' }, 400)
    }

    updates.push('updated_at = datetime("now")')
    values.push(formationId)

    await c.env.DB.prepare(
      `UPDATE formations SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM formations WHERE id = ?'
    ).bind(formationId).first()

    return c.json({
      success: true,
      message: 'Formación actualizada',
      data: updated
    })

  } catch (error) {
    console.error('Update formation error:', error)
    return c.json({ success: false, error: 'Error al actualizar formación' }, 500)
  }
})

// =====================================================
// ADMIN: POST /api/content/modules - Crear Módulo
// =====================================================

content.post('/modules', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json<Partial<Module>>()

    if (!body.formation_id || !body.title || !body.slug) {
      return c.json({ success: false, error: 'formation_id, título y slug son requeridos' }, 400)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO modules (id, formation_id, title, slug, description, thumbnail_url, sort_order, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.formation_id,
      body.title,
      body.slug,
      body.description || null,
      body.thumbnail_url || null,
      body.sort_order || 0,
      body.is_published ? 1 : 0
    ).run()

    const module = await c.env.DB.prepare(
      'SELECT * FROM modules WHERE id = ?'
    ).bind(id).first()

    return c.json({
      success: true,
      message: 'Módulo creado',
      data: module
    }, 201)

  } catch (error) {
    console.error('Create module error:', error)
    return c.json({ success: false, error: 'Error al crear módulo' }, 500)
  }
})

// =====================================================
// ADMIN: POST /api/content/lessons - Crear Lección
// =====================================================

content.post('/lessons', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json<Partial<Lesson>>()

    if (!body.module_id || !body.title || !body.slug) {
      return c.json({ success: false, error: 'module_id, título y slug son requeridos' }, 400)
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO lessons (id, module_id, title, slug, description, content_type, video_url,
                          video_duration_seconds, thumbnail_url, transcript, resources,
                          sort_order, is_free_preview, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.module_id,
      body.title,
      body.slug,
      body.description || null,
      body.content_type || 'video',
      body.video_url || null,
      body.video_duration_seconds || 0,
      body.thumbnail_url || null,
      body.transcript || null,
      body.resources ? JSON.stringify(body.resources) : null,
      body.sort_order || 0,
      body.is_free_preview ? 1 : 0,
      body.is_published ? 1 : 0
    ).run()

    const lesson = await c.env.DB.prepare(
      'SELECT * FROM lessons WHERE id = ?'
    ).bind(id).first()

    return c.json({
      success: true,
      message: 'Lección creada',
      data: lesson
    }, 201)

  } catch (error) {
    console.error('Create lesson error:', error)
    return c.json({ success: false, error: 'Error al crear lección' }, 500)
  }
})

export default content
