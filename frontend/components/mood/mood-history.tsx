"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MoodEntry {
  timestamp: string
  mood: number
  notes?: string
}

const mockHistory: MoodEntry[] = [
  { timestamp: "2:30 PM", mood: 5, notes: "Great productivity session!" },
  { timestamp: "12:00 PM", mood: 4, notes: "Lunch break, feeling good" },
  { timestamp: "9:00 AM", mood: 3, notes: "Just started the day" },
  { timestamp: "Yesterday 5:00 PM", mood: 4 },
  { timestamp: "Yesterday 1:00 PM", mood: 3 },
]

const getMoodEmoji = (mood: number) => {
  const emojis = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" }
  return emojis[mood as keyof typeof emojis] || "😐"
}

const getMoodLabel = (mood: number) => {
  const labels = { 1: "Overwhelmed", 2: "Stressed", 3: "Neutral", 4: "Good", 5: "Excellent" }
  return labels[mood as keyof typeof labels] || ""
}

export default function MoodHistory() {
  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>Check-in History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No check-ins yet. Start tracking your mood!</p>
        ) : (
          mockHistory.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 bg-background/50 rounded-lg border border-border/50">
              <span className="text-3xl">{getMoodEmoji(entry.mood)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{getMoodLabel(entry.mood)}</p>
                  <Badge variant="outline" className="text-xs">
                    {entry.timestamp}
                  </Badge>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
