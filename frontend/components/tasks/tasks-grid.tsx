"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronRight, Trash2 } from "lucide-react"
import { useState } from "react"

interface Task {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  category: string
  completed: boolean
  dueDate?: string
}

interface TasksGridProps {
  category: string
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review project proposal",
    description: "Check the new design mockups",
    priority: "high",
    category: "work",
    completed: false,
    dueDate: "2025-11-11",
  },
  {
    id: "2",
    title: "Morning meditation",
    priority: "medium",
    category: "health",
    completed: false,
  },
  {
    id: "3",
    title: "Update documentation",
    priority: "low",
    category: "work",
    completed: true,
  },
]

export default function TasksGrid({ category }: TasksGridProps) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)

  const filteredTasks = tasks.filter((task) => {
    if (category === "completed") return task.completed
    if (category === "all") return true
    if (category === "today") return !task.completed
    if (category === "upcoming") return !task.completed
    return true
  })

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    }
    return colors[priority as keyof typeof colors] || ""
  }

  if (filteredTasks.length === 0) {
    return (
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-muted">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No tasks in this category</p>
          <Button variant="outline" size="sm">
            Create one now
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTasks.map((task) => (
        <Card
          key={task.id}
          className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10 cursor-pointer hover:border-primary/30 transition-colors ${
            task.completed ? "opacity-60" : ""
          }`}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="mt-1" />
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
            </div>

            {task.dueDate && <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
