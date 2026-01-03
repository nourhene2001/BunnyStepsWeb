// components/task-creator.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import AuthService from "@/services/authService"
import { Tag, Sparkles, Calendar } from "lucide-react"

interface Hobby { id: number; name: string }
interface Category { id: number; name: string }

interface TaskCreatorProps {
  onClose: () => void
  initialHobbyId?: number | string     // ← NEW: from HobbyTracker
  onSuccess?: () => void
  editingTask?: any                     // ← if editing
}

const FOCUS_MODES = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "flow", label: "Flow" },
  { value: "mini", label: "Mini" },
  { value: "shuffle", label: "Shuffle" },
]

export default function TaskCreator({ 
  onClose, 
  initialHobbyId, 
  onSuccess, 
  editingTask 
}: TaskCreatorProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [categoryId, setCategoryId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [preferredFocusMode, setPreferredFocusMode] = useState("")
  
  // ← FIXED: Properly initialize from initialHobbyId OR editingTask
  const [selectedHobbyId, setSelectedHobbyId] = useState<string>(
    initialHobbyId?.toString() || 
    editingTask?.related_hobby?.id?.toString() || 
    ""
  )

  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    const load = async () => {
      const [hRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/hobbies/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/categories/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (hRes.ok) setHobbies(await hRes.json())
      if (cRes.ok) setCategories(await cRes.json())
    }
    load()
  }, [token])

  const saveTask = async () => {
    if (!title.trim()) return alert("Title required!")

    setLoading(true)
    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status: "todo",
    }
    if (categoryId) payload.category = categoryId
    if (dueDate) payload.due_date = dueDate
    if (preferredFocusMode) payload.preferred_focus_mode = preferredFocusMode
    if (selectedHobbyId) payload.hobby = selectedHobbyId
    try {
      const res = await fetch(`${API_URL}/api/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess?.()
        onClose()
      } else {
        const err = await res.json()
        alert("Error: " + JSON.stringify(err))
      }
    } catch (err) {
      alert("Network error")
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="space-y-6">
    {/* Task Title */}
    <div className="space-y-2">
      <Label htmlFor="title" className="text-sm font-semibold text-foreground">
        What's the task?
      </Label>
      <Input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Practice guitar for 5 minutes"
        autoFocus
        className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors focus:border-ring focus:ring-ring/50"
      />
    </div>

    {/* Description */}
    <div className="space-y-2">
      <Label htmlFor="description" className="text-sm font-semibold text-foreground">
        Add details (optional)
      </Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Any notes that help you focus..."
        className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors focus:border-ring focus:ring-ring/50 resize-none"
      />
    </div>

    {/* Priority & Category */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="priority" className="text-sm font-semibold text-foreground flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-current"></span>
          Priority
        </Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger id="priority" className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-semibold text-foreground flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" />
          Category
        </Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category" className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Focus Mode */}
    <div className="space-y-2">
      <Label htmlFor="focus-mode" className="text-sm font-semibold text-foreground flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        Focus style
      </Label>
      <Select value={preferredFocusMode} onValueChange={setPreferredFocusMode}>
        <SelectTrigger id="focus-mode" className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors">
          <SelectValue placeholder="Choose a style" />
        </SelectTrigger>
        <SelectContent>
          {FOCUS_MODES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Due Date */}
    <div className="space-y-2">
      <Label htmlFor="due-date" className="text-sm font-semibold text-foreground flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        Due date
      </Label>
      <Input
        id="due-date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors"
      />
    </div>

    {/* Hobby Link */}
    <div className="space-y-2">
      <Label htmlFor="hobby" className="text-sm font-semibold text-foreground">
        Link to hobby {initialHobbyId && <span className="text-xs text-accent ml-1">✓ Linked</span>}
      </Label>
      <Select value={selectedHobbyId} onValueChange={setSelectedHobbyId}>
        <SelectTrigger id="hobby" className="rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          {hobbies.map((h) => (
            <SelectItem key={h.id} value={h.id.toString()}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Actions */}
    <div className="flex gap-3 pt-4 border-t border-border">
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1 rounded-lg border-border hover:bg-muted/50"
      >
        Cancel
      </Button>
      <Button
        onClick={saveTask}
        disabled={loading || !title.trim()}
        className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      >
        {loading ? "Creating..." : "Create task"}
      </Button>
    </div>
  </div>
)}