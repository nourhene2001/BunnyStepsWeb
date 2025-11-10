"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MoodCheckIn from "./mood-check-in"
import AvatarCustomizer from "./avatar-customizer"
import MoodHistory from "./mood-history"
import MoodInsights from "./mood-insights"

export default function MoodTrackingView() {
  const [avatar, setAvatar] = useState({
    skin: "brown",
    outfit: "casual",
    accessory: "none",
    mood: "happy",
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mood & Avatar</h1>
        <p className="text-muted-foreground mt-1">Track your mood and customize your bunny companion</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Preview */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20 sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Bunny</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-8xl mb-4">
                {avatar.mood === "happy" && "😊"}
                {avatar.mood === "stressed" && "😰"}
                {avatar.mood === "focused" && "🎯"}
                {avatar.mood === "excited" && "🤩"}
                {avatar.mood === "tired" && "😴"}
              </div>
              <h3 className="font-bold text-lg mb-2">Bun Bun</h3>
              <div className="space-y-2 text-sm">
                <div className="px-2 py-1 bg-primary/10 text-primary rounded">Skin: {avatar.skin}</div>
                <div className="px-2 py-1 bg-accent/10 text-accent rounded">Outfit: {avatar.outfit}</div>
                {avatar.accessory !== "none" && (
                  <div className="px-2 py-1 bg-secondary/10 text-secondary rounded">Accessory: {avatar.accessory}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="checkin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checkin">Check-in</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="checkin">
              <MoodCheckIn />
            </TabsContent>

            <TabsContent value="customize">
              <AvatarCustomizer avatar={avatar} setAvatar={setAvatar} />
            </TabsContent>

            <TabsContent value="history">
              <MoodHistory />
            </TabsContent>
          </Tabs>

          {/* Insights */}
          <div className="mt-6">
            <MoodInsights />
          </div>
        </div>
      </div>
    </div>
  )
}
