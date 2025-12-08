"use client"

import HobbyTracker from "@/components/hobby/hobby-tracker"
import SidebarLayout from "@/components/layout/sidebar-layout"
import MoodTrackingView from "@/components/mood/mood-tracking-view"

export default function MoodPage() {
  return (
    <SidebarLayout>
      <HobbyTracker />
    </SidebarLayout>
  )
}
