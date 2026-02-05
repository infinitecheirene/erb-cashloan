"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!borrower) return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Borrower Details</h1>
              <p className="text-sm text-muted-foreground mt-1">Borrower loans and payments details</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Back Button */}
          <Button onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Borrower Info */}
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

          {/* Borrower Loans */}

          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Loans</h2>

            {borrower.loans && borrower.loans.length > 0 ? (
              <div className="space-y-4">
                {borrower.loans.map((loan) => (
                  <Card key={loan.id} className="p-4 space-y-4 border hover:shadow-sm transition-shadow">
                    {/* Loan Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Loan #{loan.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {loan.type} — ₱{Number(loan.principal_amount).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={statusColors[loan.status] || "bg-gray-100"}>{loan.status}</Badge>
                    </div>

                    {/* Loan Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Approved Amount</p>
                        <p className="font-medium">{loan.approved_amount ? `₱${Number(loan.approved_amount).toLocaleString()}` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outstanding Balance</p>
                        <p className="font-medium">{loan.outstanding_balance ? `₱${Number(loan.outstanding_balance).toLocaleString()}` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{loan.interest_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Term</p>
                        <p className="font-medium">{loan.term_months ?? "-"} months</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{loan.start_date ? new Date(loan.start_date).toLocaleDateString() : "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">First Payment Date</p>
                        <p className="font-medium">{loan.first_payment_date ? new Date(loan.first_payment_date).toLocaleDateString() : "-"}</p>
                      </div>
                    </div>

                    {/* Notes / Rejection */}
                    {(loan.notes || loan.rejection_reason) && (
                      <div className="text-sm space-y-1">
                        {loan.notes && <p className="text-muted-foreground">Notes: {loan.notes}</p>}
                        {loan.rejection_reason && <p className="text-red-600">Rejection Reason: {loan.rejection_reason}</p>}
                      </div>
                    )}

                    {/* Payments */}
                    {loan.payments && loan.payments.length > 0 && (
                      <Card className="p-3 space-y-2 border bg-gray-50">
                        <h3 className="font-semibold text-sm">Payments</h3>

                        <div className="divide-y">
                          {loan.payments.map((payment) => (
                            <div key={payment.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Transaction ID</p>
                                <p className="font-medium">{payment.transaction_id}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-medium">₱{Number(payment.amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-medium capitalize">{payment.status}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium">{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "-"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This borrower has no loans yet.</p>
            )}
          </Card>
        </main>
      </main>
    </div>
  )
}
