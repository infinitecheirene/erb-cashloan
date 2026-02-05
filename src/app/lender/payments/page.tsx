import { LenderSidebar } from "@/components/lender/lender-sidebar"
import React from "react"

const page = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <LenderSidebar />

      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all payments</p>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6"></main>
      </div>
    </div>
  )
}

export default page
