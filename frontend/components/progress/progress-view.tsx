"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LevelSystem from "./level-system"
import AchievementsList from "./achievements-list"
import RewardsShop from "./rewards-shop"

export default function ProgressView() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress & Rewards</h1>
        <p className="text-muted-foreground mt-1">Unlock achievements and earn rewards for your dedication</p>
      </div>

      <Tabs defaultValue="level" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="level">Level</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="shop">Shop</TabsTrigger>
        </TabsList>

        <TabsContent value="level">
          <LevelSystem />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsList />
        </TabsContent>

        <TabsContent value="shop">
          <RewardsShop />
        </TabsContent>
      </Tabs>
    </div>
  )
}
