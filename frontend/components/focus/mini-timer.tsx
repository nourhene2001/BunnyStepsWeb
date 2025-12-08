// mini-timer.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX, PlusCircle } from "lucide-react"

export default function MiniTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5 * 60)  // Start with 5 minutes
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      setSessionsCompleted((s) => s + 1)
      if (soundEnabled) {
        // Play notification sound
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==",
        )
        audio.play().catch(() => {})
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, soundEnabled])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setTimeLeft(5 * 60)
    setIsRunning(false)
  }

  const skipSession = () => {
    setTimeLeft(0)
    setIsRunning(false)
  }

  const addMoreTime = () => {
    setTimeLeft((t) => t + 5 * 60)  // Add 5 more minutes
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 border-primary/20 overflow-hidden">
      <CardContent className="p-8 space-y-8">
        {/* Large Timer Display */}
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
          <Button onClick={addMoreTime} variant="outline" size="lg" disabled={timeLeft === 0}>
            <PlusCircle className="w-5 h-5 mr-2" /> +5 min
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 justify-center">
          <Button onClick={skipSession} variant="ghost" size="sm" className="text-xs">
            Skip Session
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
              <p className="text-3xl font-bold text-secondary">{sessionsCompleted * 5}</p>
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