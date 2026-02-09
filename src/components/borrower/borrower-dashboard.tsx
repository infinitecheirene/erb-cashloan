"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BorrowerSidebar } from "@/components/borrower/borrower-sidebar"
import Link from "next/link"
import {
  Wallet,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  IdCard,
  HandCoins,
  Calculator,
  CreditCard,
  FileText,
  Clock,
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
  const [loanMap, setLoanMap] = useState<Record<number, Loan>>({});
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
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      // Fetch authenticated user
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!userRes.ok) throw new Error("Failed to fetch user")
      const userData = await userRes.json()
      const u = userData.user || userData
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

      // Fetch loans for authenticated user via new API
      const loansRes = await fetch("/api/borrowers/me/loans", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!loansRes.ok) throw new Error("Failed to fetch loans")
      const loansData = await loansRes.json()
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

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    if (token) {
      await fetch("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (loading || authLoading) {
    return (
      <div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <p className="text-muted-foreground">User not found</p>
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
    <div className="flex min-h-screen bg-background">
      <BorrowerSidebar />
      <div className="flex-1 lg:ml-0">
        <div className="lg:hidden h-16" />

        {/* Profile Header */}
        <header className=" border-b border-border bg-card">
          <div className="w-full flex flex-col px-4 sm:px-6 py-4 justify-between">
            <h2 className="text-2xl font-semibold leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <span className="text-sm text-muted-foreground">
              Member since {memberSinceMonth} {memberSinceYear}
            </span>
            <div className="block lg:hidden border border-t my-2" />
            <div className="flex justify-between">
              <div className="flex flex-col lg:flex-row">
                <div>
                  <Mail className="inline-block h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <div>
                  <Phone className="inline-block h-4 w-4 mr-1 lg:ml-4 text-gray-500" />
                  <span className="text-sm text-muted-foreground">
                    {user.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <MapPin className="inline-block h-4 w-4 mr-1 lg:ml-4 text-gray-500" />
                  <span className="text-sm text-muted-foreground">
                    {user.city || "N/A"}, {user.postalCode || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <Button>Apply New Loan</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Borrowed */}
            <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {Number(loanStats.totalBorrowed).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                <Wallet className="h-6 w-6" />
              </div>
            </Card>

            {/* Monthly Payment */}
            <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {Number(loanStats.monthlyPayment).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Next Payment: {loanStats.nextPayment ?? "—"}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                <HandCoins className="h-6 w-6" />
              </div>
            </Card>

            {/* Outstanding Balance */}
            <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {Number(loanStats.outstandingBalance).toLocaleString(
                    "en-PH",
                    { style: "currency", currency: "PHP" },
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                <IdCard className="h-6 w-6" />
              </div>
            </Card>

            {/* Next Payment */}
            <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {loanStats.nextPayment || "No upcoming payment"}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6 gap-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Upcoming Payment
              </h3>
              <div>
                <Card className="bg-gray-50"></Card>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                >
                  <Calculator className="w-5 h-5" />
                  <span className="text-xs">Loan Calculator</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Make Payment</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">View Statements</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-xs">Payment History</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Active Loans Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Loans</h2>
            <Card className="overflow-x-auto">
              <table className="w-full text-left table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Approved Amount
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Principal
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Outstanding
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Interest Rate
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Term
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="pt-8 pb-3 text-center">
                        <div className="flex flex-col justify-center items-center gap-2">
                          <span>No active loans. </span>
                          <Link
                            href="/dashboard/loans"
                            className="text-white bg-primary w-26 px-2 py-2 rounded-lg"
                          >
                            Apply now
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeLoans.map((l) => {
                      const loanDetail = loanMap[l.id]
                      return (
                        <tr key={l.id} className="border-b border-gray-100">
                          <td className="px-4 py-2">{l.type}</td>
                          <td className="px-4 py-2">
                            {l.approved_amount.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                          </td>
                          <td className="px-4 py-2">
                            {loanDetail?.principal_amount.toLocaleString(
                              "en-PH",
                              { style: "currency", currency: "PHP" },
                            ) ?? "—"}
                          </td>
                          <td className="px-4 py-2">
                            {loanDetail?.outstanding_balance?.toLocaleString(
                              "en-PH",
                              { style: "currency", currency: "PHP" },
                            ) ?? "—"}
                          </td>
                          <td className="px-4 py-2">{l.interest_rate}%</td>
                          <td className="px-4 py-2">{l.term_months} months</td>
                          <td className="px-4 py-2 capitalize">{l.status}</td>
                          <td className="px-4 py-2">
                            {new Date(l.created_at).toLocaleDateString("en-PH")}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Payment History Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <Card className="overflow-x-auto">
              <table className="w-full text-left table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Principal
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Amount Paid
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Outstanding
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="pt-8 pb-3 text-center">
                        No payment history yet.
                      </td>
                    </tr>
                  ) : (
                    loans.map((l) => (
                      <tr key={l.id} className="border-b border-gray-100">
                        <td className="px-4 py-2">{l.type}</td>
                        <td className="px-4 py-2">
                          {l.principal_amount.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </td>
                        <td className="px-4 py-2">
                          {(
                            l?.principal_amount - l?.outstanding_balance
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </td>
                        <td className="px-4 py-2">
                          {l?.outstanding_balance?.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </td>
                        <td className="px-4 py-2 capitalize">{l.status}</td>
                        <td className="px-4 py-2">
                          {new Date(l.updated_at).toLocaleDateString("en-PH")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
