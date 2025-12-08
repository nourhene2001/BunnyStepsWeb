// Shuffle-timer.tsx
// shuffle-timer.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle } from "lucide-react"
import AuthService from "@/services/authService"
import { Checkbox } from "@/components/ui/checkbox"

interface Task {
  id: string
  title: string
}

export default function ShuffleTimer() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [shuffledTasks, setShuffledTasks] = useState<Task[]>([]) // Shuffled list
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60 * 60)  // 60 minutes
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const token = AuthService.getAccessToken()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks || data)  // adjust based on backend response
    }
  }

  const toggleTask = (id: string) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter(t => t !== id))
    } else if (selectedTasks.length < 3) {
      setSelectedTasks([...selectedTasks, id])
    }
  }

  const shuffleSelectedTasks = () => {
    const selected = tasks.filter(t => selectedTasks.includes(t.id))
    const shuffled = [...selected].sort(() => Math.random() - 0.5) // Shuffle
    setShuffledTasks(shuffled)
    setCurrentTaskIndex(0)
  }

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      setSessionsCompleted(s => s + 1)
      setTimeLeft(60 * 60) // Reset for next task
      setCurrentTaskIndex(i => i + 1) // Move to next shuffled task
      if (soundEnabled) {
        const audio = new Audio("/session-complete.mp3") // Add sound file
        audio.play().catch(() => {})
      }
      if (currentTaskIndex + 1 >= shuffledTasks.length) {
        alert("All tasks shuffled and completed!")
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft, soundEnabled, currentTaskIndex, shuffledTasks])

  const startShuffle = () => {
    if (selectedTasks.length === 0) return alert("Select tasks first")
    shuffleSelectedTasks() // Shuffle on start
    setIsRunning(true)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 border-primary/20 overflow-hidden">
      <CardContent className="p-8 space-y-8">
        {/* Task Selection */}
        <div>
          <h4 className="font-semibold mb-3">Select up to 3 tasks</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                  disabled={selectedTasks.length >= 3 && !selectedTasks.includes(task.id)}
                />
                <span className="text-sm">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Task */}
        {shuffledTasks.length > 0 && currentTaskIndex < shuffledTasks.length && (
          <div className="text-center">
            <p className="text-lg font-semibold">Current Task: {shuffledTasks[currentTaskIndex].title}</p>
          </div>
        )}

        {/* Timer */}
        <div className="text-center">
          <p className="text-8xl font-mono font-bold tracking-tight text-primary">
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button onClick={startShuffle} variant="outline" size="lg" disabled={isRunning}>
            <Play className="w-5 h-5" /> Start Shuffle
          </Button>
          <Button onClick={() => setIsRunning(!isRunning)} variant="outline" size="lg" disabled={!shuffledTasks.length}>
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={() => setTimeLeft(60 * 60)} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="border-t border-primary/20 pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sessions Today</p>
              <p className="text-3xl font-bold text-primary">{sessionsCompleted}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Minutes</p>
              <p className="text-3xl font-bold text-secondary">{sessionsCompleted * 60}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Focus Streak</p>
              <p className="text-3xl font-bold text-accent">7 days</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-background/60 rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-sm mb-2">Focus Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Silence notifications during focus time</li>
            <li>• Take a 5-minute break after each session</li>
            <li>• Drink water to stay hydrated</li>
            <li>• Stand up and stretch every hour</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}