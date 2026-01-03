// focus-stats.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import AuthService from "@/services/authService"

export default function FocusStats() {
  const [chartData, setChartData] = useState<any[]>([])
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
        console.error("Failed to load focus stats", err)
      }
    }
    fetchStats()
  }, [token])

  const totalSessions = chartData.reduce((sum, day) => sum + (day.sessions || 0), 0)
  const totalMinutes = chartData.reduce((sum, day) => sum + (day.minutes || 0), 0)

// focus-stats.tsx
return (
  <div className="space-y-6">
    {/* Weekly Chart */}
    <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-foreground">Focus This Week</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex items-center justify-center text-muted-foreground">
            No focus data yet this week
          </div>
        )}
      </CardContent>
    </Card>

    {/* Summary Stats */}
    <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Sessions This Week</p>
          <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Minutes Focused</p>
          <p className="text-3xl font-bold text-foreground">{totalMinutes}</p>
        </div>
      </CardContent>
    </Card>
  </div>
)}