"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { PaymentModal } from "@/components/payment-modal"
import { AlertCircle, CheckCircle2, Clock, CreditCard, DollarSign, Calendar } from "lucide-react"

interface Payment {
  id: number
  amount: string
  due_date: string
  status: string
  loan?: {
    loan_number: string
    id: number
  }
}

interface Loan {
  id: number
  loan_number: string
  type: string
  amount: string
  principal_amount?: string
  outstanding_balance?: string
  monthly_payment?: string
  interest_rate: string
  term_months: number
  status: string
  next_payment_date?: string
  next_payment_amount?: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const { user, authenticated, loading: authLoading } = useAuth()
  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([])
  const [overduePayments, setOverduePayments] = useState<Payment[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch scheduled payments
      const [upcomingRes, overdueRes, loansRes] = await Promise.all([
        fetch("/api/payments?type=upcoming", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/payments?type=overdue", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // Fetch active loans - FIXED: Changed from /api/borrowers/payments to /api/loans
        fetch("/api/loans?status=active", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!upcomingRes.ok || !overdueRes.ok) {
        throw new Error("Failed to fetch payments")
      }

      const upcoming = await upcomingRes.json()
      const overdue = await overdueRes.json()

      // Directly extract the array from Laravel paginated response
      setUpcomingPayments(Array.isArray(upcoming.payments?.data) ? upcoming.payments.data : [])
      setOverduePayments(Array.isArray(overdue.payments?.data) ? overdue.payments.data : [])

      // Active loans - FIXED: Better handling of different response formats
      if (loansRes.ok) {
        const loansData = await loansRes.json()

        // Handle different possible response structures
        const loans = Array.isArray(loansData.loans?.data)
          ? loansData.loans.data
          : Array.isArray(loansData.loans)
            ? loansData.loans
            : Array.isArray(loansData.data)
              ? loansData.data
              : []

        // Filter for active loans (in case the API returns all loans)
        const active = loans.filter((loan: Loan) => loan.status === "active")
        setActiveLoans(active)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }

    if (authenticated) {
      fetchPayments()
    }
  }, [authenticated, authLoading, router])

  const handlePayClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setPaymentModalOpen(true)
  }

  const handleMakePaymentForLoan = (loan: Loan) => {
    // Calculate monthly payment
    const monthlyPayment =
      loan.monthly_payment ||
      loan.next_payment_amount ||
      (parseFloat(loan.outstanding_balance || loan.principal_amount || loan.amount) / loan.term_months).toFixed(2)

    // Create a payment object from the loan
    const payment: Payment = {
      id: loan.id,
      amount: monthlyPayment,
      due_date: loan.next_payment_date || new Date().toISOString(),
      status: "pending",
      loan: {
        loan_number: loan.loan_number,
        id: loan.id,
      },
    }

    setSelectedPayment(payment)
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Refresh the payments list
    setLoading(true)
    fetchPayments()
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Add padding for mobile header */}
        <div className="lg:hidden h-16" />

        <header className="border-b border-border bg-card">
          <div className="px-4 sm:px-6 py-4">
            <h1 className="text-3xl font-bold text-primary">Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your loan payments</p>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {error && (
            <Card className="p-4 mb-6 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Card>
          )}

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="active" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Active Loans</span>
                <span className="sm:hidden">Active</span>({activeLoans.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Upcoming</span>
                <span className="sm:hidden">Up</span>({upcomingPayments.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Overdue</span>
                <span className="sm:hidden">Over</span>({overduePayments.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Loans Tab */}
            <TabsContent value="active" className="space-y-6 mt-6">
              {activeLoans.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Loans</h3>
                  <p className="text-muted-foreground">You don&apos;t have any active loans at the moment.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeLoans.map((loan) => {
                    const monthlyPayment =
                      loan.monthly_payment ||
                      loan.next_payment_amount ||
                      (parseFloat(loan.outstanding_balance || loan.principal_amount || loan.amount) / loan.term_months).toFixed(2)

                    return (
                      <Card key={loan.id} className="p-4 sm:p-6 border-green-200 bg-green-50/30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                              <span className="text-sm text-muted-foreground">Loan {loan.loan_number}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Monthly Payment</p>
                                  <p className="font-semibold text-lg">
                                    ₱
                                    {parseFloat(monthlyPayment).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                                  <p className="font-medium">
                                    ₱
                                    {parseFloat(loan.outstanding_balance || loan.amount).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Term</p>
                                  <p className="font-medium">{loan.term_months} months</p>
                                </div>
                              </div>
                            </div>

                            {loan.next_payment_date && (
                              <p className="text-sm text-muted-foreground">
                                Next payment due:{" "}
                                {new Date(loan.next_payment_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>

                          <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={() => handleMakePaymentForLoan(loan)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Make Payment
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Payments Tab */}
            <TabsContent value="upcoming" className="space-y-6 mt-6">
              {upcomingPayments.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Payments</h3>
                  <p className="text-muted-foreground">You&apos;re all caught up!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingPayments.map((payment) => (
                    <Card key={payment.id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Loan {payment.loan?.loan_number}</p>
                          <h3 className="text-xl font-semibold mt-1">
                            ₱{parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Due on{" "}
                            {new Date(payment.due_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Button className="w-full sm:w-auto" onClick={() => handlePayClick(payment)}>
                          Pay Now
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Overdue Payments Tab */}
            <TabsContent value="overdue" className="space-y-6 mt-6">
              {overduePayments.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Overdue Payments</h3>
                  <p className="text-muted-foreground">Great job keeping up with your payments!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {overduePayments.map((payment) => (
                    <Card key={payment.id} className="p-4 sm:p-6 border-destructive/50 bg-destructive/5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="destructive">Overdue</Badge>
                            <p className="text-sm text-muted-foreground">Loan {payment.loan?.loan_number}</p>
                          </div>
                          <h3 className="text-xl font-semibold mt-2">
                            ₱{parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </h3>
                          <p className="text-sm text-destructive mt-1">
                            Due on{" "}
                            {new Date(payment.due_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Button variant="destructive" className="w-full sm:w-auto" onClick={() => handlePayClick(payment)}>
                          Pay Immediately
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Payment Modal */}
      <PaymentModal payment={selectedPayment} open={paymentModalOpen} onOpenChange={setPaymentModalOpen} onSuccess={handlePaymentSuccess} />
    </div>
  )
}