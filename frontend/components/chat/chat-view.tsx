"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
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

interface ChatResponse {
  reply: string
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // User message object
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    // Add user message
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // --- Call your Django backend ---
      const res = await axios.post<ChatResponse>("http://localhost:8000/api/chat/", {
        message: userMessage.text,
      })

      // Bunny reply from AI
      const bunnyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.reply,
        sender: "bunny",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, bunnyMessage])
    } catch (err) {
      // Error fallback message
      const errorMessage: Message = {
        id: "error",
        text: "Oops! Bun Bun is sleepy... please try again!",
        sender: "bunny",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    }

    setIsLoading(false)
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
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
                onClick={() => setInputValue(action)}
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
