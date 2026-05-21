"use client"

import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

interface UserState {
  xp: number
  level: number
  streakDays: number
  completedLessons: Set<string>
}

type Action =
  | { type: "HYDRATE"; payload: Omit<UserState, "completedLessons"> & { completedLessons: string[] } }
  | { type: "ADD_XP"; xp: number; leveledUp: boolean }
  | { type: "MARK_LESSON_COMPLETE"; lessonId: string }
  | { type: "SET_STREAK"; days: number }

// ── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case "HYDRATE":
      return {
        xp: action.payload.xp,
        level: action.payload.level,
        streakDays: action.payload.streakDays,
        completedLessons: new Set(action.payload.completedLessons),
      }
    case "ADD_XP":
      return {
        ...state,
        xp: state.xp + action.xp,
        level: action.leveledUp ? state.level + 1 : state.level,
      }
    case "MARK_LESSON_COMPLETE": {
      const next = new Set(state.completedLessons)
      next.add(action.lessonId)
      return { ...state, completedLessons: next }
    }
    case "SET_STREAK":
      return { ...state, streakDays: action.days }
    default:
      return state
  }
}

const initialState: UserState = {
  xp: 0,
  level: 1,
  streakDays: 0,
  completedLessons: new Set(),
}

// ── Context ────────────────────────────────────────────────────────────────

interface UserStoreContext {
  state: UserState
  hydrate: (data: { xp: number; level: number; streakDays: number; completedLessons: string[] }) => void
  addXP: (xp: number, leveledUp: boolean) => void
  markLessonComplete: (lessonId: string) => void
  isLessonCompleted: (lessonId: string) => boolean
}

const Context = createContext<UserStoreContext | null>(null)

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const hydrate = useCallback(
    (data: { xp: number; level: number; streakDays: number; completedLessons: string[] }) => {
      dispatch({ type: "HYDRATE", payload: data })
    },
    []
  )

  const addXP = useCallback((xp: number, leveledUp: boolean) => {
    dispatch({ type: "ADD_XP", xp, leveledUp })
  }, [])

  const markLessonComplete = useCallback((lessonId: string) => {
    dispatch({ type: "MARK_LESSON_COMPLETE", lessonId })
  }, [])

  const isLessonCompleted = useCallback(
    (lessonId: string) => state.completedLessons.has(lessonId),
    [state.completedLessons]
  )

  return (
    <Context.Provider value={{ state, hydrate, addXP, markLessonComplete, isLessonCompleted }}>
      {children}
    </Context.Provider>
  )
}

export function useUserStore() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error("useUserStore must be used inside UserStoreProvider")
  return ctx
}
