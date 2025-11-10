"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Star } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  total: number
  completed: boolean
  reward: number
}

const achievements: Achievement[] = [
  {
    id: "1",
    name: "First Steps",
    description: "Complete your first task",
    icon: "👣",
    progress: 1,
    total: 1,
    completed: true,
    reward: 50,
  },
  {
    id: "2",
    name: "Task Master",
    description: "Complete 25 tasks",
    icon: "✓",
    progress: 24,
    total: 25,
    completed: false,
    reward: 200,
  },
  {
    id: "3",
    name: "Focus Champion",
    description: "Complete 10 focus sessions",
    icon: "🎯",
    progress: 10,
    total: 10,
    completed: true,
    reward: 150,
  },
  {
    id: "4",
    name: "Mood Tracker",
    description: "Check your mood 30 times",
    icon: "🎭",
    progress: 18,
    total: 30,
    completed: false,
    reward: 100,
  },
  {
    id: "5",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚔️",
    progress: 7,
    total: 7,
    completed: true,
    reward: 300,
  },
  {
    id: "6",
    name: "Perfect Day",
    description: "Complete all tasks in a day",
    icon: "💯",
    progress: 0,
    total: 1,
    completed: false,
    reward: 250,
  },
]

export default function AchievementsList() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`cursor-pointer transition-all ${
              achievement.completed
                ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20"
                : "bg-white/60 dark:bg-slate-800/60 backdrop-blur border-muted hover:border-secondary/50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{achievement.icon}</span>
                {achievement.completed ? (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <h3 className="font-semibold mb-1">{achievement.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{achievement.description}</p>

              {!achievement.completed && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reward</span>
                <Badge className="text-xs">+{achievement.reward} XP</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
