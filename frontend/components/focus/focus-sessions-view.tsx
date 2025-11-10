"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PomodoroTimer from "./pomodoro-timer"
import FocusStats from "./focus-stats"

export default function FocusSessionsView() {
  const [timerMode, setTimerMode] = useState<"pomodoro" | "custom">("pomodoro")

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Focus Sessions</h1>
        <p className="text-muted-foreground mt-1">Stay focused with guided focus sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Tabs value={timerMode} onValueChange={(v) => setTimerMode(v as "pomodoro" | "custom")}>
            <TabsList>
              <TabsTrigger value="pomodoro">Pomodoro (25 min)</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="pomodoro">
              <PomodoroTimer />
            </TabsContent>

            <TabsContent value="custom">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Set your custom focus duration</p>
                    <div className="flex gap-4 justify-center">
                      <div>
                        <label className="text-sm font-semibold">Minutes</label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          defaultValue="25"
                          className="mt-2 p-2 border rounded w-20 text-center"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold">Seconds</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          defaultValue="0"
                          className="mt-2 p-2 border rounded w-20 text-center"
                        />
                      </div>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 w-full">Start Custom Session</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats */}
        <div>
          <FocusStats />
        </div>
      </div>
    </div>
  )
}
