"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import TaskCreator from "./task-creator"
import TasksGrid from "./tasks-grid"

type TaskCategory = "all" | "today" | "upcoming" | "completed"

export default function TaskManagerView() {
  const [showCreator, setShowCreator] = useState(false)
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("today")

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground mt-1">Break down your goals into manageable steps</p>
        </div>
        <Button onClick={() => setShowCreator(!showCreator)} size="lg" className="bg-primary hover:bg-primary/90">
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </Button>
      </div>

      {/* Task Creator Modal */}
      {showCreator && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle>Create a New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCreator onClose={() => setShowCreator(false)} />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as TaskCategory)}>
        <TabsList className="bg-card">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          <TasksGrid category={activeCategory} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
