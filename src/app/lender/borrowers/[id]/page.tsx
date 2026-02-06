"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LenderSidebar } from "@/components/lender/lender-sidebar"

interface Payment {
  id: number
  transaction_id: string
  amount: string
  status: string
  due_date: string
  paid_at?: string
  created_at: string
  updated_at: string
}

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
  payments?: Payment[]
}

interface Borrower {
  id: number
  first_name: string
  last_name: string
  email?: string
  loans?: Loan[]
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 capitalize",
  approved: "bg-blue-100 text-blue-700 capitalize",
  rejected: "bg-red-100 text-red-700 capitalize",
  active: "bg-green-100 text-green-700 capitalize",
  completed: "bg-gray-100 text-gray-700 capitalize",
  defaulted: "bg-black text-white capitalize",
}

export default function BorrowerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [borrower, setBorrower] = useState<Borrower | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    const fetchBorrower = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`/api/borrowers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to load borrower")

        const data = await res.json()
        setBorrower(data.borrower)
      } catch {
        toast.error("Failed to load borrower details")
        router.push("/admin/borrowers")
      } finally {
        setLoading(false)
      }
    }

    fetchBorrower()
  }, [id, router])

  const downloadDocument = async (id: number, docId: number, fileName?: string) => {
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!borrower) return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <LenderSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-primary">Borrowers Details</h1>
              <p className="text-sm text-muted-foreground mt-1">Borrower loans and payments details</p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Back Button */}
          <Button onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Borrower Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {borrower.first_name} {borrower.last_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{borrower.email || "-"}</p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="loans" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-3xl">
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

           

            {/*  LOANS  */}
            <TabsContent value="loans" className="space-y-4">
              {borrower.loans?.length ? (
                borrower.loans.map((loan) => (
                  <Card key={loan.id} className="p-5 space-y-4 border hover:shadow-sm transition-shadow">
                    {/* Loan Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Loan #{loan.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {loan.type} — ₱{Number(loan.principal_amount).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
                    </div>
                    {/* Loan Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <Info label="Approved Amount" value={loan.approved_amount ? `₱${Number(loan.approved_amount).toLocaleString()}` : "-"} />
                      <Info
                        label="Outstanding Balance"
                        value={loan.outstanding_balance ? `₱${Number(loan.outstanding_balance).toLocaleString()}` : "-"}
                      />
                      <Info label="Interest Rate" value={`${loan.interest_rate}%`} />
                      <Info label="Term" value={`${loan.term_months ?? "-"} months`} />
                      <Info label="Start Date" value={loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "-"} />
                      <Info
                        label="First Payment Date"
                        value={loan.first_payment_date ? new Date(loan.first_payment_date).toLocaleDateString() : "-"}
                      />
                    </div>
                    {/* Notes / Rejection */}
                    {(loan.notes || loan.rejection_reason) && (
                      <div className="text-sm space-y-1">
                        {loan.notes && <p className="text-muted-foreground">Notes: {loan.notes}</p>}
                        {loan.rejection_reason && <p className="text-red-600">Rejection Reason: {loan.rejection_reason}</p>}
                      </div>
                    )}
                    {/* Documents */}
                    {loan.documents?.length > 0 ? (
                      <Card className="p-6 space-y-4 gap-0">
                        <h2 className="text-lg font-semibold">Documents</h2>

                        {loan.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{doc.name || doc.file_name}</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={downloading === doc.id}
                              onClick={() => downloadDocument(doc.loan_id, doc.id, doc.file_name)}
                            >
                              {downloading === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </Card>
                    ) : (
                      <div className="pt-3 border-t text-sm">
                        <p className="font-medium mb-2">Documents</p>
                        <p className="text-muted-foreground">No documents uploaded</p>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">This borrower has no loans yet.</p>
              )}
            </TabsContent>

            {/* PAYMENTS  */}
            <TabsContent value="payments" className="space-y-4">
              {borrower.loans?.flatMap((loan) => loan.payments || []).length ? (
                borrower.loans.flatMap((loan) =>
                  loan.payments?.map((payment) => {
                    const status = payment.status || "-"
                    const label = statusLabels[status] || status
                    const style = statusStyles[status] || "bg-gray-100 text-gray-800"

                    return (
                      <Card key={payment.id} className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">Payment — Loan #{loan.id}</p>
                          <Badge className={style}>{label}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <Info label="Transaction ID" value={payment.transaction_id} />
                          <Info label="Amount" value={`₱${Number(payment.amount).toLocaleString()}`} />
                          <Info label="Due Date" value={payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "-"} />
                        </div>

                        {/* Proof of Payment */}
                        {payment?.proof_of_payment ? (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">Proof of Payment</h4>
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">{payment.proof_of_payment.split("/").pop()}</p>
                                  <p className="text-sm text-muted-foreground">Proof of Payment</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => downloadFile(payment.id)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t text-sm">
                            <p className="font-medium mb-1">Proof of Payment</p>
                            <p className="text-muted-foreground">No proof uploaded</p>
                          </div>
                        )}
                      </Card>
                    )
                  }),
                )
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              )}
            </TabsContent>

            {/* TIMELINE */}
            <TabsContent value="timeline" className="space-y-6">
              {borrower.loans?.length ? (
                borrower.loans.map((loan) => (
                  <Card key={loan.id} className="p-5 space-y-5 border hover:shadow-sm transition-shadow">
                    <h3 className="text-base font-semibold">Loan #{loan.id} Timeline</h3>

                    {/* Loan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <Info label="Start Date" value={loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "-"} />
                      <Info
                        label="First Payment Date"
                        value={loan.first_payment_date ? new Date(loan.first_payment_date).toLocaleDateString() : "-"}
                      />
                      <Info label="Approved At" value={loan.approved_at ? new Date(loan.approved_at).toLocaleDateString() : "-"} />
                      <Info label="Created At" value={loan.created_at ? new Date(loan.created_at).toLocaleDateString() : "-"} />
                    </div>

                    {/* Payments */}
                    {loan.payments?.length ? (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Payments</h4>
                        <div className="grid grid-cols-4 gap-4 p-2 bg-muted rounded-md text-sm mb-2 font-semibold">
                          <span>ID</span>
                          <span>Transaction ID</span>
                          <span>Due Date</span>
                          <span>Status</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          {loan.payments.map((payment) => {
                            const status = payment.status || "-"
                            const label = statusLabels[status] || status
                            const style = statusStyles[status] || "bg-gray-100 text-gray-800"

                            return (
                              <li key={payment.id} className="grid grid-cols-4 gap-4 p-2 bg-muted rounded-md">
                                <span className="font-medium w-24">Payment #{payment.id}</span>
                                <span className="truncate w-48">{payment.transaction_id ? payment.transaction_id : "-"}</span>
                                <span className="w-28">{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "-"}</span>
                                <Badge className={style}>{label}</Badge>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No timeline available.</p>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  )
  function Info({ label, value }) {
    return (
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    )
  }
}
