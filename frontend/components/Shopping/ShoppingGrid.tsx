"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Edit, Check, AlertCircle } from "lucide-react"
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
  const [creatorOpen, setCreatorOpen] = useState(false)

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return
    await fetch(`${API_URL}/api/shopping/items/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      default: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }
return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.length === 0 ? (
      <p className="col-span-full text-center text-lg text-muted-foreground">
        No items yet — take a gentle breath 🌿
      </p>
    ) : (
      items.map((item) => (
        <Card key={item.id} className="border-border hover:shadow-md transition-shadow rounded-2xl">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg text-foreground">{item.name}</h3>
              {item.image && (
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
              )}
            </div>

            <p className="text-2xl font-bold text-foreground">{item.estimated_cost} DT</p>

            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
              <Badge variant="outline">{item.item_type}</Badge>
              {item.note?.includes("almost over") && <Badge variant="secondary">Almost Over</Badge>}
            </div>

            {item.expiry_date && (
              <p className="text-sm text-muted-foreground">
                Expiry: {format(new Date(item.expiry_date), "MMM d, yyyy")}
              </p>
            )}

            {item.item_type === "impulsive" && item.estimated_cost > salaryRemaining && salaryRemaining >= 0 && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Exceeds remaining budget</span>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              {!item.purchased && (
                <Button size="sm" onClick={() => markPurchased(item.id)} className="bg-accent hover:bg-accent/90">
                  <Check className="w-4 h-4 mr-1" /> Purchased
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-muted/50"
                onClick={() => {
                  setEditingItem(item)
                  setCreatorOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteItem(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    )}

    <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <ShoppingCreator item={editingItem} onSave={() => {
          setCreatorOpen(false)
          setEditingItem(null)
          onUpdate()
        }} />
      </DialogContent>
    </Dialog>
  </div>
)
}