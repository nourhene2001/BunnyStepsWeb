"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { day: "Mon", sessions: 3 },
  { day: "Tue", sessions: 5 },
  { day: "Wed", sessions: 4 },
  { day: "Thu", sessions: 6 },
  { day: "Fri", sessions: 7 },
  { day: "Sat", sessions: 2 },
  { day: "Sun", sessions: 4 },
]

export default function FocusStats() {
  return (
    <div className="space-y-4">
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sessions" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Weekly Total</p>
            <p className="text-2xl font-bold text-accent">31 sessions</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hours Focused</p>
            <p className="text-2xl font-bold text-secondary">12.75 hrs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
