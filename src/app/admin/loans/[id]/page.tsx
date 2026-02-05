"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface Loan {
  id: number
  loan_number: string
  type: string
  principal_amount: string
  approved_amount?: string
  interest_rate: string
  term_months?: number
  status: string
  notes?: string
  rejection_reason?: string
  start_date?: string
  first_payment_date?: string
  outstanding_balance?: string
  created_at: string
  updated_at: string
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
  }>
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 capitalize",
  approved: "bg-blue-100 text-blue-700 capitalize",
  rejected: "bg-red-100 text-red-700 capitalize",
  active: "bg-green-100 text-green-700 capitalize",
  completed: "bg-gray-100 text-gray-700 capitalize",
  defaulted: "bg-black text-white capitalize",
}

export default function LoanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`/api/loans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to load loan")

        const data = await res.json()
        setLoan(data.loan)
      } catch {
        toast.error("Failed to load loan details")
        router.push("/admin/loans")
      } finally {
        setLoading(false)
      }
    }

    fetchLoan()
  }, [id, router])

  const downloadDocument = async (docId: number, fileName?: string) => {
    setDownloading(docId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/loans/${id}/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = fileName || "document.pdf"
      a.click()

      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download document")
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!loan) return null

  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 ml-64 bg-background min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card">
          <div className="px-8 py-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Loan Details</h1>
                <p className="text-muted-foreground mt-1">Loan #{loan.loan_number}</p>
              </div>

              <Badge className={statusColors[loan.status] || "bg-gray-100"}>{loan.status}</Badge>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">
          {/* Back */}
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Loan Overview */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Loan Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-medium capitalize">{loan.type}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="font-medium">{loan.term_months} months</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="font-semibold">₱{Number(loan.outstanding_balance ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* People */}
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">People Involved</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Borrower</p>
                <p className="font-medium">
                  {loan.borrower?.first_name} {loan.borrower?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{loan.borrower?.email || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Lender</p>
                <p className="font-medium">{loan.lender ? `${loan.lender.first_name} ${loan.lender.last_name}` : "-"}</p>
                <p className="text-sm text-muted-foreground">{loan.lender?.email || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Loan Officer</p>
                <p className="font-medium">{loan.loan_officer ? `${loan.loan_officer.first_name} ${loan.loan_officer.last_name}` : "-"}</p>
                <p className="text-sm text-muted-foreground">{loan.loan_officer?.email || "-"}</p>
              </div>
            </div>
          </Card>

          {/* Financial Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Financial Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="font-medium">₱{Number(loan.principal_amount).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="font-medium">{loan.approved_amount ? `₱${Number(loan.approved_amount).toLocaleString()}` : "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{loan.interest_rate}%</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{loan.status}</p>
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Timeline</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{loan.created_at ? new Date(loan.created_at).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved At</p>
                <p className="font-medium">{loan.approved_at ? new Date(loan.approved_at).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disbursement Date</p>
                <p className="font-medium">{loan.disbursement_date ? new Date(loan.disbursement_date).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">First Payment Date</p>
                <p className="font-medium">{loan.first_payment_date ? new Date(loan.first_payment_date).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold">Notes & Decisions</h2>

            <p className="text-sm leading-relaxed">{loan.notes || "No notes provided."}</p>

            {loan.rejection_reason && <p className="text-sm text-red-600">Rejection Reason: {loan.rejection_reason}</p>}
          </Card>

          {/* Documents */}
          {loan.documents?.length > 0 && (
            <Card className="p-6 space-y-4 gap-0">
              <h2 className="text-lg font-semibold">Documents</h2>

              {loan.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc.name || doc.file_name}</span>
                  </div>

                  <Button size="sm" variant="outline" disabled={downloading === doc.id} onClick={() => downloadDocument(doc.id, doc.file_name)}>
                    {downloading === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
