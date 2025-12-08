// flow-timer.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react"

export default function FlowTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)  // No fixed time, just elapsed
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((t) => t + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Reminders every 3 hours (10800 seconds)
  useEffect(() => {
    if (elapsedTime > 0 && elapsedTime % (3 * 3600) === 0 && soundEnabled) {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==",
      )
      audio.play().catch(() => {})
      alert("3 hours passed! Time for a break?")
    }
  }, [elapsedTime, soundEnabled])

  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setElapsedTime(0)
    setIsRunning(false)
  }

  const endSession = () => {
    setIsRunning(false)
    setSessionsCompleted((s) => s + 1)
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 border-primary/20 overflow-hidden">
      <CardContent className="p-8 space-y-8">
        {/* Elapsed Time Display */}
        <div className="text-center">
          <p className="text-8xl font-mono font-bold tracking-tight text-primary">
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button onClick={toggleTimer} variant="outline" size="lg">
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={endSession} variant="outline" size="lg" disabled={!isRunning}>
            End Session
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
              <p className="text-3xl font-bold text-secondary">{sessionsCompleted * (elapsedTime / 60)}</p>
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