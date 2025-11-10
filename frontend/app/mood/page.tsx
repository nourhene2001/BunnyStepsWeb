"use client"

import SidebarLayout from "@/components/layout/sidebar-layout"
import MoodTrackingView from "@/components/mood/mood-tracking-view"

export default function MoodPage() {
  return (
    <SidebarLayout>
      <MoodTrackingView />
    </SidebarLayout>
  )
}
