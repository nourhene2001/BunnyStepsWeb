// app/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Moon, Sun, Lock, Database, LogOut, Bell, Zap, Check, User, Shield, Award, DollarSign, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"
import AuthService from "@/services/authService"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import SidebarLayout from "@/components/layout/sidebar-layout"

interface Settings {
  theme: "light" | "dark"
  notifications: {
    taskReminders: boolean
    moodCheckins: boolean
    achievements: boolean
    weeklyReport: boolean
  }
  accessibility: {
    reducedMotion: boolean
    largerText: boolean
    highContrast: boolean
  }
  language: string
  salary_amount?: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    notifications: { taskReminders: true, moodCheckins: true, achievements: true, weeklyReport: true },
    accessibility: { reducedMotion: false, largerText: false, highContrast: false },
    language: "en",
    salary_amount: 0,
  })
  const [saving, setSaving] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const token = AuthService.getAccessToken()

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Get profile data (includes salary)
        const profileRes = await fetch(`${API_URL}/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (profileRes.ok) {
          const profile = await profileRes.json()
          setSettings(prev => ({ ...prev, salary_amount: profile.salary_amount || 0 }))
        }

        // Load local theme preference
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
        if (savedTheme) {
          setSettings(prev => ({ ...prev, theme: savedTheme }))
          document.documentElement.classList.toggle("dark", savedTheme === "dark")
        }
      } catch (error) {
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [token])

  const updateTheme = (newTheme: "light" | "dark") => {
    setSettings(prev => ({ ...prev, theme: newTheme }))
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    toast.success(`Theme changed to ${newTheme}`)
  }

  const toggleNotification = async (key: keyof Settings["notifications"]) => {
    const updated = { ...settings.notifications, [key]: !settings.notifications[key] }
    setSettings(prev => ({ ...prev, notifications: updated }))
    
    // Save to backend (mock endpoint - implement in views.py)
    try {
      await fetch(`${API_URL}/settings/notifications/`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(updated)
      })
      toast.success("Notification preferences saved")
    } catch {
      toast.error("Failed to save notification settings")
    }
  }

  const updateAccessibility = (key: keyof Settings["accessibility"], value: boolean) => {
    const updated = { ...settings.accessibility, [key]: value }
    setSettings(prev => ({ ...prev, accessibility: updated }))
    
    // Apply accessibility changes immediately
    if (key === "reducedMotion") {
      document.documentElement.style.setProperty('--animate-duration', value ? '0.01s' : '0.3s')
    } else if (key === "largerText") {
      document.documentElement.classList.toggle('text-lg', value)
    } else if (key === "highContrast") {
      document.documentElement.classList.toggle('high-contrast', value)
    }
    
    toast.success("Accessibility updated")
  }

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      router.push("/login")
      toast.success("Logged out successfully")
    } catch {
      toast.error("Logout failed")
      router.push("/login")
    }
  }

  const updateSalary = async (value: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/profile/`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ salary_amount: value })
      })
      if (res.ok) {
        setSettings(prev => ({ ...prev, salary_amount: value }))
        toast.success("Salary updated")
      }
    } catch {
      toast.error("Failed to update salary")
    }
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your BunnySteps experience</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="appearance"><Sun className="w-4 h-4 mr-1" /> Appearance</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" /> Notifications</TabsTrigger>
              <TabsTrigger value="accessibility"><Shield className="w-4 h-4 mr-1" /> Accessibility</TabsTrigger>
              <TabsTrigger value="account"><User className="w-4 h-4 mr-1" /> Account</TabsTrigger>
            </TabsList>

            {/* Appearance */}
            <TabsContent value="appearance" className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Theme
                </h3>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <Card className={`p-6 text-center cursor-pointer transition-all hover:shadow-md border-2 ${
                    settings.theme === "light" 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-border hover:border-primary/50"
                  }`} onClick={() => updateTheme("light")}>
                    <Sun className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">Light</h4>
                    <p className="text-sm text-muted-foreground">Bright and clean</p>
                  </Card>
                  
                  <Card className={`p-6 text-center cursor-pointer transition-all hover:shadow-md border-2 ${
                    settings.theme === "dark" 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-border hover:border-primary/50"
                  }`} onClick={() => updateTheme("dark")}>
                    <Moon className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">Dark</h4>
                    <p className="text-sm text-muted-foreground">Eye-friendly</p>
                  </Card>
                </div>
              </div>

              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={settings.language} onValueChange={(v) => setSettings(prev => ({ ...prev, language: v }))}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="p-8 space-y-4">
              <div className="bg-accent/10 p-6 rounded-2xl border border-accent/20">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    { key: "taskReminders", label: "Task Reminders", desc: "Due dates and priority changes", icon: Check },
                    { key: "moodCheckins", label: "Mood Check-ins", desc: "Daily mood prompts", icon: Heart },
                    { key: "achievements", label: "Achievements", desc: "New badges & level ups", icon: Award },
                    { key: "weeklyReport", label: "Weekly Summary", desc: "Your productivity recap", icon: TrendingUp },
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-card hover:bg-accent/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications[key as keyof Settings["notifications"]]}
                        onCheckedChange={() => toggleNotification(key as keyof Settings["notifications"])}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Accessibility */}
            <TabsContent value="accessibility" className="p-8 space-y-6">
              <div className="bg-emerald/10 p-6 rounded-2xl border border-emerald/20">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Accessibility
                </h3>
                <p className="text-muted-foreground mb-6">Make BunnySteps work better for you</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: "reducedMotion", label: "Reduced Motion", desc: "Disable animations", icon: "✨" },
                    { key: "largerText", label: "Larger Text", desc: "Increase font sizes", icon: "🔤" },
                    { key: "highContrast", label: "High Contrast", desc: "Better text visibility", icon: "🎨" },
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-card hover:bg-accent/5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.accessibility[key as keyof Settings["accessibility"]]}
                        onCheckedChange={(checked) => updateAccessibility(key as keyof Settings["accessibility"], !!checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Account */}
            <TabsContent value="account" className="p-8 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Monthly Salary
                  </CardTitle>
                  <p className="text-muted-foreground">Used for budget calculations</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 items-end">
                    <Input
                      type="number"
                      value={settings.salary_amount || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, salary_amount: parseInt(e.target.value) || 0 }))}
                      placeholder="1200"
                      className="max-w-xs"
                    />
                    <Button 
                      onClick={() => updateSalary(settings.salary_amount || 0)}
                      variant="outline"
                    >
                      Update Salary
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Current: {settings.salary_amount || 0} DT
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <LogOut className="w-5 h-5" />
                    Logout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="w-full border-destructive hover:bg-destructive/5 text-destructive hover:text-destructive-foreground"
                    size="lg"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign out of BunnySteps
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    You'll need to log in again to continue
                  </p>
                </CardContent>
              </Card>

              <div className="p-6 bg-muted/50 rounded-2xl text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Your Data is Safe</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  All your tasks, habits, and progress are encrypted and stored securely.
                  Only you can access them.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </SidebarLayout>
  )
}