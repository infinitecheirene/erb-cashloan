"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-context"
import { BorrowerSidebar } from "@/components/borrower/borrower-sidebar"
import { LoansList } from "@/components/loans/loans-list"
import { LoanApplicationForm } from "@/components/loans/loan-application-form"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { Plus, Loader2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoansPage() {
  const router = useRouter()
  const { user, loading, authenticated } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loans, setLoans] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const { toast } = useToast()

  useEffect(() => {
    if (authenticated) {
      fetchStats()
      fetchLoans()
    }
  }, [authenticated, refreshKey])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/loans/statistics", {
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/loans", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLoans(data.loans || [])
      }
    } catch (error) {
      console.error("Failed to fetch loans:", error)
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
    setRefreshKey((prev) => prev + 1)
    toast({ title: "Success!", description: "Loan application submitted successfully" })
  }

  const handleViewLoan = (loanId: number) => {
    setSelectedLoanId(loanId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLoanId(null)
  }

  const handleNewApplication = () => {
    setActiveTab("apply")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <BorrowerSidebar />

      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Loans</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all loan applications</p>
            </div>
            <Button onClick={handleNewApplication} className="gap-1 w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#1e40af]">
              <Plus className="h-4 w-4" /> New Application
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 flex flex-col gap-6">
          {/* Stats */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <span className="text-sm font-medium text-muted-foreground">Total Loans</span>
                <span className="text-2xl font-bold">{stats.data.total_loans || 0}</span>
              </Card>
              <Card className="p-4">
                <span className="text-sm font-medium text-muted-foreground">Active</span>
                <span className="text-2xl font-bold text-green-600">{stats.data.active_loans || 0}</span>
              </Card>
              <Card className="p-4">
                <span className="text-sm font-medium text-muted-foreground">Total Outstanding</span>
                <span className="text-2xl font-bold text-yellow-600">{stats.data.total_outstanding || 0}</span>
              </Card>
              <Card className="p-4">
                <span className="text-sm font-medium text-muted-foreground">{user?.role === "borrower" ? "Total Borrowed" : "Total Lent"}</span>
                <span className="text-2xl font-bold">
                  ₱
                  {(stats.data.total_borrowed || stats.data.total_lent || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="list">My Loans</TabsTrigger>
              {user?.role === "borrower" && <TabsTrigger value="apply">Apply for Loan</TabsTrigger>}
            </TabsList>

            <TabsContent value="list" className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-muted-foreground text-sm">View and manage your loan applications</p>
              </div>

              {/* Filters */}
              <Card className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by loan number, borrower name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="defaulted">Defaulted</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                  </SelectContent>
                </Select>
              </Card>
              <LoansList key={refreshKey} searchQuery={searchQuery} statusFilter={statusFilter} typeFilter={typeFilter} onViewLoan={handleViewLoan} />
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
