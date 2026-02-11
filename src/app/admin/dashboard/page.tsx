"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card } from "@/components/ui/card"
import { Wallet, TrendingUp, CreditCard, HandCoins } from "lucide-react"
import { Pie, Line } from "react-chartjs-2"

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

export default function AdminDashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const [users, setUsers] = useState<BorrowerUser[]>([])
    const [loans, setLoans] = useState<Loan[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    // Pagination states
    const [pendingPage, setPendingPage] = useState(1)
    const [historyPage, setHistoryPage] = useState(1)
    const rowsPerPage = 5

    // Redirect if not admin
    useEffect(() => {
        if (!user) return
        if (user.role !== "admin") router.push("/login")
    }, [user, router])

    // Fetch data once
    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem("token")
                if (!token) throw new Error("Unauthorized")

                const res = await fetch("/api/admin/dashboard", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) throw new Error("Failed to fetch dashboard data")
                const data = await res.json()

                const allUsers: BorrowerUser[] = Array.isArray(data.users || data.data || data)
                    ? data.users || data.data || data
                    : []

                const allLoans: Loan[] = Array.isArray(data.loans || data.data || data)
                    ? data.loans || data.data || data
                    : []

                // Ensure each loan has borrower info
                allLoans.forEach(l => {
                    if (!l.borrower && l.user_id) {
                        const borrower = allUsers.find(u => u.id === l.user_id)
                        if (borrower) l.borrower = borrower
                    }
                })

                setUsers(allUsers)
                setLoans(allLoans)
            } catch (err) {
                console.error("Admin fetch error:", err)
                localStorage.removeItem("token")
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }

        fetchAdminData()
    }, [router])

    // Only consider loans with borrower info for stats
    const loansWithBorrowers = useMemo(() => loans.filter(l => l.borrower), [loans])

    // Stats
    const activeLoans = useMemo(
        () => loansWithBorrowers.filter(l => l.status === "approved" && l.outstanding_balance > 0),
        [loansWithBorrowers]
    )

    const monthlyVolume = useMemo(
        () => loansWithBorrowers
            .filter(l => l.status === "approved")
            .reduce((sum, l) => sum + (l.approved_amount || 0), 0),
        [loansWithBorrowers]
    )

    const repaidLoans = useMemo(
        () => loansWithBorrowers.filter(l => l.status === "approved" && l.outstanding_balance === 0),
        [loansWithBorrowers]
    )

    const repaymentRate = useMemo(
        () => loansWithBorrowers.length > 0
            ? ((repaidLoans.length / loansWithBorrowers.length) * 100).toFixed(1)
            : "0",
        [loansWithBorrowers, repaidLoans]
    )

    const loanStatusCounts = useMemo(() => {
        return loansWithBorrowers.reduce<Record<string, number>>((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1
            return acc
        }, {})
    }, [loansWithBorrowers])

    const loanStatusData = {
        labels: Object.keys(loanStatusCounts),
        datasets: [{
            label: "Loans by Status",
            data: Object.values(loanStatusCounts),
            backgroundColor: ["#FBBF24", "#34D399", "#F87171"],
        }],
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const loansByMonth = useMemo(() => {
        const months = Array(12).fill(0)
        loansWithBorrowers.forEach(l => {
            if (l.status === "approved") {
                const month = new Date(l.created_at).getMonth()
                months[month] += l.approved_amount || 0
            }
        })
        return months
    }, [loansWithBorrowers])

    const monthlyTrendData = {
        labels: monthNames,
        datasets: [{
            label: "Approved Loan Volume",
            data: loansByMonth,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
        }],
    }

    // Total borrowers with at least one loan
    const totalBorrowers = useMemo(() => {
        const borrowerIds = new Set(loansWithBorrowers.map(l => l.borrower?.id))
        return borrowerIds.size
    }, [loansWithBorrowers])

    // Filter for search
    const filteredLoans = useMemo(() => loansWithBorrowers.filter(l => l.id.toString().includes(search)), [loansWithBorrowers, search])
    const pendingApprovals = filteredLoans.filter(l => l.status === "pending")

    // Paginated data
    const pendingPageLoans = useMemo(() => {
        const start = (pendingPage - 1) * rowsPerPage
        const end = start + rowsPerPage
        return pendingApprovals.slice(start, end)
    }, [pendingApprovals, pendingPage])

    const historyPageLoans = useMemo(() => {
        const start = (historyPage - 1) * rowsPerPage
        const end = start + rowsPerPage
        return loans.slice(start, end)
    }, [loans, historyPage])

    const totalPendingPages = Math.ceil(pendingApprovals.length / rowsPerPage)
    const totalHistoryPages = Math.ceil(loans.length / rowsPerPage)

    const handleLoanAction = async (loanId: number, action: "approve" | "reject") => {
        const confirmMessage = `Are you sure you want to ${action} loan #${loanId}?`
        if (!window.confirm(confirmMessage)) return

        try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("Unauthorized")
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            const res = await fetch(`${baseUrl}/api/loans/${loanId}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            })

            if (!res.ok) throw new Error(`Failed to ${action} loan`)

            setLoans(prev =>
                prev.map(l =>
                    l.id === loanId ? { ...l, status: action === "approve" ? "approved" : "rejected" } : l
                )
            )

            alert(`Loan #${loanId} ${action}d successfully!`)
        } catch (error) {
            console.error(error)
            alert(`Error: Could not ${action} loan.`)
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            <div className="flex-1 lg:ml-0">
                <div className="lg:hidden h-16" />
                <header className="hidden lg:block border-b border-border bg-card">
                    <div className="w-full flex flex-col px-4 sm:px-6 py-4 justify-between">
                        <div className="flex justify-between">
                            <h2 className="text-2xl font-semibold leading-tight">Dashboard</h2>
                            <div className="mt-4 sm:mt-0">
                                <input
                                    type="text"
                                    placeholder="Search users or loan ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:w-80 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="block lg:hidden border border-t my-2" />
                    </div>
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
                                    <p className="text-sm text-muted-foreground">Monthly Volume</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {monthlyVolume.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
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
                        {/* Loan Status Distribution */}
                        <Card className="p-6 flex flex-col justify-between" style={{ minHeight: 350 }}>
                            <h2 className="text-lg font-semibold mb-4">Loan Status Distribution</h2>
                            <div className="flex-1">
                                <Pie
                                    data={loanStatusData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { padding: 20 } } },
                                    }}
                                />
                            </div>
                        </Card>

                        {/* Monthly Loan Trends */}
                        <Card className="p-6 flex flex-col justify-between" style={{ minHeight: 350 }}>
                            <h2 className="text-lg font-semibold mb-4">Monthly Loan Trends</h2>
                            <div className="flex-1">
                                <Line
                                    data={monthlyTrendData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: "top" },
                                        },
                                        scales: {
                                            x: {
                                                grid: { display: false },
                                            },
                                            y: {
                                                grid: { display: true }, // keep grid lines if you want
                                                border: { display: false }, // replaces drawBorder
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Pending Approvals */}
                        <div className="p-6 border rounded-md bg-accent-foreground shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Pending Approval</h2>
                            <table className="w-full text-left table-auto border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-sm text-muted-foreground" />
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Name</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Email</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Phone</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Approved Amount</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Interest Rate</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Type</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Term</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPageLoans.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="pt-8 pb-3 text-center">No pending loans.</td>
                                        </tr>
                                    ) : (
                                        pendingPageLoans.map(l => (
                                            <tr key={l.id} className="border-b border-gray-100">
                                                <td className="px-4 py-2">{l.type || "--"}</td>
                                                <td className="px-4 py-2">{l.borrower?.first_name} {l.borrower?.last_name}</td>
                                                <td className="px-4 py-2">{l.borrower?.email}</td>
                                                <td className="px-4 py-2">{l.borrower?.phone || "--"}</td>
                                                <td className="px-4 py-2">{(l.approved_amount || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2">{l.interest_rate || "--"}%</td>
                                                <td className="px-4 py-2">{l.term_months ? `${l.term_months} months` : "--"}</td>
                                                <td className="px-4 py-2">{new Date(l.created_at).toLocaleDateString("en-PH")}</td>
                                                <td className="px-4 py-2 capitalize">{l.status}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPendingPages > 1 && (
                                <div className="flex justify-end mt-3 gap-2">
                                    <button disabled={pendingPage === 1} onClick={() => setPendingPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                                    <span className="px-2 py-1">{pendingPage} / {totalPendingPages}</span>
                                    <button disabled={pendingPage === totalPendingPages} onClick={() => setPendingPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>

                        {/* Payment History */}
                        <div className="p-6 border rounded-md bg-accent-foreground shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
                            <table className="w-full text-left table-auto border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Name</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Email</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Phone</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Amount Paid</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Outstanding Balance</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Status</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyPageLoans.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="pt-8 pb-3 text-center">No payment history yet.</td>
                                        </tr>
                                    ) : (
                                        historyPageLoans.map(l => (
                                            <tr key={l.id} className="border-b border-gray-100">
                                                <td className="px-4 py-2">{l.borrower?.first_name} {l.borrower?.last_name}</td>
                                                <td className="px-4 py-2">{l.borrower?.email}</td>
                                                <td className="px-4 py-2">{l.borrower?.phone || "--"}</td>
                                                <td className="px-4 py-2">{((l.principal_amount || 0) - (l.outstanding_balance || 0)).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2">{(l.outstanding_balance || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2 capitalize">{l.status}</td>
                                                <td className="px-4 py-2">{l.updated_at ? new Date(l.updated_at).toLocaleDateString("en-PH") : "--"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalHistoryPages > 1 && (
                                <div className="flex justify-end mt-3 gap-2">
                                    <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                                    <span className="px-2 py-1">{historyPage} / {totalHistoryPages}</span>
                                    <button disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
