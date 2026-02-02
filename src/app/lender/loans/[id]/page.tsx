"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { LenderSidebar } from "@/components/lender/lender-sidebar"
import { AlertCircle, CheckCircle2, FileText, Download, Calendar, DollarSign, Percent, Clock, User, Briefcase } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Loan {
  id: number
  loan_number: string
  type: string
  amount: string
  interest_rate: string
  term_months: number
  total_amount: string
  outstanding_balance: string
  status: string
  purpose: string
  created_at: string
  approved_at?: string
  disbursement_date?: string
  borrower?: {
    name: string
    email: string
  }
  documents?: Array<{
    id: number
    document_type: string
    file_name: string
  }>
}

export default function LoanDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const loanId = params?.id
  const { user, authenticated, loading: authLoading } = useAuth()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activating, setActivating] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }

    if (!loanId) return

    fetchLoanDetails()
  }, [authenticated, authLoading, loanId, router])

  const fetchLoanDetails = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch loan details")
      }

      const data = await response.json()
      setLoan(data.loan)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loan")
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!loan) return

    setActivating(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/loans/${loan.id}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to activate loan")
      }

      // Success! Refresh the loan details
      await fetchLoanDetails()
      setShowActivateDialog(false)

      // Show success message
      alert("Loan activated successfully! Payment schedule has been generated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate loan")
    } finally {
      setActivating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: "Pending" },
      approved: { variant: "secondary", label: "Approved" },
      active: { variant: "default", label: "Active" },
      completed: { variant: "default", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
      defaulted: { variant: "destructive", label: "Defaulted" },
    }

    const config = variants[status] || { variant: "default", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!loan) {
    return <div className="min-h-screen flex items-center justify-center">Loan not found</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 lg:ml-0">
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Loan Details</h2>
                <p className="text-sm text-muted-foreground mt-1">{loan.loan_number}</p>
              </div>
              {getStatusBadge(loan.status)}
            </div>
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

          {/* Activate Button for Approved Loans */}
          {loan.status === "approved" && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-blue-900">Ready to Activate</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This loan has been approved and is ready to be activated. Activating will generate the payment schedule and disburse the funds.
                  </p>
                </div>
                <Button onClick={() => setShowActivateDialog(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Activate Loan
                </Button>
              </div>
            </Card>
          )}

          {/* Active Loan Success Message */}
          {loan.status === "active" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Loan Active</h3>
                  <p className="text-sm text-green-700 mt-1">This loan is active and payment schedule has been generated.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Borrower Information */}
          {loan.borrower && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Borrower Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{loan.borrower.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{loan.borrower.email}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Loan Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Loan Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Principal Amount
                </p>
                <p className="text-2xl font-bold mt-1">₱{parseFloat(loan.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Interest Rate
                </p>
                <p className="text-2xl font-bold mt-1">{loan.interest_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Term
                </p>
                <p className="text-2xl font-bold mt-1">{loan.term_months} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </p>
                <p className="text-2xl font-bold mt-1">₱{parseFloat(loan.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              {loan.status === "active" && (
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold mt-1">
                    ₱{parseFloat(loan.outstanding_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-medium mt-1 capitalize">{loan.type.replace("_", " ")}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium mt-1">{loan.purpose}</p>
              </div>
            </div>
          </Card>

          {/* Documents */}
          {loan.documents && loan.documents.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </h3>
              <div className="space-y-3">
                {loan.documents.map((doc) => (
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
                        window.open(`/api/loans/${loan.id}/documents/${doc.id}/download`, "_blank")
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Application Date</p>
                <p className="font-medium">
                  {new Date(loan.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {loan.approved_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Approval Date</p>
                  <p className="font-medium">
                    {new Date(loan.approved_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {loan.disbursement_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Disbursement Date</p>
                  <p className="font-medium">
                    {new Date(loan.disbursement_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>

      {/* Activate Confirmation Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Loan</DialogTitle>
            <DialogDescription>Are you sure you want to activate this loan? This will:</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm">✓ Set the loan status to &quot;Active&quot;</p>
            <p className="text-sm">✓ Generate {loan.term_months} monthly payment schedules</p>
            <p className="text-sm">✓ Set disbursement date to today</p>
            <p className="text-sm">✓ Enable the borrower to start making payments</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)} disabled={activating}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={activating}>
              {activating ? "Activating..." : "Activate Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
