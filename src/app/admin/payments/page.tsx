"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCheckIcon, CheckCircle, Download, Eye, XCircle } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/paginated-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import Image from "next/image"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

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
    name: string
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

interface Payment {
  id: number
  transaction_id: string
  payment_date?: string
  amount: string
  due_date: string
  paid_date?: string
  status: string
  loan?: Loan
  loan_id: string
  notes?: string
  days_late: string
  late_fee: string
  payment_method: string
  created_at: string
  proof_of_payment?: string
  verified_at?: string
  rejection_reason?: string
  updated_at?: string
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { authenticated, loading: authLoading } = useAuth()
  const requestIdRef = useRef(0)

  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [filterType, setFilterType] = useState<"all" | "upcoming" | "overdue" | "paid">("all")

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
  })

  const [sorting, setSorting] = useState<{ column: string; order: "asc" | "desc" }>({
    column: "due_date",
    order: "asc",
  })

  const [initialLoading, setInitialLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [viewPaymentOpen, setViewPaymentOpen] = useState(false)
  const [verifyPaymentOpen, setVerifyPaymentOpen] = useState(false)
  const [verifyActionLoading, setVerifyActionLoading] = useState(false)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Reset page when search/filter changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [debouncedSearch, filterType])

  const fetchPayments = async () => {
    const requestId = ++requestIdRef.current

    if (typeof pagination.pageIndex !== "number" || typeof pagination.pageSize !== "number") return

    setInitialLoading((prev) => prev || true)
    setFetching(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      const params = new URLSearchParams()
      params.set("type", filterType)
      params.set("page", String(pagination.pageIndex + 1))
      params.set("per_page", String(pagination.pageSize))
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (sorting?.column) {
        params.set("sort_column", sorting.column)
        params.set("sort_order", sorting.order)
      }

      const res = await fetch(`/api/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to fetch payments")

      if (requestId !== requestIdRef.current) return

      setPayments(data.data ?? [])
      setPagination({
        pageIndex: data.current_page - 1,
        pageSize: data.per_page,
        total: data.total,
      })
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load payments")
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false)
        setFetching(false)
      }
    }
  }

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }
    if (authenticated) fetchPayments()
  }, [authenticated, authLoading, debouncedSearch, filterType, pagination.pageIndex, pagination.pageSize, sorting.column, sorting.order])

  const handleVerifyPayment = async (action: "approve" | "reject", reason?: string) => {
    if (!selectedPayment) return
    setVerifyActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/payments/${selectedPayment.id}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? reason : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to verify payment")
      // Close modal BEFORE fetching new data to prevent re-opening
      setVerifyPaymentOpen(false)
      setSelectedPayment(null)
      fetchPayments()
      setVerifyPaymentOpen(false)
      setViewPaymentOpen(false)
      toast.success(`Payment ${action === "approve" ? "approved" : "rejected"} successfully`)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to verify")
    } finally {
      setVerifyActionLoading(false)
    }
  }

  // Inside your component
  const downloadFile = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!paymentId) throw new Error("Invalid payment ID")
      if (!token) throw new Error("Unauthorized")
        
      // Proxy URL in Next.js
      const proxyUrl = `/api/payments/${paymentId}/proof/download`

      const res = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${token}`, // include the token here
        },
      })
      if (!res.ok) throw new Error("Failed to fetch file")

      const blob = await res.blob()

      // Extract filename from content-disposition header if present
      const disposition = res.headers.get("content-disposition")
      let fileName = "proof.png"

      if (disposition?.includes("filename=")) {
        const match = disposition.match(/filename="?(.+)"?/)
        if (match && match[1]) fileName = match[1]
      }

      // Create temporary link to trigger download
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success("File downloaded successfully")
    } catch (err) {
      console.error("Download failed", err)
      toast.error((err as Error).message || "Failed to download file")
    }
  }

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "transaction_id", header: "Transaction #" },
      {
        id: "borrower",
        header: "Borrower",
        accessorFn: (row) => row.loan?.borrower?.name || "-",
      },
      {
        id: "email",
        header: "Email",
        accessorFn: (row) => row.loan?.borrower?.email || "-",
      },
      {
        accessorKey: "loan_id",
        header: "Loan #",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (v) => `₱${Number(v.getValue()).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: (v) => new Date(v.getValue() as string).toLocaleDateString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (v) => {
          const rawStatus = (v.getValue() as string)?.toLowerCase()

          // Map to human-readable label
          const statusLabels: Record<string, string> = {
            paid: "Paid",
            pending: "Pending",
            late: "Late",
            missed: "Missed",
            awaiting_verification: "Awaiting Verification",
            rejected: "Rejected",
          }

          const statusStyles: Record<string, string> = {
            paid: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            late: "bg-orange-100 text-orange-800",
            missed: "bg-red-100 text-red-800",
            awaiting_verification: "bg-yellow-200 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
          }

          const label = statusLabels[rawStatus] ?? rawStatus
          const cls = statusStyles[rawStatus] ?? "bg-gray-100 text-gray-800"

          return <Badge className={`${cls} px-2 py-1 rounded-full text-xs`}>{label}</Badge>
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPayment(row.original)
                setViewPaymentOpen(true)
              }}
              title={row.original.status !== "awaiting_verification" ? "View Details" : "Verify Payment"}
            >
              {row.original.status !== "awaiting_verification" ? (
                <Eye className="h-4 w-4 text-gray-500" />
              ) : (
                <CheckCheckIcon className="h-4 w-4 text-blue-800" />
              )}
            </Button>
          </>
        ),
      },
    ],
    [],
  )

  if (authLoading || initialLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-primary">Payments</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all payments</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              {["all", "upcoming", "overdue", "awaiting_verification", "rejected", "paid"].map((t) => {
                // Map to human-readable label
                const labelMap: Record<string, string> = {
                  all: "All",
                  upcoming: "Upcoming",
                  overdue: "Overdue",
                  awaiting_verification: "Awaiting Verification",
                  rejected: "Rejected",
                  paid: "Paid",
                }

                return (
                  <Button
                    key={t}
                    size="sm"
                    variant={filterType === t ? "default" : "outline"}
                    className="capitalize"
                    onClick={() => setFilterType(t as any)}
                  >
                    {labelMap[t] ?? t}
                  </Button>
                )
              })}
            </div>
            {fetching && <span className="text-xs text-muted-foreground">Updating results…</span>}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border rounded flex gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Table */}
          <DataTable
            columns={columns}
            data={payments}
            pageCount={Math.ceil(pagination.total / pagination.pageSize)}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPageChange={(pageIndex, pageSize) =>
              setPagination((p) => ({
                pageIndex,
                pageSize: pageSize ?? p.pageSize,
                total: p.total,
              }))
            }
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search payments, borrower, loan #"
            onSortingChange={(s) => {
              const x = s[0]
              if (x)
                setSorting({
                  column: x.id,
                  order: x.desc ? "desc" : "asc",
                })
            }}
          />
        </main>
      </div>

      {/* Verify Payment Dialog */}
      <Dialog open={viewPaymentOpen} onOpenChange={setViewPaymentOpen}>
        <DialogContent className="h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold items-center justify-between">
              <p>Payment Details — Loan #{selectedPayment?.id ?? "-"}</p>
              <p className="text-xs text-gray-500">{selectedPayment?.transaction_id ?? "-"}</p>
            </DialogTitle>
          </DialogHeader>

          {/* Loan Summary Card */}
          <div className="border rounded-md p-4 bg-slate-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Loan Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium capitalize">{selectedPayment?.loan?.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-medium capitalize">{selectedPayment?.loan?.type}</p>
              </div>

              <div>
                <p className="text-gray-600">Approved Amount</p>
                <p className="font-medium text-green-700">₱{parseFloat(selectedPayment?.loan?.approved_amount ?? "0").toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Outstanding</p>
                <p className="font-medium text-red-600">₱{parseFloat(selectedPayment?.loan?.outstanding_balance ?? "0").toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Interest Rate</p>
                <p className="font-medium">{selectedPayment?.loan?.interest_rate}%</p>
              </div>
              <div>
                <p className="text-gray-600">Term</p>
                <p className="font-medium">{selectedPayment?.loan?.term_months} months</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Purpose</p>
                <p className="font-medium truncate">{selectedPayment?.loan?.purpose}</p>
              </div>
            </div>
          </div>

          {/* Borrower Info Card */}
          <div className="border rounded-md p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Borrower</h3>
            <p className="text-sm">
              <span className="text-gray-600">Name: </span>
              <span className="font-medium">{selectedPayment?.loan?.borrower?.name ?? "-"}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Email: </span>
              <span className="font-medium">{selectedPayment?.loan?.borrower?.email ?? "-"}</span>
            </p>
          </div>

          {/* Payment Summary Card */}
          <div className="border rounded-md p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-medium text-green-800">₱{parseFloat(selectedPayment?.amount ?? "0").toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Late Fee</p>
                <p className="font-medium text-red-600">₱{parseFloat(selectedPayment?.late_fee ?? "0").toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Days Late</p>
                <p className="font-medium">{selectedPayment?.days_late}</p>
              </div>
              <div>
                <p className="text-gray-600">Due Date</p>
                <p className="font-medium">{new Date(selectedPayment?.due_date ?? "-").toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Status</p>
                <p className="font-medium capitalize">{selectedPayment?.status}</p>
              </div>
            </div>
          </div>

          {/* Transaction Info Card */}
          <div className="border rounded-md p-4 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Method</p>
                <p className="font-medium capitalize">{selectedPayment?.payment_method ?? "-"}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment Date</p>
                <p className="font-medium">{selectedPayment?.payment_date ? new Date(selectedPayment?.payment_date).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-gray-600">Paid Date</p>
                <p className="font-medium">{selectedPayment?.paid_date ? new Date(selectedPayment?.paid_date).toLocaleDateString() : "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Notes</p>
                <p className="font-medium">
                  {selectedPayment?.notes ? `| ${selectedPayment?.notes}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Proof of Payment */}
          {selectedPayment?.proof_of_payment && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Proof of Payment</h4>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{selectedPayment.proof_of_payment.split("/").pop()}</p>
                    <p className="text-sm text-muted-foreground">Proof of Payment</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => downloadFile(String(selectedPayment.id))}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
            <div>
              <p className="text-gray-600">Verified At</p>
              <p className="font-medium">{selectedPayment?.verified_at ? new Date(selectedPayment.verified_at).toLocaleString() : "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Rejection Reason</p>
              <p className="font-medium">{selectedPayment?.rejection_reason ?? "-"}</p>
            </div>
          </div>
          {/* Record */}
          <div className="border rounded-md p-4 bg-gray-50 text-sm">
            <p>
              <span className="text-gray-600">Created: </span>
              <span className="font-medium">{new Date(selectedPayment?.created_at ?? "").toLocaleString()}</span>
            </p>
            <p>
              <span className="text-gray-600">Updated: </span>
              <span className="font-medium">{new Date(selectedPayment?.updated_at ?? "").toLocaleString()}</span>
            </p>
          </div>
          {selectedPayment?.status === "awaiting_verification" && (
            <div className="flex flex-col gap-3 mt-4">
              <Button variant="default" onClick={() => setApproveConfirmOpen(true)} disabled={verifyActionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectReasonOpen(true)} disabled={verifyActionLoading}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to approve this payment?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setApproveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setApproveConfirmOpen(false)
                handleVerifyPayment("approve")
              }}
              disabled={verifyActionLoading}
            >
              {verifyActionLoading ? "Processing..." : "Approve"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectReasonOpen} onOpenChange={setRejectReasonOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <p>Please provide a reason for rejecting this payment:</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full mt-2 p-2 border rounded resize-none"
            rows={3}
            placeholder="Enter rejection reason..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRejectReasonOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectReasonOpen(false)
                handleVerifyPayment("reject", rejectReason)
                setRejectReason("") // clear after submit
              }}
              disabled={verifyActionLoading || !rejectReason.trim()}
            >
              {verifyActionLoading ? "Processing..." : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
