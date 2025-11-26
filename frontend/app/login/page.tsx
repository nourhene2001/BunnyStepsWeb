// app/login/page.tsx
"use client"
import LoginForm from "@/components/login"
import BunnyAvatar from "@/components/bunny-avatar"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-pink-200/20 blur-3xl"
            style={{ width: 120 + Math.random() * 180, height: 120 + Math.random() * 180, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            animate={{ y: [-60, 60], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 18 + i, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <BunnyAvatar mood="excited" message="I missed you!" size="lg" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mt-6">Welcome Home</h1>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-pink-100">
          <LoginForm />
          <p className="text-center mt-6 text-gray-600">
            New here? <Link href="/register" className="text-purple-600 font-bold hover:underline">Create your burrow</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}