"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react"

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
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
    setTimeLeft(25 * 60)
    setIsRunning(false)
  }

  const skipSession = () => {
    setTimeLeft(0)
    setIsRunning(false)
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 border-primary/20 overflow-hidden">
      <CardContent className="p-8 space-y-8">
        {/* Large Timer Display */}
        <div className="text-center">
          <div className="text-9xl font-bold text-primary mb-4 font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="w-full bg-background/50 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300"
              style={{ width: `${((25 * 60 - timeLeft) / (25 * 60)) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground text-lg">
            {isRunning ? "Focus time - no distractions!" : "Ready to focus?"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button onClick={toggleTimer} size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
            {isRunning ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
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
              <p className="text-3xl font-bold text-secondary">{sessionsCompleted * 25}</p>
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
