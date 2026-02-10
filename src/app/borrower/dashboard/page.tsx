"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  Wallet,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  HandCoins,
  Calculator,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  DollarSign,
  Calendar,
  CheckCircle2,
  Activity,
  PlusCircle,
  Eye,
} from "lucide-react"

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  city?: string
  postalCode?: string
  created_at?: string
}

interface Loan {
  id: number
  loan_number: string
  outstanding_balance: number
  type: string
  principal_amount: number
  approved_amount: number
  interest_rate: number
  term_months: number
  status: string
  created_at: string
  updated_at: string
  balance: string
  start_date?: string
  next_payment_date?: string
  borrower?: { first_name: string; last_name: string }
  lender?: { first_name: string; last_name: string }
  payments?: any[]
  first_payment_date?: string
  loan_officer?: { name: string }
}

interface LoanStats {
  totalBorrowed: number
  monthlyPayment: number
  outstandingBalance: number
  nextPayment: string | null
}

export default function BorrowerDashboard() {
  const router = useRouter()
  const { authenticated, loading: authLoading } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [loanMap, setLoanMap] = useState<Record<number, Loan>>({})
  const [loanStats, setLoanStats] = useState<LoanStats>({
    totalBorrowed: 0,
    monthlyPayment: 0,
    outstandingBalance: 0,
    nextPayment: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/login")
      return
    }
    if (authenticated) {
      fetchUserAndLoans()
    }
  }, [authenticated, authLoading, router])

  const fetchUserAndLoans = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        router.push("/login")
        return
      }

      // Fetch authenticated user
      const userRes = await fetch(
        `/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!userRes.ok) {
        throw new Error(`Failed to fetch user: ${userRes.status}`)
      }

      const userData = await userRes.json()
      console.log("User data received:", userData)

      const u = userData.user || userData

      if (!u || !u.id) {
        throw new Error("Invalid user data received")
      }

      setUser({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        city: u.city,
        postalCode: u.postal_code,
        created_at: u.created_at,
      })

      // Fetch loans
      const loansRes = await fetch(`/api/borrowers/${u.id}/loans`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!loansRes.ok) {
        console.warn("Failed to fetch loans:", loansRes.status)
        setLoans([])
        setActiveLoans([])
        setLoading(false)
        return
      }

      const loansData = await loansRes.json()
      console.log("Loans data received:", loansData)

      const loanList: Loan[] = loansData.loans || []

      const loanMap: Record<number, Loan> = {}
      loanList.forEach((loan) => {
        loanMap[loan.id] = loan
      })
      setLoanMap(loanMap)

      // Compute stats
      let totalBorrowed = 0
      let monthlyPayment = 0
      let outstandingBalance = 0
      let nextPayment: string | null = null
      const active: Loan[] = []

      loanList.forEach((l) => {
        totalBorrowed += Number(l.principal_amount)
        monthlyPayment +=
          Number(l.approved_amount / l.term_months) +
          Number((l.approved_amount * l.interest_rate) / 100 / l.term_months)
        outstandingBalance += Number(l.outstanding_balance)

        if (l.status === "approved" && l.outstanding_balance > 0) {
          active.push(l)
          if (!nextPayment && l.next_payment_date)
            nextPayment = l.next_payment_date
        }
      })

      setLoanStats({
        totalBorrowed,
        monthlyPayment,
        outstandingBalance,
        nextPayment,
      })
      setActiveLoans(active)
      setLoans(loanList)
    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      setError(err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
      approved: { className: 'bg-primary/10 text-primary border-primary/20', label: 'Approved' },
      active: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
      completed: { className: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Completed' },
      rejected: { className: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
      defaulted: { className: 'bg-red-50 text-red-700 border-red-200', label: 'Defaulted' },
    }

    const config = variants[status] || { className: 'bg-slate-100 text-slate-700 border-slate-200', label: status }
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={fetchUserAndLoans}>Retry</Button>
            <Button onClick={() => router.push('/login')}>Back to Login</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={fetchUserAndLoans}>Retry</Button>
        </div>
      </div>
    )
  }

  const memberSinceMonth = user.created_at
    ? new Date(user.created_at).toLocaleString("default", { month: "long" })
    : ""
  const memberSinceYear = user.created_at
    ? new Date(user.created_at).getFullYear()
    : ""

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome back, {user.firstName} 👋
                </h1>
                <p className="text-slate-600 mb-4">
                  Member since {memberSinceMonth} {memberSinceYear}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phone || "N/A"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {user.city || "N/A"}, {user.postalCode || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push('/dashboard/loans')}
                >
                  <FileText className="h-4 w-4" />
                  My Loans
                </Button>
                <Button
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => router.push('/dashboard/loans/apply')}
                >
                  <PlusCircle className="h-4 w-4" />
                  Apply for Loan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Borrowed Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 border-0 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Borrowed</p>
              <p className="text-2xl font-bold">
                {Number(loanStats.totalBorrowed).toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </p>
            </div>
          </Card>

          {/* Monthly Payment Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <HandCoins className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Monthly Payment</p>
              <p className="text-2xl font-bold">
                {Number(loanStats.monthlyPayment).toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </p>
            </div>
          </Card>

          {/* Outstanding Balance Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border-0 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-slate-200 text-sm font-medium mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold">
                {Number(loanStats.outstandingBalance).toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </p>
            </div>
          </Card>

          {/* Next Payment Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
                <Clock className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Next Payment</p>
              <p className="text-xl font-bold">
                {loanStats.nextPayment || "No upcoming payment"}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Payment Card */}
          <Card className="shadow-sm border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Upcoming Payment
              </h3>
            </div>
            <div className="p-6">
              {loanStats.nextPayment ? (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-600">Due Date</span>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      {loanStats.nextPayment}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-xl font-bold text-slate-900">
                      {Number(loanStats.monthlyPayment).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600">No upcoming payments</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-slate-200 lg:col-span-2">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                  onClick={() => router.push('/dashboard/calculator')}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 group-hover:bg-primary flex items-center justify-center mb-3 transition-colors">
                    <Calculator className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Loan Calculator</p>
                </button>
                <button
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                  onClick={() => router.push('/dashboard/payment')}
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center mb-3 transition-colors">
                    <CreditCard className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Make Payment</p>
                </button>
                <button
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left group"
                  onClick={() => router.push('/dashboard/statements')}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-100 group-hover:bg-amber-500 flex items-center justify-center mb-3 transition-colors">
                    <FileText className="h-5 w-5 text-amber-600 group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">View Statements</p>
                </button>
                <button
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                  onClick={() => router.push('/dashboard/history')}
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 group-hover:bg-slate-700 flex items-center justify-center mb-3 transition-colors">
                    <Clock className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">Payment History</p>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Loans */}
        <Card className="shadow-sm border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Active Loans</h2>
                <p className="text-sm text-slate-600 mt-1">Your currently active loan accounts</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/loans')}
                className="gap-2"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-900 font-medium mb-1">No active loans</p>
                <p className="text-sm text-slate-600 mb-4">Apply for a loan to get started</p>
                <Button
                  onClick={() => router.push("/dashboard/loans/apply")}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const loanDetail = loanMap[loan.id]
                  return (
                    <div
                      key={loan.id}
                      className="group p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-slate-900 capitalize">{loan.type}</span>
                            {getStatusBadge(loan.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 mb-1">Approved Amount</p>
                              <p className="font-semibold text-slate-900">
                                {loan.approved_amount.toLocaleString("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-1">Outstanding</p>
                              <p className="font-semibold text-slate-900">
                                {loanDetail?.outstanding_balance.toLocaleString("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                }) ?? "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-1">Interest Rate</p>
                              <p className="font-semibold text-slate-900">{loan.interest_rate}%</p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-1">Term</p>
                              <p className="font-semibold text-slate-900">{loan.term_months} months</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                          onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Payment History */}
        <Card className="shadow-sm border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
                <p className="text-sm text-slate-600 mt-1">Track your loan payments and progress</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/history')}
                className="gap-2"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {loans.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-900 font-medium mb-1">No payment history yet</p>
                <p className="text-sm text-slate-600">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loans.slice(0, 5).map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-slate-900 capitalize">{loan.type}</span>
                          {getStatusBadge(loan.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 mb-1">Principal</p>
                            <p className="font-semibold text-slate-900">
                              {loan.principal_amount.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-1">Amount Paid</p>
                            <p className="font-semibold text-emerald-600">
                              {(loan.principal_amount - loan.outstanding_balance).toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-1">Outstanding</p>
                            <p className="font-semibold text-slate-900">
                              {loan.outstanding_balance.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-1">Last Updated</p>
                            <p className="font-semibold text-slate-900">
                              {new Date(loan.updated_at).toLocaleDateString("en-PH")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}