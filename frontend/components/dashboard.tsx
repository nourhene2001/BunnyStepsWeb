// app/dashboard/page.tsx  ← ONE FILE ONLY (final version)
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Settings, MessageCircle, Home, Notebook, Brain, Heart, Palette, Wallet } from "lucide-react"
import AuthService from "@/services/authService"
import TaskList from "./task-list"
import FocusSession from "./focus-session"
import MoodTracker from "./mood-tracker"
import HobbyTracker from "./hobby-tracker"
import ShoppingList from "./money-tracker"
import BunnyAvatar from "./bunny-avatar"

type View = "dashboard" | "tasks" | "focus" | "mood" | "hobby" | "finance"

const sidebarItems = [
  { view: "dashboard" as View, icon: Home, label: "Home", emoji: "Home" },
  { view: "tasks" as View, icon: Notebook, label: "Organizer", emoji: "Notebook" },
  { view: "focus" as View, icon: Brain, label: "Lock In", emoji: "Brain" },
  { view: "mood" as View, icon: Heart, label: "Log Mood", emoji: "Heart" },
  { view: "hobby" as View, icon: Palette, label: "Hobbies", emoji: "Palette" },
  { view: "finance" as View, icon: Wallet, label: "Money", emoji: "Wallet" },
]

const focusModes = [
  { name: "Pomodoro", icon: "Timer" },
  { name: "Hyperfocus", icon: "Fire" },
  { name: "Gentle Focus", icon: "Flower" },
  { name: "Challenge Mode", icon: "Sword" },
]

export default function Dashboard() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser) {
        router.replace("/login?redirect=/dashboard")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 flex items-center justify-center flex-col gap-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-9xl"
        >
          Bunny
        </motion.div>
        <p className="text-2xl font-bold text-pink-600 animate-pulse">Hopping you in safely...</p>
      </div>
    )
  }

  if (!user) return null

  const stats = { streak: 12, totalCompleted: 89, level: 9, coins: 620 }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden p-6 flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255, 245, 255, 0.8), rgba(240, 220, 255, 0.6)), url('/b1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Floating subtle bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-pink-200/30 rounded-full blur-2xl"
            style={{
              width: `${30 + Math.random() * 50}px`,
              height: `${30 + Math.random() * 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Top Header: Title + Stats + Bunny */}
      <div className="relative  flex justify-between items-start mb-6">
              {/* Title */}
      <div className="mb-6 z-10 relative">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-1">🌸 BunnySteps</h1>
        <p className="text-muted-foreground text-sm md:text-base">Your cozy ADHD-friendly focus companion</p>
      </div>
        
        {/* Right: Mini Stat Cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "🔥 Streak", value: `${stats.streak}d`, color: "from-pink-200 to-pink-100" },
            { label: "✅ Done", value: stats.totalCompleted, color: "from-purple-200 to-purple-100" },
            { label: "⭐ Level", value: stats.level, color: "from-blue-200 to-blue-100" },
            { label: "💰 Coins", value: stats.coins, color: "from-yellow-200 to-yellow-100" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`w-25 h-25 rounded-2xl p-2 shadow-md bg-gradient-to-br ${item.color} flex flex-col justify-center items-center`}
              initial={{ rotate: (i % 2 === 0 ? -2 : 2) }}
              whileHover={{ scale: 1.05, rotate: 0 }}
            >
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-lg font-bold">{item.value}</div>
            </motion.div>
          ))}
        </div>

 
      </div>



      {/* Main Layout: Sidebar + Content */}
      <div className="relative z-10 flex flex-1 gap-6">
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-3 w-21">
          {[
              { view: "dashboard", icon: "🏡", label: "Home" },            // House emoji for dashboard
              { view: "tasks", icon: "📒", label: "Organizer" },           // Notebook for tasks/organizer
              { view: "focus", icon: "🧠", label: "Lock In" },             // Target for focus sessions
              { view: "mood", icon: "🔒", label: "Log Mood" },             // Heart for mood tracking
              { view: "hobby", icon: "🎨", label: "Start a Hobby" },       // Paint palette for hobbies
              { view: "finance", icon: "💰", label: "Money Tracking" },    // Money bag for finances
            ]
            .map(({ view, icon, label }) => (
            <Button
              key={view}
              onClick={() => setCurrentView(view as any)}
              variant={currentView === view ? "default" : "outline"}
              className="pink w-29 h-25 rounded-xl flex flex-col items-center gap-1 text-sm py-3"
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Button>
            
          ))}
                {/* Settings Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/40 hover:bg-white/70 backdrop-blur"
        >
          <Settings className="w-5 h-5" />
        </Button>
        </div>

        {/* Main Content */}
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur rounded-3xl shadow-lg overflow-y-auto"
        >
          {currentView === "dashboard" && (
            <div>
              <h2 className="text-3xl font-extrabold mb-4">Welcome Back 🌼</h2>
              <p className="text-muted-foreground mb-6">
                You’ve been hopping forward for <strong>{stats.streak}</strong> days straight! Keep the flow going 🌈
              </p>

              {/* Focus Modes */}
              <h4 className="font-semibold mb-3">Focus Modes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {focusModes.map((mode, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="p-4 bg-white/80 rounded-xl shadow border text-center text-sm hover:bg-pink-50"
                  >
                    <div className="text-lg mb-1">{mode.icon}</div>
                    {mode.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {currentView === "tasks" && <TaskList />}
          {currentView === "focus" && <FocusSession />}
          {currentView === "mood" && <MoodTracker />}
          {currentView === "hobby" && <HobbyTracker />}
          {currentView === "finance" && <ShoppingList />}
        </motion.div>
      </div>

      {/* Floating Chat Bunny */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 p-3 bg-pink-400 text-white rounded-full shadow-lg hover:bg-pink-500"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  )
}