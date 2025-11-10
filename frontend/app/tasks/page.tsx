"use client"
import Dashboard from "@/components/layout/sidebar-layout"
import TaskManagerView from "@/components/tasks/task-manager-view"

export default function TasksPage() {
  return (
    <Dashboard>
      <TaskManagerView />
    </Dashboard>
  )
}
