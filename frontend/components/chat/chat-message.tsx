"use client"

interface Message {
  id: string
  text: string
  sender: "user" | "bunny"
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
      {message.sender === "bunny" && <span className="text-2xl flex-shrink-0">😊</span>}

      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
          message.sender === "user"
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-muted-foreground rounded-bl-none"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 opacity-70 ${
            message.sender === "user" ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {message.sender === "user" && <span className="text-2xl flex-shrink-0">👤</span>}
    </div>
  )
}
