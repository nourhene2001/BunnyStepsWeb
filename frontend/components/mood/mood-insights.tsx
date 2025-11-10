"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const moodTrendData = [
  { time: "Mon", mood: 3 },
  { time: "Tue", mood: 3.5 },
  { time: "Wed", mood: 4 },
  { time: "Thu", mood: 4.2 },
  { time: "Fri", mood: 4.5 },
  { time: "Sat", mood: 4 },
  { time: "Sun", mood: 4.3 },
]

export default function MoodInsights() {
  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle>Mood Trends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={moodTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "12px" }} domain={[1, 5]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: `1px solid var(--border)`,
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="var(--secondary)"
              strokeWidth={2}
              dot={{ fill: "var(--secondary)" }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20">
            <p className="text-muted-foreground mb-1">Best Day</p>
            <p className="font-semibold">Friday (4.5)</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded border border-accent/20">
            <p className="text-muted-foreground mb-1">Average</p>
            <p className="font-semibold">4.1</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded border border-secondary/20">
            <p className="text-muted-foreground mb-1">Streak</p>
            <p className="font-semibold">7 days</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2">Insight</h4>
          <p className="text-xs text-muted-foreground">
            Your mood has improved by 40% this week! Keep up the great work with your productivity sessions and mood
            check-ins.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
