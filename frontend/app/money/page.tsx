"use client"

import HobbyTracker from "@/components/hobby/hobby-tracker"
import SidebarLayout from "@/components/layout/sidebar-layout"
import MoneyTracker from "@/components/Shopping/ShoppingManagerView"

export default function MoneyPage() {
  return (
    <SidebarLayout>
      <MoneyTracker />
    </SidebarLayout>
  )
}