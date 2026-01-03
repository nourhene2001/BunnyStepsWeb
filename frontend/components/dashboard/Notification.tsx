// components/NotificationBell.tsx
"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, Trophy, AlertCircle, Rabbit } from "lucide-react"
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

// Removed count prop - compute internally
interface NotificationBellProps {}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function NotificationBell({}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  // Track which reward notifications we've already shown
  const [shownRewardIds, setShownRewardIds] = useState<Set<number>>(new Set())
  const { showReward } = useReward()

  const token = AuthService.getAccessToken()

  const fetchNotifications = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/notifications/?ordering=-created_at&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const data: Notification[] = await res.json()
      setNotifications(data)

      // Find new UNREAD reward notifications we haven't shown yet
      const rewardTypes = ["level_up", "task_complete"]
      const newRewardNotifs = data.filter(
        n => !n.is_read && 
             rewardTypes.includes(n.type) && 
             !shownRewardIds.has(n.id)
      )

      // Show each new reward ONCE
      for (const notif of newRewardNotifs) {
        showReward({
          name: notif.title,
          description: notif.message,
        })

        // Remember we showed it
        setShownRewardIds(prev => new Set(prev).add(notif.id))

        // Mark as read on backend
        fetch(`${API_URL}/notifications/${notif.id}/read/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } catch (err) {
      console.error("Failed to load notifications")
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [token])  // Removed unnecessary deps to avoid loops

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
      case "badge_earned":
      case "weekly_discipline":
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case "task_complete":
        return <CheckCircle className="w-6 h-6 text-emerald-500" />
      case "reminder_due":
        return <Clock className="w-6 h-6 text-orange-500" />
      default:
        return <AlertCircle className="w-6 h-6 text-purple-500" />
    }
  }

  // Compute unread internally
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
            {unread > 99 ? "99+" : unread}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-96 bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-50">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Rabbit className="w-6 h-6" />
                  Bunny Notifications
                </h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs underline">
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Rabbit className="w-20 h-20 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">All caught up! 🐰</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 border-b border-border/50 hover:bg-accent/50 transition"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-muted/50 text-center">
              <a href="/notifications" className="text-sm font-medium text-primary hover:underline">
                View all →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}