"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@radix-ui/react-checkbox"
import { Edit, Trash2, Sparkles, Snowflake, Bell, DollarSign, Lock, Clock, MoreHorizontal, ChevronRight } from "lucide-react"
import { format, parseISO } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Task, Category } from "../tasks/types"
import AuthService from "@/services/authService"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const token = AuthService.getAccessToken()

type TaskWithAnimation = Task & {
  justCompleted?: boolean
}

function SortableTaskCard({
  task,
  onComplete,
  onDelete,
  onEdit,
  onStart,
  onStartFocus,
  onFreeze,
  onReminderOpen,
  onShoppingOpen,
  categories,
}: {
  task: TaskWithAnimation
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onStart: (task: Task) => void
  onStartFocus: (task: Task) => void
  onFreeze: (id: string, freeze: boolean) => void
  onReminderOpen: (task: Task) => void
  onShoppingOpen: (task: Task) => void
  categories: Category[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: "bg-pink-100 text-pink-700",
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

return (
  <motion.div
    ref={setNodeRef}
    style={style}
    {...attributes}
    {...listeners}
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="cursor-grab active:cursor-grabbing touch-none"
  >
    <Card
      className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm overflow-hidden min-h-[100px] flex flex-col justify-between relative"
    >
      <CardContent className="pt-2 pb-2 space-y-5">
        {/* Top Right Menu */}
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/80"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onReminderOpen(task)}>
                <Bell className="mr-2 h-4 w-4" /> Set Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShoppingOpen(task)}>
                <DollarSign className="mr-2 h-4 w-4" /> Add to Shopping
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Checkbox */}
        <div className="flex items-start gap-4 pr-10">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => !task.completed && onComplete(task.id)}
            className="mt-1 h-5 w-5 border-2 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-lg break-words flex items-center gap-2 ${
                task.completed
                  ? "text-muted-foreground line-through opacity-70"
                  : "text-foreground"
              }`}
            >
              {task.title}
              {task.frozen && (
                <Snowflake className="w-4 h-4 text-accent animate-pulse" />
              )}
            </h3>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {task.category && (
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${task.category.color}20`,
                color: task.category.color,
                borderColor: task.category.color + "40",
              }}
              className="border"
            >
              {task.category.name} 
            </Badge>
          )}
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority.toUpperCase()}
          </Badge>
          {task.status === "in_progress" && !task.completed && (
            <Badge className="bg-primary/10 text-primary">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              In Progress
            </Badge>
          )}
        </div>

        {/* Due Date */}
        {task.due_date && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Due: <span className="font-medium">{format(parseISO(task.due_date), "MMM d, yyyy")}</span>
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-4 border-t border-border">
          {task.status === "todo" && !task.completed && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={(e) => {
                e.stopPropagation()
                onStart(task)
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Start
            </Button>
          )}

          {!task.completed && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation()
                onStartFocus(task)
              }}
            >
              <Lock className="w-4 h-4 mr-1.5" /> Lock In
            </Button>
          )}

          {!task.completed && (
            task.frozen ? (
              <Button
                size="sm"
                variant="outline"
                className="border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
                onClick={() => onFreeze(task.id, false)}
              >
                <Snowflake className="w-4 h-4 mr-1.5" /> Unfreeze
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-accent hover:bg-accent/10"
                onClick={() => onFreeze(task.id, true)}
              >
                <Snowflake className="w-4 h-4" />
              </Button>
            )
          )}
        </div>
      </CardContent>

      {/* Celebration Animation */}
      <AnimatePresence>
        {task.justCompleted && (
          <motion.div
            initial={{ y: -120, opacity: 0, scale: 0.6 }}
            animate={{ y: -20, opacity: 1, scale: 1 }}
            exit={{ y: -200, opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-10"
          >
            <motion.img
              src="/bunny-hop.png"
              alt="Celebrating bunny!"
              className="w-28 h-28 drop-shadow-2xl"
              animate={{ y: [0, -40, -20, -50, -30], rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 1.6, times: [0, 0.2, 0.4, 0.7, 1], ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  </motion.div>
)}

export default function ReorderableTaskList({
  tasks,
  categories,
  onRefresh,
  onEdit,
  onStart,
}: {
  tasks: Task[]
  categories: Category[]
  onRefresh: () => void
  onEdit: (task: Task) => void
  onStart: (task: Task) => void
}) {
  const [items, setItems] = useState<TaskWithAnimation[]>([])

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false)
  const [reminderDate, setReminderDate] = useState("")
  const [shoppingName, setShoppingName] = useState("")
  const [shoppingCost, setShoppingCost] = useState("")

  useEffect(() => {
    setItems(tasks.map((task) => ({ ...task, justCompleted: false })))
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((current) => {
        const oldIndex = current.findIndex((i) => i.id === active.id)
        const newIndex = current.findIndex((i) => i.id === over.id)
        return arrayMove(current, oldIndex, newIndex)
      })
    }
  }

  const handleComplete = async (id: string) => {
    try {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
      const res = await fetch(`${API_URL}/tasks/${id}/complete/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Amazing work! +XP & coins!")

      setItems((current) =>
        current.map((t) => (t.id === id ? { ...t, justCompleted: true } : t))
      )
      setTimeout(() => {
        setItems((current) =>
          current.map((t) => (t.id === id ? { ...t, justCompleted: false } : t))
        )
      }, 2000)

      onRefresh()
    } catch {
      toast.error("Could not complete task")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete forever?")) return
    await fetch(`${API_URL}/tasks/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    onRefresh()
  }

  const handleStart = async (task: Task) => {
    if (task.status !== "todo" || task.frozen) {
      toast.error("Cannot start this task")
      return
    }
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
    } catch {
      toast.error("Could not start task")
    }
  }

  const handleStartFocus = async (task: Task) => {
    if (task.status !== "todo" || task.frozen) {
      toast.error("Cannot start this task")
      return
    }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      const res = await fetch(`${API_URL}/tasks/${task.id}/start/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      toast.success("Locked in! Let's focus!")
      onRefresh()
      window.location.href = `/focus?taskId=${task.id}&mode=${data.focus_mode}`
    } catch {
      toast.error("Could not lock in")
    }
  }

  const handleFreeze = async (id: string, freeze: boolean) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}/toggle_freeze/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      toast.success(freeze ? "Task frozen ❄️" : "Task unfrozen ✅")
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update")
    }
  }

  const handleReminderOpen = (task: Task) => {
    setEditingTask(task)
    setReminderModalOpen(true)
  }

  const handleShoppingOpen = (task: Task) => {
    setEditingTask(task)
    setShoppingModalOpen(true)
  }

  const setReminder = async (id: string) => {
    if (!reminderDate) return toast.error("Pick a reminder time!")
    try {
      await fetch(`${API_URL}/reminders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task: id, reminder_date: reminderDate }),
      })
      toast.success("Reminder set! 🔔")
      setReminderModalOpen(false)
      setReminderDate("")
      onRefresh()
    } catch {
      toast.error("Failed to set reminder")
    }
  }

  const addShoppingItem = async (id: string) => {
    if (!shoppingName || !shoppingCost) return toast.error("Add item name & cost!")
    try {
      await fetch(`${API_URL}/shopping-items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: shoppingName,
          estimated_cost: Number(shoppingCost),
          task: id,
        }),
      })
      toast.success("Added to shopping list! 🛒")
      setShoppingModalOpen(false)
      setShoppingName("")
      setShoppingCost("")
      onRefresh()
    } catch {
      toast.error("Failed to add shopping item")
    }
  }

return (
  <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {items.length === 0 ? (
            <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card/95 backdrop-blur-sm overflow-hidden text-center py-16">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">All clear for now!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                No tasks here yet. Take a breather or add something new!
              </p>
            </Card>
          ) : (
            items.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                categories={categories}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={onEdit}
                onStart={handleStart}
                onStartFocus={handleStartFocus}
                onFreeze={handleFreeze}
                onReminderOpen={handleReminderOpen}
                onShoppingOpen={handleShoppingOpen}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>

    {/* Reminder Modal */}
    <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <Input
            type="datetime-local"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
          />
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={() => editingTask && setReminder(editingTask.id)}
          >
            Set Reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Shopping Modal */}
    <Dialog open={shoppingModalOpen} onOpenChange={setShoppingModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cost to Shopping List</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <Input
            placeholder="Item name"
            value={shoppingName}
            onChange={(e) => setShoppingName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Estimated cost"
            value={shoppingCost}
            onChange={(e) => setShoppingCost(e.target.value)}
          />
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={() => editingTask && addShoppingItem(editingTask.id)}
          >
            Add to Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
)}