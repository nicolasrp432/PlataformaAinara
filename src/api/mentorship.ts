// =====================================================
// Leader Blueprint - API de Mentoría (Supabase)
// =====================================================

import { Hono } from 'hono'
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import type { Mentor, MentorshipSession } from '../lib/supabase'
import type { Bindings, Variables } from '../types'

const mentorship = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// =====================================================
// GET /api/mentorship/mentors - Listar Mentores
// =====================================================

mentorship.get('/mentors', optionalAuth, async (c) => {
  try {
    const { data: mentors, error } = await supabase
      .from('mentors')
      .select(`
        *,
        mentorship_sessions (id, status)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    // Transform and map sessions_completed
    const formattedMentors = mentors.map((m: any) => ({
      ...m,
      sessions_completed: m.mentorship_sessions?.filter((s: any) => s.status === 'completed').length || 0,
      specialties: m.specialties || []
    }))

    return c.json({
      success: true,
      data: formattedMentors
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

    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', mentorId)
      .eq('is_active', true)
      .maybeSingle()

    if (mentorError || !mentor) {
      return c.json({ success: false, error: 'Mentor no encontrado' }, 404)
    }

    // Availability
    const { data: availability } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    // Booked slots (next meetings)
    const { data: bookedSessions } = await supabase
      .from('mentorship_sessions')
      .select('scheduled_at, duration_minutes')
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'confirmed'])
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })

    // Blocked dates
    const { data: blockedDates } = await supabase
      .from('mentor_blocked_dates')
      .select('blocked_date')
      .eq('mentor_id', mentorId)
      .gte('blocked_date', new Date().toISOString().slice(0, 10))

    return c.json({
      success: true,
      data: {
        ...mentor,
        specialties: mentor.specialties || [],
        availability: availability || [],
        booked_slots: bookedSessions || [],
        blocked_dates: blockedDates?.map(d => d.blocked_date) || []
      }
    })

  } catch (error) {
    console.error('Get mentor error:', error)
    return c.json({ success: false, error: 'Error al obtener mentor' }, 500)
  }
})

// =====================================================
// POST /api/mentorship/sessions - Reservar Sesión
// =====================================================

mentorship.post('/sessions', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const body = await c.req.json<{
      mentor_id: string
      scheduled_at: string
      user_notes?: string
    }>()

    if (!body.mentor_id || !body.scheduled_at) {
      return c.json({ success: false, error: 'mentor_id y scheduled_at son requeridos' }, 400)
    }

    // 1. Verify mentor
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, session_duration_minutes')
      .eq('id', body.mentor_id)
      .eq('is_active', true)
      .maybeSingle()

    if (!mentor) return c.json({ success: false, error: 'Mentor no encontrado' }, 404)

    // 2. No past booking
    if (new Date(body.scheduled_at) <= new Date()) {
      return c.json({ success: false, error: 'No puedes reservar una sesión en el pasado' }, 400)
    }

    // 3. Check availability (no double booking)
    const { data: existing } = await supabase
      .from('mentorship_sessions')
      .select('id')
      .eq('mentor_id', body.mentor_id)
      .eq('scheduled_at', body.scheduled_at)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle()

    if (existing) return c.json({ success: false, error: 'Este horario ya no está disponible' }, 409)

    // 4. Create session
    const { data: session, error: insertError } = await supabase
      .from('mentorship_sessions')
      .insert({
        mentor_id: body.mentor_id,
        user_id: user.id,
        scheduled_at: body.scheduled_at,
        duration_minutes: mentor.session_duration_minutes || 60,
        status: 'pending',
        user_notes: body.user_notes || null
      })
      .select()
      .single()

    if (insertError) throw insertError

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

    let query = supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentor:mentors (name, title, avatar_url)
      `)
      .eq('user_id', user.id)

    if (status === 'upcoming') {
      query = query.gt('scheduled_at', new Date().toISOString()).in('status', ['pending', 'confirmed'])
    } else if (status === 'past') {
      // In Supabase we can use or() but simple gt/lt is cleaner if we don't mix complex logic
      query = query.lt('scheduled_at', new Date().toISOString())
    }

    const { data: sessions, error } = await query.order('scheduled_at', { ascending: false })
    if (error) throw error

    return c.json({
      success: true,
      data: sessions
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

    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle()

    if (!session) return c.json({ success: false, error: 'Sesión no encontrada o no cancelable' }, 404)

    // 24h limit
    const hoursUntil = (new Date(session.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return c.json({ success: false, error: 'No puedes cancelar con menos de 24 horas de anticipación' }, 400)
    }

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_reason: body.reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error

    return c.json({ success: true, message: 'Sesión cancelada' })
  } catch (error) {
    return c.json({ success: false, error: 'Error al cancelar sesión' }, 500)
  }
})

// =====================================================
// ADMIN: Confirmar y Bloquear (Migrados)
// =====================================================

mentorship.put('/sessions/:id/confirm', requireAuth, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{ meeting_link?: string; notes?: string }>()

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'confirmed',
        meeting_link: body.meeting_link || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return c.json({ success: false, error: 'Sesión no encontrada o ya procesada' }, 404)

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: 'Error al confirmar sesión' }, 500)
  }
})

mentorship.post('/mentors/:id/block', requireAuth, requireAdmin, async (c) => {
  try {
    const mentorId = c.req.param('id')
    const body = await c.req.json<{ date: string; reason?: string }>()
    if (!body.date) return c.json({ success: false, error: 'Fecha requerida' }, 400)

    const { error } = await supabase
      .from('mentor_blocked_dates')
      .upsert({
        mentor_id: mentorId,
        blocked_date: body.date,
        reason: body.reason || null
      }, { onConflict: 'mentor_id,blocked_date' })

    if (error) throw error
    return c.json({ success: true, message: 'Fecha bloqueada' })
  } catch (error) {
    return c.json({ success: false, error: 'Error al bloquear fecha' }, 500)
  }
})

export default mentorship
