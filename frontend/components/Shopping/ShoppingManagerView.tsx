"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Plus, Wallet } from "lucide-react"
import AuthService from "@/services/authService"
import ShoppingGrid from "./ShoppingGrid"
import ShoppingCreator from "./ShoppingCreator"
import { motion } from "framer-motion"
import { Rabbit } from "lucide-react"
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

interface Salary {
  amount: number
  received_date: string
}

export default function ShoppingManagerView() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [salary, setSalary] = useState<Salary | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [salaryModalOpen, setSalaryModalOpen] = useState(false)
  const [newSalaryAmount, setNewSalaryAmount] = useState("")
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)   // ← fixed

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchItems()
    loadSalary()
  }, [])

const fetchItems = async () => {
  setIsLoading(true)

  try {
    const res = await fetch(`${API_URL}/api/shopping/items/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error("Failed to load items")

    const data = await res.json()
    setItems(data)
  } catch (err) {
    console.error(err)
  } finally {
    setIsLoading(false) // 👈 ALWAYS stop loading
  }
}


  const loadSalary = () => {
    const saved = localStorage.getItem("bunny_salary")
    if (saved) setSalary(JSON.parse(saved))
  }

  const saveSalary = () => {
    if (!newSalaryAmount || isNaN(Number(newSalaryAmount))) return
    const newSalary: Salary = {
      amount: Number(newSalaryAmount),
      received_date: new Date().toISOString(),
    }
    setSalary(newSalary)
    localStorage.setItem("bunny_salary", JSON.stringify(newSalary))
    setSalaryModalOpen(false)
    setNewSalaryAmount("")
  }

  const salaryAmount = salary?.amount ?? 0

  // 1️⃣ Total already spent (purchased items)
  const totalSpent = items
    .filter(i => i.purchased)
    .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0)

  // 2️⃣ Total planned (needed but NOT purchased)
  const totalPlanned = items
    .filter(i => !i.purchased && i.item_type === "needed")
    .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0)

  // 3️⃣ Total impulsive (optional, NOT purchased)
  const totalImpulsive = items
    .filter(i => !i.purchased && i.item_type === "impulsive")
    .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0)

  // ✅ ACTUAL remaining (real money right now)
  const actualRemaining = salaryAmount - totalSpent

  // ✅ Remaining after planned needs
  const remaining = actualRemaining - (totalPlanned+totalImpulsive)

  const overBudget = remaining < 0

if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      
      {/* Bunny */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="p-5 rounded-full bg-accent/10"
      >
        <Rabbit className="w-10 h-10 text-accent" />
      </motion.div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">
          Getting things ready…
        </p>
        <p className="text-sm text-muted-foreground">
          Just a tiny moment 🐾
        </p>
      </div>

      {/* Soft dots */}
      <motion.div
        className="flex gap-2 mt-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.2,
              repeat: Infinity,
            },
          },
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-accent/60"
            variants={{
              hidden: { opacity: 0.3 },
              visible: { opacity: 1 },
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}

return (
  <div className="max-w-7xl mx-auto space-y-10 py-10 px-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">
          Shopping Manager
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Mindful spending, one item at a time
        </p>
      </div>

      <div className="flex gap-4">
        <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <ShoppingCreator item={null} onSave={() => {
              setCreatorOpen(false)
              fetchItems()
            }} />
          </DialogContent>
        </Dialog>

        <Dialog open={salaryModalOpen} onOpenChange={setSalaryModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="border-border hover:bg-muted/50">
              <Wallet className="w-5 h-5 mr-2" />
              Set Salary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Monthly Salary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="number"
                placeholder="e.g. 2500"
                value={newSalaryAmount}
                onChange={(e) => setNewSalaryAmount(e.target.value)}
                className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors"
              />
              <Button
                onClick={saveSalary}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
              >
                Save Salary
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

<div className="rounded-2xl border border-border bg-card p-4 space-y-4">

  {/* Small label instead of big header */}
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-muted-foreground">
      Money overview
    </p>
  </div>

  {/* ACTUAL REMAINING – primary focus */}
  <div className="flex items-center justify-between rounded-xl border border-[color:var(--chart-4)]/40 bg-[color:var(--chart-4)]/10 p-4">
    <div>
      <p className="text-sm font-medium text-foreground">
        Available now
      </p>
      <p className="text-xs text-muted-foreground">
        After purchased items
      </p>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {actualRemaining.toFixed(2)} DT
    </p>
  </div>

  {/* BREAKDOWN */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

    {/* PLANNED */}
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Planned essentials
      </p>
      <p className="text-lg font-semibold text-[color:var(--secondary)]">
        − {totalPlanned.toFixed(2)} DT
      </p>
    </div>

    {/* OPTIONAL */}
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Optional items
      </p>
      <p className="text-lg font-semibold text-[color:var(--accent)]">
        − {totalImpulsive.toFixed(2)} DT
      </p>
    </div>

  </div>

  {/* PROJECTION – secondary */}
  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-3">
    <p className="text-sm text-muted-foreground">
      After planned spending
    </p>
    <p className="text-lg font-semibold text-muted-foreground">
      {remaining.toFixed(2)} DT
    </p>
  </div>

</div>


    {/* Over Budget Alert */}
    {overBudget && (
      <Card className="border-destructive/30 bg-destructive/10 rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <AlertTriangle className="w-7 h-7 text-destructive" />
          <div>
            <CardTitle className="text-xl text-destructive">Over Budget</CardTitle>
            <p className="text-destructive-foreground mt-1">
              Consider reviewing impulsive items or adjusting your plans.
            </p>
          </div>
        </CardHeader>
      </Card>
    )}

    {/* Tabs */}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full h-14 bg-muted/40 rounded-2xl p-2 gap-2">
        <TabsTrigger
          value="all"
          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
        >
          All
        </TabsTrigger>
        <TabsTrigger
          value="needed"
          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
        >
          Needs
        </TabsTrigger>
        <TabsTrigger
          value="impulsive"
          className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
        >
          Wants
        </TabsTrigger>
        <TabsTrigger
          value="purchased"
          className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
        >
          Purchased
        </TabsTrigger>
        <TabsTrigger
          value="expiring"
          className="rounded-xl data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-md hover:bg-muted/60 transition-all"
        >
          Expiring Soon
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-10">
        <ShoppingGrid
          items={
            activeTab === "needed" ? items.filter(i => i.item_type === "needed" && !i.purchased) :
            activeTab === "impulsive" ? items.filter(i => i.item_type === "impulsive" && !i.purchased) :
            activeTab === "purchased" ? items.filter(i => i.purchased) :
            activeTab === "expiring" ? items.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date(Date.now() + 7*24*60*60*1000) && !i.purchased) :
            items
          }
          onUpdate={fetchItems}
          salaryRemaining={remaining}
        />
      </TabsContent>
    </Tabs>
  </div>
)}