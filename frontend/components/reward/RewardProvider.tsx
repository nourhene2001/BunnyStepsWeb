"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { RewardUnlockedModal } from "./rewardunlocked"

interface RewardData {
  name: string
  description?: string
}

interface RewardContextType {
  showReward: (reward: RewardData) => void
}

const RewardContext = createContext<RewardContextType | null>(null)

export function RewardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reward, setReward] = useState<RewardData | null>(null)

  const showReward = (reward: RewardData) => {
    setReward(reward)
    setIsOpen(true)
  }

  const closeReward = () => {
    setIsOpen(false)
    setReward(null)
  }

  return (
    <RewardContext.Provider value={{ showReward }}>
      {children}

      {/* Global modal lives here */}
      {reward && (
        <RewardUnlockedModal
          isOpen={isOpen}
          rewardName={reward.name}
          rewardDescription={reward.description}
          onClose={closeReward}
        />
      )}
    </RewardContext.Provider>
  )
}

export function useReward() {
  const ctx = useContext(RewardContext)
  if (!ctx) {
    throw new Error("useReward must be used inside RewardProvider")
  }
  return ctx
}
