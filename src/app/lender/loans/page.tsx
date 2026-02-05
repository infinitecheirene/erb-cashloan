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
  CheckCheckIcon,
  Edit,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LenderSidebar } from "@/components/lender/lender-sidebar"
import { toast } from "sonner"

interface Loan {
  id: number
  loan_number: string
  type: string
  principal_amount: string
  approved_amount?: string
  interest_rate: string
  status: string
  term_months?: number
  purpose?: string
  created_at: string
  approved_at?: string
  updated_at: string
  disbursement_date?: string
  start_date?: string
  first_payment_date?: string
  notes?: string
  rejection_reason?: string
  outstanding_balance?: string
  employment_status?: string
  borrower?: {
    first_name: string
    last_name: string
    email?: string
  }
  lender?: {
    id: number
    first_name: string
    last_name: string
    email?: string
  }
  loan_officer?: {
    first_name: string
    last_name: string
    email?: string
  }
  documents?: Array<{
    id: number
    name?: string
    file_name?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
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
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const [status, setStatus] = useState("")
  const [approvedAmount, setApprovedAmount] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [notes, setNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [activateStartDate, setActivateStartDate] = useState("")
  const [activateFirstPaymentDate, setActivateFirstPaymentDate] = useState("")
  const [updating, setUpdating] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const handleViewDetails = (loan: Loan, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setSelectedLoan(loan)
    setShowLoanModal(true)
  }

  // Helper function to get borrower name
  const getBorrowerName = (borrower: Loan["borrower"]): string => {
    if (!borrower) return "N/A"
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

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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

  const openUpdateModal = (loan: Loan, newStatus?: string) => {
    setSelectedLoan(loan)

    setStatus(newStatus ?? loan.status)
    setApprovedAmount("")
    setInterestRate(loan.interest_rate ?? "")
    setNotes("")
    setRejectionReason("")
    setActivateStartDate("")
    setActivateFirstPaymentDate("")

    setShowUpdateModal(true)
  }

  const handleUpdateLoan = async () => {
    if (!selectedLoan) return
    setUpdating(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      if (status === "active") {
        // Use activate API if status is active
        const body = {
          start_date: activateStartDate || null,
          first_payment_date: activateFirstPaymentDate || null,
          notes: notes || null,
        }

        const res = await fetch(`/api/loans/${selectedLoan.id}/activate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Failed to activate loan" }))
          throw new Error(err.message || "Failed to activate loan")
        }

        const data = await res.json()
        toast.success("Loan activated successfully", { description: data.message })
      } else {
        // Use normal update API for other statuses
        const payload: Record<string, any> = {}

        if (status && status !== selectedLoan.status) payload.status = status
        if (notes !== "") payload.notes = notes
        if (status === "approved" && approvedAmount !== "") payload.approved_amount = Number(approvedAmount)
        if (status === "approved" && interestRate !== "") payload.interest_rate = Number(interestRate)
        if (status === "rejected" && rejectionReason !== "") payload.rejection_reason = rejectionReason

        const res = await fetch(`/api/loans/${selectedLoan.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || "Update failed")
        }

        toast.success("Loan updated successfully")
      }

      // Reset modal & refresh data
      setShowUpdateModal(false)
      setSelectedLoan(null)
      setActivateStartDate("")
      setActivateFirstPaymentDate("")
      setNotes("")
      fetchLoans()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <LenderSidebar />

      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <h1 className="text-3xl font-bold text-primary">Loans</h1>
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
            {paginatedLoans.length === 0 ? (
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
              paginatedLoans.map((loan) => (
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
                              ₱
                              {loan.principal_amount
                                ? parseFloat(loan.principal_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })
                                : "0.00"}
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
                      {/* View */}
                      <Button
                        variant="outline"
                        onClick={(e) => handleViewDetails(loan, e)}
                        className="w-full sm:w-auto"
                        type="button"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button variant="outline" onClick={() => openUpdateModal(loan)} className="w-full sm:w-auto" title="Update Loan">
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>

                      {/* Status selector */}
                      <Select value={loan.status} onValueChange={(value) => openUpdateModal(loan, value)}>
                        <SelectTrigger className="w-[140px] text-sm border-gray-200">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="pending" disabled={loan.status !== "pending"}>
                            Pending
                          </SelectItem>
                          <SelectItem value="approved" disabled={loan.status !== "pending"}>
                            Approved
                          </SelectItem>
                          <SelectItem value="rejected" disabled={loan.status !== "pending"}>
                            Rejected
                          </SelectItem>
                          <SelectItem value="active" disabled={loan.status !== "approved"}>
                            Active
                          </SelectItem>
                          <SelectItem value="completed" disabled={loan.status !== "active"}>
                            Completed
                          </SelectItem>
                          <SelectItem value="defaulted" disabled={loan.status !== "completed"}>
                            Defaulted
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                  Previous
                </Button>

                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Loan Details Modal */}
      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="w-full sm:max-w-lg md:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {selectedLoan && (
            <>
              {/* Header - Sticky */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b p-6 z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                {/* 1. Key Financial Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700 uppercase">Principal</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      ₱
                      {parseFloat(selectedLoan.principal_amount || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700 uppercase">Approved Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₱{selectedLoan.approved_amount}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700 uppercase">Outstanding Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">₱{selectedLoan.outstanding_balance}</p>
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

                {/* 2. Borrower Info */}
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
                          {`${selectedLoan.borrower.first_name} ${selectedLoan.borrower.last_name}`}
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
                      {/* Employment Status */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Employment Status</p>
                        <p className="font-medium text-slate-900 text-sm capitalize">{selectedLoan.employment_status || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Loan Details */}
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <h3 className="font-semibold text-slate-900 mb-3">Loan Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Loan Officer */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Lender</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {`${selectedLoan.lender?.first_name || ""} ${selectedLoan.lender?.last_name || ""}` || "-"}
                      </p>
                      <p className="font-medium text-gray-500 text-sm">{selectedLoan.lender?.email || "-"}</p>
                    </div>

                    {/* Rejection Reason */}
                    {selectedLoan.status === "rejected" && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-1">Rejection Reason</p>
                        <p className="font-medium text-slate-900 text-sm">{selectedLoan.rejection_reason || "-"}</p>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Notes</p>
                      <p className="font-medium text-slate-900 text-sm">{selectedLoan.notes || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Purpose */}
                {selectedLoan.purpose && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-amber-900">Purpose</h3>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{selectedLoan.purpose}</p>
                  </div>
                )}

                {/* 5. Timeline */}
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Timeline</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs text-slate-500 mb-1">Applied</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {new Date(selectedLoan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {selectedLoan.approved_at && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">Approved</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.approved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                    {selectedLoan.disbursement_date && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">Disbursed</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.disbursement_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                    {selectedLoan.start_date && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">Start Date</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}

                    {selectedLoan.first_payment_date && (
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-slate-500 mb-1">First Payment Date</p>
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(selectedLoan.first_payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Documents */}
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
                            onClick={() => window.open(`/api/loans/${selectedLoan.id}/documents/${doc.id}/download`, "_blank")}
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

      {/* Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <Label>Status</Label>

              <Select value={status} onValueChange={(value) => setStatus(value)}>
                <SelectTrigger className="w-[140px] text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {/* Pending → can only stay pending */}
                  <SelectItem value="pending" disabled={selectedLoan?.status !== "pending"}>
                    Pending
                  </SelectItem>

                  {/* Pending → Approved */}
                  <SelectItem value="approved" disabled={selectedLoan?.status !== "pending"}>
                    Approved
                  </SelectItem>

                  {/* Pending → Rejected */}
                  <SelectItem value="rejected" disabled={selectedLoan?.status !== "pending"}>
                    Rejected
                  </SelectItem>

                  {/* Approved → Active */}
                  <SelectItem value="active" disabled={selectedLoan?.status !== "approved"}>
                    Active
                  </SelectItem>

                  {/* Active → Completed */}
                  <SelectItem value="completed" disabled={selectedLoan?.status !== "active"}>
                    Completed
                  </SelectItem>

                  {/* Completed → Defaulted */}
                  <SelectItem value="defaulted" disabled={selectedLoan?.status !== "completed"}>
                    Defaulted
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(() => {
              // Determine what fields to show based on status
              const isPending = status === "pending"
              const isApproved = status === "approved"
              const isRejected = status === "rejected"
              const isActive = status === "active"
              const isCompleted = status === "completed"
              const isDefaulted = status === "defaulted"

              return (
                <>
                  {/* Approved Amount & Interest Rate */}
                  {(isPending || isApproved) && (
                    <>
                      <div>
                        <Label>Approved Amount</Label>
                        <Input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
                      </div>

                      <div>
                        <Label>Interest Rate (%)</Label>
                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* Rejection Reason */}
                  {isRejected && (
                    <div>
                      <Label>Rejection Reason</Label>
                      <Textarea placeholder="Rejection Reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                    </div>
                  )}

                  {/* Activate fields */}
                  {isActive && (
                    <>
                      <div className="space-y-1">
                        <Label>Start Date</Label>
                        <Input type="date" value={activateStartDate} onChange={(e) => setActivateStartDate(e.target.value)} />
                      </div>

                      <div className="space-y-1">
                        <Label>First Payment Date</Label>
                        <Input type="date" value={activateFirstPaymentDate} onChange={(e) => setActivateFirstPaymentDate(e.target.value)} />
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* Completed or Defaulted loans: only Notes */}
                  {(isCompleted || isDefaulted) && (
                    <div>
                      <Label>Notes</Label>
                      <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  )}
                </>
              )
            })()}

            <Button className="w-full" onClick={handleUpdateLoan} disabled={updating}>
              {updating ? "Updating..." : "Update Loan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
