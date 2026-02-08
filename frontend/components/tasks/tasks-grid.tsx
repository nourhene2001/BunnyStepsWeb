"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sparkles, Edit, Snowflake, Lock, Clock, MoreHorizontal, Bell, DollarSign, Trash2 } from "lucide-react"
import confetti from "canvas-confetti"
import { format, isToday, parseISO, isWithinInterval, addDays } from "date-fns"
import AuthService from "@/services/authService"
import { Task, Category } from "./types"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const token = AuthService.getAccessToken()

interface TasksGridProps {
  status: string
  tasks: Task[]
  categories: Category[]
  onRefresh: () => void
}

export default function TasksGrid({ status, tasks, categories, onRefresh }: TasksGridProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false)
  const [reminderDate, setReminderDate] = useState("")
  const [shoppingName, setShoppingName] = useState("")
  const [shoppingCost, setShoppingCost] = useState("")

  const filteredTasks = tasks.filter(task => {
    if (status === "todo") return task.status === "todo"
    if (status === "in_progress") return task.status === "in_progress"
    if (status === "done") return task.status === "done"
    if (status === "today") return task.due_date && isToday(parseISO(task.due_date))
    if (status === "soon") return task.due_date && !isToday(parseISO(task.due_date)) && isWithinInterval(parseISO(task.due_date), { start: new Date(), end: addDays(new Date(), 3) })
    if (status === "urgent") return ["urgent", "high"].includes(task.priority)
    return true
  })

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: "bg-destructive/10 text-destructive",
      high: "bg-destructive/10 text-destructive",
      medium: "bg-accent/10 text-accent",
      low: "bg-secondary/10 text-secondary",
    }
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground"
  }


const showFloatingXP = (amount: number = 50) => {
  // Create the floating text element
  const el = document.createElement("div")
  el.innerText = `+${amount} XP`
  el.style.position = "fixed"
  el.style.left = "50%"
  el.style.top = "60%"
  el.style.transform = "translate(-50%, -50%)"
  el.style.fontSize = "48px"
  el.style.fontWeight = "bold"
  el.style.color = "#facc15"
  el.style.textShadow = "0 0 20px #fbbf24, 0 4px 8px rgba(0,0,0,0.4)"
  el.style.pointerEvents = "none"
  el.style.zIndex = "9999"
  el.style.userSelect = "none"
  el.style.opacity = "0"
  el.style.transition = "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)"

  document.body.appendChild(el)

  // Trigger animation
  requestAnimationFrame(() => {
    el.style.opacity = "1"
    el.style.transform = "translate(-50%, -150%) scale(1.3)"
    el.style.filter = "blur(0px)"
  })

  // Remove after animation
  setTimeout(() => {
    el.style.opacity = "0"
    el.style.transform = "translate(-50%, -300%) scale(0.8)"
    setTimeout(() => el.remove(), 600)
  }, 800)
}
const completeTask = async (id: string) => {
  try {
    // Show floating +50 XP text
    showFloatingXP(50)

    // Optional: Add a small confetti burst (without text)
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#facc15", "#fbbf24", "#f59e0b", "#a78bfa", "#f472b6"],
      scalar: 0.8,
    })

    // API call
    const res = await fetch(`${API_URL}/tasks/${id}/complete/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error("Failed")

    toast.success("Amazing work! +50 XP & +10 coins earned!", {
      icon: "🏆",
      duration: 4000,
    })

    onRefresh()
  } catch (err) {
    console.error(err)
    toast.error("Could not complete task")
  }
}
  const deleteTask = async (id: string) => {
    if (!confirm("Delete forever?")) return
    await fetch(`${API_URL}/tasks/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    onRefresh()
  }

  const handleStart = async (task: Task) => {
    if (task.status !== "todo" || task.frozen) { toast.error("Cannot start this task"); return }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      const res = await fetch(`${API_URL}/tasks/${task.id}/start/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      toast.success(data.detail || "Started!")
      onRefresh()
    } catch { toast.error("Could not start task") }
  }

  const handleStartFocus = async (task: Task) => {
    if (task.status !== "todo" || task.frozen) { toast.error("Cannot start this task"); return }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      const res = await fetch(`${API_URL}/tasks/${task.id}/start/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      toast.success("Locked in! Let's focus!")
      onRefresh()
      window.location.href = `/focus?taskId=${task.id}&mode=${data.focus_mode}`
    } catch { toast.error("Could not lock in") }
  }

  const handleFreeze = async (id: string, freeze: boolean) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}/toggle_freeze/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      toast.success(freeze ? "Task frozen ❄️" : "Task unfrozen ✅")
      onRefresh()
    } catch { toast.error("Failed to update") }
  }

  const handleReminderOpen = (task: Task) => {
    setEditingTask(task)
    setReminderModalOpen(true)
  }

  const handleShoppingOpen = (task: Task) => {
    setEditingTask(task)
    setShoppingModalOpen(true)
  }

  const setReminder = async (id: string) => {
    if (!reminderDate) return toast.error("Pick a reminder time!")
    try {
      await fetch(`${API_URL}/reminders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task: id, reminder_date: reminderDate }),
      })
      toast.success("Reminder set! 🔔")
      setReminderModalOpen(false)
      setReminderDate("")
      onRefresh()
    } catch { toast.error("Failed to set reminder") }
  }

  const addShoppingItem = async (id: string) => {
    if (!shoppingName || !shoppingCost) return toast.error("Add item name & cost!")
    try {
      await fetch(`${API_URL}/shopping-items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: shoppingName,
          estimated_cost: Number(shoppingCost),
          task: id,
        }),
      })
      toast.success("Added to shopping list! 🛒")
      setShoppingModalOpen(false)
      setShoppingName("")
      setShoppingCost("")
      onRefresh()
    } catch { toast.error("Failed to add shopping item") }
  }

return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredTasks.map((task) => (
      <Card
        key={task.id}
        className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm overflow-hidden"
      >
        <CardContent className="pt-6 pb-5 space-y-5">
          {/* More Menu */}
          <div className="absolute top-4 right-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/80"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleReminderOpen(task)}>
                  <Bell className="mr-2 h-4 w-4" /> Set Reminder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShoppingOpen(task)}>
                  <DollarSign className="mr-2 h-4 w-4" /> Add to Shopping
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title + Checkbox */}
          <div className="flex items-start gap-4 pr-10">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => !task.completed && completeTask(task.id)}
              className="mt-1 h-5 w-5 border-2 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-lg break-words flex items-center gap-2 ${
                  task.completed
                    ? "text-muted-foreground line-through opacity-70"
                    : "text-foreground"
                }`}
              >
                {task.title}
                {task.frozen && (
                  <Snowflake className="w-4 h-4 text-accent animate-pulse" />
                )}
              </h3>

              {task.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {task.category && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${task.category.color}20`,
                  color: task.category.color,
                  borderColor: task.category.color + "40",
                }}
                className="border"
              >
                {task.category.name}
              </Badge>
            )}
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority.toUpperCase()}
            </Badge>
            {task.status === "in_progress" && !task.completed && (
              <Badge className="bg-primary/10 text-primary">
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                In Progress
              </Badge>
            )}
          </div>

          {/* Due Date */}
          {task.due_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Due: <span className="font-medium">{format(parseISO(task.due_date), "MMM d, yyyy")}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-border">
            {task.status === "todo" && !task.completed && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                onClick={() => handleStart(task)}
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Start
              </Button>
            )}

            {!task.completed && (
              <Button
                size="sm"
                variant="outline"
                className="border-primary/40 hover:bg-primary/5"
                onClick={() => handleStartFocus(task)}
              >
                <Lock className="w-4 h-4 mr-1.5" /> Lock In
              </Button>
            )}

            {!task.completed && (
              task.frozen ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
                  onClick={() => handleFreeze(task.id, false)}
                >
                  <Snowflake className="w-4 h-4 mr-1.5" /> Unfreeze
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-accent hover:bg-accent/10"
                  onClick={() => handleFreeze(task.id, true)}
                >
                  <Snowflake className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    ))}

    {/* Reminder Modal */}
    <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            type="datetime-local"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
          />
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => editingTask && setReminder(editingTask.id)}
          >
            Set Reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Shopping Modal */}
    <Dialog open={shoppingModalOpen} onOpenChange={setShoppingModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cost to Shopping List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            placeholder="Item name"
            value={shoppingName}
            onChange={(e) => setShoppingName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Estimated cost"
            value={shoppingCost}
            onChange={(e) => setShoppingCost(e.target.value)}
          />
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => editingTask && addShoppingItem(editingTask.id)}
          >
            Add to Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
)}