"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import AuthService from "@/services/authService"
import { Category } from "./types"

const token = AuthService.getAccessToken()
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CATCreatorProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function CategoryCreator({ onClose, onSuccess }: CATCreatorProps) {
  const [description, setDescription] = useState("")
  const [catColor, setCatColor] = useState("#c4b5fd")
  const [catName, setCatName] = useState("")

  const addCategory = async () => {
    if (!catName.trim()) return

    const res = await fetch(`${API_URL}/api/categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: catName.trim(),
        color: catColor,
        description: description.trim() || null,
      }),
    })

    if (res.ok) {
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Category Name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g., Work, Health, Personal"
          value={catName}
          onChange={(e) => setCatName(e.target.value)}
          className="h-12 text-base border-input focus:border-ring focus:ring-ring/50 rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Description (optional)
        </label>
        <Textarea
          placeholder="Add details about this category..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-32 text-base border-input focus:border-ring focus:ring-ring/50 rounded-xl resize-none"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-xl">
        <label className="text-sm font-medium text-foreground whitespace-nowrap">
          Category Color
        </label>
        <Input
          type="color"
          value={catColor}
          onChange={(e) => setCatColor(e.target.value)}
          className="w-16 h-16 cursor-pointer border-2 border-border rounded-lg hover:border-ring transition-colors"
        />
        <span className="text-sm font-mono text-muted-foreground bg-card px-3 py-1 rounded border">
          {catColor}
        </span>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={onClose}
          className="h-12 px-8 border-border hover:bg-muted/50"
        >
          Cancel
        </Button>
        <Button
          onClick={addCategory}
          disabled={!catName.trim()}
          className="h-12 px-8 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium"
        >
          Create Category
        </Button>
      </div>
    </div>
  )
}