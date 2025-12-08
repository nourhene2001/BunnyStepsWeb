"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, CheckSquare, Zap, Heart, BarChart3, MessageSquare, Settings, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Zap, label: "Focus", href: "/focus" },
  { icon: Heart, label: "Mood", href: "/mood" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: MessageSquare, label: "Hobby", href: "/hobby" },
  { icon: MessageSquare, label: "Shopping", href: "/money" },
]

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 w-64 h-screen bg-card border-r border-border transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">BunnySteps</h1>
          <p className="text-xs text-muted-foreground mt-1">ADHD-Friendly Productivity</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant={pathname === item.href ? "default" : "ghost"} className="w-full justify-start">
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">BunnySteps</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
