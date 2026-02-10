"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
    Minus,
    Plus
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
    const [loanStats, setLoanStats] = useState<LoanStats>({
        totalBorrowed: 0,
        monthlyPayment: 0,
        outstandingBalance: 0,
        nextPayment: null,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Modal state
    const [showCalculator, setShowCalculator] = useState(false)

    // Calculator state
    const [loanAmount, setLoanAmount] = useState(50000)
    const [loanTerm, setLoanTerm] = useState(12)

    const termOptions = [6, 12, 18, 24, 36]

    const handleAmountChange = (amount: number) => {
        if (amount < 5000) amount = 5000
        if (amount > 5000000) amount = 5000000
        setLoanAmount(amount)
    }

    const processingFee = loanAmount * 0.02
    const disbursedAmount = loanAmount - processingFee

    // Example interest logic (you can adjust rate)
    const interestRate = 12 // 12% annual sample
    const monthlyPayment =
        (loanAmount + loanAmount * (interestRate / 100)) / loanTerm

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
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Unauthorized");

            // Fetch authenticated user
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!userRes.ok) throw new Error("Failed to fetch user");
            const userData = await userRes.json();
            const u = userData.user || userData;
            setUser({
                id: u.id,
                firstName: u.first_name,
                lastName: u.last_name,
                email: u.email,
                phone: u.phone,
                city: u.city,
                postalCode: u.postal_code,
                created_at: u.created_at,
            });

            // Fetch loans for the user
            const loansRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/borrowers/${u.id}/loans?include=borrower,lender,payments`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (!loansRes.ok) throw new Error("Failed to fetch loans");
            const loansData = await loansRes.json();
            const loanList: Loan[] = loansData.loans || [];

            // Compute loan stats
            let totalBorrowed = 0;
            let monthlyPayment = 0;
            let outstandingBalance = 0;
            let nextPayment: string | null = null;

            // Filter active loans
            const active = loanList.filter(
                (l) =>
                    l.status.toLowerCase() === "active"
            );

            loanList.forEach((l) => {
                totalBorrowed += Number(l.principal_amount);
                outstandingBalance += Number(l.outstanding_balance);
            });

            active.forEach((l) => {
                monthlyPayment +=
                    Number(l.approved_amount) / Number(l.term_months) +
                    (Number(l.approved_amount) * Number(l.interest_rate)) / 100 / Number(l.term_months);

                if (!nextPayment && l.next_payment_date) {
                    nextPayment = l.next_payment_date;
                }
            });

            setLoanStats({
                totalBorrowed,
                monthlyPayment,
                outstandingBalance,
                nextPayment,
            });

            setLoans(loanList);
            setActiveLoans(active); // <- correctly set active loans here
        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("token")
        if (token) {
            await fetch("http://localhost:8000/api/auth/logout", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            })
        }
        localStorage.removeItem("token")
        router.push("/login")
    }

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
            <div className="flex-1">
                <div className="lg:hidden h-16" />

                {/* Profile Header */}
                <header className="border-b border-border bg-card sticky top-16 lg:top-0 z-40">
                    <div className="w-full flex flex-col px-4 sm:px-6 py-4 justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold leading-tight mt-1 text-primary">{user.firstName} {user.lastName}</h2>
                                <span className="text-sm text-muted-foreground">Member since {memberSinceMonth} {memberSinceYear}</span>
                                <div className="block lg:hidden border border-t my-2" />

                                <div className="flex justify-between">
                                    <div className="flex flex-col lg:flex-row">
                                        <div>
                                            <Mail className="inline-block h-4 w-4 mr-1 text-gray-500" />
                                            <span className="text-sm text-muted-foreground">{user.email}</span>
                                        </div>
                                        <div>
                                            <Phone className="inline-block h-4 w-4 mr-1 lg:ml-4 text-gray-500" />
                                            <span className="text-sm text-muted-foreground">{user.phone || "N/A"}</span>
                                        </div>
                                        <div>
                                            <MapPin className="inline-block h-4 w-4 mr-1 lg:ml-4 text-gray-500" />
                                            <span className="text-sm text-muted-foreground">{user.city || "N/A"}, {user.postalCode || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button>
                                    Apply New Loan
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Borrowed */}
                        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {Number(loanStats.totalBorrowed).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                </p>
                            </div>
                            <div className="shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                                <Wallet className="h-6 w-6" />
                            </div>
                        </Card>

                        {/* Monthly Payment */}
                        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {Number(loanStats.monthlyPayment).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Next Payment: {loanStats.nextPayment ?? "—"}
                                </p>
                            </div>
                            <div className="shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                                <HandCoins className="h-6 w-6" />
                            </div>
                        </Card>

                        {/* Outstanding Balance */}
                        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {Number(loanStats.outstandingBalance).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                </p>
                            </div>
                            <div className="shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
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
                            <div className="shrink-0 p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6 gap-2">
                        <Card className="p-6 h-auto">
                            <h3 className="text-lg font-semibold text-card-foreground">
                                Upcoming Payment
                            </h3>

                            {activeLoans.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No active payments.
                                </div>
                            ) : (
                                (() => {
                                    // Sort active loans by next payment date
                                    const sortedLoans = [...activeLoans].sort((a, b) => {
                                        if (!a.next_payment_date) return 1
                                        if (!b.next_payment_date) return -1
                                        return (
                                            new Date(a.next_payment_date).getTime() -
                                            new Date(b.next_payment_date).getTime()
                                        )
                                    })

                                    const nextLoan = sortedLoans[0]

                                    const monthlyAmount =
                                        Number(nextLoan.approved_amount) /
                                        Number(nextLoan.term_months) +
                                        (Number(nextLoan.approved_amount) *
                                            Number(nextLoan.interest_rate)) /
                                        100 /
                                        Number(nextLoan.term_months)

                                    return (
                                        <div className="bg-gray-50 p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Loan Type
                                                </span>
                                                <span className="font-medium">
                                                    {nextLoan.type}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Due Date
                                                </span>
                                                <span className="font-medium">
                                                    {nextLoan.next_payment_date
                                                        ? new Date(
                                                            nextLoan.next_payment_date
                                                        ).toLocaleDateString("en-PH")
                                                        : "—"}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Amount Due
                                                </span>
                                                <span className="font-bold text-lg">
                                                    {monthlyAmount.toLocaleString("en-PH", {
                                                        style: "currency",
                                                        currency: "PHP",
                                                    })}
                                                </span>
                                            </div>

                                            <div className="pt-2">
                                                <Button className="w-full">
                                                    Make Payment
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })()
                            )}
                        </Card>

                        {/* Quick Actions */}
                        <Card className="card-elevated p-6 h-auto">
                            <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">

                                {/* LOAN CALCULATOR */}
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCalculator(true)}
                                    className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                                >
                                    <Calculator className="w-5 h-5" />
                                    <span className="text-xs">Loan Calculator</span>
                                </Button>

                                {/* MAKE PAYMENT */}
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-xs">Make Payment</span>
                                </Button>

                                {/* VIEW STATEMENTS */}
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="text-xs">View Statements</span>
                                </Button>

                                {/* DOCUMENTS */}
                                <Button
                                    asChild
                                    variant="outline"
                                    className="flex flex-col items-center gap-2 h-auto py-4 hover:text-black hover:bg-blue-200"
                                >
                                    <Link href="/documents">
                                        <Clock className="w-5 h-5" />
                                        <span className="text-xs">Documents</span>
                                    </Link>
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
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Type</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Approved Amount</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Principal</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Outstanding</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Interest Rate</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Term</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLoans.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="pt-8 pb-3 text-center">
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
                                        activeLoans.map((l) => (
                                            <tr key={l.id} className="border-b border-gray-100">
                                                <td className="px-4 py-2">{l.type}</td>

                                                <td className="px-4 py-2">
                                                    {Number(l.approved_amount).toLocaleString("en-PH", {
                                                        style: "currency",
                                                        currency: "PHP",
                                                    })}
                                                </td>

                                                <td className="px-4 py-2">
                                                    {Number(l.principal_amount).toLocaleString("en-PH", {
                                                        style: "currency",
                                                        currency: "PHP",
                                                    })}
                                                </td>

                                                <td className="px-4 py-2">
                                                    {Number(l.outstanding_balance).toLocaleString("en-PH", {
                                                        style: "currency",
                                                        currency: "PHP",
                                                    })}
                                                </td>

                                                <td className="px-4 py-2">{l.interest_rate}%</td>

                                                <td className="px-4 py-2">{l.term_months} months</td>

                                                <td className="px-4 py-2">
                                                    {new Date(l.created_at).toLocaleDateString("en-PH")}
                                                </td>
                                            </tr>
                                        ))
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
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Type</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Principal</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Amount Paid</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Outstanding</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Status</th>
                                        <th className="px-4 py-2 text-sm text-muted-foreground">Last Updated</th>
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
                                                <td className="px-4 py-2">{l.principal_amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2">{(l.principal_amount - l.outstanding_balance).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2">{l.outstanding_balance.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</td>
                                                <td className="px-4 py-2 capitalize">{l.status}</td>
                                                <td className="px-4 py-2">{new Date(l.updated_at).toLocaleDateString("en-PH")}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>

                        {/* Loan Calculator Modal */}
                        {showCalculator && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl relative overflow-y-auto">

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowCalculator(false)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-black text-lg"
                                    >
                                        ✕
                                    </button>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                                            {/* Input Section */}
                                            <Card className="border border-border p-5 rounded-2xl">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <div className="w-8 h-8 p-3 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        LH
                                                    </div>
                                                    <h2 className="text-xl font-bold">
                                                        Get a sample cash loan computation
                                                    </h2>
                                                </div>

                                                {/* Loan Amount */}
                                                <div className="mb-8">
                                                    <label className="block text-sm font-semibold mb-3">
                                                        How much money do you need?
                                                    </label>

                                                    <div className="flex items-center justify-center gap-4">
                                                        <button
                                                            onClick={() => handleAmountChange(loanAmount - 5000)}
                                                            className="w-12 h-4 rounded-lg border"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>

                                                        <input
                                                            type="number"
                                                            value={loanAmount}
                                                            onChange={(e) => handleAmountChange(Number(e.target.value))}
                                                            className="flex-1 text-center text-lg font-semibold border rounded-md"
                                                        />

                                                        <button
                                                            onClick={() => handleAmountChange(loanAmount + 5000)}
                                                            className="w-12 h-4 rounded-lg border"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="range"
                                                        min="5000"
                                                        max="5000000"
                                                        step="1000"
                                                        value={loanAmount}
                                                        onChange={(e) => handleAmountChange(Number(e.target.value))}
                                                        className="w-full mt-4"
                                                    />
                                                </div>

                                                {/* Terms */}
                                                <div>
                                                    <label className="block text-sm font-semibold mb-4">
                                                        Sample Loan Terms (months)
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {termOptions.map((term) => (
                                                            <button
                                                                key={term}
                                                                onClick={() => setLoanTerm(term)}
                                                                className={`px-4 py-2 rounded-lg font-semibold ${loanTerm === term
                                                                    ? "bg-primary text-white"
                                                                    : "border"
                                                                    }`}
                                                            >
                                                                {term}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Results Section */}
                                            <Card className="bg-yellow-50 p-8 rounded-2xl">
                                                <div className="space-y-6">

                                                    <div className="flex justify-between">
                                                        <span>Loan Term</span>
                                                        <span>{loanTerm} months</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Loan Amount</span>
                                                        <span>₱{loanAmount.toLocaleString()}</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Processing Fee (2%)</span>
                                                        <span className="text-red-500">
                                                            -₱{processingFee.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Amount to be Disbursed</span>
                                                        <span>
                                                            ₱{disbursedAmount.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="bg-white rounded-lg p-4 mt-6">
                                                        <p className="text-sm text-muted-foreground">
                                                            Estimated Monthly Installment
                                                        </p>
                                                        <p className="text-xl font-bold">
                                                            ₱{Math.round(monthlyPayment).toLocaleString()} / month
                                                        </p>
                                                    </div>

                                                    <Link href="/dashboard/loans">
                                                        <Button className="w-full mt-4">
                                                            Apply for this Loan
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}