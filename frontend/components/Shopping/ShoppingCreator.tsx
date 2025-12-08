// components/shopping-creator.tsx
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
    <div className="space-y-4">
      <Input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} />
      <Input type="number" placeholder="Estimated cost (DT)" value={cost} onChange={e => setCost(e.target.value)} />
      <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="Expiry / Want by" />

      <div className="flex gap-4">
        <div>
          <Label>Type</Label>
          <Select value={itemType} onValueChange={v => setItemType(v as "needed" | "impulsive")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="needed">Needed</SelectItem>
              <SelectItem value="impulsive">Impulsive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={v => setPriority(v as "low" | "medium" | "high")}>
            <SelectTrigger>
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

      <div className="flex items-center gap-2">
        <Checkbox checked={aboutToExpire} onCheckedChange={setAboutToExpire as any} />
        <Label>Mark as about to expire</Label>
      </div>

      <div>
        <Label>Upload Picture (e.g., expiring item)</Label>
        <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
      </div>

      <Button onClick={saveItem} className="w-full">{item ? "Update" : "Add"} Item</Button>
    </div>
  )
}