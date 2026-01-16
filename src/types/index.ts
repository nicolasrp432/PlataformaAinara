// =====================================================
// Leader Blueprint - Tipos TypeScript
// =====================================================

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: 'user' | 'admin' | 'mentor'
  status: 'active' | 'inactive' | 'suspended'
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  refresh_token: string
  expires_at: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description?: string
  price_monthly?: number
  price_yearly?: number
  features: string[]
  is_active: boolean
  created_at: string
}

export interface UserAccess {
  id: string
  user_id: string
  plan_id?: string
  access_type: 'free' | 'paid' | 'manual' | 'trial'
  access_granted_by?: string
  access_reason?: string
  starts_at: string
  expires_at?: string
  is_active: boolean
  payment_reference?: string
  created_at: string
  updated_at: string
}

export interface Formation {
  id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  trailer_url?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes: number
  is_premium: boolean
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Relaciones (cargadas según necesidad)
  modules?: Module[]
  progress?: number // porcentaje de progreso del usuario
}

export interface Module {
  id: string
  formation_id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
  // Relaciones
  lessons?: Lesson[]
  progress?: number
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  slug: string
  description?: string
  content_type: 'video' | 'audio' | 'text' | 'quiz' | 'exercise'
  video_url?: string
  video_duration_seconds: number
  thumbnail_url?: string
  transcript?: string
  resources?: LessonResource[]
  sort_order: number
  is_free_preview: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  // Progreso del usuario
  user_progress?: UserProgress
}

export interface LessonResource {
  title: string
  url: string
  type: 'pdf' | 'audio' | 'worksheet' | 'link'
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percent: number
  last_position_seconds: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface UserStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  total_xp: number
  level: number
  last_activity_date?: string
  created_at: string
  updated_at: string
}

export interface XPLog {
  id: string
  user_id: string
  xp_amount: number
  reason: string
  reference_type?: string
  reference_id?: string
  created_at: string
}

export interface Reflection {
  id: string
  user_id: string
  lesson_id?: string
  content: string
  is_public: boolean
  created_at: string
  updated_at: string
  // Relaciones
  author?: Pick<User, 'id' | 'name' | 'avatar_url'>
  reactions?: {
    resonates: number
    supports: number
    user_resonated?: boolean
    user_supported?: boolean
  }
}

export interface Mentor {
  id: string
  user_id?: string
  name: string
  title?: string
  bio?: string
  avatar_url?: string
  specialties: string[]
  session_price?: number
  session_duration_minutes: number
  calendar_link?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MentorAvailability {
  id: string
  mentor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface MentorshipSession {
  id: string
  mentor_id: string
  user_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  meeting_link?: string
  notes?: string
  user_notes?: string
  payment_reference?: string
  cancelled_by?: string
  cancelled_reason?: string
  created_at: string
  updated_at: string
  // Relaciones
  mentor?: Mentor
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>
  tokens: AuthTokens
  access: UserAccess | null
}

// =====================================================
// Request Types
// =====================================================

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar_url?: string
}

export interface CreateReflectionRequest {
  content: string
  lesson_id?: string
  is_public?: boolean
}

export interface BookSessionRequest {
  mentor_id: string
  scheduled_at: string
  user_notes?: string
}

// =====================================================
// Cloudflare Bindings
// =====================================================

export interface Bindings {
  DB: D1Database
  JWT_SECRET: string
  ENVIRONMENT: string
}

export interface Variables {
  user?: User
  userAccess?: UserAccess
}
