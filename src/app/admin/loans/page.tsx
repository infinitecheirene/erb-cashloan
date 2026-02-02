"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Eye, FileText, Loader2, Download } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

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

interface LoanOfficer {
  id: number
  name: string
  email: string
}

interface LoanDocument {
  id: number
  file_name?: string
  name?: string
  uploaded_at?: string
  created_at?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-blue-100 text-blue-800",
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { authenticated, loading, user } = useAuth()
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null)
  const [appLoading, setAppLoading] = useState(true)
  const [downloadingDoc, setDownloadingDoc] = useState<number | null>(null)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
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
  const [loanOfficerId, setLoanOfficerId] = useState<number | null>(null)

  // Reject form state
  const [rejectionReason, setRejectionReason] = useState("")

  // Loan officers for auto-suggest
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([])
  const [loanOfficerSearch, setLoanOfficerSearch] = useState("")

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

  // Fetch loan officers for auto-suggest
  useEffect(() => {
    if (!loanOfficerSearch || user?.role !== "admin") return
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`/api/loan-officers?q=${encodeURIComponent(loanOfficerSearch)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch loan officers")
        const data = await res.json()
        setLoanOfficers(data.loan_officers)
      } catch (err) {
        console.error(err)
      }
    }, 300) // debounce 300ms

    return () => clearTimeout(timeout)
  }, [loanOfficerSearch, user?.role])

  useEffect(() => {
    fetchApplications()
  }, [])

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      toast.error("Error activating loan", { description: message })
    } finally {
      setActivating(false)
    }
  }

  const handleApprove = async () => {
    if (!approvedAmount || !loanOfficerId) {
      toast.error("Error", { description: "Amount and officer are required" })
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const body = {
        approved_amount: Number(approvedAmount),
        interest_rate: approvedRate ? Number(approvedRate) : undefined,
        loan_officer_id: loanOfficerId,
      }

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
      setLoanOfficerId(null)
      setLoanOfficerSearch("")
      setSelectedApp(null)
      setShowApproveModal(false)

      // Refetch applications
      fetchApplications()
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred"
      toast.error("Error", { description: errorMsg })
    }
  }

  const handleDownloadDocument = async (doc: LoanDocument) => {
    setDownloadingDoc(doc.id)
    const loanId = selectedApp?.id
    if (!loanId) return
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`/api/loans/${loanId}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to download document (${response.status})`)
      }

      const blob = await response.blob()

      const fileName = doc.file_name || `document_${doc.id}.pdf`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Success", {
        description: "Document downloaded successfully",
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to download document"
      toast.error("Error", {
        description: errorMsg,
      })
    } finally {
      setDownloadingDoc(null)
    }
  }
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

        <div className="px-8 py-8">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Loan Number</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading applications...
                      </TableCell>
                    </TableRow>
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No pending applications
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/50">
                        <TableCell>{app.id}</TableCell>
                        <TableCell>{app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : "N/A"}</TableCell>
                        <TableCell className="capitalize">{app.type}</TableCell>
                        <TableCell>₱{parseFloat(app.principal_amount).toLocaleString()}</TableCell>
                        <TableCell>{app.interest_rate}%</TableCell>
                        <TableCell>
                          <Badge className={statusColors[app.status] || "bg-gray-100"}>{app.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app)
                              setShowViewModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-green-300" />
                          </Button>

                          {app.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedApp(app)
                                  setApprovedAmount(app.principal_amount)
                                  setApprovedRate(app.interest_rate)
                                  setShowApproveModal(true)
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedApp(app)
                                  setShowRejectModal(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}

                          {app.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app)
                                setActivateStartDate(app.start_date || "")
                                setActivateFirstPaymentDate(app.first_payment_date || "")
                                setShowActivateModal(true)
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* View Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            {selectedApp && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Loan Application Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Borrower & Loan Info in grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-md p-4">
                    {/* Borrower Info */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Borrower</h3>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {selectedApp.borrower?.first_name} {selectedApp.borrower?.last_name}
                      </p>

                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedApp.borrower?.email || "-"}</p>

                      <p className="text-xs text-muted-foreground">Employment</p>
                      <p className="font-medium capitalize">{selectedApp.employment_status || "-"}</p>
                    </div>

                    {/* Loan Info */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Loan</h3>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedApp.type}</p>

                      <p className="text-xs text-muted-foreground">Requested</p>
                      <p className="font-medium">₱{parseFloat(selectedApp.principal_amount).toLocaleString()}</p>

                      <p className="text-xs text-muted-foreground">Approved</p>
                      <p className="font-medium">
                        {selectedApp.approved_amount ? `₱${parseFloat(selectedApp.approved_amount).toLocaleString()}` : "-"}
                      </p>

                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-medium">{selectedApp.interest_rate}%</p>

                      <p className="text-xs text-muted-foreground">Term</p>
                      <p className="font-medium">{selectedApp.term_months || "-"} months</p>

                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={statusColors[selectedApp.status]}>{selectedApp.status}</Badge>

                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="font-medium">
                        ₱{selectedApp.outstanding_balance ? parseFloat(selectedApp.outstanding_balance).toLocaleString() : "0"}
                      </p>
                    </div>
                  </div>

                  {/* Dates & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-md p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Dates</h3>
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="font-medium">{selectedApp.start_date || "-"}</p>

                      <p className="text-xs text-muted-foreground">First Payment</p>
                      <p className="font-medium">{selectedApp.first_payment_date || "-"}</p>

                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(selectedApp.created_at).toLocaleString()}</p>

                      <p className="text-xs text-muted-foreground">Updated</p>
                      <p className="font-medium">{new Date(selectedApp.updated_at).toLocaleString()}</p>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Notes</h3>
                      <p className="text-xs text-muted-foreground">General</p>
                      <p className="font-medium">{selectedApp.notes || "-"}</p>

                      <p className="text-xs text-muted-foreground">Rejection Reason</p>
                      <p className="font-medium">{selectedApp.rejection_reason || "-"}</p>
                    </div>
                  </div>

                  {/* Lender & Officer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-md p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Borrower</h3>
                      <p className="font-medium">
                        {selectedApp.borrower?.first_name} {selectedApp.borrower?.last_name} ({selectedApp.borrower?.email || "-"})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Lender</h3>
                      <p className="font-medium">
                        {selectedApp.lender?.first_name} {selectedApp.lender?.last_name} ({selectedApp.lender?.email || "-"})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Loan Officer</h3>
                      <p className="font-medium">
                        {selectedApp.loan_officer?.first_name} {selectedApp.loan_officer?.last_name} ({selectedApp.loan_officer?.email || "-"})
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {selectedApp?.documents?.length ? (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Documents ({selectedApp.documents.length})</h4>
                        <div className="space-y-1">
                          {selectedApp.documents.map((doc) => (
                            <Card key={doc.id} className="p-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <div className="truncate text-sm font-medium w-full max-w-[180px]">
                                    {doc.name || doc.file_name || `Document ${doc.id}`}
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc)} disabled={downloadingDoc === doc.id}>
                                  {downloadingDoc === doc.id ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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

              {/* Loan Officer Search + Select */}
              <div className="space-y-2 relative">
                <Label htmlFor="loanOfficerSearch">Assign Loan Officer</Label>
                <Input
                  id="loanOfficerSearch"
                  placeholder="Search Loan Officer..."
                  value={loanOfficerSearch}
                  onChange={(e) => setLoanOfficerSearch(e.target.value)}
                />

                {loanOfficerSearch && loanOfficers.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto mt-1">
                    {loanOfficers.map((officer) => (
                      <div
                        key={officer.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setLoanOfficerId(officer.id)
                          setLoanOfficerSearch(officer.name)
                        }}
                      >
                        {officer.name} ({officer.email})
                      </div>
                    ))}
                  </div>
                )}
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
      </main>
    </div>
  )
}
