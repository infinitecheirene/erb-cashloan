"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-context"
import {
  Search,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  User,
  Eye,
  AlertCircle,
  Loader2,
  Briefcase,
  Percent,
  Clock,
  Download,
  Mail,
  CreditCard,
  Check,
  Cross,
  X,
} from "lucide-react"
import { LoanOfficerSidebar } from "@/components/loan-officer/loan-officer-sidebar"

interface Loan {
  id: number
  loan_number: string
  type: string
  amount: string
  principal_amount?: string
  interest_rate: string
  term_months: number
  total_amount?: string
  outstanding_balance?: string
  status: string
  purpose?: string
  created_at: string
  approved_at?: string
  disbursement_date?: string
  borrower: {
    id: number
    first_name: string
    last_name: string
    name?: string
    email: string
  }
  documents?: Array<{
    id: number
    document_type: string
    file_name: string
  }>
}

export default function LenderLoansPage() {
  const router = useRouter()
  const { user, authenticated, loading: authLoading } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [loadingLoan, setLoadingLoan] = useState(false)
  const [loanOfficerMap, setLoanOfficerMap] = useState<Record<number, number>>({})


  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }

    if (authenticated) {
      fetchLoans()
    }
  }, [authenticated, authLoading, router])

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setError("No authentication token found. Please log in again.")
        setLoading(false)
        return
      }

      const response = await fetch("/api/loans", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please log in again.")
          setTimeout(() => {
            localStorage.removeItem("token")
            router.push("/")
          }, 2000)
          return
        }
        throw new Error("Failed to fetch loans")
      }

      const data = await response.json()
      setLoans(Array.isArray(data.loans) ? data.loans : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans")
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

  const handleViewDetails = (loanId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    fetchLoanDetails(loanId)
  }

  // Helper function to get borrower name
  const getBorrowerName = (borrower: Loan["borrower"]): string => {
    if (!borrower) return "N/A"
    if (borrower.name) return borrower.name
    const firstName = borrower.first_name || ""
    const lastName = borrower.last_name || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
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

  // Safe filtering with null checks
  const filteredLoans = Array.isArray(loans)
    ? loans.filter((loan) => {
        if (!loan) return false

        const loanNumber = loan.loan_number?.toLowerCase() || ""
        const borrowerName = getBorrowerName(loan.borrower).toLowerCase()
        const borrowerEmail = loan.borrower?.email?.toLowerCase() || ""
        const search = searchQuery.toLowerCase()

        const matchesSearch = loanNumber.includes(search) || borrowerName.includes(search) || borrowerEmail.includes(search)

        const matchesStatus = statusFilter === "all" || loan.status === statusFilter
        const matchesType = typeFilter === "all" || loan.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
      })
    : []

  const stats = {
    total: loans.length,
    pending: loans.filter((l) => l?.status === "pending").length,
    approved: loans.filter((l) => l?.status === "approved").length,
    active: loans.filter((l) => l?.status === "active").length,
    completed: loans.filter((l) => l?.status === "completed").length,
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
            <h1 className="text-2xl font-bold">Loans</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all loan applications</p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loans</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-800 font-bold">{stats.pending}</span>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold mt-1">{stats.approved}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-bold">{stats.approved}</span>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-800 font-bold">{stats.active}</span>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold mt-1">{stats.completed}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-800 font-bold">{stats.completed}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
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
            </div>
          </Card>

          {/* Loans List */}
          <div className="space-y-4">
            {filteredLoans.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No loans found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No loan applications have been submitted yet"}
                  </p>
                </div>
              </Card>
            ) : (
              filteredLoans.map((loan) => (
                <Card key={loan.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{loan.id || "N/A"}</h3>
                            {getStatusBadge(loan.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">{loan.type ? loan.type.replace("_", " ") : "Unknown"} Loan</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground text-xs">Borrower</p>
                            <p className="font-medium truncate">{getBorrowerName(loan.borrower)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-medium">
                              ₱{loan.amount ? parseFloat(loan.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">Term</p>
                            <p className="font-medium">{loan.term_months || 0} months</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">Applied</p>
                            <p className="font-medium">
                              {loan.created_at
                                ? new Date(loan.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-[260px]">
                      {/* Assign Loan Officer */}
                      <Select
                        value={loanOfficerMap[loan.id]?.toString()}
                        onValueChange={(value) =>
                          setLoanOfficerMap((prev) => ({
                            ...prev,
                            [loan.id]: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Assign officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Replace with real officers from API */}
                          <SelectItem value="2">Officer John</SelectItem>
                          <SelectItem value="3">Officer Jane</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Approve */}
                      <Button variant="default" disabled={!loanOfficerMap[loan.id]} onClick={() => approveLoan(loan.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>

                      {/* Reject */}
                      <Button variant="destructive" onClick={() => rejectLoan(loan.id)}>
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      {/* REDESIGNED Loan Details Modal - Compact, Scannable, Better Typography */}
      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedLoan && (
            <>
              {/* Header - Sticky */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b p-6 z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-6 w-6 text-slate-600" />
                      <h2 className="text-2xl font-bold text-slate-900 truncate">{selectedLoan.id}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(selectedLoan.status)}
                      <span className="text-sm text-slate-600 capitalize">{selectedLoan.type.replace("_", " ")} Loan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Key Financial Info - Prominent Display */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700 uppercase">Principal</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      ₱
                      {parseFloat(selectedLoan.principal_amount || selectedLoan.amount || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700 uppercase">Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{selectedLoan.interest_rate}%</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700 uppercase">Term</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{selectedLoan.term_months}m</p>
                  </div>
                </div>

                {/* Borrower Info - Compact Card */}
                {selectedLoan.borrower && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Borrower</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Name</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {selectedLoan.borrower.name || `${selectedLoan.borrower.first_name} ${selectedLoan.borrower.last_name}`}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <p className="font-medium text-slate-900 text-sm truncate" title={selectedLoan.borrower.email}>
                            {selectedLoan.borrower.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purpose - If exists */}
                {selectedLoan.purpose && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-amber-900">Purpose</h3>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{selectedLoan.purpose}</p>
                  </div>
                )}

                {/* Timeline - Horizontal */}
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Timeline</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs text-slate-500 mb-1">Applied</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {new Date(selectedLoan.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {selectedLoan.approved_at && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">Approved</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.approved_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {selectedLoan.disbursement_date && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">Disbursed</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.disbursement_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents - Compact List */}
                {selectedLoan.documents && selectedLoan.documents.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Documents ({selectedLoan.documents.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedLoan.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 p-3 bg-white rounded border hover:border-slate-300 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-slate-900 truncate" title={doc.file_name}>
                                {doc.file_name}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{doc.document_type.replace("_", " ")}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>

              {/* Footer - Sticky */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
                <Button onClick={() => setShowLoanModal(false)} className="min-w-[120px]">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
