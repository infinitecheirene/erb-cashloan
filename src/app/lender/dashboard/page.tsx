"use client"

import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card } from "@/components/ui/card"
import { Wallet, HandCoins, CreditCard, TrendingUp } from "lucide-react"
import { Chart as ChartJS, CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend, PointElement, LineElement } from "chart.js"
import { Pie, Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend, PointElement, LineElement)

interface BorrowerUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  city?: string
  postalCode?: string
  created_at?: string
}

interface Loan {
  id: number
  type?: string
  principal_amount?: number
  approved_amount: number
  outstanding_balance: number
  interest_rate?: number
  term_months?: number
  status: string
  created_at: string
  updated_at?: string
  borrower?: BorrowerUser
  user_id?: number
}

export default function LenderDashboard() {
  const router = useRouter()
  const { authenticated } = useAuth()
  const [users, setUsers] = useState<BorrowerUser[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!authenticated) {
      router.push("/login")
      return
    }
    if (authenticated) fetchAdminData()
  }, [authenticated, router])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

      const [usersRes, loansRes] = await Promise.all([
        fetch(`${baseUrl}/api/user`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/loans?include=borrower`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!usersRes.ok) throw new Error("Failed to fetch users")
      if (!loansRes.ok) throw new Error("Failed to fetch loans")

      const usersData = await usersRes.json()
      const loansData = await loansRes.json()

      const allUsers: BorrowerUser[] = Array.isArray(usersData?.users || usersData?.data || usersData)
        ? usersData?.users || usersData?.data || usersData
        : []

      const allLoans: Loan[] = Array.isArray(loansData?.loans || loansData?.data || loansData)
        ? loansData?.loans || loansData?.data || loansData
        : []

      // Ensure each loan has a borrower reference
      allLoans.forEach(l => {
        if (!l.borrower && l.user_id) {
          const borrower = allUsers.find(u => u.id === l.user_id)
          if (borrower) l.borrower = borrower
        }
      })

      setUsers(allUsers)
      setLoans(allLoans)
    } catch (error) {
      console.error("Admin fetch error:", error)
      localStorage.removeItem("token")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loansWithBorrowers = useMemo(() => loans.filter(l => l.borrower), [loans])

  const activeLoans = useMemo(
    () => loansWithBorrowers.filter(
      l => l.status === "approved"
    ),
    [loansWithBorrowers]
  );

  const totalBorrowers = useMemo(
    () => new Set(loansWithBorrowers.map(l => l.borrower?.id)).size,
    [loansWithBorrowers]
  );

  const paymentHistory = useMemo(
    () => loansWithBorrowers.filter(l => l.principal_amount && l.outstanding_balance >= 0),
    [loansWithBorrowers]
  );

  // Total approved volume
  const totalLoanVolume = useMemo(
    () => loansWithBorrowers
      .filter(l => l.status === "approved")
      .reduce((sum, l) => sum + (l.approved_amount || 0), 0),
    [loansWithBorrowers]
  );

  // Repaid loans & repayment rate
  const repaidLoans = useMemo(
    () => loansWithBorrowers.filter(l => l.status === "approved" && l.outstanding_balance === 0),
    [loansWithBorrowers]
  );

  const repaymentRate = useMemo(
    () => loansWithBorrowers.length > 0
      ? ((repaidLoans.length / loansWithBorrowers.length) * 100).toFixed(1)
      : "0",
    [loansWithBorrowers, repaidLoans]
  );

  // --- Loan type counts & total volume per type ---
  const loanTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    loansWithBorrowers.forEach(l => {
      const type = l.type || "Other"
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [loansWithBorrowers])

  const loanTypeVolumes = useMemo(() => {
    const volumes: Record<string, number> = {}
    loansWithBorrowers.forEach(l => {
      const type = l.type || "Other"
      volumes[type] = (volumes[type] || 0) + (l.approved_amount || 0)
    })
    return volumes
  }, [loansWithBorrowers])

  const loanTypeData = {
    labels: Object.keys(loanTypeCounts),
    datasets: [{
      label: "Number of Loans",
      data: Object.values(loanTypeCounts),
      backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
    }],
  }

  // Compute monthly volume trends
  const monthlyVolumeData = useMemo(() => {
    const monthsMap: Record<string, number> = {};

    loansWithBorrowers.forEach(l => {
      if (!l.created_at || !l.approved_amount) return;

      const date = new Date(l.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g., "2026-02"

      monthsMap[month] = (monthsMap[month] || 0) + l.approved_amount;
    });

    // Sort months ascending
    const sortedMonths = Object.keys(monthsMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: "Total Types Volume",
          data: sortedMonths.map(m => monthsMap[m]),
          backgroundColor: "#60A5FA",
          borderColor: "#3b82f6",
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [loansWithBorrowers]);


  const loanVolumeData = {
    labels: Object.keys(loanTypeVolumes),
    datasets: [{
      label: "Total Volume (PHP)",
      data: Object.values(loanTypeVolumes),
      backgroundColor: ["#34D399", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA"],
    }],
  }

  // Add new state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- Compute pagination for payment history ---
  const paginatedPaymentHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return paymentHistory.slice(start, start + itemsPerPage);
  }, [paymentHistory, currentPage]);

  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);

  // --- Handlers ---
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 lg:ml-0">
        <div className="lg:hidden h-16" />
        <header className="border-b border-border bg-card px-4 sm:px-6 py-4">
          <h2 className="text-2xl font-semibold">Lender Dashboard</h2>
        </header>

        <main className="p-4 sm:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Borrowers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{loading ? "--" : totalBorrowers}</p>
                </div>
                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{loading ? "--" : activeLoans.length}</p>
                </div>
                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                  <HandCoins className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loan Volume</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loading ? "--" : totalLoanVolume.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                  </p>
                </div>
                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Repayment Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{loading ? "--" : repaymentRate}%</p>
                </div>
                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Loan Type Count */}
            <Card className="p-6 flex flex-col justify-between" style={{ minHeight: 350 }}>
              <h2 className="text-lg font-semibold mb-4">Loan Type Distribution</h2>
              <div className="flex-1">
                <Pie
                  data={loanTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { padding: 20 } } },
                  }}
                />
              </div>
            </Card>

            {/* Loan Type Volume */}
            <Card className="p-6 flex flex-col justify-between" style={{ minHeight: 350 }}>
              <h2 className="text-lg font-semibold mb-4">Monthly Volume Trends</h2>
              <div className="flex-1">
                <Line
                  data={monthlyVolumeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                      x: { grid: { display: false }, title: { display: true, text: 'Month' } },
                      y: { grid: { drawBorder: false }, title: { display: true, text: 'Number of Types' } }
                    },
                  }}
                />
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            {/* Active Loans */}
            <div className="p-6 border rounded-md bg-accent-foreground shadow-md">
              <h2 className="text-lg font-semibold mb-4">Active Loans</h2>
              <table className="w-full text-left table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Approved Amount</th>
                    <th className="px-4 py-2">Principal Amount</th>
                    <th className="px-4 py-2">Outstanding</th>
                    <th className="px-4 py-2">Interest Rate</th>
                    <th className="px-4 py-2">Term</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map(l => (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="px-4 py-2">{l.type}</td>
                      <td className="px-4 py-2">{(l.principal_amount || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                      <td className="px-4 py-2">{l.outstanding_balance.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                      <td className="px-4 py-2">{l.interest_rate}%</td>
                      <td className="px-4 py-2">{l.term_months} months</td>
                      <td className="px-4 py-2 capitalize">{l.status}</td>
                      <td className="px-4 py-2">{new Date(l.created_at).toLocaleDateString("en-PH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment History */}
            <div className="p-6 border rounded-md bg-accent-foreground shadow-md">
              <h2 className="text-lg font-semibold mb-4">Payment History</h2>

              <table className="w-full text-left table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-sm text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Email</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Amount Paid</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Outstanding Balance</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-sm text-muted-foreground">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPaymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="pt-8 pb-3 text-center">
                        No payment history yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedPaymentHistory.map((l) => (
                      <tr key={l.id} className="border-b border-gray-100">
                        <td className="px-4 py-2">{l.borrower?.first_name} {l.borrower?.last_name}</td>
                        <td className="px-4 py-2">{l.borrower?.email}</td>
                        <td className="px-4 py-2">{l.type || "--"}</td>
                        <td className="px-4 py-2">
                          {((l.principal_amount || 0) - (l.outstanding_balance || 0)).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                        </td>
                        <td className="px-4 py-2">
                          {(l.outstanding_balance || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                        </td>
                        <td className="px-4 py-2 capitalize">{l.status}</td>
                        <td className="px-4 py-2">{l.updated_at ? new Date(l.updated_at).toLocaleDateString("en-PH") : "--"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i + 1)}
                      className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : ""}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
