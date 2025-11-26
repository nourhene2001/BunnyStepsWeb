"use client"

import { useState, useEffect, ChangeEvent, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Image as ImageIcon, Mic, Edit, X } from "lucide-react"
import { groupBy } from "lodash"
import AuthService from "@/services/authService"

interface Category {
  id: string
  name: string
  color?: string
  extra_schema?: Record<string, string>
}

interface Task {
  id: string
  title: string
  description?: string
  completed?: boolean
  priority: "low" | "medium" | "high" | "urgent"
  category?: Category | null
  estimated_minutes?: number
  preferred_datetime?: string
  due_date?: string
  recurrence_rule?: string
  custom_fields?: Record<string, any>
  image?: string
  voice_note?: string
  frozen?: boolean
  archived?: boolean
}

export default function TaskList() {
  /* ---------- Global state ---------- */
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [grouping, setGrouping] = useState<"none" | "priority" | "category">("none")

  /* ---------- Task form state ---------- */
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">("")
  const [preferredDatetime, setPreferredDatetime] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [recurrenceRule, setRecurrenceRule] = useState("")
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)

  /* ---------- Voice recording ---------- */
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  /* ---------- Category modal state ---------- */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState("")

  // Dynamic extra fields: [{ key: string, type: string }]
  const [extraFields, setExtraFields] = useState<{ id: string; key: string; type: string }[]>([])

  /* ---------- Lifecycle ---------- */
  useEffect(() => {
    setMounted(true)
    fetchTasks()
    fetchCategories()
  }, [])

  /* ---------- API helpers ---------- */
const fetchTasks = async () => {
  try {
    const token = AuthService.getAccessToken();


    const res = await fetch("http://localhost:8000/api/tasks/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
  }
};

const fetchCategories = async () => {
  try {
     const token = AuthService.getAccessToken();


    const res = await fetch("http://localhost:8000/api/categories/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
  }
};


  /* ---------- Category CRUD ---------- */
  const resetCatForm = () => {
    setEditingCat(null)
    setCatName("")
    setCatColor("")
    setExtraFields([])
  }

const openEditCat = (cat: Category) => {
  setEditingCat(cat)
  setCatName(cat.name)
  setCatColor(cat.color ?? "")

  // Convert saved schema → array with stable IDs
  setExtraFields(
    cat.extra_schema
      ? Object.entries(cat.extra_schema).map(([key, type]) => ({
          id: crypto.randomUUID(),
          key,
          type,
        }))
      : []
  )

  setCatModalOpen(true)
}


const addExtraField = () => {
  setExtraFields(prev => [
    ...prev,
    { id: crypto.randomUUID(), key: "", type: "string" }
  ])
}


  const updateExtraField = (index: number, field: "key" | "type", value: string) => {
    setExtraFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    )
  }

  const removeExtraField = (index: number) => {
    setExtraFields((prev) => prev.filter((_, i) => i !== index))
  }

  const buildExtraSchema = (): Record<string, string> => {
    const schema: Record<string, string> = {}
    extraFields.forEach((f) => {
      if (f.key.trim()) {
        schema[f.key.trim()] = f.type
      }
    })
    return schema
  }

 const saveCategory = async () => {
  if (!catName.trim()) return;

   const token = AuthService.getAccessToken();


  const payload: any = {
    name: catName,
    color: catColor || undefined,
    extra_schema: buildExtraSchema(),
  };

  const method = editingCat ? "PATCH" : "POST";
  const url = editingCat
    ? `http://localhost:8000/api/categories/${editingCat.id}/`
    : "http://localhost:8000/api/categories/";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,      // 🔥 FIX
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Unauthorized");

    const saved = await res.json();

    if (editingCat) {
      setCategories((prev) =>
        prev.map((c) => (c.id === saved.id ? saved : c))
      );
    } else {
      setCategories((prev) => [...prev, saved]);
    }

    resetCatForm();
    setCatModalOpen(false);
  } catch (e) {
    console.error(e);
  }
};

const deleteCategory = async (cat: Category) => {
  if (!confirm(`Delete "${cat.name}"?`)) return;

   const token = AuthService.getAccessToken();


  try {
    const res = await fetch(
      `http://localhost:8000/api/categories/${cat.id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,  // 🔥 FIX
        },
      }
    );

    if (!res.ok) throw new Error("Unauthorized");

    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (selectedCategoryId === cat.id) setSelectedCategoryId(null);
  } catch (e) {
    console.error(e);
  }
};

  /* ---------- Task form helpers ---------- */
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    const cat = categories.find((c) => c.id === value)
    if (cat?.extra_schema) {
      const init: Record<string, any> = {}
      Object.keys(cat.extra_schema).forEach((k) => (init[k] = ""))
      setCustomFields(init)
    } else {
      setCustomFields({})
    }
  }

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomFields((prev) => ({ ...prev, [key]: value }))
  }

  /* ---------- Voice recording ---------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setVoiceFile(new File([blob], "voice_note.webm", { type: "audio/webm" }))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (e) {
      console.error(e)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageFile(e.target.files[0])
  }

  /* ---------- Add task ---------- */
 const addTask = async () => {
  if (!title.trim()) return;

   const token = AuthService.getAccessToken();


  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("priority", priority);
  if (selectedCategoryId) form.append("category", selectedCategoryId);
  if (estimatedMinutes) form.append("estimated_minutes", estimatedMinutes.toString());
  if (preferredDatetime) form.append("preferred_datetime", preferredDatetime);
  if (dueDate) form.append("due_date", dueDate);
  if (recurrenceRule) form.append("recurrence_rule", recurrenceRule);
  form.append("custom_fields", JSON.stringify(customFields));
  form.append("completed", "false");
  if (imageFile) form.append("image", imageFile);
  if (voiceFile) form.append("voice_note", voiceFile);

  try {
    const res = await fetch("http://localhost:8000/api/tasks/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,   // 🔥 FIX
      },
      body: form,
    });

    const data = await res.json();
    setTasks((prev) => [...prev, data]);

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedCategoryId(null);
    setPriority("medium");
    setEstimatedMinutes("");
    setPreferredDatetime("");
    setDueDate("");
    setRecurrenceRule("");
    setCustomFields({});
    setImageFile(null);
    setVoiceFile(null);
  } catch (e) {
    console.error(e);
  }
};

  /* ---------- Task actions ---------- */
 const toggleTask = async (id: string) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

   const token = AuthService.getAccessToken();


  try {
    const res = await fetch(`http://localhost:8000/api/tasks/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,  // 🔥 FIX
      },
      body: JSON.stringify({ completed: !task.completed }),
    });

    const upd = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? upd : t)));
  } catch (e) {
    console.error(e);
  }
};


const deleteTask = async (id: string) => {
   const token = AuthService.getAccessToken();


  try {
    await fetch(`http://localhost:8000/api/tasks/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,   // 🔥 FIX
      },
    });

    setTasks((prev) => prev.filter((t) => t.id !== id));
  } catch (e) {
    console.error(e);
  }
};


  /* ---------- Rendering helpers ---------- */
  const renderCustomFields = () => {
    const cat = categories.find((c) => c.id === selectedCategoryId)
    if (!cat?.extra_schema) return null
    return Object.entries(cat.extra_schema).map(([key, type]) => (
      <Input
        key={key}
        placeholder={`${key} (${type})`}
        value={customFields[key] ?? ""}
        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
        className="bg-background/50"
      />
    ))
  }

  const groupTasks = (list: Task[]) => {
    if (grouping === "none") return { "": list }
    if (grouping === "priority") return groupBy(list, "priority")
    if (grouping === "category") return groupBy(list, (t) => t.category?.name ?? "Uncategorized")
    return { "": list }
  }

  if (!mounted) return null
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const completed = safeTasks.filter((t) => t.completed).length
  const grouped = groupTasks(safeTasks)

  /* ---------- UI ---------- */
  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-accent/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks ({completed}/{safeTasks.length})</CardTitle>

        {/* Grouping */}
        <Select value={grouping} onValueChange={(v: any) => setGrouping(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>

        {/* ADD CATEGORY BUTTON */}
        <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </DialogTrigger>

          {/* CATEGORY MANAGEMENT MODAL */}
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
            </DialogHeader>

            {/* New/Edit Category Form */}
            <div className="space-y-4 border p-4 rounded-lg mb-6">
              <h3 className="font-medium">{editingCat ? "Edit" : "Add New"} Category</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Work" />
                </div>
    
                <div>
                  <Label>Color</Label>
                  <Input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} />
                </div>
              </div>

              {/* Extra Fields Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Extra Fields</Label>
                  <Button size="sm" variant="outline" onClick={addExtraField}>
                    <Plus className="w-4 h-4 mr-1" /> Add Field
                  </Button>
                </div>

                {extraFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Field name"
                      value={field.key}
                      onChange={(e) => updateExtraField(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateExtraField(index, "type", v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">string</SelectItem>
                        <SelectItem value="number">number</SelectItem>
                        <SelectItem value="boolean">boolean</SelectItem>
                        <SelectItem value="date">date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeExtraField(index)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={saveCategory} size="sm">
                  {editingCat ? "Update" : "Create"}
                </Button>
                {editingCat && (
                  <Button variant="outline" size="sm" onClick={resetCatForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                >
             
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditCat(cat)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCategory(cat)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* TASK FORM */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 min-w-[200px]"
            />

            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategoryId ?? ""} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Est. min"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : "")}
              className="w-28"
            />

            <Input
              type="datetime-local"
              placeholder="Preferred"
              value={preferredDatetime}
              onChange={(e) => setPreferredDatetime(e.target.value)}
              className="w-40"
            />

            <Input
              type="datetime-local"
              placeholder="Due"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-40"
            />

            <Input
              placeholder="Recur (e.g. every Mon)"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className="w-44"
            />

            <Button onClick={addTask} size="icon">
              <Plus className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse text-red-500" : ""}`} />
            </Button>

            <label>
              <Button variant="outline" size="icon" asChild>
                <div>
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </Button>
            </label>
          </div>

          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {renderCustomFields()}
        </div>

        {/* TASK LIST */}
        <div className="space-y-6">
{Object.entries(grouped).map(([key, list]) => (
  <div key={key || "ungrouped"}>
              {grouping !== "none" && <h4 className="font-semibold mb-2">{key}</h4>}
              <div className="space-y-2">
                {list.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-background/50 rounded-lg hover:bg-background/80 transition"
                  >
                    <Checkbox
                      checked={task.completed ?? false}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <p
                        className={`font-medium text-sm ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      )}
                      {task.category && (
                        <span className="text-xs text-muted-foreground">
                          #{task.category.name}
                        </span>
                      )}
                      {task.estimated_minutes && (
                        <span className="text-xs ml-2">Est. {task.estimated_minutes} min</span>
                      )}
                      {task.preferred_datetime && (
                        <span className="text-xs ml-2 text-blue-600">
                          Pref. {new Date(task.preferred_datetime).toLocaleString()}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs ml-2 text-red-600">
                          Due {new Date(task.due_date).toLocaleString()}
                        </span>
                      )}
                      {task.recurrence_rule && (
                        <span className="text-xs ml-2 text-green-600">
                          Recur {task.recurrence_rule}
                        </span>
                      )}
                      {task.image && <ImageIcon className="w-4 h-4 inline ml-2" />}
                      {task.voice_note && <Mic className="w-4 h-4 inline ml-2" />}
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.priority === "urgent"
                          ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                          : task.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {task.priority}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}