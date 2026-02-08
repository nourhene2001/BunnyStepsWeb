"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { RewardUnlockedModal } from "./rewardunlocked"

type RewardType = "xp" | "coins" | "level_up" | "badge"

interface BaseReward {
  type: RewardType
}

interface XPReward extends BaseReward { type: "xp"; amount: number; source?: string }
interface CoinsReward extends BaseReward { type: "coins"; amount: number; source?: string }
interface LevelUpReward extends BaseReward { type: "level_up"; newLevel: number }
interface BadgeReward extends BaseReward { type: "badge"; badgeTitle: string; badgeDescription?: string }

type Reward = XPReward | CoinsReward | LevelUpReward | BadgeReward

interface RewardContextType {
  showReward: (reward: Reward, delay?: number) => void
}

const RewardContext = createContext<RewardContextType | null>(null)

export function RewardProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<{ reward: Reward; delay: number }[]>([])
  const [currentReward, setCurrentReward] = useState<Reward | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const processQueue = () => {
    if (queue.length > 0 && !isOpen) {
      const next = queue[0]
      setCurrentReward(next.reward)
      setIsOpen(true)
      setQueue(prev => prev.slice(1))

      // Auto-process next after delay
      if (queue.length > 1) {
        setTimeout(processQueue, next.delay + getAutoCloseDuration(next.reward))
      }
    }
  }

  const showReward = (reward: Reward, delay: number = 0) => {
    setQueue(prev => [...prev, { reward, delay }])
    setTimeout(processQueue, delay)
  }

  const closeReward = () => {
    setIsOpen(false)
    setTimeout(() => {
      setCurrentReward(null)
      setTimeout(processQueue, 300) // small gap before next
    }, 300)
  }

  const getAutoCloseDuration = (reward: Reward): number => {
    switch (reward.type) {
      case "xp":
      case "coins":
        return 2200
      case "level_up":
        return 4500
      case "badge":
        return 5000
      default:
        return 3000
    }
  }

  const getDisplay = (reward: Reward) => {
    switch (reward.type) {
      case "xp":
        return { name: `+${reward.amount} XP`, description: reward.source || "Great progress!" }
      case "coins":
        return { name: `+${reward.amount} Coins`, description: reward.source || "Cha-ching!" }
      case "level_up":
        return { name: `Level ${reward.newLevel}!`, description: "You've leveled up! Keep going strong! 🏆" }
      case "badge":
        return { name: reward.badgeTitle, description: reward.badgeDescription || "New achievement unlocked!" }
    }
  }

const display = currentReward ? getDisplay(currentReward) : null

return (
  <RewardContext.Provider value={{ showReward }}>
    {children}

    {display && currentReward && (
      <RewardUnlockedModal
        isOpen={isOpen}
        rewardName={display.name}
        rewardDescription={display.description}
        onClose={closeReward}
        autoCloseDuration={getAutoCloseDuration(currentReward)}  // Safe: guarded by currentReward
        rewardType={currentReward.type}
      />
    )}
  </RewardContext.Provider>
)}

export function useReward() {
  const ctx = useContext(RewardContext)
  if (!ctx) throw new Error("useReward must be used inside RewardProvider")
  return ctx
}