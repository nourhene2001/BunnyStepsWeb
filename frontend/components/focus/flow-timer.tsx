// flow-timer.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react"
import { useFocusSession } from "@/hooks/useFocusSession"

export default function FlowTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { currentSession, startSession, endSession } = useFocusSession("flow")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  // 3-hour alert
  useEffect(() => {
    if (elapsedTime > 0 && elapsedTime % (3 * 3600) === 0 && soundEnabled) {
      new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==")
        .play()
        .catch(() => {})
      alert("3 hours passed! Time for a gentle break?")
    }
  }, [elapsedTime, soundEnabled])

  const toggleTimer = async () => {
    if (!isRunning) {
      await startSession()
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  const resetTimer = async () => {
    if (currentSession) {
      const minutes = Math.floor(elapsedTime / 60)
      await endSession(minutes)
    }
    setElapsedTime(0)
    setIsRunning(false)
  }

  const endNow = async () => {
    if (currentSession) {
      const minutes = Math.floor(elapsedTime / 60)
      await endSession(minutes)
    }
    setIsRunning(false)
  }

  const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, "0")
  const seconds = (elapsedTime % 60).toString().padStart(2, "0")

  return (
    <Card className="rounded-2xl overflow-hidden border-border bg-card/95 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold">{minutes}:{seconds}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isRunning ? "In flow..." : "Ready to dive in?"}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={toggleTimer} size="lg">
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline" size="lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center">
          <Button onClick={endNow} variant="ghost">
            End Session Now
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