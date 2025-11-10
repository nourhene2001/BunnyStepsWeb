"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

export default function FocusSession() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setTimeLeft(25 * 60)
    setIsRunning(false)
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>Focus Session (Pomodoro)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-7xl font-bold text-primary mb-4">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <p className="text-muted-foreground">Stay focused and crush your goals!</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={toggleTimer} size="lg" className="bg-primary hover:bg-primary/90">
            {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Daily Sessions</p>
            <p className="text-2xl font-bold text-accent">3</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Minutes</p>
            <p className="text-2xl font-bold text-secondary">75</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Streak</p>
            <p className="text-2xl font-bold text-primary">7 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
