"use client"

import { useState } from "react"
import AuthService from "@/services/authService"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Rabbit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6
">
      <div className="w-full max-w-md">
           <Card className="border border-gray-200 rounded-2xl bg-white shadow-sm">
          <CardHeader className="text-center pt-10 pb-6">
            <Rabbit className="w-12 h-12 mx-auto text-gray-700" />
            <CardTitle className="text-2xl font-semibold text-gray-900 mt-4">
              Welcome !
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Register when you’re ready
            </CardDescription>
          </CardHeader>
                    <CardContent className="px-8 pb-10">

    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UserName* </label>

      <Input
        type="text"
        placeholder="Choose a username"
        required
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="h-12 rounded-xl border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
      </div>
      <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Email* </label>

      <Input
        type="email"
        placeholder="Your email "
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="h-12 rounded-xl border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
      </div>
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password*</label>

      <Input
        type="password"
        placeholder="Create a password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="h-12 rounded-xl border-gray-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      /> </div> <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confim Password </label>

      <Input
        type="password"
        placeholder="Confirm password"
        required
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
        {loading ? "Creating account..." : "Create Account"}
      </Button>
          <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account ?{" "}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Log In
                </a>
              </p>
    </form>
    </CardContent>
    </Card>
    </div></div>
  )
}