"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Zap, Coins, Star, Sparkles } from "lucide-react"
import { useEffect } from "react"

interface RewardUnlockedModalProps {
  isOpen: boolean
  rewardName: string
  rewardDescription?: string
  onClose: () => void
  autoCloseDuration?: number
  rewardType: "xp" | "coins" | "level_up" | "badge"
}

export function RewardUnlockedModal({
  isOpen,
  rewardName,
  rewardDescription,
  onClose,
  autoCloseDuration = 3000,
  rewardType,
}: RewardUnlockedModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(onClose, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDuration, onClose])

  const confetti = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: i * 0.06,
    left: 15 + Math.random() * 70,
    duration: 1.5 + Math.random() * 1,
    color: rewardType === "badge" 
      ? ["#A78BFA", "#C084FC", "#E9D5FF", "#F0ABFC"]
      : rewardType === "level_up"
      ? ["#FCD34D", "#FBBF24", "#F59E0B", "#D97706"]
      : ["#FCD34D", "#FB923C", "#F97316", "#EF4444"]
  }))

  const getMainIcon = () => {
    switch (rewardType) {
      case "xp": return <Zap className="w-24 h-24 text-yellow-500" />
      case "coins": return <Coins className="w-24 h-24 text-yellow-600" />
      case "badge": return <Star className="w-24 h-24 text-purple-500 fill-purple-400" />
      default: return <Trophy className="w-24 h-24 text-amber-500 drop-shadow-2xl" />
    }
  }

  const getHeaderText = () => {
    switch (rewardType) {
      case "badge": return "Achievement Unlocked!"
      case "level_up": return "Level Up!"
      default: return "Reward Earned!"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 dark:from-amber-950/80 dark:via-slate-900 dark:to-purple-950/80 rounded-3xl p-10 shadow-3xl max-w-md w-full mx-4 pointer-events-auto relative overflow-hidden"
            >
              {/* Confetti */}
              {confetti.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ y: -30, opacity: 1 }}
                  animate={{ y: 400, opacity: 0, rotate: Math.random() * 800 - 400 }}
                  transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ left: `${p.left}%`, backgroundColor: p.color[Math.floor(Math.random() * p.color.length)] }}
                />
              ))}

              {/* Main Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-8"
              >
                <motion.div
                  animate={{ y: rewardType === "level_up" ? [0, -16, 0] : [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                  {getMainIcon()}
                </motion.div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-7 h-7 text-amber-600 animate-pulse" />
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    {getHeaderText()}
                  </p>
                  <Sparkles className="w-7 h-7 text-amber-600 animate-pulse" />
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {rewardName}
                </h2>

                {rewardDescription && (
                  <p className="text-slate-600 dark:text-slate-300 text-base max-w-xs mx-auto leading-relaxed">
                    {rewardDescription}
                  </p>
                )}
              </motion.div>

              {/* Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl transition-all"
              >
                {rewardType === "badge" ? "Incredible!" : "Awesome!"}
              </motion.button>

              {/* Glow Orbs */}
              <div className="absolute -top-20 -right-20 w-52 h-52 bg-amber-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}