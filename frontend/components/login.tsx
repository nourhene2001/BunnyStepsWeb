// components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import AuthService from "@/services/authService"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Rabbit, Sparkles, Heart } from "lucide-react"

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
      setError(err.error || "Oops! Wrong carrot (username/password)")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
          <CardHeader className="text-center space-y-4 pb-8 pt-10 bg-gradient-to-b from-pink-100 to-purple-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Rabbit className="w-20 h-20 mx-auto text-pink-600 drop-shadow-lg" />
            </motion.div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back, Bunny!
            </CardTitle>
            <CardDescription className="text-lg text-purple-700">
              Hop into your cozy productivity garden <Heart className="inline w-5 h-5 text-pink-500" />
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-10 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Your cute username"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="h-14 text-lg rounded-2xl border-2 border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 placeholder:text-pink-300"
                />
                <motion.div
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-pink-500 text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  What’s your bunny name?
                </motion.div>
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Your secret password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-14 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 placeholder:text-purple-300"
                />
                <motion.div
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 text-purple-500 text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Shh… only bunnies know this
                </motion.div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 text-red-600 px-5 py-4 rounded-2xl text-center font-medium flex items-center justify-center gap-2"
                >
                  <Rabbit className="w-5 h-5" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Rabbit className="w-6 h-6" />
                    </motion.div>
                    Hopping in...
                  </>
                ) : (
                  <>
                    <Rabbit className="w-7 h-7" />
                    Hop In!
                    <Sparkles className="w-6 h-6" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don’t have a burrow yet?{" "}
                <span className="text-pink-600 font-semibold cursor-pointer hover:underline">
                  Create one!
                </span>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Floating carrots */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 text-orange-400 text-6xl"
        >
          
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 text-orange-400 text-5xl"
        >
          
        </motion.div>
      </motion.div>
    </div>
  )
}