"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Tag, Clock, AlertTriangle, Sparkles, Trash2, Edit, Snowflake, Bell, DollarSign, ChevronRight } from "lucide-react"
import confetti from "canvas-confetti"
import { format, isToday, isTomorrow, parseISO, isWithinInterval, addDays } from "date-fns"
import AuthService from "@/services/authService"
import { Task, Category } from "./types"
import { toast } from "sonner"
import { Checkbox } from "@radix-ui/react-checkbox"

const FOCUS_MODES = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "flow", label: "Flow" },
  { value: "mini", label: "Mini" },
  { value: "shuffle", label: "Shuffle" },
]

interface TasksGridProps {
  status: string
  tasks: Task[]
  categories: Category[]
  onRefresh: () => void
}

export default function TasksGrid({ status, tasks, categories, onRefresh }: TasksGridProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [dueDate, setDueDate] = useState("")
  const [taskCategoryId, setTaskCategoryId] = useState("")
  const [preferredFocusMode, setPreferredFocusMode] = useState("")
  const [reminderDate, setReminderDate] = useState("")
  const [shoppingName, setShoppingName] = useState("")
  const [shoppingCost, setShoppingCost] = useState("")

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  // Filter tasks based on current tab
  const filteredTasks = tasks.filter(task => {
    if (status === "todo") return task.status === "todo"
    if (status === "in_progress") return task.status === "in_progress"
    if (status === "done") return task.status === "done"
    if (status === "today") return task.due_date && isToday(parseISO(task.due_date))
    if (status === "soon") return task.due_date && !isToday(parseISO(task.due_date)) && isWithinInterval(parseISO(task.due_date), { start: new Date(), end: addDays(new Date(), 3) })
    if (status === "urgent") return ["urgent", "high"].includes(task.priority)
    return true // "all"
  })

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: "bg-pink-100 text-pink-700",
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const completeTask = async (id: string) => {
    try {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
      const res = await fetch(`${API_URL}/tasks/${id}/complete/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      toast.success("Amazing work!", { description: `+${data.xp} XP & ${data.coins} coins!` })
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Could not complete task")
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm("Delete forever?")) return
    await fetch(`${API_URL}/tasks/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    onRefresh()
  }

  const startProgress = async (task: Task) => {
    if (task.status !== "todo" || task.frozen) return toast.error("Cannot start this task")
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
      window.location.href = `/focus?taskId=${task.id}&mode=${data.focus_mode}`
    } catch (err: any) {
      toast.error(err.message || "Could not start task")
    }
  }
const addShoppingItem = async (id: string) => {
  if (!shoppingName || !shoppingCost) return

  await fetch(`${API_URL}/shopping-items/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: shoppingName,
      estimated_cost: Number(shoppingCost),
      task: id,
    }),
  })

  setShoppingModalOpen(false)
  setShoppingName("")
  setShoppingCost("")

}
const setReminder = async (id: string) => {
  if (!reminderDate) return

  await fetch(`${API_URL}/reminders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      task: id,
      reminder_date: reminderDate,
    }),
  })

  setReminderModalOpen(false)
  setReminderDate("")

}
  const freezeTask = async (id: string, freeze: boolean) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}/toggle_freeze/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      toast.success(freeze ? "Task frozen" : "Task unfrozen")
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update")
    }
  }

  const saveTask = async () => {
    const payload: any = { title, description: description || null, priority, status: "todo" }
    if (taskCategoryId) payload.category = taskCategoryId
    if (dueDate) payload.due_date = dueDate
    if (preferredFocusMode) payload.preferred_focus_mode = preferredFocusMode

    const url = editingTask ? `${API_URL}/tasks/${editingTask.id}/` : `${API_URL}/tasks/`
    const method = editingTask ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success(editingTask ? "Task updated!" : "Task created!")
      setTaskModalOpen(false)
      resetForm()
      onRefresh()
    } else {
      const err = await res.json()
      toast.error("Error: " + JSON.stringify(err))
    }
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setPriority("medium"); setDueDate(""); setTaskCategoryId(""); setPreferredFocusMode(""); setEditingTask(null)
  }

  const editTask = (task: Task) => {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description || "")
    setPriority(task.priority as any)
    setDueDate(task.due_date || "")
    setTaskCategoryId(task.category?.id?.toString() || "")
    setPreferredFocusMode(task.preferred_focus_mode || "")
    setTaskModalOpen(true)
  }



  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTasks.map(task => (
        <Card
          key={task.id}
          className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10 cursor-pointer hover:border-primary/30 transition-colors ${
            task.completed ? "opacity-60" : ""
          }`}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox checked={task.completed} onCheckedChange={() => completeTask(task.id)} className="mt-1" />
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                  {task.frozen && (
                    <span title="This task is frozen" className="inline-block">
                      <Snowflake className="w-4 h-4 inline ml-2 text-blue-400" />
                    </span>
                  )}
                </h3>
                {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {task.category && <Badge variant="outline" className="text-xs">{task.category.name}</Badge>}
              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
            </div>

            {task.due_date && <p className="text-xs text-muted-foreground">Due: {format(parseISO(task.due_date), "MMM d")}</p>}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              {task.status != "done" && task.status != "in_progress" && !task.frozen && <Button size="sm" onClick={() => startProgress(task)}>Start</Button>}
              <Button size="sm" variant="outline" onClick={() => freezeTask(task.id, !task.frozen)}>
            {task.frozen ? "Unfreeze" : "Freeze"}
          </Button>
              <Button variant="ghost" size="icon" onClick={() => editTask(task)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setReminderModalOpen(true)}><Bell className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() =>setShoppingModalOpen(true)}><DollarSign className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTask(task.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
             {/* Reminder Modal */}
        <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Reminder</DialogTitle></DialogHeader>
            <Input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
            <Button onClick={() => setReminder(editingTask?.id || "")}>Set Reminder</Button>
          </DialogContent>
        </Dialog>

        {/* Shopping Modal */}
        <Dialog open={shoppingModalOpen} onOpenChange={setShoppingModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Cost to Shopping List</DialogTitle></DialogHeader>
            <Input placeholder="Item name" value={shoppingName} onChange={e => setShoppingName(e.target.value)} />
            <Input type="number" placeholder="Estimated cost" value={shoppingCost} onChange={e => setShoppingCost(e.target.value)} />
            <Button onClick={() => addShoppingItem(editingTask?.id || "")}>Add to Shopping</Button>
          </DialogContent>
        </Dialog>

                     <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
            
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} />
                        <Textarea placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                          <Select value={priority} onValueChange={v => setPriority(v as any)}>
                            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={taskCategoryId} onValueChange={setTaskCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Select value={preferredFocusMode} onValueChange={setPreferredFocusMode}>
                          <SelectTrigger><SelectValue placeholder="Preferred Focus Mode" /></SelectTrigger>
                          <SelectContent>
                            {FOCUS_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        <Button onClick={saveTask} size="lg" className="w-full bg-green-600">{editingTask ? "Update" : "Create"} Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
</div>
  )
}