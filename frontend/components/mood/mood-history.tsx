"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AuthService from "@/services/authService"
import { format } from "date-fns"

interface MoodEntry {
  id: number
  rating: number
  note?: string
  created_at: string
}

const getMoodEmoji = (rating: number) => {
  const emojis = ["", "😢", "😕", "😐", "🙂", "😄"]
  return emojis[rating] || "😐"
}

const getMoodLabel = (rating: number) => {
  const labels = ["", "Overwhelmed", "Stressed", "Neutral", "Good", "Excellent"]
  return labels[rating] || "Unknown"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function MoodHistory() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  const token = AuthService.getAccessToken()

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/mood-logs/?ordering=-created_at`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setEntries(data)
        }
      } catch (err) {
        console.error("Failed to load mood history")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
    window.addEventListener("mood-updated", fetchHistory)
    return () => window.removeEventListener("mood-updated", fetchHistory)
  }, [token])

  if (loading) return <p className="text-center text-muted-foreground py-8">Loading...</p>

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>Check-in History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No check-ins yet. Start tracking your mood!</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 p-3 bg-background/50 rounded-lg border border-border/50">
              <span className="text-3xl">{getMoodEmoji(entry.rating)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{getMoodLabel(entry.rating)}</p>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(entry.created_at), "h:mm a")}
                  </Badge>
                </div>
                {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}