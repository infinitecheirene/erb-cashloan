"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card } from "@/components/ui/card"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    HandCoins,
} from "lucide-react"

interface BorrowerUser {
    id: number
    first_name: string
    last_name: string
    email: string
    created_at?: string
}

interface Loan {
    id: number
    status: string
    approved_amount: number
    outstanding_balance: number
    created_at: string
}

export default function AdminDashboard() {
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

        if (authenticated) {
            fetchAdminData()
        }

    }, [authenticated, router])

    const fetchAdminData = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            const [usersRes, loansRes] = await Promise.all([
                fetch("http://localhost:8000/api/user", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:8000/api/loans", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            if (!usersRes.ok || !loansRes.ok) {
                throw new Error("Failed to fetch admin data")
            }

            const usersData = await usersRes.json()
            const loansData = await loansRes.json()

            const normalizedUsers = Array.isArray(usersData.users)
                ? usersData.users
                : Array.isArray(usersData)
                    ? usersData
                    : []

            const normalizedLoans = Array.isArray(loansData.loan)
                ? loansData.loan
                : Array.isArray(loansData.loans)
                    ? loansData.loans
                    : Array.isArray(loansData)
                        ? loansData
                        : []

            setUsers(normalizedUsers)
            setLoans(normalizedLoans)
        } catch (error) {
            console.error("Admin fetch error:", error)
            localStorage.removeItem("token")
            router.push("/login")
        } finally {
            setLoading(false)
        }
    }

    // Search
    const filteredUsers = useMemo(() => {
        return users.filter((user) =>
            `${user.first_name} ${user.last_name} ${user.email}`
                .toLowerCase()
                .includes(search.toLowerCase())
        )
    }, [users, search])

    const filteredLoans = useMemo(() => {
        return loans.filter((loan) =>
            loan.id.toString().includes(search)
        )
    }, [loans, search])

    // Stats
    const activeLoans = filteredLoans.filter(
        (loan) => loan.status === "approved" && loan.outstanding_balance > 0
    )

    const monthlyVolume = filteredLoans
        .filter((loan) => loan.status === "approved")
        .reduce((sum, loan) => sum + loan.approved_amount, 0)

    const repaidLoans = filteredLoans.filter(
        (loan) => loan.status === "approved" && loan.outstanding_balance === 0
    )

    const repaymentRate =
        filteredLoans.length > 0
            ? ((repaidLoans.length / filteredLoans.length) * 100).toFixed(1)
            : "0"

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <div className="flex-1 lg:ml-0">
                <div className="lg:hidden h-16" />

                <header className=" border-b border-border bg-card">
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
                                    <p className="text-sm text-muted-foreground">Total User</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {loading ? "--" : users.length}
                                    </p>
                                </div>
                                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Loans</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {loading ? "--" : activeLoans.length}
                                    </p>
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
                                        {monthlyVolume.toLocaleString("en-PH", {
                                            style: "currency",
                                            currency: "PHP",
                                        })}
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
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {loading ? "--" : repaymentRate}%
                                    </p>
                                </div>
                                <div className="p-2 text-gray-500 bg-emerald-100 border-gray-300 rounded-sm">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Recent Loans</h2>
                            <p className="text-muted-foreground">Loan list coming soon...</p>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">System Overview</h2>
                            <p className="text-muted-foreground">Analytics coming soon...</p>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

