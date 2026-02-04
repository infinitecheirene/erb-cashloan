"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Eye, FileText, Loader2, Download, Edit2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"

interface LoanApplication {
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
  updated_at: string
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

interface Lender {
  id: number
  first_name: string
  last_name: string
  email?: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 capitalize",
  approved: "bg-blue-100 text-blue-700 capitalize",
  rejected: "bg-red-100 text-red-700 capitalize",
  active: "bg-green-100 text-green-700 capitalize",
  completed: "bg-gray-100 text-gray-700 capitalize",
  defaulted: "bg-black text-white capitalize",
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { authenticated, loading, user } = useAuth()
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null)
  const [appLoading, setAppLoading] = useState(true)
  const [lenders, setLenders] = useState<Lender[]>([])

  //stats
  const [loanStats, setLoanStats] = useState<{
    total_loans: number
    pending_loans: number
    active_loans: number
    total_disbursed: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Search state
  const [search, setSearch] = useState("")

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  // activate modal states
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [activateStartDate, setActivateStartDate] = useState("")
  const [activateFirstPaymentDate, setActivateFirstPaymentDate] = useState("")
  const [activating, setActivating] = useState(false)

  // Approve form states
  const [approvedAmount, setApprovedAmount] = useState("")
  const [approvedRate, setApprovedRate] = useState("")

  // Reject form state
  const [rejectionReason, setRejectionReason] = useState("")

  // update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [status, setStatus] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [notes, setNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const [selectedLenderId, setSelectedLenderId] = useState<number | null>(null)

  const fetchLoanStatistics = async () => {
    try {
      setStatsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(`/api/loans/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to fetch statistics")
      const data = await res.json()
      setLoanStats(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/loans?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch applications")
      const data = await response.json()
      const loans = Array.isArray(data.loans) ? data.loans : (data.loans?.data ?? [])
      setApplications(loans)
    } catch (err) {
      console.error(err)
    } finally {
      setAppLoading(false)
    }
  }

  const fetchLenders = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/lenders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch lenders")
      const data = await res.json()
      setLenders(data.lenders)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchLoanStatistics()
    fetchApplications()
    fetchLenders()
  }, [])

  const getColumns = (
    statusColors: Record<string, string>,
    setSelectedApp: any,
    setStatus: any,
    setApprovedAmount: any,
    setInterestRate: any,
    setNotes: any,
    setRejectionReason: any,
    setShowUpdateModal: any,
    router: any,
  ): ColumnDef<LoanApplication, any>[] => [
    { header: "Loan Number", accessorKey: "id" },
    {
      header: "Borrower",
      accessorFn: (row) => (row.borrower ? `${row.borrower.first_name} ${row.borrower.last_name}` : "N/A"),
    },
    { header: "Type", accessorKey: "type" },
    {
      header: "Principal Amount",
      accessorFn: (row) => `₱${Number(row.principal_amount).toLocaleString()}`,
    },
    {
      header: "Approved Amount",
      accessorFn: (row) => (row.approved_amount ? `₱${Number(row.approved_amount).toLocaleString()}` : "-"),
    },
    { header: "Rate", accessorFn: (row) => `${row.interest_rate}%` },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <Badge className={statusColors[row.original.status] || "bg-gray-100"}>{row.original.status}</Badge>,
    },
    { header: "Submitted", accessorFn: (row) => new Date(row.created_at).toLocaleDateString() },
    {
      header: "Actions",
      cell: ({ row }) => {
        const loan = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/loans/${loan.id}`)}>
              <Eye className="h-4 w-4 text-blue-500" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedApp(loan)
                setStatus(loan.status)
                setApprovedAmount(loan.approved_amount ?? "")
                setInterestRate(loan.interest_rate ?? "")
                setNotes(loan.notes ?? "")
                setRejectionReason(loan.rejection_reason ?? "")
                setShowUpdateModal(true)
              }}
            >
              <Edit2 className="h-4 w-4 text-green-500" />
            </Button>

            <Select
              value={row.original.status}
              onValueChange={(value) => {
                const loan = row.original
                setSelectedApp(loan)

                switch (value) {
                  case "approved":
                    setApprovedAmount(loan.approved_amount ?? "")
                    setApprovedRate(loan.interest_rate ?? "")
                    setShowApproveModal(true)
                    break

                  case "rejected":
                    setRejectionReason(loan.rejection_reason ?? "")
                    setShowRejectModal(true)
                    break

                  case "active":
                    setActivateStartDate(loan.start_date ?? "")
                    setActivateFirstPaymentDate(loan.first_payment_date ?? "")
                    setShowActivateModal(true)
                    break

                  default:
                    // For other status changes, use update modal
                    setStatus(value)
                    setNotes(loan.notes ?? "")
                    setShowUpdateModal(true)
                    break
                }
              }}
            >
              <SelectTrigger className="w-[140px] text-sm border-gray-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="pending" disabled={loan.status === "completed" || loan.status === "defaulted"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Pending
                  </span>
                </SelectItem>

                <SelectItem value="approved" disabled={loan.status !== "pending"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Approved
                  </span>
                </SelectItem>

                <SelectItem value="rejected" disabled={loan.status !== "pending"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    Rejected
                  </span>
                </SelectItem>

                <SelectItem value="active" disabled={loan.status !== "approved"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-600" />
                    Active
                  </span>
                </SelectItem>

                <SelectItem value="completed" disabled={loan.status !== "active"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-600" />
                    Completed
                  </span>
                </SelectItem>

                <SelectItem value="defaulted" disabled={loan.status !== "completed"}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-black" />
                    Defaulted
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      },
    },
  ]

  const columns = getColumns(
    statusColors,
    setSelectedApp,
    setStatus,
    setApprovedAmount,
    setInterestRate,
    setNotes,
    setRejectionReason,
    setShowUpdateModal,
    router,
  )

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!authenticated || !["admin", "loan_officer"].includes(user?.role || "")) {
    router.push("/dashboard")
    return null
  }

  // Handlers
  const handleActivate = async () => {
    if (!selectedApp) return
    setActivating(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const body = {
        start_date: activateStartDate || null,
        first_payment_date: activateFirstPaymentDate || null,
      }

      const res = await fetch(`/api/loans/${selectedApp.id}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to activate loan" }))
        throw new Error(error.message || "Failed to activate loan")
      }

      const data = await res.json()
      toast.success("Loan activated successfully", { description: data.message })
      setShowActivateModal(false)
      setActivateStartDate("")
      setActivateFirstPaymentDate("")
      setSelectedApp(null)
      fetchApplications()
      fetchLoanStatistics()
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      toast.error("Error activating loan", { description: message })
    } finally {
      setActivating(false)
    }
  }

  const handleApprove = async () => {
    if (!approvedAmount) {
      toast.error("Error", { description: "Amount and officer are required" })
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const body: Record<string, any> = {
        approved_amount: Number(approvedAmount),
        interest_rate: approvedRate ? Number(approvedRate) : undefined,
      }

      if (selectedLenderId) body.lender_id = selectedLenderId

      const res = await fetch(`/api/loans/${selectedApp?.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to approve loan" }))
        throw new Error(error.message || "Failed to approve loan")
      }

      const data = await res.json()
      toast.success("Success", { description: data.message })

      // Reset form
      setApprovedAmount("")
      setApprovedRate("")
      setSelectedApp(null)
      setShowApproveModal(false)

      fetchApplications()
      fetchLoanStatistics()
    } catch (err) {
      console.error(err)
      toast.error("Error", {
        description: err instanceof Error ? err.message : "An error occurred",
      })
    }
  }

  const handleReject = async () => {
    if (!selectedApp) return

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const body = {
        reason: rejectionReason || null,
      }

      const res = await fetch(`/api/loans/${selectedApp.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to reject loan" }))
        throw new Error(error.message || "Failed to reject loan")
      }

      const data = await res.json()
      toast.success("Success", { description: data.message || "Loan rejected successfully" })

      setRejectionReason("")
      setSelectedApp(null)
      setShowRejectModal(false)

      fetchApplications()
      fetchLoanStatistics()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error("Error", { description: errorMsg })
    }
  }

  const handleUpdateLoan = async () => {
    if (!selectedApp) return
    setUpdating(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      const payload: Record<string, any> = {}

      if (status && status !== selectedApp.status) payload.status = status

      if (approvedAmount !== "") payload.approved_amount = Number(approvedAmount)

      if (interestRate !== "") payload.interest_rate = Number(interestRate)

      if (notes !== "") payload.notes = notes

      if (status === "rejected" && rejectionReason !== "") payload.rejection_reason = rejectionReason
      // Assign lender if admin and selected
      if (user?.role === "admin" && selectedLenderId) {
        payload.lender_id = selectedLenderId
      }

      const res = await fetch(`/api/loans/${selectedApp.id}`, {
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

      setShowUpdateModal(false)
      setSelectedApp(null)
      fetchApplications()
      fetchLoanStatistics()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan")
    } finally {
      setUpdating(false)
    }
  }

  const normalizedSearch = search.toLowerCase()

  const filteredData = applications.filter((app) => {
    if (normalizedSearch === "") return true

    return (
      String(app.id).includes(normalizedSearch) ||
      app.borrower?.first_name?.toLowerCase().includes(normalizedSearch) ||
      app.borrower?.last_name?.toLowerCase().includes(normalizedSearch)
    )
  })

  const paginatedData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const pageCount = Math.ceil(filteredData.length / pageSize)

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 bg-background min-h-screen">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-primary">Loan Applications</h1>
            <p className="text-muted-foreground mt-1">Review and process pending applications</p>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Total Loans</h3>
            <p className="text-xl font-bold">{statsLoading ? "..." : (loanStats?.total_loans ?? 0)}</p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Loans</h3>
            <p className="text-xl font-bold">{statsLoading ? "..." : (loanStats?.pending_loans ?? 0)}</p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Active Loans</h3>
            <p className="text-xl font-bold">{statsLoading ? "..." : (loanStats?.active_loans ?? 0)}</p>
          </Card>
          <Card className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Total Disbursed</h3>
            <p className="text-xl font-bold">{statsLoading ? "..." : `₱${Number(loanStats?.total_disbursed ?? 0).toLocaleString()}`}</p>
          </Card>
        </div>

        <div className="px-8 py-4">
          <DataTable
            columns={columns}
            data={applications}
            search={search}
            onSearchChange={(val) => setSearch(val)}
            searchFields={["id", "borrower"]}
          />
        </div>

        {/* Activate Loan Modal */}
        <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Activate Loan #{selectedApp?.loan_number}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <label htmlFor="activateStartDate" className="text-sm font-medium">
                  Start Date
                </label>
                <Input id="activateStartDate" type="date" value={activateStartDate} onChange={(e) => setActivateStartDate(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label htmlFor="activateFirstPaymentDate" className="text-sm font-medium">
                  First Payment Date
                </label>
                <Input
                  id="activateFirstPaymentDate"
                  type="date"
                  value={activateFirstPaymentDate}
                  onChange={(e) => setActivateFirstPaymentDate(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleActivate} disabled={activating}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> {activating ? "Activating..." : "Activate Loan"}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowActivateModal(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Modal */}
        <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Loan #{selectedApp?.loan_number}</DialogTitle>
            </DialogHeader>

            {/* Lender Assignment (Admin only) */}
            {user?.role === "admin" && (
              <div className="space-y-1">
                <Label>Assign Lender</Label>
                <Select value={selectedLenderId?.toString() || ""} onValueChange={(val) => setSelectedLenderId(Number(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Lender" />
                  </SelectTrigger>
                  <SelectContent>
                    {lenders.map((lender) => (
                      <SelectItem key={lender.id} value={lender.id.toString()}>
                        {lender.first_name} {lender.last_name} ({lender.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4">
              {/* Approved Amount */}
              <div className="space-y-2">
                <Label htmlFor="approvedAmount">Approved Amount</Label>
                <Input
                  id="approvedAmount"
                  type="number"
                  placeholder="Approved Amount"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <Label htmlFor="approvedRate">Interest Rate (%)</Label>
                <Input
                  id="approvedRate"
                  type="number"
                  placeholder="Interest Rate (%)"
                  value={approvedRate}
                  onChange={(e) => setApprovedRate(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowApproveModal(false)} variant="ghost">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Loan #{selectedApp?.loan_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea placeholder="Rejection Reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              <Button className="w-full" onClick={handleReject} variant="destructive">
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowRejectModal(false)} variant="ghost">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Loan #{selectedApp?.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["pending", "approved", "rejected", "active", "completed", "defaulted"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lender Assignment (Admin only) */}
              {user?.role === "admin" && (
                <div className="space-y-1">
                  <Label>Assign Lender</Label>
                  <Select value={selectedLenderId?.toString() || ""} onValueChange={(val) => setSelectedLenderId(Number(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lender" />
                    </SelectTrigger>
                    <SelectContent>
                      {lenders.map((lender) => (
                        <SelectItem key={lender.id} value={lender.id.toString()}>
                          {lender.first_name} {lender.last_name} ({lender.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This is optional. If left unassigned, a lender may assign the loan to themselves later.
                  </p>
                </div>
              )}

              {/* Approved Amount */}
              <div>
                <Label>Approved Amount</Label>
                <Input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
              </div>

              {/* Interest Rate */}
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <Button className="w-full" onClick={handleUpdateLoan} disabled={updating}>
                {updating ? "Updating..." : "Update Loan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
