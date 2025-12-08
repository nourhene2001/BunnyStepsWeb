// components/shopping-manager-view.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Plus, Wallet, AlertCircle } from "lucide-react"
import { format, isPast, addDays, isWithinInterval } from "date-fns"
import AuthService from "@/services/authService"
import ShoppingGrid from "./ShoppingGrid"
import ShoppingCreator from "./ShoppingCreator"

interface ShoppingItem {
  id: string
  name: string
  estimated_cost: number
  expiry_date?: string
  purchased: boolean
  priority: "low" | "medium" | "high"
  item_type: "needed" | "impulsive"
  image?: string  // URL if uploaded
  note?: string   // For "almost over"
}

interface Salary {
  amount: number
  received_date: string
  notes?: string
}

export default function ShoppingManagerView() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [salary, setSalary] = useState<Salary | null>(null)
  const [activeTab, setActiveTab] = useState("soon")
  const [salaryModalOpen, setSalaryModalOpen] = useState(false)
  const [newSalaryAmount, setNewSalaryAmount] = useState("")
const [creatorOpen, setCreatorOpen] = useState(false)
const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchItems()
    loadSalary()
  }, [])

  const fetchItems = async () => {
    const res = await fetch(`${API_URL}/api/shopping/items/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setItems(await res.json())
  }

  const loadSalary = () => {
    const saved = localStorage.getItem("bunny_salary")
    if (saved) setSalary(JSON.parse(saved))
  }

  const saveSalary = () => {
    if (!newSalaryAmount || isNaN(Number(newSalaryAmount))) return
    const newSalary = {
      amount: Number(newSalaryAmount),
      received_date: new Date().toISOString(),
      notes: "Monthly salary"
    }
    setSalary(newSalary)
    localStorage.setItem("bunny_salary", JSON.stringify(newSalary))
    setSalaryModalOpen(false)
    setNewSalaryAmount("")
  }

  // Budget calculations
  const totalPlanned = items.filter(i => !i.purchased).reduce((sum, i) => sum + i.estimated_cost, 0)
const totalSpent = items
  .filter(i => i.purchased)
  .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0)  
  const impulsivePlanned = items.filter(i => !i.purchased && i.item_type === "impulsive").reduce((sum, i) => sum + i.estimated_cost, 0)
  const remaining = salary ? salary.amount - totalPlanned : 0
  const overBudget = remaining < 0

  // Filtered lists
  const soonItems = items.filter(i => !i.purchased && i.expiry_date && isWithinInterval(new Date(i.expiry_date), { start: new Date(), end: addDays(new Date(), 7) }) || i.note?.includes("almost over"))
  const actualItems = items.filter(i => !i.purchased && (i.expiry_date && isPast(new Date(i.expiry_date)) || i.priority === "high"))
  const impulsiveItems = items.filter(i => !i.purchased && i.item_type === "impulsive")
  const purchasedItems = items.filter(i => i.purchased)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
{/* Header */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-foreground">Shopping Manager</h1>
    <p className="text-muted-foreground mt-1">Track your needs, impulses, and budget</p>
  </div>

  <div className="flex gap-3">
    {/* Add Item Button */}
    <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
          <Plus className="w-6 h-6 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Shopping Item" : "New Shopping Item"}</DialogTitle>
        </DialogHeader>
        <ShoppingCreator 
          item={editingItem || undefined} 
          onSave={() => {
            setCreatorOpen(false)
            setEditingItem(null)
            fetchItems()
          }} 
        />
      </DialogContent>
    </Dialog>

    {/* Salary Button */}
    <Dialog open={salaryModalOpen} onOpenChange={setSalaryModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Wallet className="w-5 h-5 mr-2" />
          {salary ? `${salary.amount} DT` : "Set Salary"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Set Monthly Salary (DT)</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input 
            type="number" 
            placeholder="e.g. 2500" 
            value={newSalaryAmount} 
            onChange={e => setNewSalaryAmount(e.target.value)} 
          />
          <Button onClick={saveSalary} className="w-full">Save Salary</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</div>

      {/* Budget Overview */}
      {salary && (
        <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-pink-200">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Salary</p>
              <p className="text-2xl font-bold">{salary.amount} DT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planned</p>
              <p className="text-2xl font-bold text-orange-600">{totalPlanned} DT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-red-600">{totalSpent} DT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>{remaining} DT</p>
            </div>
          </CardContent>
        </Card>
      )}

      {overBudget && (
        <div className="bg-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-6 h-6" />
          <div>Over budget! Review impulsive items.</div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="soon">Buy Soon</TabsTrigger>
          <TabsTrigger value="actual">Actual List</TabsTrigger>
          <TabsTrigger value="impulsive">Impulsive</TabsTrigger>
          <TabsTrigger value="purchased">Purchased</TabsTrigger>
          <TabsTrigger value="all">All Items</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <ShoppingGrid 
            items={activeTab === "soon" ? soonItems : activeTab === "actual" ? actualItems : activeTab === "impulsive" ? impulsiveItems : activeTab === "purchased" ? purchasedItems : items} 
            onUpdate={fetchItems} 
            salaryRemaining={remaining} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}