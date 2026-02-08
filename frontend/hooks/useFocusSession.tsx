// hooks/useFocusSession.ts
import { useState } from "react"
import AuthService from "@/services/authService"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface FocusSession {
  id: number
  mode: string
  started_at: string
}

export function useFocusSession(mode: string) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const token = AuthService.getAccessToken()

  const startSession = async () => {
    if (!token) {
      console.error("No auth token")
      return
    }

    try {
      const res = await fetch(`${API_URL}/focus-sessions/start/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        console.error("Start failed:", error)
        return
      }

      const data = await res.json()
      const session: FocusSession = {
        id: data.session_id,
        mode,
        started_at: new Date().toISOString(),
      }
      setCurrentSession(session)
    } catch (err) {
      console.error("Failed to start session", err)
    }
  }

  const endSession = async () => {
    if (!currentSession || !token) return

    try {
      const res = await fetch(`${API_URL}/focus-sessions/${currentSession.id}/end/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        console.error("End failed:", await res.json().catch(() => ({})))
        return
      }

      const data = await res.json()
      const minutes = data.effective_minutes || 0
      console.log(`Focus session ended: +${minutes} XP`)

      setCurrentSession(null)

      // Optional: trigger reward
      if (minutes > 0 && typeof window !== "undefined") {
        import("@/components/reward/RewardProvider")
          .then(module => {
            const { useReward } = module
            const { showReward } = useReward()
            showReward({ type: "xp", amount: minutes, source: `${mode} session` })
          })
          .catch(() => {})
      }
    } catch (err) {
      console.error("Failed to end session", err)
    }
  }

  // Always return the functions — never void
  return {
    currentSession,
    startSession,
    endSession,
  }
}