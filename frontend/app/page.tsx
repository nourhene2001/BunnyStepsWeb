"use client"
import Dashboard from "@/components/dashboard/Dashboard"
import LandingPage from "@/components/landing-page"
import SidebarLayout from "@/components/layout/sidebar-layout"
import { Toaster } from "@/components/ui/toaster"
import AuthService from "@/services/authService"
import { motion } from "framer-motion"
import { Rabbit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center bg-background">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="p-2 rounded-full bg-accent/10"
        >
          <Rabbit className="w-10 h-10 text-accent" />
        </motion.div>

        <div className="space-y-1">
          <p className="text-lg font-medium text-foreground">
            Getting things ready…
          </p>
          <p className="text-sm text-muted-foreground">
            Just a tiny moment 🐾
          </p>
        </div>

        <motion.div
          className="flex gap-2 mt-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                repeat: Infinity,
              },
            },
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-accent/60"
              variants={{
                hidden: { opacity: 0.3 },
                visible: { opacity: 1 },
              }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

  // Always show LandingPage
  // But pass user info so it can personalize (welcome + different button)
  return (
    <>
      <LandingPage user={user} />
      <Toaster />
    </>
  )
}