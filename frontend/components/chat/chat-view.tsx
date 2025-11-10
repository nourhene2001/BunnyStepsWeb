"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles } from "lucide-react"
import ChatMessage from "./chat-message"

interface Message {
  id: string
  text: string
  sender: "user" | "bunny"
  timestamp: Date
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey there! I'm Bun Bun, your productivity companion. How can I help you today?",
      sender: "bunny",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const bunnyResponses = [
    "That sounds like a great plan! You've got this!",
    "I believe in you! Let's break this down into smaller steps.",
    "Remember to take breaks and be kind to yourself!",
    "You're doing amazing! Keep up the momentum!",
    "Let's focus on one task at a time. You can do this!",
    "I'm here to support you every step of the way!",
    "Your productivity streak is impressive! Keep it up!",
    "Don't forget to hydrate and stretch a bit!",
    "You're making great progress! I'm so proud of you!",
    "Let's celebrate this win together! You earned it!",
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const randomResponse = bunnyResponses[Math.floor(Math.random() * bunnyResponses.length)]
      const bunnyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "bunny",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, bunnyMessage])
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 h-screen flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Chat with Bun Bun</h1>
        <p className="text-muted-foreground mt-1">Your AI-powered productivity companion</p>
      </div>

      {/* Chat Container */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">😊</span>
            <div>
              <CardTitle>Bun Bun</CardTitle>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex gap-2 items-end">
              <span className="text-2xl">😊</span>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ask Bun Bun anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
              className="bg-background/80"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {["I need motivation", "Task tips", "Focus help", "Break time?"].map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(action)
                }}
                className="text-xs"
              >
                {action}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Bun Bun is powered by AI and here to support your productivity journey
          </p>
        </div>
      </Card>
    </div>
  )
}
