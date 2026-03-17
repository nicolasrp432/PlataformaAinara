// =====================================================
// Leader Blueprint - API de Reflexiones/Comunidad (Supabase)
// =====================================================

import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { supabase } from '../lib/supabase'
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
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('reflections')
      .select('*, profiles(name, avatar_url)', { count: 'exact' })
      .eq('is_public', true)

    if (filter === 'my_journey' && user) {
      query = query.eq('user_id', user.id)
    } else if (filter === 'resonated' && user) {
      // This would require a join or a specific RPC if complex, 
      // but let's stick to a simpler logic for now: 
      // fetch all then filter if needed, or use a subquery-like approach.
      // For simplicity, we'll fetch reflections where the user has shared reactions.
      const { data: reactedIds } = await supabase
        .from('reflection_reactions')
        .select('reflection_id')
        .eq('user_id', user.id)
        .eq('reaction_type', 'resonate')

      const ids = reactedIds?.map(r => r.reflection_id) || []
      query = query.in('id', ids)
    }

    const { data: reflectionsData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Fetch reaction counts for each reflection
    // In a high-traffic app, we should use a Postgres View or RPC for this.
    const reflectionsWithCounts = await Promise.all((reflectionsData || []).map(async (r) => {
      const { count: resonateCount } = await supabase
        .from('reflection_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('reflection_id', r.id)
        .eq('reaction_type', 'resonate')

      const { count: supportCount } = await supabase
        .from('reflection_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('reflection_id', r.id)
        .eq('reaction_type', 'support')

      let userResonated = false
      let userSupported = false

      if (user) {
        const { data: userReactions } = await supabase
          .from('reflection_reactions')
          .select('reaction_type')
          .eq('reflection_id', r.id)
          .eq('user_id', user.id)

        userResonated = userReactions?.some(ur => ur.reaction_type === 'resonate') || false
        userSupported = userReactions?.some(ur => ur.reaction_type === 'support') || false
      }

      return {
        ...r,
        author_name: (r.profiles as any)?.name,
        author_avatar: (r.profiles as any)?.avatar_url,
        resonate_count: resonateCount || 0,
        support_count: supportCount || 0,
        user_resonated: userResonated,
        user_supported: userSupported
      }
    }))

    return c.json({
      success: true,
      data: reflectionsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('Get reflections error:', error)
    return c.json({ success: false, error: error.message || 'Error al obtener reflexiones' }, 500)
  }
})

// =====================================================
// POST /api/reflections - Crear Reflexión
// =====================================================

reflections.post('/', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    let body: any;

    // Handle both JSON and Form Data (from Dashboard)
    const contentType = c.req.header('content-type')
    if (contentType?.includes('application/json')) {
      body = await c.req.json<CreateReflectionRequest>()
    } else {
      const formData = await c.req.formData()
      body = {
        content: formData.get('content') as string,
        is_public: formData.get('is_public') === 'true' || true,
        lesson_id: formData.get('lesson_id') as string || undefined
      }
    }

    if (!body.content || body.content.trim().length === 0) {
      if (contentType?.includes('application/json')) {
        return c.json({ success: false, error: 'El contenido es requerido' }, 400)
      }
      return c.redirect('/?error=El contenido es requerido')
    }

    const { data: reflection, error } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        lesson_id: body.lesson_id || null,
        content: body.content.trim(),
        is_public: body.is_public !== false
      })
      .select('*, profiles(name, avatar_url)')
      .single()

    if (error) throw error

    // Grant XP for public reflection
    if (body.is_public !== false) {
      // Log XP
      await supabase.from('xp_log').insert({
        user_id: user.id,
        xp_amount: 10,
        reason: 'Reflexión compartida',
        reference_type: 'reflection',
        reference_id: reflection.id
      })

      // Update XP total in user_streaks
      // Use RPC or upsert
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('total_xp')
        .eq('id', user.id)
        .single()

      const newXp = (streak?.total_xp || 0) + 10
      await supabase
        .from('user_streaks')
        .update({
          total_xp: newXp,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    if (contentType?.includes('application/json')) {
      return c.json({
        success: true,
        message: body.is_public !== false ? '¡Reflexión compartida! +10 XP' : 'Reflexión guardada',
        data: reflection
      }, 201)
    }

    // Redirect back to dashboard if it was a form post
    return c.redirect('/?success=Reflexión guardada')

  } catch (error: any) {
    console.error('Create reflection error:', error)
    return c.json({ success: false, error: error.message || 'Error al crear reflexión' }, 500)
  }
})

// =====================================================
// DELETE /api/reflections/:id - Eliminar Reflexión
// =====================================================

reflections.delete('/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user')!
    const reflectionId = c.req.param('id')

    const { data: reflection, error: fetchError } = await supabase
      .from('reflections')
      .select('user_id')
      .eq('id', reflectionId)
      .single()

    if (fetchError || !reflection) {
      return c.json({ success: false, error: 'Reflexión no encontrada' }, 404)
    }

    if (reflection.user_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso para eliminar esta reflexión' }, 403)
    }

    const { error: deleteError } = await supabase
      .from('reflections')
      .delete()
      .eq('id', reflectionId)

    if (deleteError) throw deleteError

    return c.json({ success: true, message: 'Reflexión eliminada' })

  } catch (error: any) {
    console.error('Delete reflection error:', error)
    return c.json({ success: false, error: error.message || 'Error al eliminar reflexión' }, 500)
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
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: entries, count, error } = await supabase
      .from('reflections')
      .select('*, lessons(title, modules(title, formations(title)))', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const formattedEntries = entries?.map(r => ({
      ...r,
      lesson_title: (r.lessons as any)?.title,
      module_title: (r.lessons as any)?.modules?.title,
      formation_title: (r.lessons as any)?.modules?.formations?.title
    }))

    return c.json({
      success: true,
      data: formattedEntries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('Get journal error:', error)
    return c.json({ success: false, error: error.message || 'Error al obtener diario' }, 500)
  }
})

export default reflections
