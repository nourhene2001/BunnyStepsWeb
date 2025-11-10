"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  type: "avatar" | "accessory" | "item"
  purchased: boolean
}

const shopItems: ShopItem[] = [
  {
    id: "1",
    name: "Blue Bunny Skin",
    description: "A cool blue variant for your bunny",
    icon: "💙",
    cost: 150,
    type: "avatar",
    purchased: true,
  },
  {
    id: "2",
    name: "Rainbow Skin",
    description: "Celebrate your achievements with colors",
    icon: "🌈",
    cost: 500,
    type: "avatar",
    purchased: false,
  },
  {
    id: "3",
    name: "Space Hat",
    description: "Blast off to productivity!",
    icon: "🚀",
    cost: 200,
    type: "accessory",
    purchased: false,
  },
  {
    id: "4",
    name: "Chef Hat",
    description: "For productive cooking sessions",
    icon: "👨‍🍳",
    cost: 200,
    type: "accessory",
    purchased: false,
  },
  {
    id: "5",
    name: "Crown",
    description: "Rule your productivity kingdom",
    icon: "👑",
    cost: 350,
    type: "accessory",
    purchased: false,
  },
  {
    id: "6",
    name: "XP Booster (1 hour)",
    description: "Double XP gain for 1 hour",
    icon: "⚡",
    cost: 100,
    type: "item",
    purchased: false,
  },
]

export default function RewardsShop() {
  const [coins, setCoins] = useState(850)
  const [purchasedItems, setPurchasedItems] = useState(shopItems.map((item) => item.purchased))

  const handlePurchase = (index: number, cost: number) => {
    if (coins >= cost && !purchasedItems[index]) {
      setCoins(coins - cost)
      const newPurchased = [...purchasedItems]
      newPurchased[index] = true
      setPurchasedItems(newPurchased)
    }
  }

  return (
    <div className="space-y-6">
      {/* Currency Header */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🪙</span>
              <div>
                <p className="text-sm text-muted-foreground">Your Coins</p>
                <p className="text-2xl font-bold">{coins}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Learn how to earn more
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shop Items */}
      <div className="space-y-4">
        {["avatar", "accessory", "item"].map((category) => (
          <div key={category}>
            <h3 className="font-semibold text-lg mb-3 capitalize">{category}s</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems
                .filter((item) => item.type === category)
                .map((item, idx) => {
                  const globalIdx = shopItems.findIndex((i) => i.id === item.id)
                  const isPurchased = purchasedItems[globalIdx]
                  return (
                    <Card
                      key={item.id}
                      className={`overflow-hidden transition-all ${
                        isPurchased
                          ? "bg-primary/10 border-primary/20"
                          : "bg-white/60 dark:bg-slate-800/60 backdrop-blur border-muted hover:border-primary/50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-5xl">{item.icon}</span>
                          {isPurchased && <Badge className="text-xs bg-primary">Owned</Badge>}
                        </div>

                        <h4 className="font-semibold mb-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mb-4">{item.description}</p>

                        <Button
                          onClick={() => handlePurchase(globalIdx, item.cost)}
                          disabled={coins < item.cost || isPurchased}
                          className="w-full"
                          variant={isPurchased ? "outline" : "default"}
                        >
                          {isPurchased ? "Owned" : `${item.cost} 🪙`}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
