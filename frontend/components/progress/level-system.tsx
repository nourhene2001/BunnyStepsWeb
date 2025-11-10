"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Zap } from "lucide-react"

export default function LevelSystem() {
  const currentLevel = 5
  const currentXP = 2450
  const nextLevelXP = 3000
  const totalXP = 8500

  const progressPercent = (currentXP / nextLevelXP) * 100

  return (
    <div className="space-y-6">
      {/* Current Level */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground mb-2">Current Level</p>
              <h2 className="text-5xl font-bold text-primary">{currentLevel}</h2>
            </div>
            <Award className="w-20 h-20 text-primary opacity-20" />
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Level Progress</span>
              <span className="font-semibold">
                {currentXP} / {nextLevelXP} XP
              </span>
            </div>
            <div className="w-full bg-background/50 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{nextLevelXP - currentXP} XP until next level</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <p className="text-sm text-muted-foreground">Total XP Earned</p>
            </div>
            <p className="text-3xl font-bold text-accent">{totalXP}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-5 h-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
            <p className="text-3xl font-bold text-secondary">12 / 28</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌟</span>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>
            <p className="text-3xl font-bold text-primary">850</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Milestones */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { level: 1, xp: 0, reward: "Starter Badge" },
            { level: 5, xp: 3000, reward: "Blue Avatar Skin", completed: true },
            { level: 10, xp: 8000, reward: "Special Hat" },
            { level: 20, xp: 20000, reward: "Gold Crown" },
          ].map((milestone) => (
            <div
              key={milestone.level}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                milestone.completed ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border"
              }`}
            >
              <div>
                <p className="font-semibold">Level {milestone.level}</p>
                <p className="text-xs text-muted-foreground">{milestone.reward}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{milestone.xp} XP</p>
                {milestone.completed && <Badge className="text-xs">Unlocked</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
