"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TasksGrid from "./tasks-grid"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Tag, Clock, AlertTriangle, Sparkles, Trash2, Edit, Snowflake, Bell, DollarSign, BellRing } from "lucide-react"
import confetti from "canvas-confetti"
import { format, isToday, isTomorrow, parseISO, isWithinInterval, addDays } from "date-fns"
import AuthService from "@/services/authService"
import CategoryCreator from "./Category-creator"
import { Skeleton } from "../ui/skeleton"
import { Task, Hobby,Category } from "./types"   // ← Import shared types
import { motion } from "framer-motion"
import { Rabbit } from "lucide-react"
import ReorderableTaskList from "./ReorderableTaskList"

type ActiveStatus = "todo" | "in_progress" | "done" | "today" | "Soon" |"urgent"

const FOCUS_MODES = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "flow", label: "Flow" },
  { value: "mini", label: "Mini" },
  { value: "shuffle", label: "Shuffle" },
]
export default function TaskManagerView() {
  const [showCreator, setShowCreator] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [showCategoryCreator, setShowCategoryCreator] = useState(false)
  const [ActiveStatus, setActiveStatus] = useState<ActiveStatus>("today")
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [isLoading, setIsLoading] = useState(true)   // ← fixed
  // Forms
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [dueDate, setDueDate] = useState("")
  const [taskCategoryId, setTaskCategoryId] = useState("")
  const [preferredFocusMode, setPreferredFocusMode] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [reminderDate, setReminderDate] = useState("")
  const [shoppingName, setShoppingName] = useState("")
  const [shoppingCost, setShoppingCost] = useState("")

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false)
  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState("#f0abfc")
  const refreshAll = () => {
    fetchTasks()
    fetchCategories()
  }
  useEffect(() => {
    setMounted(true)
    fetchTasks()
    fetchCategories()
  }, [])
  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/api/tasks/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTasks(await res.json())
  }

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/api/categories/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setCategories(await res.json())
  }

  const completeTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task?.completed) return

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    alert("Great job! +10 coins!")

    await fetch(`${API_URL}/api/tasks/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ completed: true }),
    })
    fetchTasks()
  }

  const saveTask = async () => {
    const form = new FormData()
    form.append("title", title)
    form.append("description", description)
    form.append("priority", priority)
    form.append("status", "todo")
    if (taskCategoryId) form.append("category", taskCategoryId)
    if (dueDate) form.append("due_date", dueDate)
    if (preferredFocusMode) form.append("preferred_focus_mode", preferredFocusMode)

    const url = editingTask ? `${API_URL}/api/tasks/${editingTask.id}/` : `${API_URL}/api/tasks/`
    const method = editingTask ? "PATCH" : "POST"

    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    resetTaskForm()
    setTaskModalOpen(false)
    fetchTasks()
  }

  const resetTaskForm = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setDueDate("")
    setTaskCategoryId("")
    setPreferredFocusMode("")
    setEditingTask(null)
  }

  const editTask = (task: Task) => {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description || "")
    setPriority(task.priority)
    setDueDate(task.due_date || "")
    setTaskCategoryId(task.category?.id || "")
    setPreferredFocusMode(task.preferred_focus_mode || "")
    setTaskModalOpen(true)
  }

  const freezeTask = async (id: string, freeze: boolean) => {
    await fetch(`${API_URL}/api/tasks/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ frozen: freeze }),
    })
    fetchTasks()
  }
const fetchData = async () => {
    setIsLoading(true)
    try {
      const [taskRes, hobbyRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/hobbies/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (taskRes.ok) setTasks(await taskRes.json())
      if (hobbyRes.ok) setHobbies(await hobbyRes.json())
    } catch (err) {
      console.error("Fetch failed", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Smart reminder: tasks due in 3 days or urgent
  const reminderTasks = tasks.filter(t => {
    if (t.status === "done" || t.frozen) return false
    if (t.priority === "urgent") return true
    if (!t.due_date) return false
    const due = new Date(t.due_date)
    const daysLeft = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3 && daysLeft >= 0
  })

if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      
      {/* Bunny */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="p-5 rounded-full bg-accent/10"
      >
        <Rabbit className="w-10 h-10 text-accent" />
      </motion.div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">
          Getting things ready…
        </p>
        <p className="text-sm text-muted-foreground">
          Just a tiny moment 🐾
        </p>
      </div>

      {/* Soft dots */}
      <motion.div
        className="flex gap-2 mt-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2,
              repeat: Infinity,
            },
          },
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-accent/60"
            variants={{
              hidden: { opacity: 0.3 },
              visible: { opacity: 1 },
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}

  const setReminder = async (id: string) => {
    if (!reminderDate) return
    await fetch(`${API_URL}/api/reminders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ task: id, reminder_date: reminderDate }),
    })
    setReminderModalOpen(false)
    setReminderDate("")
    fetchTasks()
  }
const deleteTask = async (id: string) => {
    if (!confirm("Delete this task forever?")) return
    await fetch(`${API_URL}/api/tasks/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchTasks()
  }
  const addShoppingItem = async (taskId: string) => {
    if (!shoppingName || !shoppingCost) return
    const form = new FormData()
    form.append("name", shoppingName)
    form.append("estimated_cost", shoppingCost)
    form.append("task", taskId)  // Assuming backend handles task link

    await fetch(`${API_URL}/api/shopping-items/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    setShoppingModalOpen(false)
    setShoppingName("")
    setShoppingCost("")
    fetchTasks()
  }

  const startProgress = (task: Task) => {
    // Set status to in_progress
    fetch(`${API_URL}/api/tasks/${task.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "in_progress" }),
    }).then(() => {
      // Redirect to FocusSession with task ID and preferred mode
      router.push(`/focus?taskId=${task.id}&mode=${task.preferred_focus_mode || "pomodoro"}`)
    })
  }

  const addCategory = async () => {
    if (!catName.trim()) return
    await fetch(`${API_URL}/api/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: catName, color: catColor }),
    })
    setCatName(""); setCatModalOpen(false); fetchCategories()
  }

  // Filtered tasks
  const selectedCategoryTasks = tasks.filter(t => t.category?.id === selectedCategoryId && t.status !== "done")

  const urgentTasks = tasks.filter(t => t.status !== "done" && (t.priority === "urgent" || t.priority === "high"))
  const nearDeadlineTasks = tasks.filter(t => {
    if (t.status === "done" || !t.due_date) return false
    const due = parseISO(t.due_date)
    return isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 3) })
  })
  const criticalTasks = [...new Set([...urgentTasks, ...nearDeadlineTasks.map(t => t.id)])]
    .map(id => tasks.find(t => t.id === id)!)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))

  const inProgressTasks = tasks
    .filter(t => t.status === "in_progress")
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))

  if (!mounted) return null

return (
    <div className="max-w-7xl mx-auto space-y-10 py-10 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Task Manager</h1>
          <p className="text-lg text-muted-foreground mt-2">Stay calm and focused — one task at a time</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-5 h-5 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
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
                <Button onClick={saveTask} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingTask ? "Update" : "Create"} Task</Button>
              </div>
            </DialogContent> </Dialog>
          <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="border-border hover:bg-muted bg-transparent"
              >
                <Tag className="w-5 h-5 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <CategoryCreator onClose={() => setCatModalOpen(false)} onSuccess={refreshAll} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Gentle Reminder */}
      {reminderTasks.length > 0 && (
        <Card className="border-accent/30 bg-accent/10">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <BellRing className="w-7 h-7 text-accent" />
            <div>
              <CardTitle className="text-xl text-accent-foreground">Gentle Reminder</CardTitle>
              <p className="text-accent-foreground mt-1">
                {reminderTasks.length} urgent task{reminderTasks.length > 1 ? "s" : ""} need
                {reminderTasks.length === 1 ? "s" : ""} attention soon.
              </p>
            </div>
          </CardHeader>
        </Card>
      )}
      {/* Tabs */}
<Tabs value={ActiveStatus} onValueChange={(v) => setActiveStatus(v as ActiveStatus)}>
            <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full h-14 bg-card rounded-2xl p-1.5 gap-1.5 shadow-md border border-border">
              {/* Tab triggers with enhanced styling */}
              <TabsTrigger
                value="today"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-foreground"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "today" ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Clock className="w-4 h-4" />
                  Today
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="urgent"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-destructive"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "urgent" ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Urgent
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="Soon"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-accent"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "Soon" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{
                    duration: ActiveStatus === "Soon" ? 1.5 : 0.2,
                    repeat: ActiveStatus === "Soon" ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Soon
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="todo"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-foreground"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "todo" ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  To Do
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-foreground"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "in_progress" ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  In Progress
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="done"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-foreground"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ActiveStatus === "done" ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Done
                </motion.span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="text-sm font-semibold rounded-xl transition-all duration-300
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg
                           hover:bg-muted
                           text-foreground"
              >
                <motion.span
                  className="inline-flex items-center gap-1"
                  animate={ tasks ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  All
                </motion.span>
              </TabsTrigger>
            </TabsList>
<TabsContent value={ActiveStatus} className="mt-10">
  {["today", "in_progress"].includes(ActiveStatus) ? (
    <ReorderableTaskList
      tasks={tasks.filter(task => {
        if (ActiveStatus === "today") return task.due_date && isToday(parseISO(task.due_date))
        if (ActiveStatus === "in_progress") return task.status === "in_progress"
        return false
      })}
      categories={categories}
      onRefresh={refreshAll}
      onEdit={editTask}
      onStart={startProgress}
    />
  ) : (
    <TasksGrid status={ActiveStatus} tasks={tasks} categories={categories} onRefresh={refreshAll} />
  )}
</TabsContent>
      </Tabs>
    </div>
  )
}