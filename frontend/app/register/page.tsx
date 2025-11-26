// app/register/page.tsx
"use client"
import RegisterForm from "@/components/RegisterForm"
import BunnyAvatar from "@/components/bunny-avatar"
import Link from "next/link"
import { motion } from "framer-motion"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Same bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-purple-200/20 blur-3xl"
            style={{ width: 100 + Math.random() * 200, height: 100 + Math.random() * 200, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            animate={{ y: [-60, 60], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 20 + i * 2, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <BunnyAvatar mood="excited" message="Yay! A new friend!" size="lg" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mt-6">Join BunnySteps</h1>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-purple-100">
          <RegisterForm />
          <p className="text-center mt-6 text-gray-600">
            Already have a burrow? <Link href="/login" className="text-pink-600 font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}