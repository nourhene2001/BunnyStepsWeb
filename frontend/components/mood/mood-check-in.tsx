"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import AuthService from "@/services/authService"
import { toast } from "sonner"

interface MoodOption {
  emoji: string
  label: string
  value: number
  color: string
}

const moods: MoodOption[] = [
  { emoji: "😢", label: "Overwhelmed", value: 1, color: "bg-red-100 dark:bg-red-900/30" },
  { emoji: "😕", label: "Stressed", value: 2, color: "bg-orange-100 dark:bg-orange-900/30" },
  { emoji: "😐", label: "Neutral", value: 3, color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { emoji: "🙂", label: "Good", value: 4, color: "bg-green-100 dark:bg-green-900/30" },
  { emoji: "😄", label: "Excellent", value: 5, color: "bg-blue-100 dark:bg-blue-900/30" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [SelectedLabel, setSelectedLabel] = useState<String | null>(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const token = AuthService.getAccessToken()

const handleCheckIn = async () => {
  if (!selectedMood || !token) return;

  // Find the selected mood object to get the label
  const selectedMoodObj = moods.find(m => m.value === selectedMood);
  if (!selectedMoodObj) return;

  setSaving(true);
  try {
    const payload = {
      mood: selectedMoodObj.label,    // ← Send the string label: "Good", "Stressed", etc.
      rating: selectedMood,           // ← Send the number (1-5)
      note: notes.trim() || "",       // ← Send empty string, not null
    };

    const res = await fetch(`${API_URL}/mood-logs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Response body:", data);

    if (res.ok) {
      toast.success("Mood logged successfully!");
      setSelectedMood(null);
      setNotes("");
      window.dispatchEvent(new Event("mood-updated"));
    } else {
      toast.error("Failed to save mood");
      console.error("Validation errors:", data);
    }
  } catch (err) {
    toast.error("Network error");
    console.error(err);
  } finally {
    setSaving(false);
  }
};

  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-primary/10">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">How are you feeling right now?</h3>
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
              onClick={() => {
  setSelectedMood(mood.value)
  setSelectedLabel(mood.label)
}}

                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selectedMood === mood.value
                
                    ? `border-primary ${mood.color} scale-105 shadow-md`
                    : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <span className="text-4xl mb-2">{mood.emoji}</span>
                <span className="text-xs font-medium">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">What's on your mind?</label>
          <Textarea
            placeholder="Add any notes about your mood (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-background/50 min-h-24"
          />
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={!selectedMood || saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Check-in"}
        </Button>

        {/* Optional: Show today's count (fetched in parent) */}
      </CardContent>
    </Card>
  )
}