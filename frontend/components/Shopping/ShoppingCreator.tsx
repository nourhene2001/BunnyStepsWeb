"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import AuthService from "@/services/authService"

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

interface ShoppingCreatorProps {
  item?: ShoppingItem | null
  onSave: () => void
}

export default function ShoppingCreator({ item, onSave }: ShoppingCreatorProps) {
  const [name, setName] = useState(item?.name || "")
  const [cost, setCost] = useState(item?.estimated_cost.toString() || "")
  const [expiry, setExpiry] = useState(item?.expiry_date || "")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(item?.priority || "medium")
  const [itemType, setItemType] = useState<"needed" | "impulsive">(item?.item_type || "needed")
  const [aboutToExpire, setAboutToExpire] = useState(!!item?.note?.includes("almost over"))
  const [imageFile, setImageFile] = useState<File | null>(null)

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const saveItem = async () => {
    const form = new FormData()
    form.append("name", name)
    form.append("estimated_cost", cost)
    form.append("priority", priority)
    form.append("item_type", itemType)
    if (expiry) form.append("expiry_date", expiry)
    form.append("note", aboutToExpire ? "almost over" : "")
    if (imageFile) form.append("image", imageFile)

    const url = item ? `${API_URL}/api/shopping/items/${item.id}/` : `${API_URL}/api/shopping/items/`
    const method = item ? "PATCH" : "POST"

    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    onSave()
  }
return (
  <div className="space-y-6">
    {/* Item Name */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Item Name</Label>
      <Input
        placeholder="e.g., New laptop"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors"
      />
    </div>

    {/* Estimated Cost */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Estimated Cost</Label>
      <Input
        type="number"
        placeholder="e.g., 1200"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors"
      />
    </div>

    {/* Expiry Date */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Expiry Date (optional)</Label>
      <Input
        type="date"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
        className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors"
      />
    </div>

    {/* Type & Priority */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Type</Label>
        <Select value={itemType} onValueChange={(v) => setItemType(v as "needed" | "impulsive")}>
          <SelectTrigger className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="needed">Needed</SelectItem>
            <SelectItem value="impulsive">Impulsive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Priority</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
          <SelectTrigger className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* About to Expire */}
    <div className="flex items-center gap-3">
      <Checkbox
        checked={aboutToExpire}
        onCheckedChange={setAboutToExpire as any}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <Label className="text-sm font-medium text-foreground cursor-pointer">Mark as about to expire</Label>
    </div>

    {/* Upload Photo */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Upload Photo (optional)</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="h-12 rounded-xl border-border focus:border-ring focus:ring-ring/50 bg-muted/30 hover:bg-muted/50 transition-colors"
      />
    </div>

    {/* Save Button */}
    <Button
      onClick={saveItem}
      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-sm"
    >
      {item ? "Update Item" : "Add Item"}
    </Button>
  </div>
)}