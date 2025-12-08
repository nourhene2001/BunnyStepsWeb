"use client"
import Dashboard from "@/components/Dashboard"
import SidebarLayout from "@/components/layout/sidebar-layout"
import { Toaster } from "@/components/ui/toaster"
import AuthService from "@/services/authService"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser) {
        router.replace("/login?redirect=/dashboard")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    checkAuth()
  }, [router])
    if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 flex items-center justify-center flex-col gap-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-9xl"
        >
          Bunny
        </motion.div>
        <p className="text-2xl font-bold text-pink-600 animate-pulse">Hopping you in safely...</p>
      </div>
    )
  }

  if (!user) return null
  return (
    <>
<SidebarLayout>
        <Dashboard />
      </SidebarLayout>      <Toaster />
    </>
  )
}
