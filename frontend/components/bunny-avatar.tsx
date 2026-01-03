// components/bunny-avatar.tsx
import { motion } from "framer-motion"

type Mood = "happy" | "excited" | "calm" | "sleepy" | "proud" | "shy"

interface BunnyAvatarProps {
  mood?: Mood          // optional – defaults to "happy"
  message?: string     // optional speech bubble
  size?: "sm" | "md" | "lg"
}

export default function BunnyAvatar({ 
  mood = "happy", 
  message, 
  size = "md" 
}: BunnyAvatarProps) {

  const sizeClasses = {
    sm: "w-24 h-24 text-4xl",
    md: "w-32 h-32 text-6xl",
    lg: "w-48 h-48 text-8xl",
  }

  const moodEmoji: Record<Mood, string> = {
    happy: "😊",
    excited: "🤩",
    calm: "😌",
    sleepy: "😴",
    proud: "😎",
    shy: "😊",
  }

  return (
    <div className={`relative flex flex-col items-center ${sizeClasses[size]}`}>
      {/* Bunny Face */}
      <motion.div
        animate={{ 
          y: mood === "excited" ? [-4, 4, -4] : [0, 0, 0], // only small bounce for excited
        }}
        transition={{ 
          duration: mood === "excited" ? 0.8 : 0,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {moodEmoji[mood]}
      </motion.div>

      {/* Speech bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl px-3 py-2 shadow-md text-center max-w-xs text-sm text-neutral-800"
        >
          {message}
          {/* Tail */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white" />
        </motion.div>
      )}
    </div>
  )
}
