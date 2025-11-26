// app/dashboard/money-tracker.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Plus, Trash2, Edit2, Check, Wallet } from "lucide-react"
import { format } from "date-fns"

interface ShoppingItem {
  id: number
  name: string
  estimated_cost: number
  expiry_date?: string
  purchased: boolean
  priority: "low" | "medium" | "high"
  type: "needed" | "impulsive"
}

interface Salary {
  amount: number
  received_date: string
  notes?: string
}

export default function MoneyTracker() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [salary, setSalary] = useState<Salary | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newItemCost, setNewItemCost] = useState("")
  const [newItemExpiry, setNewItemExpiry] = useState("")
  const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">("medium")
  const [newItemType, setNewItemType] = useState<"needed" | "impulsive">("needed")

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // Fetch shopping items
  const fetchItems = async () => {
    if (!token) return
    const res = await fetch("/api/shopping-items/", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setItems(data)
    }
  }

  // Fetch salary (you can store it in localStorage or a dedicated endpoint later)
  const loadSalary = () => {
    const saved = localStorage.getItem("bunny_salary")
    if (saved) setSalary(JSON.parse(saved))
  }

  useEffect(() => {
    fetchItems()
    loadSalary()
  }, [])

  const addItem = async () => {
    if (!newItemName || !newItemCost) return

    const payload = {
      name: newItemName,
      estimated_cost: Number(newItemCost),
      expiry_date: newItemExpiry || null,
      priority: newItemPriority,
      type: newItemType,
      purchased: false,
    }

    const res = await fetch("/api/shopping-items/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token!}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const item = await res.json()
      setItems([...items, item])
      setNewItemName("")
      setNewItemCost("")
      setNewItemExpiry("")
    }
  }

  const togglePurchased = async (id: number) => {
    const res = await fetch(`/api/shopping-items/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token!}`,
      },
      body: JSON.stringify({ purchased: true }),
    })

    if (res.ok) {
      setItems(items.map(i => i.id === id ? { ...i, purchased: true } : i))
    }
  }

  const deleteItem = async (id: number) => {
    await fetch(`/api/shopping-items/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token!}` },
    })
    setItems(items.filter(i => i.id !== id))
  }

  const saveSalary = () => {
    const amount = prompt("Enter your monthly salary (DT):")
    if (amount && !isNaN(Number(amount))) {
      const newSalary = {
        amount: Number(amount),
        received_date: new Date().toISOString().split("T")[0],
        notes: "Monthly salary"
      }
      setSalary(newSalary)
      localStorage.setItem("bunny_salary", JSON.stringify(newSalary))
    }
  }

  const totalPlanned = items
    .filter(i => !i.purchased)
    .reduce((sum, i) => sum + i.estimated_cost, 0)

  const totalSpent = items
    .filter(i => i.purchased)
    .reduce((sum, i) => sum + i.estimated_cost, 0)

  const remaining = salary ? salary.amount - totalPlanned : null
  const overBudget = remaining !== null && remaining < 0

  return (
    <div className="space-y-6">
      {/* Salary Card */}
      <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Monthly Budget
          </CardTitle>
          <Button onClick={saveSalary} size="sm" variant="secondary">
            {salary ? "Edit Salary" : "Set Salary"}
          </Button>
        </CardHeader>
        <CardContent>
          {salary ? (
            <div className="text-3xl font-bold text-purple-700">
              {salary.amount.toLocaleString()} DT
              <p className="text-sm text-muted-foreground mt-1">
                Received on {format(new Date(salary.received_date), "dd MMM yyyy")}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No salary set yet. Click above to add!</p>
          )}
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {salary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Planned Spending</p>
              <p className="text-2xl font-bold text-orange-600">{totalPlanned} DT</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Already Spent</p>
              <p className="text-2xl font-bold text-red-600">{totalSpent} DT</p>
            </CardContent>
          </Card>
          <Card className={overBudget ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${overBudget ? "text-red-700" : "text-green-700"}`}>
                {remaining?.toLocaleString()} DT
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Over Budget Warning */}
      {overBudget && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-xl flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <strong>Warning!</strong> You're planning to spend more than your salary!
            <br />
            <small>Consider freezing some impulsive items</small>
          </div>
        </div>
      )}

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Item name (e.g. new headphones)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Estimated cost (DT)"
              value={newItemCost}
              onChange={(e) => setNewItemCost(e.target.value)}
            />
          </div>

          <Input
            type="date"
            value={newItemExpiry}
            onChange={(e) => setNewItemExpiry(e.target.value)}
            placeholder="Expiry / Want by (optional)"
          />

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label>Type:</Label>
              <Button
                size="sm"
                variant={newItemType === "needed" ? "default" : "outline"}
                onClick={() => setNewItemType("needed")}
              >
                Needed
              </Button>
              <Button
                size="sm"
                variant={newItemType === "impulsive" ? "default" : "outline"}
                onClick={() => setNewItemType("impulsive")}
              >
                Impulsive
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label>Priority:</Label>
              {(["low", "medium", "high"] as const).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={newItemPriority === p ? "default" : "outline"}
                  onClick={() => setNewItemPriority(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={addItem} className="w-full bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" /> Add to List
          </Button>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">Shopping List</h3>
        {items.filter(i => !i.purchased).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No items yet! You're all set</p>
        ) : (
          items
            .filter(i => !i.purchased)
            .map(item => (
              <Card key={item.id} className={`border-l-4 ${
                item.type === "impulsive" ? "border-pink-400" : "border-blue-400"
              }`}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-2xl font-bold text-pink-600">{item.estimated_cost} DT</p>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span className={`px-2 py-1 rounded-full ${
                        item.priority === "high" ? "bg-red-100 text-red-700" :
                        item.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {item.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        item.type === "impulsive" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.type}
                      </span>
                      {item.expiry_date && (
                        <span>Exp: {format(new Date(item.expiry_date), "dd MMM")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => togglePurchased(item.id)}>
                      Bought
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Purchased Items */}
      {items.some(i => i.purchased) && (
        <>
          <h3 className="text-xl font-bold text-muted-foreground">Purchased</h3>
          <div className="space-y-2">
            {items.filter(i => i.purchased).map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-muted-foreground">
                <s>{item.name} — {item.estimated_cost} DT</s>
                <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}