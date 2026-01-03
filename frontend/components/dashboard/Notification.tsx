// components/NotificationBell.tsx  (or paste directly in Dashboard.tsx)
import { useState, useEffect } from "react"
import { Bell, CheckCircle, Clock, Trophy, AlertCircle, Rabbit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"  // your shadcn utils
import AuthService from "@/services/authService"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/notifications/?all=false`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // every 30s
    return () => clearInterval(interval)
  }, [token])

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications/mark-all-read/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications([])
  }

  const unreadCount = notifications.length

  const getIcon = (type: string) => {
    switch (type) {
      case "reminder_due": return <Clock className="w-5 h-5 text-orange-500" />
      case "task_complete": return <CheckCircle className="w-5 h-5 text-green-500" />
      case "badge_earned":
      case "weekly_discipline": return <Trophy className="w-5 h-5 text-yellow-500" />
      default: return <AlertCircle className="w-5 h-5 text-purple-500" />
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-3 bg-white/80 backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      >
        <Bell className="w-7 h-7 text-purple-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 overflow-hidden animate-in slide-in-from-top-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Bunny Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs underline opacity-90 hover:opacity-100"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Rabbit className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>All caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 border-b border-purple-100 hover:bg-purple-50/50 transition"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900">{notif.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-purple-50 text-center">
              <a href="/notifications" className="text-purple-600 font-medium text-sm hover:underline">
                View all notifications →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}