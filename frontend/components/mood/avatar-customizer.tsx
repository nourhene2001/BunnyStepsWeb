"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AvatarCustomizerProps {
  avatar: {
    skin: string
    outfit: string
    accessory: string
    mood: string
  }
  setAvatar: (avatar: any) => void
}

const skins = ["brown", "white", "pink", "gray"]
const outfits = ["casual", "formal", "sporty", "cozy"]
const accessories = ["none", "glasses", "hat", "bow", "crown"]

export default function AvatarCustomizer({ avatar, setAvatar }: AvatarCustomizerProps) {
  const updateAvatar = (key: string, value: string) => {
    setAvatar({ ...avatar, [key]: value })
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-accent/10">
      <CardHeader>
        <CardTitle>Customize Your Bunny</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Skin Color</label>
          <div className="grid grid-cols-4 gap-3">
            {skins.map((skin) => (
              <button
                key={skin}
                onClick={() => updateAvatar("skin", skin)}
                className={`p-3 rounded-lg border-2 capitalize font-semibold transition-all ${
                  avatar.skin === skin ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                {skin}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Outfit</label>
          <div className="grid grid-cols-4 gap-3">
            {outfits.map((outfit) => (
              <button
                key={outfit}
                onClick={() => updateAvatar("outfit", outfit)}
                className={`p-3 rounded-lg border-2 capitalize font-semibold transition-all ${
                  avatar.outfit === outfit ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                }`}
              >
                {outfit}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Accessory</label>
          <div className="grid grid-cols-5 gap-3">
            {accessories.map((accessory) => (
              <button
                key={accessory}
                onClick={() => updateAvatar("accessory", accessory)}
                className={`p-3 rounded-lg border-2 capitalize font-semibold transition-all ${
                  avatar.accessory === accessory
                    ? "border-secondary bg-secondary/10"
                    : "border-border hover:border-secondary/50"
                }`}
              >
                {accessory}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90">Save Customization</Button>
      </CardContent>
    </Card>
  )
}
