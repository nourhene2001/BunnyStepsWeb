// focus-stats.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import AuthService from "@/services/authService"

export default function FocusStats() {
  const [chartData, setChartData] = useState([])
  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/focus-sessions/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setChartData(data.chart_data || [])
        }
      } catch (err) {
        console.error("Failed to load stats", err)
      }
    }
    fetchStats()
  }, [token])

  return (
    <div className="space-y-4">
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sessions" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Weekly Total</p>
            <p className="text-2xl font-bold text-accent">31 sessions</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hours Focused</p>
            <p className="text-2xl font-bold text-secondary">12.75 hrs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}