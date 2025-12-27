// components/shopping-grid.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AlertCircle, Trash2, Edit, Check, Bell, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import AuthService from "@/services/authService"
import ShoppingCreator from "./ShoppingCreator"

interface ShoppingItem {
  id: string
  name: string
  estimated_cost: number
  expiry_date?: string
  purchased: boolean
  priority: "low" | "medium" | "high"
  item_type: "needed" | "impulsive"
  image?: string
  note?: string
}

interface ShoppingGridProps {
  items: ShoppingItem[]
  onUpdate: () => void
  salaryRemaining: number
}

export default function ShoppingGrid({ items, onUpdate, salaryRemaining }: ShoppingGridProps) {
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reminderDate, setReminderDate] = useState("")
  const [creatorOpen, setCreatorOpen] = useState(false)

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const deleteItem = async (id: string) => {
    if (!confirm("Delete item?")) return
    await fetch(`${API_URL}/api/shopping/items/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    onUpdate()
  }

  const markPurchased = async (id: string) => {
    await fetch(`${API_URL}/api/shopping/items/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purchased: true })
    })
    onUpdate()
  }

  const setReminder = async (id: string) => {
    await fetch(`${API_URL}/api/shopping/items/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ expiry_date: reminderDate })
    })
    setReminderModalOpen(false)
    onUpdate()
  }

  const getPriorityColor = (priority: string) => {
    return priority === "high" ? "bg-red-200 text-red-800" : priority === "medium" ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground">No items in this list yet.</p>
      ) : (
        items.sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || "")).map(item => (
          <Card key={item.id} className={`border-l-4 ${item.item_type === "impulsive" ? "border-pink-400" : "border-blue-400"}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{item.name}</h3>
                {item.image && <img src={item.image} alt="Item" className="w-8 h-8 rounded" />}
              </div>
              <p className="text-lg font-bold">{item.estimated_cost} DT</p>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                <Badge variant="outline">{item.item_type}</Badge>
                {item.note?.includes("almost over") && <Badge variant="secondary">Almost Over</Badge>}
              </div>
              {item.expiry_date && <p className="text-xs text-muted-foreground">Expiry: {format(new Date(item.expiry_date), "MMM d, yyyy")}</p>}
              {item.item_type === "impulsive" && item.estimated_cost > salaryRemaining && (
                <div className="text-red-600 flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4" /> Over budget!
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                {!item.purchased && <Button size="sm" onClick={() => markPurchased(item.id)}><Check className="w-4 mr-1" /> Mark as Purchased</Button>}
                <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setCreatorOpen(true); }}><Edit className="w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setReminderModalOpen(true)}><Bell className="w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Creator Modal */}
      <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
        <DialogContent>
          <ShoppingCreator item={editingItem} onSave={() => { setCreatorOpen(false); onUpdate(); }} />
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Reminder (Expiry Date)</DialogTitle></DialogHeader>
          <Input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
          <Button onClick={() => setReminder(editingItem?.id || "")}>Set</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}