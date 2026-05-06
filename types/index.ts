// ── Enums / Union Types ──────────────────────────────────────
export type UserRole = 'student' | 'mentor' | 'admin'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ContentType = 'video' | 'text' | 'quiz' | 'exercise' | 'meditation'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'

// ── Profile ──────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  status: string | null
  level: number
  xp: number
  streak_days: number
  last_activity_date: string | null
  birth_date: string | null
  birth_time: string | null
  birth_city: string | null
  created_at: string
  updated_at: string
}

// ── Formation ────────────────────────────────────────────────
export interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  long_description: string | null
  thumbnail_url: string | null
  trailer_url: string | null
  difficulty: Difficulty
  duration_minutes: number
  is_premium: boolean
  is_published: boolean
  is_featured: boolean
  sort_order: number
  xp_reward: number
  price: number
  created_at: string
  updated_at: string
  // Relaciones opcionales
  modules?: Module[]
  modules_count?: number
  lessons_count?: number
}

// ── Module ───────────────────────────────────────────────────
export interface Module {
  id: string
  formation_id: string
  title: string
  slug: string | null
  description: string | null
  thumbnail_url: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
  // Relaciones opcionales
  lessons?: Lesson[]
  lessons_count?: number
}

// ── Lesson ───────────────────────────────────────────────────
export interface Lesson {
  id: string
  module_id: string
  title: string
  slug: string | null
  description: string | null
  content_type: ContentType
  video_url: string | null
  duration_seconds: number
  thumbnail_url: string | null
  transcript: string | null
  resources: LessonResource[] | null
  sort_order: number
  is_free: boolean
  is_published: boolean
  xp_reward: number
  created_at: string
  updated_at: string
  // Relaciones opcionales
  module?: Module
  user_progress?: UserProgress | null
}

export interface LessonResource {
  title: string
  url: string
  type: 'pdf' | 'link' | 'video'
}

// ── Enrollment ───────────────────────────────────────────────
export interface Enrollment {
  id: string
  user_id: string
  formation_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
  progress_percent: number
}

// ── UserProgress ─────────────────────────────────────────────
export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: ProgressStatus
  is_completed: boolean
  progress_percent: number
  watched_seconds: number
  last_position_seconds: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ── Reflection ───────────────────────────────────────────────
export interface Reflection {
  id: string
  user_id: string
  lesson_id: string | null
  content: string
  is_public: boolean
  created_at: string
  updated_at: string
  // Join opcional
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'role'> | null
}

// ── Tipos de UI (no son tablas de BD) ────────────────────────
export interface FormationWithProgress extends Formation {
  isEnrolled: boolean
  progress: number
  completedLessons: string[]
}

export interface LibraryFormation {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  difficulty: Difficulty
  duration: number           // en minutos
  lessonsCount: number
  isPremium: boolean
  progress: number
  isEnrolled: boolean
  isCompleted: boolean
}

// ── API utility types ─────────────────────────────────────────
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

// ── Dashboard Stats ───────────────────────────────────────────
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

// ── Form / Request Types ──────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface CreateFormationRequest {
  title: string
  slug?: string
  description?: string
  difficulty?: Difficulty
  is_premium?: boolean
}

export interface UpdateFormationRequest extends Partial<CreateFormationRequest> {
  is_published?: boolean
  sort_order?: number
  duration_minutes?: number
  is_featured?: boolean
  xp_reward?: number
  price?: number
  long_description?: string
  thumbnail_url?: string
  trailer_url?: string
}

export interface CreateModuleRequest {
  formation_id: string
  title: string
  slug?: string
  description?: string
  sort_order?: number
}

export interface CreateLessonRequest {
  module_id: string
  title: string
  slug?: string
  description?: string
  content_type?: ContentType
  video_url?: string
  is_free?: boolean
  sort_order?: number
}

export interface UpdateProgressRequest {
  lesson_id: string
  progress_percent: number
  last_position_seconds: number
  status?: ProgressStatus
}
