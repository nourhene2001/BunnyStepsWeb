"use client"

import { Card } from "@/components/ui/card"

interface BunnyAvatarProps {
  level: number
  mood: "happy" | "focused" | "tired" | "excited"
}

export default function BunnyAvatar({ level, mood }: BunnyAvatarProps) {
  const getMoodEmoji = () => {
    const moods = {
      happy: "😊",
      focused: "🎯",
      tired: "😴",
      excited: "🤩",
    }
    return moods[mood]
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 border-primary/20 overflow-hidden">
      <div className="aspect-square flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-8xl mb-4 animate-bounce">{getMoodEmoji()}</div>
          <h3 className="font-bold text-lg text-foreground mb-2">Bun Bun</h3>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Level {level}</span>
            </div>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                Bunny Level
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {mood === "happy" && "I'm ready to help! Let's be productive!"}
              {mood === "focused" && "Focus time is my favorite!"}
              {mood === "tired" && "Let me rest a bit..."}
              {mood === "excited" && "You earned a reward! Great job!"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
