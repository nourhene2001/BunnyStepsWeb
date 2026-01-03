// Shuffle-timer.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import AuthService from "@/services/authService"
import { useFocusSession } from "@/hooks/useFocusSession"

interface Task {
  id: string
  title: string
  status?: string
}

export default function ShuffleTimer() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [shuffledTasks, setShuffledTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { currentSession, startSession, endSession } = useFocusSession("shuffle")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const token = AuthService.getAccessToken()
    if (!token) return

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/?status=in_progress`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) {
      const data = await res.json()
      const allTasks = data.tasks || data
      const inProgress = allTasks.filter((t: Task) => t.status === "in_progress")
      setTasks(inProgress)
    }
  }

  const toggleTask = (id: string) => {
    setSelectedTasks(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const shuffleTasks = () => {
    const selected = tasks.filter(t => selectedTasks.includes(t.id))
    const shuffled = [...selected].sort(() => Math.random() - 0.5)
    setShuffledTasks(shuffled)
    setCurrentTaskIndex(0)
  }

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      endSession(60)
      if (soundEnabled) {
        new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==")
          .play()
          .catch(() => {})
      }
      if (currentTaskIndex < shuffledTasks.length - 1) {
        setCurrentTaskIndex(prev => prev + 1)
        setTimeLeft(60 * 60)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, timeLeft, soundEnabled, currentTaskIndex, shuffledTasks.length, endSession])

  const toggleTimer = async () => {
    if (!isRunning) {
      if (shuffledTasks.length === 0) {
        alert("Please select and shuffle tasks first!")
        return
      }
      await startSession()
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  const resetTimer = async () => {
    if (currentSession) {
      const minutes = Math.floor((60 * 60 - timeLeft) / 60)
      await endSession(minutes)
    }
    setTimeLeft(60 * 60)
    setIsRunning(false)
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0")
  const seconds = (timeLeft % 60).toString().padStart(2, "0")

  return (
    <Card className="rounded-2xl overflow-hidden border-border bg-card/95 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold">{minutes}:{seconds}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isRunning ? `Task ${currentTaskIndex + 1}/${shuffledTasks.length}` : "Select & shuffle tasks"}
          </p>
        </div>

        {!isRunning && shuffledTasks.length === 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Select up to 3 tasks</h3>
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                  disabled={selectedTasks.length >= 3 && !selectedTasks.includes(task.id)}
                />
                <span>{task.title}</span>
              </div>
            ))}
            <Button onClick={shuffleTasks} disabled={selectedTasks.length < 2} className="w-full">
              Shuffle Tasks
            </Button>
          </div>
        )}

        {shuffledTasks.length > 0 && (
          <div className="space-y-3">
            {shuffledTasks.map((task, i) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg text-center font-medium ${
                  i === currentTaskIndex ? "bg-primary text-primary-foreground" : "bg-muted/30"
                }`}
              >
                {i + 1}. {task.title}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={toggleTimer} size="lg" disabled={shuffledTasks.length === 0}>
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="bg-muted/30 p-6 rounded-2xl border">
          <h4 className="font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" /> Gentle Focus Tips
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Silence notifications</li>
            <li>• Take a gentle break when ready</li>
            <li>• Stay hydrated</li>
            <li>• Stretch lightly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}