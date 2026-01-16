// =====================================================
// Leader Blueprint - Middleware de Autenticación
// =====================================================

import { createMiddleware } from 'hono/factory'
import type { Context, Next } from 'hono'
import { verifyAccessToken } from '../lib/auth'
import type { Bindings, Variables, User, UserAccess } from '../types'

// =====================================================
// Middleware: Autenticación Requerida
// =====================================================

export const requireAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Token de autenticación requerido' }, 401)
    }

    const token = authHeader.substring(7)
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    
    const payload = await verifyAccessToken(token, secret)
    
    if (!payload) {
      return c.json({ success: false, error: 'Token inválido o expirado' }, 401)
    }

    // Obtener usuario de la base de datos
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND status = ?'
    ).bind(payload.sub, 'active').first<User>()

    if (!user) {
      return c.json({ success: false, error: 'Usuario no encontrado o inactivo' }, 401)
    }

    // Obtener acceso del usuario
    const access = await c.env.DB.prepare(`
      SELECT * FROM user_access 
      WHERE user_id = ? AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.id).first<UserAccess>()

    // Guardar en el contexto
    c.set('user', user)
    c.set('userAccess', access || undefined)

    await next()
  }
)

// =====================================================
// Middleware: Autenticación Opcional
// =====================================================

export const optionalAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production'
      
      const payload = await verifyAccessToken(token, secret)
      
      if (payload) {
        const user = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ? AND status = ?'
        ).bind(payload.sub, 'active').first<User>()

        if (user) {
          const access = await c.env.DB.prepare(`
            SELECT * FROM user_access 
            WHERE user_id = ? AND is_active = 1 
            AND (expires_at IS NULL OR expires_at > datetime('now'))
            ORDER BY created_at DESC LIMIT 1
          `).bind(user.id).first<UserAccess>()

          c.set('user', user)
          c.set('userAccess', access || undefined)
        }
      }
    }

    await next()
  }
)

// =====================================================
// Middleware: Requerir Rol de Admin
// =====================================================

export const requireAdmin = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: 'Autenticación requerida' }, 401)
    }

    if (user.role !== 'admin') {
      return c.json({ success: false, error: 'Acceso denegado. Se requieren permisos de administrador' }, 403)
    }

    await next()
  }
)

// =====================================================
// Middleware: Requerir Acceso Premium
// =====================================================

export const requirePremium = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')
    const access = c.get('userAccess')
    
    if (!user) {
      return c.json({ success: false, error: 'Autenticación requerida' }, 401)
    }

    // Admins siempre tienen acceso
    if (user.role === 'admin') {
      await next()
      return
    }

    // Verificar acceso premium
    if (!access || access.access_type === 'free') {
      return c.json({ 
        success: false, 
        error: 'Acceso premium requerido',
        upgrade_required: true
      }, 403)
    }

    await next()
  }
)

// =====================================================
// Middleware: Verificar Acceso a Contenido
// =====================================================

export const checkContentAccess = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')
    const access = c.get('userAccess')
    
    // Si no hay usuario, solo permitir contenido público/preview
    if (!user) {
      c.set('contentAccessLevel', 'public')
      await next()
      return
    }

    // Admins tienen acceso total
    if (user.role === 'admin') {
      c.set('contentAccessLevel', 'admin')
      await next()
      return
    }

    // Determinar nivel de acceso
    if (access && access.access_type !== 'free') {
      c.set('contentAccessLevel', 'premium')
    } else {
      c.set('contentAccessLevel', 'free')
    }

    await next()
  }
)

// =====================================================
// Helper: Obtener Usuario del Contexto
// =====================================================

export function getUser(c: Context<{ Bindings: Bindings; Variables: Variables }>): User | undefined {
  return c.get('user')
}

export function getUserAccess(c: Context<{ Bindings: Bindings; Variables: Variables }>): UserAccess | undefined {
  return c.get('userAccess')
}

export function hasPremiumAccess(c: Context<{ Bindings: Bindings; Variables: Variables }>): boolean {
  const user = c.get('user')
  const access = c.get('userAccess')
  
  if (!user) return false
  if (user.role === 'admin') return true
  if (!access) return false
  
  return access.access_type !== 'free' && access.is_active
}
