// app/tasks/types.ts
export interface Hobby {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  description?: string
  completed?: boolean
  status: "todo" | "in_progress" | "done" | "today" | "Soon" |"urgent"
  priority: "low" | "medium" | "high" | "urgent"
  category?: Category | null
  due_date?: string
  preferred_focus_mode?: string
  frozen?: boolean
  reminder?: { id: string; reminder_date: string }
  shopping_item?: { id: string; name: string; estimated_cost: number }
  hobby?: { id: string; name: string }

}
export interface Category { id: string; name: string; color?: string }
