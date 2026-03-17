import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserAccess,
  Formation,
  Module,
  Lesson,
  UserProgress,
  UserStreak,
  Reflection,
  Mentor,
  MentorshipSession,
  LoginRequest,
  RegisterRequest,
  CreateFormationRequest,
  UpdateFormationRequest,
  CreateModuleRequest,
  CreateLessonRequest,
  UpdateProgressRequest,
  DashboardStats,
  UserDashboardStats,
} from "@/types"

// API Base URL - defaults to same origin for local dev
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Include cookies for auth
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(
        error.error || `HTTP error ${response.status}`,
        response.status
      )
    }

    return response.json()
  }

  // =====================================================
  // Authentication
  // =====================================================

  async login(data: LoginRequest): Promise<ApiResponse<{ user: User; session: { access_token: string } }>> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User; session: { access_token: string } }>> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request("/api/auth/logout", {
      method: "POST",
    })
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request("/api/auth/me")
  }

  // =====================================================
  // Content - Formations
  // =====================================================

  async getFormations(params?: {
    page?: number
    limit?: number
    level?: string
    published?: boolean
  }): Promise<PaginatedResponse<Formation>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.level) searchParams.set("level", params.level)
    if (params?.published !== undefined)
      searchParams.set("published", String(params.published))

    const query = searchParams.toString()
    return this.request(`/api/content/formations${query ? `?${query}` : ""}`)
  }

  async getFormation(slugOrId: string): Promise<ApiResponse<Formation>> {
    return this.request(`/api/content/formations/${slugOrId}`)
  }

  async createFormation(data: CreateFormationRequest): Promise<ApiResponse<Formation>> {
    return this.request("/api/admin/formations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateFormation(
    id: string,
    data: UpdateFormationRequest
  ): Promise<ApiResponse<Formation>> {
    return this.request(`/api/admin/formations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteFormation(id: string): Promise<ApiResponse<null>> {
    return this.request(`/api/admin/formations/${id}`, {
      method: "DELETE",
    })
  }

  // =====================================================
  // Content - Modules
  // =====================================================

  async getModules(formationId: string): Promise<ApiResponse<Module[]>> {
    return this.request(`/api/content/formations/${formationId}/modules`)
  }

  async getModule(moduleId: string): Promise<ApiResponse<Module>> {
    return this.request(`/api/content/modules/${moduleId}`)
  }

  async createModule(data: CreateModuleRequest): Promise<ApiResponse<Module>> {
    return this.request("/api/admin/modules", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateModule(
    id: string,
    data: Partial<CreateModuleRequest> & { is_published?: boolean; sort_order?: number }
  ): Promise<ApiResponse<Module>> {
    return this.request(`/api/admin/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteModule(id: string): Promise<ApiResponse<null>> {
    return this.request(`/api/admin/modules/${id}`, {
      method: "DELETE",
    })
  }

  // =====================================================
  // Content - Lessons
  // =====================================================

  async getLessons(moduleId: string): Promise<ApiResponse<Lesson[]>> {
    return this.request(`/api/content/modules/${moduleId}/lessons`)
  }

  async getLesson(lessonId: string): Promise<ApiResponse<Lesson>> {
    return this.request(`/api/content/lessons/${lessonId}`)
  }

  async createLesson(data: CreateLessonRequest): Promise<ApiResponse<Lesson>> {
    return this.request("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateLesson(
    id: string,
    data: Partial<CreateLessonRequest> & {
      video_url?: string
      video_duration_seconds?: number
      transcript?: string
      resources?: string
      is_published?: boolean
      sort_order?: number
    }
  ): Promise<ApiResponse<Lesson>> {
    return this.request(`/api/admin/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteLesson(id: string): Promise<ApiResponse<null>> {
    return this.request(`/api/admin/lessons/${id}`, {
      method: "DELETE",
    })
  }

  // =====================================================
  // User Progress
  // =====================================================

  async updateProgress(data: UpdateProgressRequest): Promise<ApiResponse<UserProgress>> {
    return this.request("/api/users/progress", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async completeLesson(lessonId: string): Promise<ApiResponse<{ xp_earned: number }>> {
    return this.request(`/api/users/progress/${lessonId}/complete`, {
      method: "POST",
    })
  }

  async getUserProgress(): Promise<ApiResponse<UserProgress[]>> {
    return this.request("/api/users/progress")
  }

  async getUserStreak(): Promise<ApiResponse<UserStreak>> {
    return this.request("/api/users/streak")
  }

  // =====================================================
  // Reflections
  // =====================================================

  async getReflections(params?: {
    page?: number
    limit?: number
    public?: boolean
  }): Promise<PaginatedResponse<Reflection>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.public !== undefined)
      searchParams.set("public", String(params.public))

    const query = searchParams.toString()
    return this.request(`/api/reflections${query ? `?${query}` : ""}`)
  }

  async createReflection(data: {
    content: string
    lesson_id?: string
    is_public?: boolean
  }): Promise<ApiResponse<Reflection>> {
    return this.request("/api/reflections", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async reactToReflection(
    reflectionId: string,
    type: "resonate" | "support"
  ): Promise<ApiResponse<null>> {
    return this.request(`/api/reflections/${reflectionId}/react`, {
      method: "POST",
      body: JSON.stringify({ type }),
    })
  }

  // =====================================================
  // Mentorship
  // =====================================================

  async getMentors(): Promise<ApiResponse<Mentor[]>> {
    return this.request("/api/mentorship/mentors")
  }

  async getMentor(id: string): Promise<ApiResponse<Mentor>> {
    return this.request(`/api/mentorship/mentors/${id}`)
  }

  async bookSession(data: {
    mentor_id: string
    scheduled_at: string
    user_notes?: string
  }): Promise<ApiResponse<MentorshipSession>> {
    return this.request("/api/mentorship/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getMySessions(): Promise<ApiResponse<MentorshipSession[]>> {
    return this.request("/api/mentorship/sessions")
  }

  async cancelSession(id: string, reason?: string): Promise<ApiResponse<null>> {
    return this.request(`/api/mentorship/sessions/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // =====================================================
  // Admin
  // =====================================================

  async getAdminStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request("/api/admin/stats")
  }

  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.role) searchParams.set("role", params.role)
    if (params?.status) searchParams.set("status", params.status)

    const query = searchParams.toString()
    return this.request(`/api/admin/users${query ? `?${query}` : ""}`)
  }

  async updateUserAccess(
    userId: string,
    data: {
      access_type: string
      plan_id?: string
      access_reason?: string
      expires_at?: string
    }
  ): Promise<ApiResponse<UserAccess>> {
    return this.request(`/api/admin/users/${userId}/access`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // =====================================================
  // Dashboard
  // =====================================================

  async getUserDashboard(): Promise<ApiResponse<UserDashboardStats>> {
    return this.request("/api/users/dashboard")
  }
}

// Custom error class
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

// Export singleton instance
export const api = new ApiClient()

// Export class for custom instances
export { ApiClient }
