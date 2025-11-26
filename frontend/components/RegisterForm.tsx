// components/auth/RegisterForm.tsx
"use client"

import { useState } from "react"
import AuthService from "@/services/authService";
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function RegisterForm() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match!")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      await AuthService.register({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      router.push("/")
    } catch (err: any) {
      setError(err.detail || err.error || "Something went wrong...")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        placeholder="Choose a cute username"
        required
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
      />

      <input
        type="email"
        placeholder="Your email (optional)"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
      />

      <input
        type="password"
        placeholder="Create a strong password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
      />

      <input
        type="password"
        placeholder="Confirm your password"
        required
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        className="w-full px-5 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
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
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
      >
        {loading ? "Creating your burrow..." : "Hop In Forever!"}
      </button>
    </form>
  )
}