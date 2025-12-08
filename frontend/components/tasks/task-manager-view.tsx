"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskCreator from "./task-creator"
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground mt-1">Break down your goals into manageable steps</p>
        </div>
        <div >
 
                 <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Plus className="w-6 h-6 mr-2" /> Add Task
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
                <Button onClick={saveTask} size="lg" className="w-full bg-green-600">{editingTask ? "Update" : "Create"} Task</Button>
              </div>
            </DialogContent>
          </Dialog>
  
        
               <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="border-purple-300">
                <Tag className="w-5 h-5 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <div className="flex gap-3">
                <Input placeholder="Name" value={catName} onChange={e => setCatName(e.target.value)} />
                <Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-20" />
                <Button onClick={addCategory}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
      </div>
          {/* Reminder Alert */}
      {reminderTasks.length > 0 && (
        <Card className="border-red-400 bg-red-50 dark:bg-red-950/30">
          <CardHeader className="flex flex-row items-center gap-3">
            <BellRing className="w-6 h-6 text-red-600" />
            <div>
              <CardTitle className="text-red-700">Don't forget!</CardTitle>
              <p className="text-sm">{reminderTasks.length} task{reminderTasks.length > 1 ? "s are" : " is"} urgent or due soon!</p>
            </div>
          </CardHeader>
        </Card>
      )}
      {/* Tabs */}
      <Tabs value={ActiveStatus} onValueChange={(v) => setActiveStatus(v as ActiveStatus)}>
        <TabsList className="bg-card">
          <TabsTrigger value="today">Danger! should be done TODAY !</TabsTrigger>
          <TabsTrigger value="urgent">Urgent TASK</TabsTrigger>
          <TabsTrigger value="soon">deadline are almost here!</TabsTrigger>
          <TabsTrigger value="todo">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
          <TabsTrigger value="in_progress">In progress</TabsTrigger>
        </TabsList>

               <TabsContent value={ActiveStatus}>
          <TasksGrid
            status={ActiveStatus}
            tasks={tasks}
            hobbies={hobbies}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
