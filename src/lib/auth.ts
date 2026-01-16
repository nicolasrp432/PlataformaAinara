// =====================================================
// Leader Blueprint - Utilidades de Autenticación
// =====================================================

import type { User, AuthTokens } from '../types'

// Constantes
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 días

// =====================================================
// Funciones de Hashing de Contraseñas
// =====================================================

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// =====================================================
// Funciones JWT
// =====================================================

interface JWTPayload {
  sub: string // user_id
  email: string
  role: string
  exp: number
  iat: number
}

function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(data: string): string {
  const padded = data + '==='.slice(0, (4 - data.length % 4) % 4)
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
}

async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const signatureArray = Array.from(new Uint8Array(signature))
  return base64UrlEncode(String.fromCharCode(...signatureArray))
}

async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHmacSignature(data, secret)
  return signature === expectedSignature
}

export async function generateAccessToken(user: User, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + ACCESS_TOKEN_EXPIRY) / 1000)
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const signature = await createHmacSignature(dataToSign, secret)

  return `${dataToSign}.${signature}`
}

export async function verifyAccessToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const dataToVerify = `${encodedHeader}.${encodedPayload}`
    
    const isValid = await verifyHmacSignature(dataToVerify, signature, secret)
    if (!isValid) return null

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload
    
    // Verificar expiración
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function generateRefreshToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
}

export async function generateAuthTokens(user: User, secret: string): Promise<AuthTokens> {
  const accessToken = await generateAccessToken(user, secret)
  const refreshToken = generateRefreshToken()

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY / 1000
  }
}

// =====================================================
// Funciones de Validación
// =====================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  return { valid: errors.length === 0, errors }
}

// =====================================================
// Utilidades de Usuario
// =====================================================

export function sanitizeUser(user: any): Omit<User, 'password_hash'> {
  const { password_hash, ...sanitized } = user
  return {
    ...sanitized,
    email_verified: Boolean(sanitized.email_verified)
  }
}

export function calculateLevel(totalXp: number, multiplier: number = 1000): number {
  return Math.floor(totalXp / multiplier) + 1
}

export function calculateXpForNextLevel(totalXp: number, multiplier: number = 1000): number {
  const currentLevel = calculateLevel(totalXp, multiplier)
  return (currentLevel * multiplier) - totalXp
}
