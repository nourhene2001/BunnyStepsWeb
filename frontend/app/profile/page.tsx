"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mail, Award, TrendingUp, Calendar, DollarSign, CheckCircle, Heart } from "lucide-react"
import Link from "next/link"
import AuthService from "@/services/authService"
import { toast } from "sonner"
import SidebarLayout from "@/components/layout/sidebar-layout"

interface Task {
  id: number
  title: string
  completed_at: string
}

interface Hobby {
  id: number
  name: string
  description?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  })
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    streak: 0,
    moodEntries: 0,
    salary_amount: 0,
  })
  const [latestTasks, setLatestTasks] = useState<Task[]>([])
  const [hobbies, setHobbies] = useState<Hobby[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const token = AuthService.getAccessToken()

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          setFormData({
            username: data.username || "",
            email: data.email || "",
            bio: data.bio || "",
          })
          setStats({
            tasksCompleted: 47, // Mock or fetch real
            streak: 12, // Mock
            moodEntries: 85, // Mock
            salary_amount: data.salary_amount || 0,
          })
        }
      } catch (error) {
        toast.error("Failed to load profile")
      }
    }

    const loadLatestTasks = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/tasks/?status=done&ordering=-completed_at&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setLatestTasks(data) // Assume array of tasks
        }
      } catch (error) {
        toast.error("Failed to load tasks")
      }
    }

    const loadHobbies = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/hobbies/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setHobbies(data) // Assume array of hobbies
        }
      } catch (error) {
        toast.error("Failed to load hobbies")
      }
    }

    loadProfile()
    loadLatestTasks()
    loadHobbies()
  }, [token])

  const handleSaveProfile = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, ...data })
        setIsEditing(false)
        toast.success("Profile updated")
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Failed to update profile")
    }
  }

  if (!user) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        {/* Profile Card */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  {isEditing ? (
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="text-2xl font-bold mb-1"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                  )}
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-muted-foreground mb-2"
                    />
                  ) : (
                    <p className="text-muted-foreground flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" /> {user.email || "No email set"}
                    </p>
                  )}
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.bio || "No bio yet"}</p>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="space-x-2">
                  <Button onClick={handleSaveProfile}>Save</Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
                <p className="text-2xl font-semibold">{stats.tasksCompleted}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                <p className="text-2xl font-semibold">{stats.streak} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mood Check-ins</p>
                <p className="text-2xl font-semibold">{stats.moodEntries}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Salary</p>
                <p className="text-2xl font-semibold">{stats.salary_amount} DT</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="border-border">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none px-6 py-0">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="tasks">Latest Tasks</TabsTrigger>
              <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="p-6 space-y-4">
              <p className="text-muted-foreground">Recent activity will appear here</p>
            </TabsContent>

            <TabsContent value="achievements" className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["🌟", "🚀", "💪", "🎯", "✨", "🏆"].map((emoji, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg"
                  >
                    <span className="text-3xl mb-2">{emoji}</span>
                    <p className="text-xs text-center text-muted-foreground">Achievement {i + 1}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="p-6 space-y-4">
              <h3 className="font-semibold">Latest Accomplished Tasks</h3>
              {latestTasks.length > 0 ? (
                <ul className="space-y-3">
                  {latestTasks.map(task => (
                    <li key={task.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>{task.title}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(task.completed_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No recent completed tasks</p>
              )}
            </TabsContent>

            <TabsContent value="hobbies" className="p-6 space-y-4">
              <h3 className="font-semibold">Hobbies You're Working On</h3>
              {hobbies.length > 0 ? (
                <ul className="space-y-3">
                  {hobbies.map(hobby => (
                    <li key={hobby.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Heart className="w-5 h-5 text-primary" />
                      <div>
                        <span className="font-medium">{hobby.name}</span>
                        {hobby.description && <p className="text-sm text-muted-foreground">{hobby.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No hobbies added yet</p>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </SidebarLayout>
  )
}