/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
  Calendar,
  X,
  User,
  Briefcase,
  Percent,
  Download,
} from "lucide-react"
import { LoanOfficerSidebar } from "@/components/loan-officer/loan-officer-sidebar"

interface DashboardStats {
  totalLoans: number
  activeLoans: number
  totalDisbursed: string
  totalOutstanding: string
  pendingApplications: number
  approvedLoans: number
  completedLoans: number
  defaultedLoans: number
}

interface Loan {
  id: number
  loan_number: string
  type: string
  amount: string
  principal_amount: string
  interest_rate: string
  term_months: number
  total_amount: string
  outstanding_balance: string
  status: string
  purpose: string
  created_at: string
  approved_at?: string
  disbursement_date?: string
  borrower: {
    id: number
    first_name: string
    last_name: string
    name: string
    email: string
  }
  documents?: Array<{
    id: number
    document_type: string
    file_name: string
  }>
}

interface RecentLoan {
  id: number
  loan_number: string
  borrower_name: string
  amount: string
  status: string
  created_at: string
}

export default function LoanOfficerDashboardPage() {
  const router = useRouter()
  const { user, authenticated, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalDisbursed: "0",
    totalOutstanding: "0",
    pendingApplications: 0,
    approvedLoans: 0,
    completedLoans: 0,
    defaultedLoans: 0,
  })
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [loadingLoan, setLoadingLoan] = useState(false)

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }

    if (authenticated) {
      fetchDashboardData()
    }
  }, [authenticated, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      // For now, use the loans endpoint to calculate stats
      const loansResponse = await fetch("/api/loans", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (loansResponse.ok) {
        const loansData = await loansResponse.json()
        const loans = loansData.loans || []

        // Calculate stats from loans
        const calculatedStats = {
          totalLoans: loans.length,
          activeLoans: loans.filter((l: any) => l.status === "active").length,
          totalDisbursed: loans
            .filter((l: any) => l.status === "active" || l.status === "completed")
            .reduce((sum: number, l: any) => sum + parseFloat(l.principal_amount || l.amount || 0), 0)
            .toString(),
          totalOutstanding: loans
            .filter((l: any) => l.status === "active")
            .reduce((sum: number, l: any) => sum + parseFloat(l.outstanding_balance || l.principal_amount || l.amount || 0), 0)
            .toString(),
          pendingApplications: loans.filter((l: any) => l.status === "pending").length,
          approvedLoans: loans.filter((l: any) => l.status === "approved").length,
          completedLoans: loans.filter((l: any) => l.status === "completed").length,
          defaultedLoans: loans.filter((l: any) => l.status === "defaulted").length,
        }

        setStats(calculatedStats)

        // Get recent 5 loans
        setRecentLoans(
          loans.slice(0, 5).map((loan: any) => ({
            id: loan.id,
            loan_number: loan.loan_number,
            borrower_name: loan.borrower?.name || `${loan.borrower?.first_name} ${loan.borrower?.last_name}`.trim(),
            amount: loan.amount || loan.principal_amount || "0",
            status: loan.status,
            created_at: loan.created_at,
          })),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const fetchLoanDetails = async (loanId: number) => {
    setLoadingLoan(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch loan details")
      }

      const data = await response.json()
      setSelectedLoan(data.loan)
      setShowLoanModal(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load loan details")
    } finally {
      setLoadingLoan(false)
    }
  }

  const handleViewDetails = (loanId: number) => {
    fetchLoanDetails(loanId)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      pending: { variant: "default", label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      approved: { variant: "secondary", label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-300" },
      active: { variant: "default", label: "Active", className: "bg-green-100 text-green-800 border-green-300" },
      completed: { variant: "default", label: "Completed", className: "bg-gray-100 text-gray-800 border-gray-300" },
      rejected: { variant: "destructive", label: "Rejected" },
      defaulted: { variant: "destructive", label: "Defaulted" },
    }

    const config = variants[status] || { variant: "default", label: status }
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <LoanOfficerSidebar />

      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.first_name}</p>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6">
          {error && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Total Loans</p>
              <p className="text-3xl font-bold mt-1">{stats.totalLoans}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-3xl font-bold mt-1">{stats.activeLoans}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Total Disbursed</p>
              <p className="text-2xl font-bold mt-1">₱{parseFloat(stats.totalDisbursed).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold mt-1">₱{parseFloat(stats.totalOutstanding).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingApplications}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold mt-1">{stats.approvedLoans}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold mt-1">{stats.completedLoans}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Defaulted</p>
                  <p className="text-2xl font-bold mt-1">{stats.defaultedLoans}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Loans */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Loan Applications</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/loam-officer/loans")}>
                View All
              </Button>
            </div>

            {recentLoans.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent loan applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{loan.loan_number}</p>
                        {getStatusBadge(loan.status)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {loan.borrower_name}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />₱{parseFloat(loan.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(loan.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(loan.id)}
                      disabled={loadingLoan}
                      className="w-full sm:w-auto"
                    >
                      {loadingLoan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start"
                onClick={() => router.push("/loan-officer/loans?status=pending")}
              >
                <Clock className="h-6 w-6 mb-2" />
                <span className="font-semibold">Review Pending</span>
                <span className="text-xs text-muted-foreground">{stats.pendingApplications} applications</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start"
                onClick={() => router.push("/loan-officer/loans?status=approved")}
              >
                <CheckCircle2 className="h-6 w-6 mb-2" />
                <span className="font-semibold">Activate Approved</span>
                <span className="text-xs text-muted-foreground">{stats.approvedLoans} ready to activate</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => router.push("/loan-officer/loans?status=active")}>
                <FileText className="h-6 w-6 mb-2" />
                <span className="font-semibold">Active Loans</span>
                <span className="text-xs text-muted-foreground">{stats.activeLoans} loans</span>
              </Button>
            </div>
          </Card>
        </main>
      </div>

      {/* Loan Details Modal */}
      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Loan Details</span>
              {selectedLoan && getStatusBadge(selectedLoan.status)}
            </DialogTitle>
            <DialogDescription>{selectedLoan?.loan_number}</DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-6">
              {/* Borrower Information */}
              {selectedLoan.borrower && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Borrower Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {selectedLoan.borrower.name || `${selectedLoan.borrower.first_name} ${selectedLoan.borrower.last_name}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedLoan.borrower.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Principal Amount
                    </p>
                    <p className="text-xl font-bold mt-1">
                      ₱{parseFloat(selectedLoan.principal_amount || selectedLoan.amount || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Interest Rate
                    </p>
                    <p className="text-xl font-bold mt-1">{selectedLoan.interest_rate}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Term
                    </p>
                    <p className="text-xl font-bold mt-1">{selectedLoan.term_months} months</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Loan Type</p>
                    <p className="font-medium capitalize">{selectedLoan.type.replace("_", " ")}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg md:col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedLoan.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedLoan.documents && selectedLoan.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </h3>
                  <div className="space-y-2">
                    {selectedLoan.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{doc.document_type.replace("_", " ")}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(`/api/loans/${selectedLoan.id}/documents/${doc.id}/download`, "_blank")
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground w-32">Application Date</div>
                    <div className="font-medium">
                      {new Date(selectedLoan.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  {selectedLoan.approved_at && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground w-32">Approval Date</div>
                      <div className="font-medium">
                        {new Date(selectedLoan.approved_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                  {selectedLoan.disbursement_date && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground w-32">Disbursement Date</div>
                      <div className="font-medium">
                        {new Date(selectedLoan.disbursement_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - UPDATED: Removed the redirect button */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowLoanModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
