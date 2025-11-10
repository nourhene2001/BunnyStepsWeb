"use client"

import SidebarLayout from "@/components/layout/sidebar-layout"
import FocusSessionsView from "@/components/focus/focus-sessions-view"

export default function FocusPage() {
  return (
    <SidebarLayout>
      <FocusSessionsView />
    </SidebarLayout>
  )
}
