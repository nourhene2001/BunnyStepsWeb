"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react"
import { useFocusSession } from "@/hooks/useFocusSession"

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { currentSession, startSession, endSession } = useFocusSession("pomodoro")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      endSession()
      setTimeLeft(25 * 60)
      if (soundEnabled) {
        new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==")
          .play()
          .catch(() => {})
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, timeLeft, soundEnabled, endSession])
  

  const toggle = async () => {
    if (!isRunning) {
      await startSession()
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  const reset = async () => {
    if (currentSession) {
      const minutes = Math.floor((25 * 60 - timeLeft) / 60)
      await endSession()
    }
    setTimeLeft(25 * 60)
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
            {isRunning ? "Focusing..." : "Ready to start?"}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={toggle} size="lg">
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {/* Gentle Tips */}
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