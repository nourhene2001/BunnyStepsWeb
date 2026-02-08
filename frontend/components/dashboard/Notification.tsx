// components/NotificationBell.tsx
"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, Trophy, AlertCircle, Rabbit, Star, Coins as CoinsIcon, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AuthService from "@/services/authService"
import { useReward } from "@/components/reward/RewardProvider"
import { toast } from "sonner"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

const API_URL = "http://localhost:8000/api"  // ← Hardcode this
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [processedRewardIds, setProcessedRewardIds] = useState<Set<number>>(new Set())
  const { showReward } = useReward()

  const token = AuthService.getAccessToken()

  const fetchNotifications = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/notifications/?ordering=-created_at&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const data: Notification[] = await res.json()
      setNotifications(data)

      // Process only NEW unread reward-related notifications
      const newRewardNotifs = data.filter(
        n => !n.is_read && !processedRewardIds.has(n.id) && isRewardType(n.type)
      )

      for (const notif of newRewardNotifs) {
        handleRewardNotification(notif)
        setProcessedRewardIds(prev => new Set(prev).add(notif.id))

        // Mark as read on backend (fire and forget)
        fetch(`${API_URL}/notifications/${notif.id}/read/`, {  // Fixed: "notif ung.id" → notif.id
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } catch (err) {
      console.error("Failed to load notifications:", err)
    }
  }

  // Helper: determine if notification should trigger a reward modal
  const isRewardType = (type: string): boolean => {
    return [
      "task_complete",
      "level_up",
      "badge_earned",
      "weekly_discipline"
    ].includes(type)
  }

const handleRewardNotification = (notif: Notification) => {
  console.log("🔔 Reward notification detected:", notif.type, notif)

  switch (notif.type) {
    case "task_complete":
      console.log("Showing +50 XP")
      showReward({ type: "xp", amount: 50, source: notif.title })
      setTimeout(() => {
        console.log("Showing +10 Coins")
        showReward({ type: "coins", amount: 10, source: "Task completed!" })
      }, 800)
      break

    case "level_up":
      const levelMatch = notif.message.match(/Level (\d+)/i) || notif.title.match(/Level (\d+)/i)
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 2
      console.log("Showing Level Up:", level)
      showReward({ type: "level_up", newLevel: level })
      break

    case "badge_earned":
    case "weekly_discipline":
      console.log("Showing Badge:", notif.title)
      showReward({
        type: "badge",
        badgeTitle: notif.title,
        badgeDescription: notif.message
      })
      break
  }
}
  useEffect(() => {
    if (!token) return

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [token])

  const markAllRead = async () => {
    if (!token) return
    try {
      await fetch(`${API_URL}/notifications/mark-all-read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "level_up":
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case "badge_earned":
      case "weekly_discipline":
        return <Star className="w-6 h-6 text-purple-500" />
      case "task_complete":
        return <CheckCircle className="w-6 h-6 text-emerald-500" />
      case "reminder_due":
        return <Clock className="w-6 h-6 text-orange-500" />
      default:
        return <AlertCircle className="w-6 h-6 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(prev => !prev)}
        className="relative hover:bg-accent/80 transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-card/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-50">
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Rabbit className="w-7 h-7" />
                  Bunny Notifications
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs underline opacity-90 hover:opacity-100">
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
              {notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <Rabbit className="w-20 h-20 mx-auto mb-4 opacity-20 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">You're all caught up! 🐰</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-accent/50 transition ${!notif.is_read ? "bg-accent/30" : ""}`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 self-start" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-muted/70 text-center border-t border-border/50">
              <a href="/notifications" className="text-sm font-medium text-primary hover:underline">
                View all notifications →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}