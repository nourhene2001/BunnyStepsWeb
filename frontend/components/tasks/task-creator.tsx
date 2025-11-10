"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TaskCreatorProps {
  onClose: () => void
}

export default function TaskCreator({ onClose }: TaskCreatorProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("work")
  const [dueDate, setDueDate] = useState("")

  const handleSubmit = () => {
    if (title.trim()) {
      // TODO: Add task to state/database
      console.log({ title, description, priority, category, dueDate })
      onClose()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold mb-2 block">Task Title *</label>
        <Input
          placeholder="What do you need to do?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-background/80"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">Description</label>
        <Textarea
          placeholder="Add any details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background/80 min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">Due Date</label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background/80" />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
          Create Task
        </Button>
      </div>
    </div>
  )
}
