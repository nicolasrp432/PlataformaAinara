// =====================================================
// Leader Blueprint - API de Mentoría
// =====================================================

import { Hono } from 'hono'
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth'
import type { Bindings, Variables, Mentor, MentorshipSession, BookSessionRequest } from '../types'

const mentorship = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/mentorship/mentors - Listar Mentores
// =====================================================

mentorship.get('/mentors', optionalAuth, async (c) => {
  try {
    const mentors = await c.env.DB.prepare(`
      SELECT m.*, 
             (SELECT COUNT(*) FROM mentorship_sessions ms 
              WHERE ms.mentor_id = m.id AND ms.status = 'completed') as sessions_completed
      FROM mentors m
      WHERE m.is_active = 1
      ORDER BY m.name ASC
    `).all()

    // Parsear specialties
    const mentorsWithSpecialties = mentors.results.map((m: any) => ({
      ...m,
      specialties: m.specialties ? JSON.parse(m.specialties) : []
    }))

    return c.json({
      success: true,
      data: mentorsWithSpecialties
    })

  } catch (error) {
    console.error('Get mentors error:', error)
    return c.json({ success: false, error: 'Error al obtener mentores' }, 500)
  }
})

// =====================================================
// GET /api/mentorship/mentors/:id - Detalle de Mentor
// =====================================================

mentorship.get('/mentors/:id', optionalAuth, async (c) => {
  try {
    const mentorId = c.req.param('id')

    const mentor = await c.env.DB.prepare(`
      SELECT m.*, 
             (SELECT COUNT(*) FROM mentorship_sessions ms 
              WHERE ms.mentor_id = m.id AND ms.status = 'completed') as sessions_completed
      FROM mentors m
      WHERE m.id = ? AND m.is_active = 1
    `).bind(mentorId).first()

    if (!mentor) {
      return c.json({ success: false, error: 'Mentor no encontrado' }, 404)
    }

    // Obtener disponibilidad
    const availability = await c.env.DB.prepare(`
      SELECT * FROM mentor_availability
      WHERE mentor_id = ? AND is_active = 1
      ORDER BY day_of_week ASC, start_time ASC
    `).bind(mentorId).all()

    // Obtener próximas sesiones ocupadas (para mostrar slots no disponibles)
    const bookedSlots = await c.env.DB.prepare(`
      SELECT scheduled_at, duration_minutes 
      FROM mentorship_sessions
      WHERE mentor_id = ? AND status IN ('pending', 'confirmed')
      AND scheduled_at > datetime('now')
      ORDER BY scheduled_at ASC
    `).bind(mentorId).all()

    // Obtener fechas bloqueadas
    const blockedDates = await c.env.DB.prepare(`
      SELECT blocked_date FROM mentor_blocked_dates
      WHERE mentor_id = ? AND blocked_date >= date('now')
    `).bind(mentorId).all()

    return c.json({
      success: true,
      data: {
        ...(mentor as any),
        specialties: (mentor as any).specialties ? JSON.parse((mentor as any).specialties) : [],
        availability: availability.results,
        booked_slots: bookedSlots.results,
        blocked_dates: blockedDates.results.map((d: any) => d.blocked_date)
      }
    })

  } catch (error) {
    console.error('Get mentor error:', error)
    return c.json({ success: false, error: 'Error al obtener mentor' }, 500)
  }
})

// =====================================================
// GET /api/mentorship/mentors/:id/availability - Disponibilidad
// =====================================================

mentorship.get('/mentors/:id/availability', async (c) => {
  try {
    const mentorId = c.req.param('id')
    const dateStr = c.req.query('date') // formato YYYY-MM-DD
    const weeksAhead = parseInt(c.req.query('weeks') || '2')

    const mentor = await c.env.DB.prepare(
      'SELECT session_duration_minutes FROM mentors WHERE id = ? AND is_active = 1'
    ).bind(mentorId).first<{ session_duration_minutes: number }>()

    if (!mentor) {
      return c.json({ success: false, error: 'Mentor no encontrado' }, 404)
    }

    // Obtener disponibilidad semanal
    const weeklyAvailability = await c.env.DB.prepare(`
      SELECT * FROM mentor_availability
      WHERE mentor_id = ? AND is_active = 1
    `).bind(mentorId).all()

    // Obtener fechas bloqueadas
    const blockedDates = await c.env.DB.prepare(`
      SELECT blocked_date FROM mentor_blocked_dates
      WHERE mentor_id = ? AND blocked_date >= date('now')
    `).bind(mentorId).all()

    const blockedSet = new Set(blockedDates.results.map((d: any) => d.blocked_date))

    // Obtener sesiones ya reservadas
    const bookedSessions = await c.env.DB.prepare(`
      SELECT scheduled_at, duration_minutes 
      FROM mentorship_sessions
      WHERE mentor_id = ? AND status IN ('pending', 'confirmed')
      AND scheduled_at > datetime('now')
    `).bind(mentorId).all()

    // Generar slots disponibles para las próximas semanas
    const startDate = dateStr ? new Date(dateStr) : new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + (weeksAhead * 7))

    const availableSlots: Array<{ date: string; time: string; datetime: string }> = []
    const sessionDuration = mentor.session_duration_minutes

    // Crear un mapa de sesiones reservadas
    const bookedMap = new Map<string, boolean>()
    bookedSessions.results.forEach((s: any) => {
      const dt = new Date(s.scheduled_at)
      const key = dt.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
      bookedMap.set(key, true)
    })

    // Iterar por cada día
    const currentDate = new Date(startDate)
    while (currentDate < endDate) {
      const dateKey = currentDate.toISOString().slice(0, 10)
      const dayOfWeek = currentDate.getDay()

      // Verificar si está bloqueado
      if (!blockedSet.has(dateKey)) {
        // Obtener disponibilidad para este día
        const dayAvailability = weeklyAvailability.results.filter(
          (a: any) => a.day_of_week === dayOfWeek
        )

        for (const slot of dayAvailability) {
          const [startHour, startMin] = (slot as any).start_time.split(':').map(Number)
          const [endHour, endMin] = (slot as any).end_time.split(':').map(Number)

          let slotTime = startHour * 60 + startMin
          const endTime = endHour * 60 + endMin

          while (slotTime + sessionDuration <= endTime) {
            const hours = Math.floor(slotTime / 60)
            const mins = slotTime % 60
            const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
            const datetimeStr = `${dateKey}T${timeStr}`

            // Verificar si ya pasó
            const slotDateTime = new Date(datetimeStr)
            if (slotDateTime > new Date()) {
              // Verificar si no está reservado
              const bookKey = datetimeStr.slice(0, 16)
              if (!bookedMap.has(bookKey)) {
                availableSlots.push({
                  date: dateKey,
                  time: timeStr,
                  datetime: datetimeStr
                })
              }
            }

            slotTime += sessionDuration
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return c.json({
      success: true,
      data: {
        session_duration_minutes: sessionDuration,
        slots: availableSlots
      }
    })

  } catch (error) {
    console.error('Get availability error:', error)
    return c.json({ success: false, error: 'Error al obtener disponibilidad' }, 500)
  }
})

// =====================================================
// POST /api/mentorship/sessions - Reservar Sesión
// =====================================================

mentorship.post('/sessions', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<BookSessionRequest>()

    if (!body.mentor_id || !body.scheduled_at) {
      return c.json({ success: false, error: 'mentor_id y scheduled_at son requeridos' }, 400)
    }

    // Verificar que el mentor existe
    const mentor = await c.env.DB.prepare(
      'SELECT * FROM mentors WHERE id = ? AND is_active = 1'
    ).bind(body.mentor_id).first<Mentor>()

    if (!mentor) {
      return c.json({ success: false, error: 'Mentor no encontrado' }, 404)
    }

    // Verificar que la fecha no está en el pasado
    const scheduledDate = new Date(body.scheduled_at)
    if (scheduledDate <= new Date()) {
      return c.json({ success: false, error: 'No puedes reservar una sesión en el pasado' }, 400)
    }

    // Verificar que el slot está disponible
    const existingSession = await c.env.DB.prepare(`
      SELECT id FROM mentorship_sessions
      WHERE mentor_id = ? AND scheduled_at = ? AND status IN ('pending', 'confirmed')
    `).bind(body.mentor_id, body.scheduled_at).first()

    if (existingSession) {
      return c.json({ success: false, error: 'Este horario ya no está disponible' }, 409)
    }

    // Verificar que la fecha no está bloqueada
    const dateOnly = body.scheduled_at.slice(0, 10)
    const isBlocked = await c.env.DB.prepare(`
      SELECT id FROM mentor_blocked_dates
      WHERE mentor_id = ? AND blocked_date = ?
    `).bind(body.mentor_id, dateOnly).first()

    if (isBlocked) {
      return c.json({ success: false, error: 'El mentor no está disponible en esta fecha' }, 400)
    }

    // Crear la sesión
    const sessionId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO mentorship_sessions (id, mentor_id, user_id, scheduled_at, duration_minutes, 
                                       status, user_notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      sessionId,
      body.mentor_id,
      user.id,
      body.scheduled_at,
      mentor.session_duration_minutes,
      body.user_notes || null
    ).run()

    const session = await c.env.DB.prepare(
      'SELECT * FROM mentorship_sessions WHERE id = ?'
    ).bind(sessionId).first()

    return c.json({
      success: true,
      message: 'Sesión reservada exitosamente. Recibirás confirmación pronto.',
      data: session
    }, 201)

  } catch (error) {
    console.error('Book session error:', error)
    return c.json({ success: false, error: 'Error al reservar sesión' }, 500)
  }
})

// =====================================================
// GET /api/mentorship/sessions - Mis Sesiones
// =====================================================

mentorship.get('/sessions', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const status = c.req.query('status') // 'upcoming', 'past', 'all'

    let whereClause = 'ms.user_id = ?'
    if (status === 'upcoming') {
      whereClause += " AND ms.scheduled_at > datetime('now') AND ms.status IN ('pending', 'confirmed')"
    } else if (status === 'past') {
      whereClause += " AND (ms.scheduled_at <= datetime('now') OR ms.status IN ('completed', 'cancelled', 'no_show'))"
    }

    const sessions = await c.env.DB.prepare(`
      SELECT ms.*, m.name as mentor_name, m.title as mentor_title, m.avatar_url as mentor_avatar
      FROM mentorship_sessions ms
      JOIN mentors m ON m.id = ms.mentor_id
      WHERE ${whereClause}
      ORDER BY ms.scheduled_at DESC
    `).bind(user.id).all()

    return c.json({
      success: true,
      data: sessions.results
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    return c.json({ success: false, error: 'Error al obtener sesiones' }, 500)
  }
})

// =====================================================
// PUT /api/mentorship/sessions/:id/cancel - Cancelar Sesión
// =====================================================

mentorship.put('/sessions/:id/cancel', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const sessionId = c.req.param('id')
    const body = await c.req.json<{ reason?: string }>()

    const session = await c.env.DB.prepare(`
      SELECT * FROM mentorship_sessions
      WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')
    `).bind(sessionId, user.id).first()

    if (!session) {
      return c.json({ success: false, error: 'Sesión no encontrada o no cancelable' }, 404)
    }

    // Verificar que no es muy tarde para cancelar (24h antes)
    const scheduledAt = new Date((session as any).scheduled_at)
    const hoursUntil = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntil < 24) {
      return c.json({ 
        success: false, 
        error: 'No puedes cancelar con menos de 24 horas de anticipación' 
      }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE mentorship_sessions 
      SET status = 'cancelled', cancelled_by = ?, cancelled_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.id, body.reason || null, sessionId).run()

    return c.json({
      success: true,
      message: 'Sesión cancelada'
    })

  } catch (error) {
    console.error('Cancel session error:', error)
    return c.json({ success: false, error: 'Error al cancelar sesión' }, 500)
  }
})

// =====================================================
// ADMIN: PUT /api/mentorship/sessions/:id/confirm - Confirmar
// =====================================================

mentorship.put('/sessions/:id/confirm', requireAuth, requireAdmin, async (c) => {
  try {
    const sessionId = c.req.param('id')
    const body = await c.req.json<{ meeting_link?: string; notes?: string }>()

    const session = await c.env.DB.prepare(
      'SELECT * FROM mentorship_sessions WHERE id = ? AND status = ?'
    ).bind(sessionId, 'pending').first()

    if (!session) {
      return c.json({ success: false, error: 'Sesión no encontrada o ya procesada' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE mentorship_sessions 
      SET status = 'confirmed', meeting_link = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(body.meeting_link || null, body.notes || null, sessionId).run()

    return c.json({
      success: true,
      message: 'Sesión confirmada'
    })

  } catch (error) {
    console.error('Confirm session error:', error)
    return c.json({ success: false, error: 'Error al confirmar sesión' }, 500)
  }
})

// =====================================================
// ADMIN: POST /api/mentorship/mentors/:id/block - Bloquear Fecha
// =====================================================

mentorship.post('/mentors/:id/block', requireAuth, requireAdmin, async (c) => {
  try {
    const mentorId = c.req.param('id')
    const body = await c.req.json<{ date: string; reason?: string }>()

    if (!body.date) {
      return c.json({ success: false, error: 'Fecha requerida' }, 400)
    }

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO mentor_blocked_dates (id, mentor_id, blocked_date, reason)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), mentorId, body.date, body.reason || null).run()

    return c.json({
      success: true,
      message: 'Fecha bloqueada'
    })

  } catch (error) {
    console.error('Block date error:', error)
    return c.json({ success: false, error: 'Error al bloquear fecha' }, 500)
  }
})

export default mentorship
