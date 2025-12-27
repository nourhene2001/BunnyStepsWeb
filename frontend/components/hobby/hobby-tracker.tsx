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
import { CalendarIcon, Snowflake, StickyNote, PlusCircle, CheckCircle2, Clock, Sparkles, ArrowRight, Target, Plus } from "lucide-react"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import AuthService from "@/services/authService"
import TaskCreator from "../tasks/task-creator"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { DialogHeader } from "../ui/dialog"
import { Category } from "../tasks/types"

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
    const reason = !hobby.frozen ? prompt("Why pause? (optional)")?.trim() : ""
    await fetch(`${API_URL}/hobbies/${hobby.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ frozen: !hobby.frozen, freezeReason: reason || null }),
    })
    fetchHobbies()
  }

  const addNote = async () => {
    if (!selectedHobby || !newNote.trim()) return
    await fetch(`${API_URL}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newNote, hobby: selectedHobby.id }),
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
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Sparkles className="text-purple-600" />
            Your Hobbies & Passions
          </CardTitle>
          <p className="text-muted-foreground">Grow what makes you come alive</p>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Hobby List */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add New Hobby</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Painting, Guitar..." value={newHobbyName} onChange={e => setNewHobbyName(e.target.value)} />
              <Textarea placeholder="Why does this matter to you?" value={newHobbyDesc} onChange={e => setNewHobbyDesc(e.target.value)} rows={2} />
              <Button onClick={createHobby} className="w-full" disabled={!newHobbyName.trim()}>
                <PlusCircle className="mr-2" size={16} /> Create
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {hobbies.map(hobby => (
              <Card
                key={hobby.id}
                className={`cursor-pointer transition-all ${selectedHobby?.id === hobby.id ? "ring-2 ring-purple-500" : ""} ${hobby.frozen ? "opacity-70" : ""}`}
                onClick={() => setSelectedHobby(hobby)}
              >
                <CardHeader className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {hobby.name}
                      {hobby.frozen && <Snowflake size={16} className="text-blue-500" />}
                    </h3>
                    {hobby.description && <p className="text-xs text-muted-foreground mt-1">{hobby.description}</p>}
                  </div>
                  <Switch checked={hobby.frozen} onCheckedChange={() => toggleFreeze(hobby)} onClick={e => e.stopPropagation()} />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

         {/* Selected Hobby Details */}
        <div className="lg:col-span-2">
          {selectedHobby ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{selectedHobby.name}</CardTitle>
                {selectedHobby.description && <p className="text-muted-foreground">{selectedHobby.description}</p>}
              </CardHeader>
              <CardContent className="space-y-8">
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
                {/* Automatically link to selected hobby */}
                <input type="hidden" name="hobby" value={selectedHobby.id} />
                <Button onClick={saveTask} size="lg" className="w-full bg-green-600">{editingTask ? "Update" : "Create"} Task</Button>
              </div>
            </DialogContent>
          </Dialog>
 <Separator />
                {/* Linked Tasks Section */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                    <Target className="text-emerald-600" />
                    Tasks for This Hobby ({linkedTasks.length})
                  </h3>

                  {linkedTasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No tasks yet! Click above to create one</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {linkedTasks.map(task => (
                        <Link href={`/tasks`} key={task.id}>
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-emerald-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(task.status)}
                                  <div>
                                    <h4 className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                                      {task.title}
                                    </h4>
                                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                  {task.due_date && (
                                    <span className="text-xs text-muted-foreground">
                                      {isToday(parseISO(task.due_date)) ? "Today" :
                                       isTomorrow(parseISO(task.due_date)) ? "Tomorrow" :
                                       format(parseISO(task.due_date), "MMM d")}
                                    </span>
                                  )}
                                  <ArrowRight size={16} className="text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
<Separator />
                            {/* Notes & Reminders */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-3">Progress Notes</h4>
                    <Textarea placeholder="How did it go?" value={newNote} onChange={e => setNewNote(e.target.value)} />
                    <Button onClick={addNote} size="sm" className="mt-2" disabled={!newNote.trim()}>
                      <StickyNote className="mr-2" size={16} /> Add Note
                    </Button>
                    {notes.length > 0 && (
                      <div className="mt-4 space-y-2 text-sm">
                        {notes.slice().reverse().slice(0, 3).map(n => (
                          <div key={n.id} className="p-2 bg-muted/50 rounded italic">
                            {n.content}
                            <span className="block text-xs text-muted-foreground mt-1">
                              {format(new Date(n.created_at), "PPp")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Reminders</h4>
                    <div className="flex gap-2">
                      <Input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                      <Button onClick={addReminder} disabled={!reminderDate}>
                        <CalendarIcon size={16} /> Set
                      </Button>
                    </div>
                    {reminders.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {reminders.map(r => (
                          <div key={r.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                            <Clock size={14} />
                            {format(new Date(r.reminder_date), "PPP")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
          
          </CardContent>
            </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center text-center">
              <div>
                <Sparkles size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl text-muted-foreground">Select a hobby to see your progress</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}