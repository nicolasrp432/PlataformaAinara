// =====================================================
// Leader Blueprint - Supabase Database Types
// Auto-generated from Supabase schema
// =====================================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            achievements: {
                Row: {
                    created_at: string | null
                    criteria: Json | null
                    description: string | null
                    icon_url: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    slug: string
                    xp_reward: number | null
                }
                Insert: {
                    created_at?: string | null
                    criteria?: Json | null
                    description?: string | null
                    icon_url?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    slug: string
                    xp_reward?: number | null
                }
                Update: {
                    created_at?: string | null
                    criteria?: Json | null
                    description?: string | null
                    icon_url?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    slug?: string
                    xp_reward?: number | null
                }
                Relationships: []
            }
            books: {
                Row: {
                    audio_url: string | null
                    author: string | null
                    cover_url: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    is_premium: boolean | null
                    is_published: boolean | null
                    pdf_url: string | null
                    sort_order: number | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    audio_url?: string | null
                    author?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_premium?: boolean | null
                    is_published?: boolean | null
                    pdf_url?: string | null
                    sort_order?: number | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    audio_url?: string | null
                    author?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_premium?: boolean | null
                    is_published?: boolean | null
                    pdf_url?: string | null
                    sort_order?: number | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            formations: {
                Row: {
                    created_at: string | null
                    description: string | null
                    duration_minutes: number | null
                    id: string
                    is_premium: boolean | null
                    is_published: boolean | null
                    level: string | null
                    short_description: string | null
                    slug: string
                    sort_order: number | null
                    thumbnail_url: string | null
                    title: string
                    trailer_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    is_premium?: boolean | null
                    is_published?: boolean | null
                    level?: string | null
                    short_description?: string | null
                    slug: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title: string
                    trailer_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    is_premium?: boolean | null
                    is_published?: boolean | null
                    level?: string | null
                    short_description?: string | null
                    slug?: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title?: string
                    trailer_url?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            lessons: {
                Row: {
                    content_type: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    is_free_preview: boolean | null
                    is_published: boolean | null
                    module_id: string
                    resources: Json | null
                    slug: string
                    sort_order: number | null
                    thumbnail_url: string | null
                    title: string
                    transcript: string | null
                    updated_at: string | null
                    video_duration_seconds: number | null
                    video_url: string | null
                }
                Insert: {
                    content_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_free_preview?: boolean | null
                    is_published?: boolean | null
                    module_id: string
                    resources?: Json | null
                    slug: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title: string
                    transcript?: string | null
                    updated_at?: string | null
                    video_duration_seconds?: number | null
                    video_url?: string | null
                }
                Update: {
                    content_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_free_preview?: boolean | null
                    is_published?: boolean | null
                    module_id?: string
                    resources?: Json | null
                    slug?: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title?: string
                    transcript?: string | null
                    updated_at?: string | null
                    video_duration_seconds?: number | null
                    video_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "lessons_module_id_fkey"
                        columns: ["module_id"]
                        isOneToOne: false
                        referencedRelation: "modules"
                        referencedColumns: ["id"]
                    }
                ]
            }
            mentor_availability: {
                Row: {
                    created_at: string | null
                    day_of_week: number
                    end_time: string
                    id: string
                    is_active: boolean | null
                    mentor_id: string
                    start_time: string
                }
                Insert: {
                    created_at?: string | null
                    day_of_week: number
                    end_time: string
                    id?: string
                    is_active?: boolean | null
                    mentor_id: string
                    start_time: string
                }
                Update: {
                    created_at?: string | null
                    day_of_week?: number
                    end_time?: string
                    id?: string
                    is_active?: boolean | null
                    mentor_id?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "mentor_availability_mentor_id_fkey"
                        columns: ["mentor_id"]
                        isOneToOne: false
                        referencedRelation: "mentors"
                        referencedColumns: ["id"]
                    }
                ]
            }
            mentor_blocked_dates: {
                Row: {
                    blocked_date: string
                    created_at: string | null
                    id: string
                    mentor_id: string
                    reason: string | null
                }
                Insert: {
                    blocked_date: string
                    created_at?: string | null
                    id?: string
                    mentor_id: string
                    reason?: string | null
                }
                Update: {
                    blocked_date?: string
                    created_at?: string | null
                    id?: string
                    mentor_id?: string
                    reason?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "mentor_blocked_dates_mentor_id_fkey"
                        columns: ["mentor_id"]
                        isOneToOne: false
                        referencedRelation: "mentors"
                        referencedColumns: ["id"]
                    }
                ]
            }
            mentors: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    calendar_link: string | null
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    session_duration_minutes: number | null
                    session_price: number | null
                    specialties: Json | null
                    title: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    calendar_link?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    session_duration_minutes?: number | null
                    session_price?: number | null
                    specialties?: Json | null
                    title?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    calendar_link?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    session_duration_minutes?: number | null
                    session_price?: number | null
                    specialties?: Json | null
                    title?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            mentorship_sessions: {
                Row: {
                    cancelled_by: string | null
                    cancelled_reason: string | null
                    created_at: string | null
                    duration_minutes: number | null
                    id: string
                    meeting_link: string | null
                    mentor_id: string
                    notes: string | null
                    payment_reference: string | null
                    scheduled_at: string
                    status: string | null
                    updated_at: string | null
                    user_id: string
                    user_notes: string | null
                }
                Insert: {
                    cancelled_by?: string | null
                    cancelled_reason?: string | null
                    created_at?: string | null
                    duration_minutes?: number | null
                    id?: string
                    meeting_link?: string | null
                    mentor_id: string
                    notes?: string | null
                    payment_reference?: string | null
                    scheduled_at: string
                    status?: string | null
                    updated_at?: string | null
                    user_id: string
                    user_notes?: string | null
                }
                Update: {
                    cancelled_by?: string | null
                    cancelled_reason?: string | null
                    created_at?: string | null
                    duration_minutes?: number | null
                    id?: string
                    meeting_link?: string | null
                    mentor_id?: string
                    notes?: string | null
                    payment_reference?: string | null
                    scheduled_at?: string
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string
                    user_notes?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "mentorship_sessions_mentor_id_fkey"
                        columns: ["mentor_id"]
                        isOneToOne: false
                        referencedRelation: "mentors"
                        referencedColumns: ["id"]
                    }
                ]
            }
            modules: {
                Row: {
                    created_at: string | null
                    description: string | null
                    formation_id: string
                    id: string
                    is_published: boolean | null
                    slug: string
                    sort_order: number | null
                    thumbnail_url: string | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    formation_id: string
                    id?: string
                    is_published?: boolean | null
                    slug: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    formation_id?: string
                    id?: string
                    is_published?: boolean | null
                    slug?: string
                    sort_order?: number | null
                    thumbnail_url?: string | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "modules_formation_id_fkey"
                        columns: ["formation_id"]
                        isOneToOne: false
                        referencedRelation: "formations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    id: string
                    name: string
                    role: string | null
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    id: string
                    name: string
                    role?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                    role?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            reflection_reactions: {
                Row: {
                    created_at: string | null
                    id: string
                    reaction_type: string
                    reflection_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    reaction_type: string
                    reflection_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    reaction_type?: string
                    reflection_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "reflection_reactions_reflection_id_fkey"
                        columns: ["reflection_id"]
                        isOneToOne: false
                        referencedRelation: "reflections"
                        referencedColumns: ["id"]
                    }
                ]
            }
            reflections: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    is_public: boolean | null
                    lesson_id: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    is_public?: boolean | null
                    lesson_id?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    is_public?: boolean | null
                    lesson_id?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "reflections_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    }
                ]
            }
            themes: {
                Row: {
                    colors: Json
                    created_at: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    is_default: boolean | null
                    name: string
                    preview_url: string | null
                    slug: string
                    sort_order: number | null
                    updated_at: string | null
                    xp_cost: number
                }
                Insert: {
                    colors: Json
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_default?: boolean | null
                    name: string
                    preview_url?: string | null
                    slug: string
                    sort_order?: number | null
                    updated_at?: string | null
                    xp_cost?: number
                }
                Update: {
                    colors?: Json
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_default?: boolean | null
                    name?: string
                    preview_url?: string | null
                    slug?: string
                    sort_order?: number | null
                    updated_at?: string | null
                    xp_cost?: number
                }
                Relationships: []
            }
            user_access: {
                Row: {
                    access_granted_by: string | null
                    access_reason: string | null
                    access_type: string | null
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    is_active: boolean | null
                    payment_provider: string | null
                    payment_reference: string | null
                    starts_at: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    access_granted_by?: string | null
                    access_reason?: string | null
                    access_type?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    payment_provider?: string | null
                    payment_reference?: string | null
                    starts_at?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    access_granted_by?: string | null
                    access_reason?: string | null
                    access_type?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    payment_provider?: string | null
                    payment_reference?: string | null
                    starts_at?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            user_achievements: {
                Row: {
                    achievement_id: string
                    id: string
                    unlocked_at: string | null
                    user_id: string
                }
                Insert: {
                    achievement_id: string
                    id?: string
                    unlocked_at?: string | null
                    user_id: string
                }
                Update: {
                    achievement_id?: string
                    id?: string
                    unlocked_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_achievements_achievement_id_fkey"
                        columns: ["achievement_id"]
                        isOneToOne: false
                        referencedRelation: "achievements"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_books: {
                Row: {
                    book_id: string
                    completed_at: string | null
                    created_at: string | null
                    id: string
                    last_audio_position: number | null
                    last_page: number | null
                    progress_percent: number | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    book_id: string
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    last_audio_position?: number | null
                    last_page?: number | null
                    progress_percent?: number | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    book_id?: string
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    last_audio_position?: number | null
                    last_page?: number | null
                    progress_percent?: number | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_books_book_id_fkey"
                        columns: ["book_id"]
                        isOneToOne: false
                        referencedRelation: "books"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_progress: {
                Row: {
                    completed_at: string | null
                    created_at: string | null
                    id: string
                    last_position_seconds: number | null
                    lesson_id: string
                    progress_percent: number | null
                    status: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    last_position_seconds?: number | null
                    lesson_id: string
                    progress_percent?: number | null
                    status?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    last_position_seconds?: number | null
                    lesson_id?: string
                    progress_percent?: number | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_progress_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_streaks: {
                Row: {
                    created_at: string | null
                    current_streak: number | null
                    id: string
                    last_activity_date: string | null
                    level: number | null
                    longest_streak: number | null
                    total_xp: number | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    current_streak?: number | null
                    id?: string
                    last_activity_date?: string | null
                    level?: number | null
                    longest_streak?: number | null
                    total_xp?: number | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    current_streak?: number | null
                    id?: string
                    last_activity_date?: string | null
                    level?: number | null
                    longest_streak?: number | null
                    total_xp?: number | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            user_themes: {
                Row: {
                    id: string
                    is_active: boolean | null
                    theme_id: string
                    unlocked_at: string | null
                    user_id: string
                }
                Insert: {
                    id?: string
                    is_active?: boolean | null
                    theme_id: string
                    unlocked_at?: string | null
                    user_id: string
                }
                Update: {
                    id?: string
                    is_active?: boolean | null
                    theme_id?: string
                    unlocked_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_themes_theme_id_fkey"
                        columns: ["theme_id"]
                        isOneToOne: false
                        referencedRelation: "themes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            xp_log: {
                Row: {
                    created_at: string | null
                    id: string
                    reason: string
                    reference_id: string | null
                    reference_type: string | null
                    user_id: string
                    xp_amount: number
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    reason: string
                    reference_id?: string | null
                    reference_type?: string | null
                    user_id: string
                    xp_amount: number
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    reason?: string
                    reference_id?: string | null
                    reference_type?: string | null
                    user_id?: string
                    xp_amount?: number
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            has_premium_access: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
