"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminReportsPage() {
  const router = useRouter()
  const { authenticated, loading, user } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!authenticated || user?.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  const handleDownloadReport = (type: string) => {
    // In a real application, this would generate and download a report
    console.log("Downloading report:", type)
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 bg-background min-h-screen">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Generate and view system reports</p>
          </div>
        </header>

        <div className="px-8 py-8">
          <Tabs defaultValue="overview" className="w-full space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="loans">Loan Analytics</TabsTrigger>
              <TabsTrigger value="users">User Reports</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Total Loans</p>
                  <p className="text-3xl font-bold mt-2">2,480</p>
                  <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-3xl font-bold mt-2">1,850</p>
                  <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold mt-2">2,100</p>
                  <p className="text-xs text-green-600 mt-2">84.6% approval rate</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Default Rate</p>
                  <p className="text-3xl font-bold mt-2">2.3%</p>
                  <p className="text-xs text-red-600 mt-2">↓ 0.5% from last month</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Loan Status Distribution</h3>
                  <p className="text-muted-foreground">Chart visualization coming soon...</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Monthly Originations</h3>
                  <p className="text-muted-foreground">Chart visualization coming soon...</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="loans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Portfolio Volume</p>
                  <p className="text-3xl font-bold mt-2">$145.8M</p>
                  <p className="text-xs text-muted-foreground mt-2">Total principal outstanding</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Average Loan Size</p>
                  <p className="text-3xl font-bold mt-2">$58,700</p>
                  <p className="text-xs text-muted-foreground mt-2">Across all loans</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Avg Interest Rate</p>
                  <p className="text-3xl font-bold mt-2">6.45%</p>
                  <p className="text-xs text-muted-foreground mt-2">Weighted average</p>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Loans by Type</h3>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport("loans-by-type")} className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                <p className="text-muted-foreground">Detailed breakdown by loan type...</p>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold mt-2">5,240</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Borrowers</p>
                  <p className="text-3xl font-bold mt-2">3,100</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Lenders</p>
                  <p className="text-3xl font-bold mt-2">1,840</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Loan Officers</p>
                  <p className="text-3xl font-bold mt-2">300</p>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">New User Registrations</h3>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport("new-users")} className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                <p className="text-muted-foreground">Growth tracking by user type...</p>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Interest Collected</p>
                  <p className="text-3xl font-bold mt-2">$12.4M</p>
                  <p className="text-xs text-muted-foreground mt-2">YTD</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Payments Processed</p>
                  <p className="text-3xl font-bold mt-2">$89.2M</p>
                  <p className="text-xs text-muted-foreground mt-2">This year</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Loan Loss Reserves</p>
                  <p className="text-3xl font-bold mt-2">$3.1M</p>
                  <p className="text-xs text-muted-foreground mt-2">Allocated</p>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Revenue Analysis</h3>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport("financial")} className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                <p className="text-muted-foreground">Monthly revenue trends and projections...</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
