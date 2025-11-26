// hobby-tracker.tsx (modified with API calls)
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Snowflake, StickyNote, PlusCircle } from "lucide-react"
import { format } from "date-fns"

interface Hobby {
  id: number
  name: string
  description?: string
  frozen: boolean
  freezeReason?: string
  reminders: string[]
  notes: string[]
  lastActivity?: string
}

export default function HobbyTracker() {
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [newHobbyName, setNewHobbyName] = useState("")
  const [newHobbyDesc, setNewHobbyDesc] = useState("")
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedReminders, setSelectedReminders] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [reminderDate, setReminderDate] = useState("")

  const getToken = () => localStorage.getItem("access_token")

  const fetchHobbies = async () => {
    const token = getToken()
    if (!token) return
    const res = await fetch("/api/hobbies/", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const data = await res.json()
      setHobbies(data)
    }
  }

  const fetchNotes = async (hobbyId: number) => {
    const token = getToken()
    if (!token) return
    const res = await fetch(`/api/notes/?hobby=${hobbyId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const data = await res.json()
      setSelectedNotes(data.map((n: any) => `${new Date(n.created_at).toLocaleString()}: ${n.content}`))
    }
  }

  const fetchReminders = async (hobbyId: number) => {
    const token = getToken()
    if (!token) return
    const res = await fetch(`/api/reminders/?hobby=${hobbyId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const data = await res.json()
      setSelectedReminders(data.map((r: any) => r.reminder_date))
    }
  }

  useEffect(() => {
    fetchHobbies()
  }, [])

  // Add new hobby
  const handleAddHobby = async () => {
    if (!newHobbyName.trim()) return alert("Please enter a hobby name 🎨")

    const token = getToken()
    if (!token) return

    const payload = {
      name: newHobbyName.trim(),
      description: newHobbyDesc.trim(),
      frozen: false,
      freezeReason: "",
    }

    const res = await fetch("/api/hobbies/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      fetchHobbies()
      setNewHobbyName("")
      setNewHobbyDesc("")
    }
  }

  // Freeze or unfreeze a hobby
  const toggleFreeze = async (id: number) => {
    const hobby = hobbies.find((h) => h.id === id)
    if (!hobby) return

    const isFreezing = !hobby.frozen
    let reason = ""
    if (isFreezing) {
      reason = prompt("Why are you freezing this hobby? (optional)") || ""
    }

    const token = getToken()
    if (!token) return

    const res = await fetch(`/api/hobbies/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ frozen: isFreezing, freezeReason: reason }),
    })

    if (res.ok) {
      fetchHobbies()
    }
  }

  // Add note to selected hobby
  const addNote = async () => {
    if (!selectedHobby || !note.trim()) return

    const token = getToken()
    if (!token) return

    const payload = {
      content: note,
      hobby: selectedHobby.id,
    }

    const res = await fetch("/api/notes/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      fetchNotes(selectedHobby.id)
      setNote("")
    }
  }

  // Add reminder to selected hobby
  const addReminder = async () => {
    if (!selectedHobby || !reminderDate) return

    const token = getToken()
    if (!token) return

    const payload = {
      reminder_date: reminderDate,
      hobby: selectedHobby.id,
    }

    const res = await fetch("/api/reminders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      fetchReminders(selectedHobby.id)
      setReminderDate("")
    }
  }

  // Convert hobby to task
  const addToTasks = (hobby: Hobby) => {
    alert(`✅ "${hobby.name}" added to your Tasks list! (You can implement backend linking here.)`)
  }

  const handleSelectHobby = (hobby: Hobby) => {
    setSelectedHobby(hobby)
    fetchNotes(hobby.id)
    fetchReminders(hobby.id)
  }

  return (
    <Card className="bg-white/70 dark:bg-slate-800/60 backdrop-blur border-accent/10 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">🌱 Your Hobbies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Add Hobby */}
        <div className="space-y-3">
          <Input
            placeholder="Hobby name (e.g. painting, learning guitar...)"
            value={newHobbyName}
            onChange={(e) => setNewHobbyName(e.target.value)}
          />
          <Textarea
            placeholder="Describe this hobby — what does it mean to you?"
            value={newHobbyDesc}
            onChange={(e) => setNewHobbyDesc(e.target.value)}
          />
          <Button onClick={handleAddHobby} className="w-full gap-2">
            <PlusCircle size={18} /> Add Hobby
          </Button>
        </div>

        {/* Hobby List */}
        {hobbies.length > 0 && (
          <div className="space-y-4 mt-6">
            {hobbies.map((hobby) => (
              <Card
                key={hobby.id}
                className={`border ${
                  hobby.frozen ? "border-blue-300 bg-blue-50 dark:bg-slate-700/50" : "border-border"
                }`}
              >
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {hobby.name}{" "}
                      {hobby.frozen && <Snowflake className="text-blue-400" size={18} />}
                    </h3>
                    <p className="text-sm text-muted-foreground">{hobby.description}</p>
                    {hobby.freezeReason && (
                      <p className="text-xs text-blue-500 mt-1">🧊 Reason: {hobby.freezeReason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleSelectHobby(hobby)}>
                      Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addToTasks(hobby)}>
                      Add to Tasks
                    </Button>
                    <Switch
                      checked={hobby.frozen}
                      onCheckedChange={() => toggleFreeze(hobby.id)}
                    />
                  </div>
                </CardHeader>

                {/* Hobby details (if selected) */}
                {selectedHobby?.id === hobby.id && (
                  <CardContent className="space-y-4 border-t pt-3">
                    {/* Add Note */}
                    <div className="space-y-2">
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Write a note about your progress, thoughts, or new ideas..."
                      />
                      <Button onClick={addNote} size="sm" className="gap-1">
                        <StickyNote size={16} /> Add Note
                      </Button>
                    </div>

                    {/* Add Reminder */}
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={18} />
                      <Input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full"
                      />
                      <Button size="sm" onClick={addReminder}>
                        Add Reminder
                      </Button>
                    </div>

                    {/* Notes */}
                    {selectedNotes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mt-2 mb-1">📝 Notes</h4>
                        <ul className="space-y-1 text-sm text-foreground/90 max-h-32 overflow-y-auto">
                          {[...selectedNotes].reverse().map((n, i) => (
                            <li key={i} className="p-2 bg-background/50 rounded border text-xs italic">
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reminders */}
                    {selectedReminders.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mt-2 mb-1">⏰ Reminders</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {selectedReminders.map((r, i) => (
                            <li key={i}>🔔 {format(new Date(r), "PPP")}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}