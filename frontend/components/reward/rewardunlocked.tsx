"use client"

import { motion, AnimatePresence } from "framer-motion"

import { Star, Sparkles, Trophy } from "lucide-react"
import { useEffect } from "react"

interface RewardUnlockedModalProps {
  isOpen: boolean
  rewardName: string
  rewardDescription?: string
  onClose: () => void
  autoCloseDuration?: number
}

export function RewardUnlockedModal({
  isOpen,
  rewardName,
  rewardDescription,
  onClose,
  autoCloseDuration = 3000,
}: RewardUnlockedModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDuration) {
      const timer = setTimeout(onClose, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDuration, onClose])

  // Generate confetti particles
  const confettiPieces = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    delay: i * 0.05,
    duration: 2,
    left: Math.random() * 100,
  }))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950 dark:via-slate-900 dark:to-orange-950 rounded-2xl p-8 md:p-12 shadow-2xl max-w-md w-full mx-4 pointer-events-auto"
            >
              {/* Confetti Effect */}
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  initial={{ opacity: 1, y: 0, x: 0 }}
                  animate={{ opacity: 0, y: 100, x: (Math.random() - 0.5) * 100 }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: "easeOut",
                  }}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    left: `${piece.left}%`,
                    top: "-10px",
                    background: ["#FCD34D", "#FB923C", "#F97316", "#EF4444", "#8B5CF6"][piece.id % 5],
                  }}
                />
              ))}

              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="flex justify-center mb-6"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: 0.3 }}
                  className="relative"
                >
                  <Trophy className="w-20 h-20 text-amber-500 drop-shadow-lg" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: 0.3 }}
                    className="absolute -top-3 -right-3"
                  >
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                    Reward Unlocked!
                  </p>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2"
                >
                  {rewardName}
                </motion.h2>

                {rewardDescription && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-600 dark:text-slate-300 text-sm md:text-base"
                  >
                    {rewardDescription}
                  </motion.p>
                )}
              </motion.div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Awesome!
              </motion.button>

              {/* Decorative Elements */}
              <motion.div
                className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full opacity-20 blur-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
              />
              <motion.div
                className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-amber-300 to-yellow-200 rounded-full opacity-10 blur-3xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4, delay: 0.5 }}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
