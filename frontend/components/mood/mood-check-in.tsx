"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MoodOption {
  emoji: string
  label: string
  value: number
  color: string
}

const moods: MoodOption[] = [
  { emoji: "😢", label: "Overwhelmed", value: 1, color: "bg-red-100 dark:bg-red-900/30" },
  { emoji: "😕", label: "Stressed", value: 2, color: "bg-orange-100 dark:bg-orange-900/30" },
  { emoji: "😐", label: "Neutral", value: 3, color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { emoji: "🙂", label: "Good", value: 4, color: "bg-green-100 dark:bg-green-900/30" },
  { emoji: "😄", label: "Excellent", value: 5, color: "bg-blue-100 dark:bg-blue-900/30" },
]

export default function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [notes, setNotes] = useState("")

  const handleCheckIn = () => {
    if (selectedMood) {
      console.log("Mood check-in:", { mood: selectedMood, notes })
      setSelectedMood(null)
      setNotes("")
    }
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">How are you feeling right now?</h3>
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedMood === mood.value
                    ? `border-primary ${mood.color} scale-105`
                    : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <span className="text-4xl mb-2">{mood.emoji}</span>
                <span className="text-xs font-semibold text-center">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">What's on your mind?</label>
          <Textarea
            placeholder="Add any notes about your mood (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-background/50 min-h-24"
          />
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={!selectedMood}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          Save Check-in
        </Button>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20">
            <p className="text-muted-foreground mb-1">Check-ins Today</p>
            <p className="text-2xl font-bold text-primary">3</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded border border-accent/20">
            <p className="text-muted-foreground mb-1">Average Mood</p>
            <p className="text-2xl font-bold text-accent">4.2</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
