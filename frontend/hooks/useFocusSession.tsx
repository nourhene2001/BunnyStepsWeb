// hooks/useFocusSession.ts
import { useState } from "react"
import AuthService from "@/services/authService"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface FocusSession {
  id: number
  mode: string
  effective_minutes: number
  started_at: string
  ended_at?: string
}

export function useFocusSession(mode: string) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const token = AuthService.getAccessToken()

  const startSession = async () => {
    if (!token) return null
    const payload = {
      mode,
      effective_minutes: 0,
      started_at: new Date().toISOString(),
      task: null,
    }
    try {
      const res = await fetch(`${API_URL}/focus-sessions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentSession(data)
        return data
      }
    } catch (err) {
      console.error("Failed to start session", err)
    }
    return null
  }

  const endSession = async (minutes: number) => {
    if (!currentSession || !token) return
    const updated = {
      ...currentSession,
      effective_minutes: minutes,
      ended_at: new Date().toISOString(),
    }
    try {
      await fetch(`${API_URL}/focus-sessions/${currentSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error("Failed to end session", err)
    }
    setCurrentSession(null)
  }

  return { currentSession, startSession, endSession, setCurrentSession }
}