// app/hobby-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CalendarIcon, Snowflake, StickyNote, PlusCircle, CheckCircle2, Clock, Sparkles, ArrowRight, Target, Plus, Flower2, Leaf, ListTodo, MessageCircle } from "lucide-react"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import AuthService from "@/services/authService"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { DialogHeader } from "../ui/dialog"
import { Category } from "../tasks/types"
import TaskCreator from "./task-creator"
import { toast } from "../ui/use-toast"

interface Hobby {
  id: number
  name: string
  description?: string
  frozen: boolean
  freezeReason?: string
  created_at: string
}

interface Note {
  id: number
  content: string
  created_at: string
}

interface Reminder {
  id: number
  reminder_date: string
}

interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  completed?: boolean
}
const FOCUS_MODES = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "flow", label: "Flow" },
  { value: "mini", label: "Mini" },
  { value: "shuffle", label: "Shuffle" },]
export default function HobbyTracker() {
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isTaskCreatorOpen, setIsTaskCreatorOpen] = useState(false)

  // Form states
  const [newHobbyName, setNewHobbyName] = useState("")
  const [newHobbyDesc, setNewHobbyDesc] = useState("")
  const [newNote, setNewNote] = useState("")
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
  const [tasks, setTasks] = useState<Task[]>([])

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false)
  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState("#f0abfc")
  const [categories, setCategories] = useState<Category[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const token = AuthService.getAccessToken()

const fetchHobbies = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/hobbies/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setHobbies(await res.json())
    } catch (err) {
      console.error("Failed to load hobbies", err)
    } finally {
      setLoading(false)
    }
  }
    const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/api/tasks/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTasks(await res.json())
  }
const saveTask = async () => {
  const form = new FormData()
  form.append("title", title)
  form.append("description", description || "")
  form.append("priority", priority)
  form.append("status", "todo")

  if (taskCategoryId) form.append("category", taskCategoryId)
  if (dueDate) form.append("due_date", dueDate)
  if (preferredFocusMode) form.append("preferred_focus_mode", preferredFocusMode)

  // THIS IS THE MAGIC LINE — LINK TO CURRENT HOBBY
  if (selectedHobby) {
    form.append("hobby", selectedHobby.id.toString())
  }

  const url = editingTask 
    ? `${API_URL}/tasks/${editingTask.id}/` 
    : `${API_URL}/tasks/`
  
  const method = editingTask ? "PATCH" : "POST"

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    if (!res.ok) {
      const err = await res.json()
      console.error("Task save failed:", err)
      alert("Failed to save task")
      return
    }

    // Success — reset and refresh
    resetTaskForm()
    setTaskModalOpen(false)

    // Refresh both global tasks AND hobby-specific tasks
    fetchTasks()
    if (selectedHobby) loadHobbyDetails(selectedHobby.id)  // This makes it appear instantly!
  } catch (err) {
    console.error("Network error:", err)
    alert("Network error")
  }
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
const loadHobbyDetails = async (hobbyId: number) => {
  if (!token) return

  try {
    const [notesRes, remindersRes, tasksRes] = await Promise.all([
      fetch(`${API_URL}/notes/?hobby=${hobbyId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/reminders/?hobby=${hobbyId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/tasks/?hobby=${hobbyId}`, { headers: { Authorization: `Bearer ${token}` } }),
                                
    ])

    if (notesRes.ok) setNotes(await notesRes.json())
    if (remindersRes.ok) setReminders(await remindersRes.json())
    if (tasksRes.ok) setLinkedTasks(await tasksRes.json())
  } catch (err) {
    console.error("Failed to load hobby details", err)
  }
}
  useEffect(() => { fetchHobbies() }, [])
  useEffect(() => {
    if (selectedHobby) loadHobbyDetails(selectedHobby.id)
    else { setNotes([]); setReminders([]); setLinkedTasks([]) }
  }, [selectedHobby])

  const createHobby = async () => {
    if (!newHobbyName.trim()) return alert("Name required!")
    await fetch(`${API_URL}/hobbies/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newHobbyName.trim(), description: newHobbyDesc.trim() || null }),
    })
    fetchHobbies()
    setNewHobbyName("")
    setNewHobbyDesc("")
  }

const toggleFreeze = async (hobby: Hobby) => {

  try {
    const res = await fetch(`${API_URL}/hobbies/${hobby.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ frozen: !hobby.frozen }),
    })

    if (!res.ok) throw new Error("Failed to update hobby")

    fetchHobbies()

    toast({
      title: "Hobby updated",
      description: `Hobby is now ${!hobby.frozen ? "active" : "paused"}`,
      variant: "default",
    })
  } catch (err) {
    console.error(err)
    toast({
      title: "Failed to update hobby",
      description: "Please try again",
      variant: "destructive",
    })
  }
}


const addNote = async () => {
  if (!selectedHobby || !newNote.trim()) return

  await fetch(`${API_URL}/hobbies/${selectedHobby.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: newNote,
    }),
  })

  setNewNote("")
  loadHobbyDetails(selectedHobby.id)
}


  const addReminder = async () => {
    if (!selectedHobby || !reminderDate) return
    await fetch(`${API_URL}/reminders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reminder_date: reminderDate, hobby: selectedHobby.id }),
    })
    setReminderDate("")
    loadHobbyDetails(selectedHobby.id)
  }

  const getPriorityColor = (p: string) => {
    if (p === "high") return "bg-red-100 text-red-700 dark:bg-red-900/50"
    if (p === "medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50"
    return "bg-green-100 text-green-700 dark:bg-green-900/50"
  }

  const getStatusIcon = (status: string) => {
    if (status === "done") return <CheckCircle2 className="text-green-600" size={16} />
    if (status === "in_progress") return <Target className="text-blue-600 animate-pulse" size={16} />
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
  }


return (
  <div className="max-w-7xl mx-auto space-y-10 py-10 px-4 md:px-6">
    {/* Header */}
    <div className="space-y-3">
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground">Your Hobbies</h1>
      <p className="text-base text-muted-foreground max-w-2xl">
        Grow what matters to you, at your own pace. No pressure, just progress.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hobby List */}
      <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Flower2 className="w-5 h-5 text-primary" />
            Your interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Input
              placeholder="Hobby name"
              value={newHobbyName}
              onChange={(e) => setNewHobbyName(e.target.value)}
              className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            />
            <Textarea
              placeholder="Why does it matter?"
              value={newHobbyDesc}
              onChange={(e) => setNewHobbyDesc(e.target.value)}
              rows={2}
              className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors resize-none"
            />
            <Button
              onClick={createHobby}
              className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add hobby
            </Button>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            {hobbies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Start by adding a hobby 🌱
              </p>
            ) : (
              hobbies.map((hobby) => (
                <button
                  key={hobby.id}
                  onClick={() => setSelectedHobby(hobby)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedHobby?.id === hobby.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">
                        {hobby.name}
                      </p>
                      {hobby.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {hobby.description}
                        </p>
                      )}
                      {hobby.frozen && hobby.freezeReason && (
                        <p className="text-xs text-muted-foreground italic mt-2 line-clamp-1">
                          Paused: {hobby.freezeReason}
                        </p>
                      )}
                    </div>
                    {hobby.frozen ? (
                      <Badge className="bg-primary/10 text-primary">
                        Paused
                      </Badge>
                    ) : (
                      <Badge className="bg-accent/10 text-accent">
                        Active
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hobby Details */}
      <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        {selectedHobby ? (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                {selectedHobby.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Pause Switch */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium text-foreground">Pause this hobby</span>
                <Switch
                  checked={!selectedHobby.frozen}
                  onCheckedChange={() => toggleFreeze(selectedHobby)}
                />
              </div>

              {/* Tasks Section */}
              <section className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  Small tasks
                </h3>

                <Dialog open={isTaskCreatorOpen} onOpenChange={setIsTaskCreatorOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg border-border hover:bg-primary/5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add a task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New task for {selectedHobby.name}</DialogTitle>
                    </DialogHeader>
                    <TaskCreator
                      onClose={() => setIsTaskCreatorOpen(false)}
                      initialHobbyId={selectedHobby.id}
                      onSuccess={() => loadHobbyDetails(selectedHobby.id)}
                    />
                  </DialogContent>
                </Dialog>

                {linkedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No tasks yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {linkedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-muted/30 rounded-xl border border-border flex items-start gap-4"
                      >
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {format(parseISO(task.due_date), "MMM d")}
                            </p>
                          )}
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator className="bg-border" />

              {/* Notes Section */}
              <section className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Reflections
                </h3>

                <Textarea
                  placeholder="How did it feel? What are you learning?"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors resize-none"
                />

                <Button
                  onClick={addNote}
                  className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  disabled={!newNote.trim()}
                >
                  Save reflection
                </Button>

                {notes.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-muted/20 rounded-xl border border-border text-sm text-foreground"
                      >
                        {note.content}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </CardContent>
          </>
        ) : (
          <CardContent className="h-96 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <Leaf className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground">Select a hobby to explore it</p>
          </CardContent>
        )}
      </Card>
    </div>
  </div>
)}