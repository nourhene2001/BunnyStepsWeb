// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Zap, Star, AlertCircle, Bell, Rabbit } from "lucide-react"
import { format, isToday } from "date-fns"
import AuthService from "@/services/authService"
import NotificationBell from "./Notification"

// Types
interface Task {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  due_date?: string
  completed: boolean
}

interface ShoppingItem {
  id: string
  name: string
  estimated_cost: number
  expiry_date?: string
  priority: "low" | "medium" | "high"
  note?: string
}

interface Hobby {
  id: string
  name: string
  description?: string
}

interface UserStats {
  level: number
  xp: number
  coins: number
  achievements_count: number
}

interface Recommendation {
  message: string
  treat_yourself: ShoppingItem[]
  relax_with: Hobby[]
}
interface Notification {
  id: number
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}
export default function UltimateDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [expiringItems, setExpiringItems] = useState<ShoppingItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  const fetchData = async () => {
    if (!token) return

    setLoading(true)
    try {
      const [tasksRes, expiringRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/tasks/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/expiring-items/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const tasksData: Task[] = tasksRes.ok ? await tasksRes.json() : []
      const expiringData: ShoppingItem[] = expiringRes.ok ? await expiringRes.json() : []
      const profile = profileRes.ok ? await profileRes.json() : {}

      const userStats: UserStats = {
        level: profile.level ?? 1,
        xp: profile.xp ?? 0,
        coins: profile.coins ?? 0,
        achievements_count: profile.achievements_count ?? 0,
      }

      setTasks(tasksData)
      setExpiringItems(expiringData)
      setStats(userStats)

      // Only fetch recommendations if user has enough coins
      if (userStats.coins >= 500) {
        const recRes = await fetch(`${API_URL}/reward-recommendations/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (recRes.ok) {
          const rec = await recRes.json()
          setRecommendation(rec)
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_URL}/ping/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }, 60000) // every minute

    return () => clearInterval(interval)
  }, [token])
  // Derived values
  const urgentToday = tasks.filter(
    t => !t.completed &&
         t.due_date &&
         isToday(new Date(t.due_date)) &&
         ["high", "urgent"].includes(t.priority)
  )

  const nextLevelXP = (stats?.level ?? 1) * 1000
  const xpProgress = stats ? (stats.xp / nextLevelXP) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Rabbit className="w-20 h-20 text-pink-600 animate-bounce mx-auto mb-4" />
          <p className="text-2xl font-bold text-purple-700">Loading your cozy garden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="text-center pt-8">
          <Rabbit className="w-20 h-20 mx-auto text-pink-600 animate-bounce" />
          <h1 className="text-4xl font-bold text-purple-800 mt-4">Bunny Dashboard</h1>
          <p className="text-lg text-purple-600 mt-1">Your peaceful productivity home</p>
          <NotificationBell />
        </div>

        {/* Level & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Current Level */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-muted-foreground mb-2">Current Level</p>
                  <h2 className="text-5xl font-bold text-primary">{stats?.level}</h2>
                </div>
                <Award className="w-20 h-20 text-primary opacity-20" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Level Progress</span>
                  <span className="font-semibold">{stats?.xp} / {nextLevelXP} XP</span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-700"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {nextLevelXP - (stats?.xp ?? 0)} XP to next level
              </p>
            </CardContent>
          </Card>

          {/* Coins */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-accent/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-accent" />
                <p className="text-lg text-muted-foreground">Bunny Coins</p>
              </div>
              <p className="text-5xl font-bold text-accent">{stats?.coins}</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="w-8 h-8 text-secondary" />
                <p className="text-lg text-muted-foreground">Achievements</p>
              </div>
              <p className="text-5xl font-bold text-secondary">{stats?.achievements_count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Tasks Today */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Urgent Tasks Today ({urgentToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentToday.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No urgent tasks today! You're doing amazing</p>
            ) : (
              <div className="space-y-4">
                {urgentToday.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-red-50/50 border border-red-200">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    </div>
                    <Badge className="bg-red-500 text-white">{task.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Expiring Soon */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-orange-500" />
              Items Expiring Soon ({expiringItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nothing expiring soon</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiringItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-orange-50/50 border border-orange-200">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.expiry_date && (
                        <p className="text-sm text-muted-foreground">
                          Expires {format(new Date(item.expiry_date), "MMM d")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{item.estimated_cost} DT</p>
                      <Badge variant="outline" className="mt-1">{item.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Recommendations */}
        {recommendation && (
          <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Star className="w-6 h-6 text-yellow-500" />
                Bunny's Special Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground font-medium">{recommendation.message}</p>

              <div>
                <h3 className="font-semibold text-accent mb-3">Treat Yourself</h3>
                <div className="space-y-3">
                  {recommendation.treat_yourself.map(item => (
                    <div key={item.id} className="p-4 rounded-lg bg-white/40 backdrop-blur border border-accent/20 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <Badge variant="secondary">{item.priority}</Badge>
                      </div>
                      <p className="font-bold text-accent">{item.estimated_cost} DT</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-secondary mb-3">Or Relax With</h3>
                <div className="space-y-3">
                  {recommendation.relax_with.map(hobby => (
                    <div key={hobby.id} className="p-4 rounded-lg bg-white/40 backdrop-blur border border-secondary/20">
                      <p className="font-medium">{hobby.name}</p>
                      {hobby.description && <p className="text-sm text-muted-foreground mt-1">{hobby.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}