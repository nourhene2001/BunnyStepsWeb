"use client"

import { useState } from "react"
import AuthService from "@/services/authService"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Rabbit } from "lucide-react"

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
      setError("That didn’t work. Take a breath and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
          <CardHeader className="text-center pt-10 pb-6">
            <Rabbit className="w-12 h-12 mx-auto text-gray-700" />
            <CardTitle className="text-2xl font-semibold text-gray-900 mt-4">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in when you’re ready
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <Input
                  type="text"
                  placeholder="Your username"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="Your password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-gray-600 mt-6">
                New here?{" "}
                <a href="/register" className="text-blue-600 hover:underline font-medium">
                  Create an account
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}