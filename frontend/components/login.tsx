// components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import AuthService from "@/services/authService";
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function LoginForm() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await AuthService.login(form)
      router.push("/")
    } catch (err: any) {
      setError(err.error || "Oops! Wrong username or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        placeholder="Your cute username"
        required
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition text-lg"
      />

      <input
        type="password"
        placeholder="Your secret password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-center font-medium bg-red-50 py-3 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
      >
        {loading ? "Hopping in..." : "Hop In!"}
      </button>
    </form>
  )
}