"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Zap, Heart, Settings } from "lucide-react"
import BunnyAvatar from "./bunny-avatar"
import TaskList from "./task-list"
import FocusSession from "./focus-session"
import MoodTracker from "./mood-tracker"

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"dashboard" | "tasks" | "focus" | "mood">("dashboard")
  const [stats, setStats] = useState({
    streak: 7,
    totalCompleted: 24,
    level: 5,
    coins: 250,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">BunnySteps</h1>
            <p className="text-muted-foreground">Your ADHD-friendly productivity companion</p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur border-primary/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Streak</div>
              <div className="text-2xl font-bold text-primary">{stats.streak} days</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur border-accent/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Completed</div>
              <div className="text-2xl font-bold text-accent">{stats.totalCompleted}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur border-secondary/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Level</div>
              <div className="text-2xl font-bold text-secondary">{stats.level}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur border-yellow-400/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Coins</div>
              <div className="text-2xl font-bold text-yellow-500">{stats.coins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bunny Avatar */}
          <div className="lg:col-span-1">
            <BunnyAvatar level={stats.level} mood="happy" />
          </div>

          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant={currentView === "dashboard" ? "default" : "outline"}
                className="rounded-full"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => setCurrentView("tasks")}
                variant={currentView === "tasks" ? "default" : "outline"}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tasks
              </Button>
              <Button
                onClick={() => setCurrentView("focus")}
                variant={currentView === "focus" ? "default" : "outline"}
                className="rounded-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                Focus
              </Button>
              <Button
                onClick={() => setCurrentView("mood")}
                variant={currentView === "mood" ? "default" : "outline"}
                className="rounded-full"
              >
                <Heart className="w-4 h-4 mr-2" />
                Mood
              </Button>
            </div>

            {/* View Content */}
            {currentView === "dashboard" && (
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle>Welcome Back!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    You're on a {stats.streak}-day streak! Keep it up by completing your tasks today.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-sm mb-1">Today's Goal</h4>
                      <p className="text-xs text-muted-foreground">Complete 5 tasks and a 25-minute focus session</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                      <h4 className="font-semibold text-sm mb-1">Next Reward</h4>
                      <p className="text-xs text-muted-foreground">Unlock at level 6: Special avatar skin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentView === "tasks" && <TaskList />}
            {currentView === "focus" && <FocusSession />}
            {currentView === "mood" && <MoodTracker />}
          </div>
        </div>
      </div>
    </div>
  )
}
