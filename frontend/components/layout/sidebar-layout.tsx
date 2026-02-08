"use client"

import { Button } from "@/components/ui/button"
import {
  Home, CheckSquare, Zap, Heart, MessageCircle, ShoppingCart, Flower,
  Menu, X, Bell, LogOut, User, Settings, Palette, Globe, Moon, Sun
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import AuthService from "@/services/authService"
import { toast } from "sonner"
import { RewardProvider } from "../reward/RewardProvider"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", color: "indigo" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks", color: "emerald" },
  { icon: Zap, label: "Focus", href: "/focus", color: "amber" },
  { icon: Heart, label: "Mood", href: "/mood", color: "rose" },
  { icon: MessageCircle, label: "Chat", href: "/chat", color: "sky" },
  { icon: Flower, label: "Hobbies", href: "/hobby", color: "pink" },
  { icon: ShoppingCart, label: "Shopping", href: "/money", color: "teal" },
]

const colorMap: Record<string, any> = {
  indigo: { bg: "bg-indigo-100", icon: "bg-indigo-500 text-white", text: "text-indigo-900" },
  emerald: { bg: "bg-emerald-100", icon: "bg-emerald-500 text-white", text: "text-emerald-900" },
  amber: { bg: "bg-amber-100", icon: "bg-amber-500 text-white", text: "text-amber-900" },
  rose: { bg: "bg-rose-100", icon: "bg-rose-500 text-white", text: "text-rose-900" },
  sky: { bg: "bg-sky-100", icon: "bg-sky-500 text-white", text: "text-sky-900" },
  pink: { bg: "bg-pink-100", icon: "bg-pink-500 text-white", text: "text-pink-900" },
  teal: { bg: "bg-teal-100", icon: "bg-teal-500 text-white", text: "text-teal-900" },
  slate: { bg: "bg-slate-100", icon: "bg-slate-400 text-white", text: "text-slate-800" },
}

type Notification = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [language, setLanguage] = useState("English")
  const [user, setUser] = useState<{ username: string } | null>(null)
  const API_URL = "http://localhost:8000/api"  // ← Hardcode this
  // Load user & notifications
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        if (isMounted) setUser(currentUser || { username: "User" })
      } catch {
        if (isMounted) setUser({ username: "User" })
      }

      const token = AuthService.getAccessToken()
      if (!token) return

      try {
        const res = await fetch(`${API_URL}/notifications/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          setNotifications(data)
          setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
        }
      } catch {
        if (isMounted) toast.error("Failed to load notifications")
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Theme handling
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const handleLogout = () => {
    AuthService.logout()
    router.push("/login")
    toast.success("Logged out! See you soon")
  }

  const markAsRead = async (id: string) => {
    const token = AuthService.getAccessToken()
    if (!token) return

    try {
      await fetch(`${API_URL}/notifications/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => prev - 1)
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  return (
    <>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-slate-800 border-r dark:border-slate-700">
          <div className="px-8 py-6 border-b dark:border-slate-700">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100"><Link href="/">BunnySteps</Link></h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Focus without pressure</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href
              const c = colorMap[item.color]
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full h-14 justify-start rounded-xl px-4 ${active ? `${c.bg} ${c.text}` : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >
                    <div className={`mr-4 w-10 h-10 rounded-lg flex items-center justify-center ${active ? c.icon : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Fixed Top-Right Header (Desktop Only) */}
<header
  className="
    hidden md:flex items-center justify-end gap-4
    px-8 py-3
    sticky top-0 z-50
    bg-white/70 dark:bg-slate-900/60
    backdrop-blur-xl backdrop-saturate-150
    border-b border-slate-200/40 dark:border-slate-700/40
    shadow-sm
  "
>
            {/* Notifications Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 mr-4">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-slate-500 dark:text-slate-400">No notifications yet</p>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className="flex flex-col items-start gap-1 px-4 py-3"
                      >
                        <div className="font-medium">{notif.type}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{notif.message}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-teal-500 text-white text-sm">
                      {user?.username[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.username || "User"}</p>
                    <p className="text-xs text-slate-500">My Account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> <Link href="/profile">Profile</Link> 
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="mr-2 h-4 w-4" /> Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem checked={theme === "light"} onCheckedChange={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" /> Light
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={theme === "dark"} onCheckedChange={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" /> Dark
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="mr-2 h-4 w-4" /> Language
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem checked={language === "English"} onCheckedChange={() => setLanguage("English")}>
                      English
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={language === "French"} onCheckedChange={() => setLanguage("French")}>
                      French
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Mobile Header */}
<header
  className="
    md:hidden flex items-center justify-between
    px-4 py-3
    sticky top-0 z-50
    bg-white/80 dark:bg-slate-900/70
    backdrop-blur-xl
    border-b border-slate-200/40 dark:border-slate-700/40
  "
>
            <h1 className="text-lg font-semibold dark:text-slate-100">BunnySteps</h1>
            <div className="flex items-center gap-2">
              {/* Mobile Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 dark:text-slate-400">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} onClick={() => markAsRead(notif.id)} className="flex flex-col gap-1 px-4 py-3">
                          <div className="font-medium">{notif.type}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{notif.message}</div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
    <main className="flex-1 overflow-y-auto">
  <div className="px-6 py-3 md:px-10 md:py-0 max-w-7xl mx-auto">
            <RewardProvider>

    {children}
    </RewardProvider>
  </div>
</main>

        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-800 z-50 shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-slate-700">
              <h2 className="text-xl font-semibold dark:text-slate-100">BunnySteps</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href
                const c = colorMap[item.color]
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <Button variant="ghost" className={`w-full h-14 justify-start rounded-xl px-4 ${active ? `${c.bg} ${c.text}` : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                      <div className={`mr-4 w-10 h-10 rounded-lg flex items-center justify-center ${active ? c.icon : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  )
}