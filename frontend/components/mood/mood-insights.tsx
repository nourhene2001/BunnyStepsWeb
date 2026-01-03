"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import AuthService from "@/services/authService"

interface Insights {
  today_checkins: number
  weekly_average: number
  weekly_trend: { time: string; mood: number }[]
  best_day: string | null
  streak: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function MoodInsights() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const token = AuthService.getAccessToken()

  useEffect(() => {
    const fetchInsights = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/mood-logs/insights/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setInsights(data)
        }
      } catch (err) {
        console.error("Failed to load mood insights")
      }
    }

    fetchInsights()
    window.addEventListener("mood-updated", fetchInsights)
    return () => window.removeEventListener("mood-updated", fetchInsights)
  }, [token])

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Start checking in to see your mood trends!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>Mood Trends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={insights.weekly_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} domain={[1, 5]} ticks={[1,2,3,4,5]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="var(--secondary)"
              strokeWidth={3}
              dot={{ fill: "var(--secondary)", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20">
            <p className="text-muted-foreground mb-1">Best Day</p>
            <p className="font-semibold">{insights.best_day || "—"}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded border border-accent/20">
            <p className="text-muted-foreground mb-1">Weekly Avg</p>
            <p className="font-semibold">{insights.weekly_average}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded border border-secondary/20">
            <p className="text-muted-foreground mb-1">Check-in Streak</p>
            <p className="font-semibold">{insights.streak} days</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2">Insight</h4>
          <p className="text-xs text-muted-foreground">
            You've checked in {insights.today_checkins} time{insights.today_checkins !== 1 ? 's' : ''} today. 
            Your average mood this week is {insights.weekly_average} — keep tracking!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}