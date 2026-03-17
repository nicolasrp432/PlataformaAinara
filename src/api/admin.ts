
// =====================================================
// Leader Blueprint - Admin API Routes
// =====================================================

import { Hono } from 'hono'
import { requireAdmin } from '../middleware/auth'
import type { Bindings, Variables } from '../types'

const adminApi = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Use centralized admin middleware
adminApi.use('*', requireAdmin)

// =====================================================
// GET /api/admin/stats - Dashboard Statistics
// =====================================================

adminApi.get('/stats', async (c) => {
    try {
        // Total users
        const totalUsersResult = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM users'
        ).first<{ count: number }>()

        // Premium users
        const premiumUsersResult = await c.env.DB.prepare(
            "SELECT COUNT(*) as count FROM user_access WHERE access_type != 'free' AND is_active = 1"
        ).first<{ count: number }>()

        // Active formations
        const activeFormationsResult = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM formations WHERE is_published = 1'
        ).first<{ count: number }>()

        // Total lessons
        const totalLessonsResult = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM lessons'
        ).first<{ count: number }>()

        // Upcoming sessions
        const upcomingSessionsResult = await c.env.DB.prepare(
            "SELECT COUNT(*) as count FROM mentorship_sessions WHERE status IN ('pending', 'confirmed') AND scheduled_at >= ?"
        ).bind(new Date().toISOString()).first<{ count: number }>()

        // Total XP awarded
        const xpResult = await c.env.DB.prepare(
            'SELECT SUM(total_xp) as xp FROM user_streaks'
        ).first<{ xp: number }>()

        return c.json({
            success: true,
            data: {
                totalUsers: totalUsersResult?.count || 0,
                premiumUsers: premiumUsersResult?.count || 0,
                activeFormations: activeFormationsResult?.count || 0,
                totalLessons: totalLessonsResult?.count || 0,
                upcomingSessions: upcomingSessionsResult?.count || 0,
                totalXpAwarded: xpResult?.xp || 0
            }
        })
    } catch (error: any) {
        console.error('Admin stats error:', error)
        return c.json({ success: false, error: error.message || 'Error al obtener estadísticas' }, 500)
    }
})

// =====================================================
// GET /api/admin/users - List Users
// =====================================================

adminApi.get('/users', async (c) => {
    try {
        const { results: users } = await c.env.DB.prepare(`
            SELECT u.*, a.access_type, a.is_active as access_active 
            FROM users u 
            LEFT JOIN user_access a ON u.id = a.user_id AND a.is_active = 1
            ORDER BY u.created_at DESC
        `).all<any>()

        return c.json({ success: true, data: users })
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500)
    }
})

// =====================================================
// POST /api/admin/users/:id/role - Update User Role
// =====================================================

adminApi.post('/users/:id/role', async (c) => {
    const userId = c.req.param('id')
    const { role } = await c.req.json<{ role: string }>()

    if (!['user', 'admin', 'mentor'].includes(role)) {
        return c.json({ success: false, error: 'Rol inválido' }, 400)
    }

    await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run()

    return c.json({ success: true, message: 'Rol actualizado' })
})

// =====================================================
// POST /api/admin/users/:id/status - Update User Status
// =====================================================

adminApi.post('/users/:id/status', async (c) => {
    const userId = c.req.param('id')
    const { status } = await c.req.json<{ status: string }>()

    if (!['active', 'inactive', 'suspended'].includes(status)) {
        return c.json({ success: false, error: 'Estado inválido' }, 400)
    }

    await c.env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, userId).run()

    return c.json({ success: true, message: 'Estado actualizado' })
})

// =====================================================
// POST /api/admin/users/access - Grant Access (Form Submit)
// =====================================================

adminApi.post('/users/access', async (c) => {
    const body = await c.req.parseBody()
    const userId = body['user_id'] as string
    const accessType = body['access_type'] as string
    const expiresAt = body['expires_at'] as string
    const reason = body['access_reason'] as string
    const adminId = c.get('user')!.id

    if (!userId || !accessType) {
        return c.redirect('/admin/users?error=Missing+fields')
    }

    // Deactivate previous access
    await c.env.DB.prepare('UPDATE user_access SET is_active = 0 WHERE user_id = ?').bind(userId).run()

    // Create new access
    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
        INSERT INTO user_access (id, user_id, access_type, access_granted_by, access_reason, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(id, userId, accessType, adminId, reason || null, expiresAt || null).run()

    return c.redirect('/admin/users?success=Access+granted')
})

export default adminApi
