// components/bunny-avatar.tsx  (or wherever it lives)
import { motion } from "framer-motion"

type Mood = "happy" | "excited" | "calm" | "sleepy" | "proud" | "shy"

interface BunnyAvatarProps {
  mood?: Mood          // optional – defaults to "happy"
  message?: string     // ← THIS IS THE IMPORTANT ONE
  size?: "sm" | "md" | "lg"
}

export default function BunnyAvatar({ 
  mood = "happy", 
  message, 
  size = "md" 
}: BunnyAvatarProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  }

  const moodEmoji: Record<Mood, string> = {
    happy: "blush",
    excited: "star eyes",
    calm: "serene",
    sleepy: "sleeping",
    proud: "sunglasses",
    shy: "flushed",
  }

  return (
    <div className={`relative ${sizeClasses[size]} flex flex-col items-center`}>
      {/* Bunny Face */}
      <motion.div
        animate={{ 
          y: mood === "excited" ? [-8, 8, -8] : [0, -5, 0],
        }}
        transition={{ 
          duration: mood === "excited" ? 0.6 : 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-8xl"
      >
        {moodEmoji[mood]}
      </motion.div>

      {/* Speech bubble with message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-4 py-3 shadow-xl border-2 border-pink-200 max-w-xs text-center"
        >
          <div className="text-sm md:text-base font-medium text-pink-700">
            {message}
          </div>
          {/* Little tail */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
          </div>
        </motion.div>
      )}
    </div>
  )
}