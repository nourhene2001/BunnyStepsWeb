// components/task-creator.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import AuthService from "@/services/authService"

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
    if (selectedHobbyId) payload.related_hobby = selectedHobbyId   // ← Correct field name!

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
    <div className="space-y-5">
      <div>
        <Label>Task Title *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Practice guitar..." autoFocus />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Preferred Focus Mode</Label>
        <Select value={preferredFocusMode} onValueChange={setPreferredFocusMode}>
          <SelectTrigger><SelectValue placeholder="Pomodoro" /></SelectTrigger>
          <SelectContent>
            {FOCUS_MODES.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Due Date</Label>
        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>

      <div>
        <Label>Related Hobby {initialHobbyId && "(auto-linked)"}</Label>
        <Select value={selectedHobbyId} onValueChange={setSelectedHobbyId}>
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {hobbies.map(h => (
              <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={saveTask} disabled={loading || !title.trim()} className="flex-1 bg-emerald-600">
          {loading ? "Saving..." : "Create Task"}
        </Button>
      </div>
    </div>
  )
}