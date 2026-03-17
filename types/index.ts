// =====================================================
// Plataforma Ainara - Tipos TypeScript
// Sistema de Educación Transformacional
// =====================================================

// =====================================================
// User & Authentication Types
// =====================================================

export type UserRole = "user" | "admin" | "mentor"
export type UserStatus = "active" | "inactive" | "suspended"
export type AccessType = "free" | "paid" | "manual" | "trial"

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: UserRole
  status: UserStatus
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

export interface UserAccess {
  id: string
  user_id: string
  plan_id?: string
  access_type: AccessType
  access_granted_by?: string
  access_reason?: string
  starts_at: string
  expires_at?: string
  is_active: boolean
  payment_reference?: string
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

// =====================================================
// Content Types (Formations, Modules, Lessons)
// =====================================================

export type ContentLevel = "beginner" | "intermediate" | "advanced"
export type ContentType = "video" | "audio" | "text" | "quiz" | "exercise"
export type ProgressStatus = "not_started" | "in_progress" | "completed"

export interface Formation {
  id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  trailer_url?: string
  level: ContentLevel
  duration_minutes: number
  is_premium: boolean
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Relations
  modules?: Module[]
  modules_count?: number
  lessons_count?: number
  progress?: number
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
  // Relations
  formation?: Formation
  lessons?: Lesson[]
  lessons_count?: number
  progress?: number
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  slug: string
  description?: string
  content_type: ContentType
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
  // Relations
  module?: Module
  user_progress?: UserProgress
}

export interface LessonResource {
  title: string
  url: string
  type: "pdf" | "audio" | "worksheet" | "link"
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: ProgressStatus
  progress_percent: number
  last_position_seconds: number
  completed_at?: string
  created_at: string
  updated_at: string
}

// =====================================================
// Comments System
// =====================================================

export interface LessonComment {
  id: string
  lesson_id: string
  user_id: string
  parent_id?: string
  content: string
  is_pinned: boolean
  is_hidden: boolean
  created_at: string
  updated_at: string
  // Relations
  author?: Pick<User, "id" | "name" | "avatar_url">
  replies?: LessonComment[]
  likes_count?: number
  user_has_liked?: boolean
}

// =====================================================
// Quiz System
// =====================================================

export type QuestionType = "multiple_choice" | "true_false" | "open_ended"

export interface Quiz {
  id: string
  lesson_id?: string
  module_id?: string
  title: string
  description?: string
  passing_score: number
  max_attempts: number
  time_limit_minutes?: number
  is_published: boolean
  created_at: string
  // Relations
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_type: QuestionType
  question_text: string
  options?: string[] // JSON array for multiple choice
  correct_answer: string
  explanation?: string
  points: number
  sort_order: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  passed: boolean
  answers: Record<string, string> // questionId -> answer
  started_at: string
  completed_at?: string
  created_at: string
}

// =====================================================
// Certificates
// =====================================================

export interface Certificate {
  id: string
  user_id: string
  formation_id: string
  certificate_number: string
  issued_at: string
  pdf_url?: string
  // Relations
  user?: Pick<User, "id" | "name" | "email">
  formation?: Pick<Formation, "id" | "title" | "slug">
}

// =====================================================
// Reflections & Community
// =====================================================

export interface Reflection {
  id: string
  user_id: string
  lesson_id?: string
  content: string
  is_public: boolean
  created_at: string
  updated_at: string
  // Relations
  author?: Pick<User, "id" | "name" | "avatar_url">
  lesson?: Pick<Lesson, "id" | "title" | "slug">
  reactions?: {
    resonates: number
    supports: number
    user_resonated?: boolean
    user_supported?: boolean
  }
}

// =====================================================
// Mentorship
// =====================================================

export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

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
  status: SessionStatus
  meeting_link?: string
  notes?: string
  user_notes?: string
  payment_reference?: string
  cancelled_by?: string
  cancelled_reason?: string
  created_at: string
  updated_at: string
  // Relations
  mentor?: Mentor
  user?: Pick<User, "id" | "name" | "email" | "avatar_url">
}

// =====================================================
// Subscription Plans
// =====================================================

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

// =====================================================
// XP & Gamification
// =====================================================

export interface XPLog {
  id: string
  user_id: string
  xp_amount: number
  reason: string
  reference_type?: string
  reference_id?: string
  created_at: string
}

// =====================================================
// API Types
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
  user: Omit<User, "password_hash">
  tokens: AuthTokens
  access: UserAccess | null
}

// =====================================================
// Form/Request Types
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

export interface CreateFormationRequest {
  title: string
  slug?: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  level: ContentLevel
  is_premium?: boolean
}

export interface UpdateFormationRequest extends Partial<CreateFormationRequest> {
  is_published?: boolean
  sort_order?: number
}

export interface CreateModuleRequest {
  formation_id: string
  title: string
  slug?: string
  description?: string
}

export interface CreateLessonRequest {
  module_id: string
  title: string
  slug?: string
  description?: string
  content_type?: ContentType
  video_url?: string
  is_free_preview?: boolean
}

export interface UpdateProgressRequest {
  lesson_id: string
  progress_percent: number
  last_position_seconds: number
  status?: ProgressStatus
}

// =====================================================
// Dashboard Stats
// =====================================================

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalFormations: number
  publishedFormations: number
  totalLessons: number
  completedLessons: number
  averageProgress: number
  newUsersThisMonth: number
}

export interface UserDashboardStats {
  formationsInProgress: number
  formationsCompleted: number
  lessonsCompleted: number
  totalXp: number
  currentStreak: number
  level: number
  nextLevelProgress: number
}
