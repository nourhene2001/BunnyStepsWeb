"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MoodEntry {
  emoji: string
  label: string
  value: number
}

const moods: MoodEntry[] = [
  { emoji: "😢", label: "Overwhelmed", value: 1 },
  { emoji: "😕", label: "Stressed", value: 2 },
  { emoji: "😐", label: "Neutral", value: 3 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😄", label: "Excellent", value: 5 },
]

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [moodHistory, setMoodHistory] = useState<{ timestamp: string; value: number }[]>([])

  const handleMoodSelect = (value: number) => {
    setSelectedMood(value)
    setMoodHistory([...moodHistory, { timestamp: new Date().toLocaleTimeString(), value }])
  }

  const averageMood =
    moodHistory.length > 0 ? (moodHistory.reduce((sum, m) => sum + m.value, 0) / moodHistory.length).toFixed(1) : "N/A"

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>How are you feeling?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between gap-2 mb-6">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              onClick={() => handleMoodSelect(mood.value)}
              variant={selectedMood === mood.value ? "default" : "outline"}
              className="flex flex-col items-center p-4 h-auto"
            >
              <span className="text-4xl mb-2">{mood.emoji}</span>
              <span className="text-xs text-center">{mood.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Today's Average</p>
            <p className="text-3xl font-bold text-primary">{averageMood}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground mb-1">Check-ins</p>
            <p className="text-3xl font-bold text-accent">{moodHistory.length}</p>
          </div>
        </div>

        {moodHistory.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm mb-3">Today's Check-ins</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...moodHistory].reverse().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded">
                  <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                  <span className="text-lg">{moods[entry.value - 1]?.emoji}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
