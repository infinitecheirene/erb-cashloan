"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-context"
import { BorrowerSidebar } from "@/components/borrower/borrower-sidebar"
import { LoansList } from "@/components/loans/loans-list"
import { LoanApplicationForm } from "@/components/loans/loan-application-form"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoansPage() {
  const router = useRouter()
  const { user, loading, authenticated } = useAuth()
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (authenticated) {
      fetchStats()
    }
  }, [authenticated, refreshKey])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/loans/statistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
      </div>
    )
  }

  if (!authenticated) {
    router.push("/")
    return null
  }

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false)
    setRefreshKey((prev) => prev + 1)

    toast({
      title: "Success!",
      description: "Loan application submitted successfully",
    })
  }

  const handleViewLoan = (loanId: number) => {
    setSelectedLoanId(loanId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLoanId(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <BorrowerSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Add padding for mobile header */}
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card">
          <div className="px-4 sm:px-6 py-4">
            <h2 className="text-xl font-semibold">Loans</h2>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card className="p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Total Loans</span>
                  <span className="text-2xl font-bold">{stats.total_loans || 0}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats.pending_loans || 0}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Active</span>
                  <span className="text-2xl font-bold text-green-600">{stats.active_loans || 0}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">{user?.role === "borrower" ? "Total Borrowed" : "Total Lent"}</span>
                  <span className="text-2xl font-bold">
                    ₱{(stats.total_borrowed || stats.total_lent || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </Card>
            </div>
          )}

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="list">My Loans</TabsTrigger>
              {user?.role === "borrower" && <TabsTrigger value="apply">Apply for Loan</TabsTrigger>}
            </TabsList>

            <TabsContent value="list" className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-muted-foreground text-sm">View and manage your loan applications</p>
                {user?.role === "borrower" && (
                  <Button
                    onClick={() => setShowApplicationForm(!showApplicationForm)}
                    className="gap-1 w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#1e40af]"
                  >
                    <Plus className="h-4 w-4" />
                    New Application
                  </Button>
                )}
              </div>

              {showApplicationForm ? (
                <LoanApplicationForm onSuccess={handleApplicationSuccess} />
              ) : (
                <LoansList key={refreshKey} onViewLoan={handleViewLoan} />
              )}
            </TabsContent>

            {user?.role === "borrower" && (
              <TabsContent value="apply" className="space-y-6 mt-6">
                <LoanApplicationForm onSuccess={handleApplicationSuccess} />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>

      {/* Loan Details Modal */}
      <LoanDetailsModal loanId={selectedLoanId} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}
