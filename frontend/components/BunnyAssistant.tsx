"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function BunnyAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState("")

  // Detect which page user is on for context awareness
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("mood")) setContext("You are a gentle emotional support companion helping users reflect on their mood.")
    else if (path.includes("hobbies")) setContext("You are a playful coach helping users stay consistent with their hobbies and self-care.")
    else if (path.includes("shopping")) setContext("You are a practical helper managing shopping lists, reminders, and expenses.")
    else if (path.includes("focus")) setContext("You help ADHD users focus, organize thoughts, and manage distractions kindly.")
    else setContext("You are Bunny AI, a cheerful and kind assistant who helps users stay on track and feel good.")
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    const newMsg = { role: "user", text: input }
    setMessages((prev) => [...prev, newMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: input, context }),
      })

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "⚠️ Bunny lost connection!" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Bunny Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        {/* 3D Bunny or Animated Image */}
        <motion.img
          src="/bunny.gif" // replace with your bunny image or 3D animation later
          alt="Bunny AI"
          className="w-20 h-20 cursor-pointer hover:scale-110 transition-transform drop-shadow-lg"
          onClick={() => setIsOpen((prev) => !prev)}
        />

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-24 right-0 w-80"
            >
              <Card className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="flex flex-col p-3 space-y-2 max-h-[400px]">
                  <div className="overflow-y-auto flex-1 pr-2">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`my-1 p-2 rounded-xl ${
                          msg.role === "user"
                            ? "bg-primary/20 text-right ml-auto max-w-[80%]"
                            : "bg-accent/20 text-left mr-auto max-w-[80%]"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {loading && <p className="text-sm text-muted-foreground text-center mt-2">Bunny is thinking...</p>}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Talk to Bunny..."
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={loading}>
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
