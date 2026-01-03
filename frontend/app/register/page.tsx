// app/login/page.tsx
"use client"

import BunnyAvatar from "@/components/bunny-avatar"
import Link from "next/link"
import { motion } from "framer-motion"
import RegisterForm from "@/components/auth/RegisterForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
 

        {/* Login form already contains its own card */}
          <RegisterForm />

      </motion.div>
    </div>
  )
}
