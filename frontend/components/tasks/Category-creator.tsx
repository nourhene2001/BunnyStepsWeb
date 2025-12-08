"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AuthService from "@/services/authService"
import { Task, Hobby,Category } from "./types"   // ← Import shared types

  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CATCreatorProps {
  onClose: () => void
}

export default function CategoryCreator({ onClose }: CATCreatorProps) {
  const [description, setDescription] = useState("")
  const [catColor, setCatColor] = useState("#f0abfc" )
  const [catName, setCatName] = useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/api/categories/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setCategories(await res.json())
  }

  const addCategory = async () => {
    if (!catName.trim()) return
    await fetch(`${API_URL}/api/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: catName, color: catColor }),
    })
    
  }
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold mb-2 block">category Name *</label>
        <Input
          placeholder="What do you need to do?"
          value={catName}
          onChange={(e) => setCatName(e.target.value)}
          className="bg-background/80"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">Description</label>
        <Textarea
          placeholder="Add any details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background/80 min-h-20"
        />
      </div>


     <div className="flex gap-3">
                <label className="text-sm font-semibold mb-2 block">Choose a color for this category</label>

                <Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-20" />
    </div>


   

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={addCategory} className="bg-primary hover:bg-primary/90">
          Create Task
        </Button>
      </div>
    </div>
  )
}
