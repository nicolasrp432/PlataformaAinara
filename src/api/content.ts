
// =====================================================
// Leader Blueprint - API de Contenido Educativo (D1)
// =====================================================

import { Hono } from 'hono'
import { requireAuth, requireAdmin, optionalAuth, hasPremiumAccess } from '../middleware/auth'
import type { Formation, Module, Lesson } from '../types'
import type { Bindings, Variables } from '../types'

const content = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/content/formations - Listar Formaciones
// =====================================================

content.get('/formations', optionalAuth, async (c) => {
  try {
    const user = c.get('user')
    const userAccess = c.get('userAccess')
    const isPremium = userAccess ? hasPremiumAccess(userAccess as any) : false
    const isAdmin = user?.role === 'admin'

    // Fetch formations
    let query = 'SELECT * FROM formations'
    if (!isAdmin) {
      query += ' WHERE is_published = 1'
    }
    query += ' ORDER BY sort_order ASC'

    const { results: formations } = await c.env.DB.prepare(query).all<Formation>()

    if (!formations) return c.json({ success: true, data: [] })

    // Enhance with counts and progress if user is logged in
    const formationsWithProgress = await Promise.all((formations || []).map(async (f) => {
      // Get counts
      const { count: moduleCount } = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM modules WHERE formation_id = ? AND is_published = 1'
      ).bind(f.id).first<{ count: number }>()

      const { results: modules } = await c.env.DB.prepare(
        'SELECT id FROM modules WHERE formation_id = ? AND is_published = 1'
      ).bind(f.id).all<{ id: string }>()

      const moduleIds = modules?.map(m => m.id) || []

      let lessonCount = 0
      let totalDuration = 0
      let userProgress = null

      if (moduleIds.length > 0) {
          const placeholders = moduleIds.map(() => '?').join(',')
          
          const { count } = await c.env.DB.prepare(
              `SELECT COUNT(*) as count FROM lessons WHERE module_id IN (${placeholders}) AND is_published = 1`
          ).bind(...moduleIds).first<{ count: number }>()
          lessonCount = count || 0

          const { results: lessons } = await c.env.DB.prepare(
              `SELECT video_duration_seconds FROM lessons WHERE module_id IN (${placeholders}) AND is_published = 1`
          ).bind(...moduleIds).all<{ video_duration_seconds: number }>()

          totalDuration = lessons?.reduce((acc, curr) => acc + (curr.video_duration_seconds || 0), 0) || 0

          if (user) {
             const { results: lessonIdsData } = await c.env.DB.prepare(
                 `SELECT id FROM lessons WHERE module_id IN (${placeholders}) AND is_published = 1`
             ).bind(...moduleIds).all<{ id: string }>()
             
             const lessonIds = lessonIdsData?.map(d => d.id) || []
             
             if (lessonIds.length > 0) {
                 const lPlaceholders = lessonIds.map(() => '?').join(',')
                 const { count: completedCount } = await c.env.DB.prepare(
                     `SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed' AND lesson_id IN (${lPlaceholders})`
                 ).bind(user.id, ...lessonIds).first<{ count: number }>()

                 const totalCount = lessonIds.length
                 userProgress = {
                    completed: completedCount || 0,
                    total: totalCount,
                    percent: totalCount > 0 ? Math.round(((completedCount || 0) / totalCount) * 100) : 0
                 }
             }
          }
      }

      return {
        ...f,
        module_count: moduleCount || 0,
        lesson_count: lessonCount || 0,
        total_duration_seconds: totalDuration,
        user_progress: userProgress,
        is_locked: (f.is_premium && !isPremium && !isAdmin)
      }
    }))

    return c.json({ success: true, data: formationsWithProgress })
  } catch (error: any) {
    console.error('Content API error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =====================================================
// GET /api/content/formations/:slug - Detalle de Formación
// =====================================================

content.get('/formations/:slug', optionalAuth, async (c) => {
    try {
        const slug = c.req.param('slug')
        const user = c.get('user')
        const userAccess = c.get('userAccess')
        const isPremium = userAccess ? hasPremiumAccess(userAccess as any) : false
        const isAdmin = user?.role === 'admin'

        const formation = await c.env.DB.prepare('SELECT * FROM formations WHERE slug = ?').bind(slug).first<Formation>()

        if (!formation) {
            return c.json({ success: false, error: 'Formación no encontrada' }, 404)
        }

        if (!formation.is_published && !isAdmin) {
             return c.json({ success: false, error: 'Formación no disponible' }, 404)
        }

        // Get modules and lessons
        const { results: modules } = await c.env.DB.prepare(
            'SELECT * FROM modules WHERE formation_id = ? AND is_published = 1 ORDER BY sort_order ASC'
        ).bind(formation.id).all<Module>()

        const modulesWithLessons = await Promise.all((modules || []).map(async (m) => {
            const { results: lessons } = await c.env.DB.prepare(
                'SELECT * FROM lessons WHERE module_id = ? AND is_published = 1 ORDER BY sort_order ASC'
            ).bind(m.id).all<Lesson>()

            // Check progress for each lesson
            const lessonsWithStatus = await Promise.all((lessons || []).map(async (l) => {
                let status = 'locked'
                let isCompleted = false
                
                if (l.is_free_preview || isPremium || isAdmin) {
                    status = 'available'
                }
                
                if (user) {
                    const progress = await c.env.DB.prepare(
                        'SELECT status FROM user_progress WHERE user_id = ? AND lesson_id = ?'
                    ).bind(user.id, l.id).first<{ status: string }>()
                    
                    if (progress) {
                        status = progress.status
                        isCompleted = status === 'completed'
                    }
                }
                
                return { ...l, status, is_completed: isCompleted }
            }))

            return { ...m, lessons: lessonsWithStatus }
        }))

        return c.json({
            success: true,
            data: {
                ...formation,
                modules: modulesWithLessons,
                is_locked: (formation.is_premium && !isPremium && !isAdmin)
            }
        })

    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500)
    }
})

export default content
