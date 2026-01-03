"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PomodoroTimer from "./pomodoro-timer"
import FlowTimer from "./flow-timer"
import MiniTimer from "./mini-timer"
import FocusStats from "./focus-stats"
import {
  Play,
  Pause,
  RotateCcw,
  Rabbit,
  Sparkles,
  Trophy,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import AuthService from "@/services/authService"
import ShuffleTimer from "./Shuffle-timer"

type FocusMode = "pomodoro" | "flow" | "mini" | "shuffle"

interface FocusSession {
  id?: number
  mode: FocusMode
  effective_minutes: number
  started_at: string
  ended_at?: string
  task?: number | null
}

const BUNNY_QUOTES = {
  pomodoro: "25 minutes of pure focus. You got this!",
  mini: "Let’s just hop for 5 minutes — no pressure!",
  flow: "Ride the wave — I’ll track your time while you stay in the zone!",
  shuffle: "Time to juggle! I’ll shuffle your tasks.",
}

const FLOW_MAX_HOURS_PER_DAY = 3
const FLOW_MAX_SESSIONS_PER_DAY = 2

export default function FocusSessionsView() {
  const [mode, setMode] = useState<FocusMode>("pomodoro")
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [history, setHistory] = useState<FocusSession[]>([])
  const [flowSessionCount, setFlowSessionCount] = useState(0)
  const [flowMinutesToday, setFlowMinutesToday] = useState(0)
  const [timerMode, setTimerMode] = useState<"pomodoro" | "flow" | "mini" | "shuffle" >("pomodoro")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const token = AuthService.getAccessToken()

  // Load history + calculate daily flow stats
  const loadHistory = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/focus-sessions/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
        updateDailyFlowStats(data)
      }
    } catch (err) {
      console.error("Failed to load focus sessions", err)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [token])

  // Update Flow limits
  const updateDailyFlowStats = (sessions: FocusSession[]) => {
    const today = format(new Date(), "yyyy-MM-dd")
    const todayFlow = sessions.filter(
      s => s.mode === "flow" && s.started_at.startsWith(today)
    )
    setFlowSessionCount(todayFlow.length)
    setFlowMinutesToday(todayFlow.reduce((sum, s) => sum + s.effective_minutes, 0))
  }

  // Start session
  const startSession = async () => {
    if (mode === "flow") {
      if (flowSessionCount >= FLOW_MAX_SESSIONS_PER_DAY) {
        alert("Max 2 Flow sessions per day!")
        return
      }
      if (flowMinutesToday >= FLOW_MAX_HOURS_PER_DAY * 60) {
        alert("Max 3 hours of Flow per day!")
        return
      }
    }

    const session: FocusSession = {
      mode,
      effective_minutes: 0,
      started_at: new Date().toISOString(),
      task: null, // you can link task later if needed
    }

    try {
      const res = await fetch(`${API_URL}/focus-sessions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(session),
      })

      if (!res.ok) throw new Error("Failed to start session")

      const data = await res.json()
      setCurrentSession(data)
      setIsRunning(true)
      startTimeRef.current = Date.now()
    } catch (err) {
      alert("Could not start session")
      console.error(err)
    }
  }

  // End session
  const endSession = async () => {
    if (!currentSession) return

    const minutes = Math.floor((Date.now() - startTimeRef.current) / 60000)
    const updatedSession = {
      ...currentSession,
      effective_minutes: minutes,
      ended_at: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${API_URL}/focus-sessions/${currentSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSession),
      })

      if (!res.ok) throw new Error("Failed to save session")

      const saved = await res.json()
      setHistory(prev => [...prev, saved])
      updateDailyFlowStats([...history, saved])
      setCurrentSession(null)
      setIsRunning(false)
      setElapsedSeconds(0)
    } catch (err) {
      alert("Session ended but not saved — check connection")
    }
  }

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // Format time
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

 return (
  <div className="space-y-10 p-6 max-w-7xl mx-auto">
    {/* Header */}
    <div>
      <h1 className="text-4xl font-semibold text-foreground">Focus Sessions</h1>
      <p className="text-lg text-muted-foreground mt-2">Pick a mode and focus gently</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Timer Card */}
      <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-foreground">Choose Your Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={timerMode} onValueChange={(v) => setTimerMode(v as typeof timerMode)}>
            <TabsList className="grid grid-cols-4 w-full h-14 bg-muted/40 rounded-2xl p-2 gap-2">
              <TabsTrigger
                value="pomodoro"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
              >
                Pomodoro
              </TabsTrigger>

              <TabsTrigger
                value="flow"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
              >
                Flow
              </TabsTrigger>

              <TabsTrigger
                value="mini"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
              >
                Mini
              </TabsTrigger>

              <TabsTrigger
                value="shuffle"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
              >
                Shuffle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pomodoro" className="mt-8">
              <PomodoroTimer />
            </TabsContent>
            <TabsContent value="flow" className="mt-8">
              <FlowTimer />
            </TabsContent>
            <TabsContent value="mini" className="mt-8">
              <MiniTimer />
            </TabsContent>
            <TabsContent value="shuffle" className="mt-8">
              <ShuffleTimer />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats Sidebar */}
      <div className="space-y-6">
        <FocusStats />
      </div>
    </div>
  </div>
)}