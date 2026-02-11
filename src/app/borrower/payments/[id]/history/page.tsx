"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { PaymentModal } from "@/components/payment-modal"
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Calendar,
    ArrowLeft,
    XCircle,
    Printer
} from "lucide-react"

interface Payment {
    id: number
    amount: string
    due_date: string
    paid_date?: string
    status: string // 'paid', 'pending', 'overdue', 'missed'
    payment_number: number
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
    disbursement_date?: string
}

interface PaymentSchedule {
    loan: Loan
    payments: Payment[]
}

export default function PaymentHistoryPage() {
    const router = useRouter()
    const params = useParams()
    const loanId = params.id as string

    const { user, authenticated, loading: authLoading } = useAuth()
    const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    const recomputeStatuses = (payments: Payment[]) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Sort by payment number
        const sorted = [...payments].sort((a, b) => a.payment_number - b.payment_number)

        // Find the last paid payment
        let lastPaidIndex = -1
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].status === "paid" || sorted[i].paid_date) {
                lastPaidIndex = i
            }
        }

        return sorted.map((p, index) => {
            // If already paid -> keep as paid
            if (p.status === "paid" || p.paid_date) {
                return { ...p, status: "paid" }
            }

            // If this payment comes after the last paid payment, it's pending
            if (index > lastPaidIndex) {
                const due = new Date(p.due_date)
                due.setHours(0, 0, 0, 0)

                // Check if it's overdue or missed based on date
                if (due < today) {
                    const daysPast = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
                    return {
                        ...p,
                        status: daysPast > 30 ? "missed" : "overdue",
                    }
                }

                // Otherwise it's pending (future payment)
                return {
                    ...p,
                    status: "pending",
                }
            }

            // This shouldn't happen, but just in case
            return {
                ...p,
                status: "pending",
            }
        })
    }

    const fetchPaymentHistory = async () => {
        try {
            const token = localStorage.getItem("token")

            console.log("Fetching loan ID:", loanId)

            // Fetch specific loan
            const loansRes = await fetch(`/api/loans/${loanId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!loansRes.ok) {
                throw new Error("Failed to fetch loan")
            }

            const loansData = await loansRes.json()
            const loan = loansData.loan || loansData

            // Fetch payment schedule for this loan
            try {
                const paymentsRes = await fetch(`/api/loans/${loanId}/payments`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                let payments: Payment[] = []

                if (paymentsRes.ok) {
                    const paymentsData = await paymentsRes.json()
                    payments = Array.isArray(paymentsData.payments?.data)
                        ? paymentsData.payments.data
                        : Array.isArray(paymentsData.payments)
                            ? paymentsData.payments
                            : Array.isArray(paymentsData)
                                ? paymentsData
                                : generatePaymentSchedule(loan)
                } else {
                    // Generate schedule if API doesn't exist
                    payments = generatePaymentSchedule(loan)
                }

                const updatedPayments = recomputeStatuses(payments)

                console.log("UPDATED PAYMENTS:", updatedPayments)
                console.log("PENDING COUNT:", updatedPayments.filter(p => p.status === 'pending').length)

                setPaymentSchedule({
                    loan,
                    payments: updatedPayments,
                })

            } catch (err) {
                // Fallback to generated schedule
                const generatedPayments = generatePaymentSchedule(loan)
                const updatedPayments = recomputeStatuses(generatedPayments)

                setPaymentSchedule({
                    loan,
                    payments: updatedPayments,
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load payment history")
        } finally {
            setLoading(false)
        }
    }

    // Generate payment schedule if API doesn't provide it
    const generatePaymentSchedule = (loan: Loan): Payment[] => {
        const monthlyPayment = loan.monthly_payment ||
            (parseFloat(loan.amount) / loan.term_months).toFixed(2)

        const startDate = loan.disbursement_date
            ? new Date(loan.disbursement_date)
            : new Date()

        const payments: Payment[] = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 1; i <= loan.term_months; i++) {
            const dueDate = new Date(startDate)
            dueDate.setMonth(dueDate.getMonth() + i)
            dueDate.setHours(0, 0, 0, 0)

            let status = 'pending'
            if (dueDate < today) {
                // Past due date - check if it should be marked as missed or overdue
                const daysPast = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                status = daysPast > 30 ? 'missed' : 'overdue'
            }

            payments.push({
                id: loan.id * 1000 + i,
                amount: monthlyPayment,
                due_date: dueDate.toISOString(),
                status,
                payment_number: i,
                loan: {
                    loan_number: loan.loan_number,
                    id: loan.id,
                },
            })
        }

        return payments
    }

    const handlePrint = () => {
        window.print()
    }

    const handlePrintPDF = async () => {
        try {
            const token = localStorage.getItem("token")

            console.log("Downloading payment schedule PDF for loan:", loanId)

            const response = await fetch(`/api/loans/${loanId}/payment-schedule/export-pdf`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = downloadUrl
                a.download = `loan-${loanId}-payment-schedule-${new Date().toISOString().split("T")[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(downloadUrl)
                document.body.removeChild(a)

                console.log("PDF downloaded successfully")
            } else {
                const errorData = await response.json()
                console.error("Failed to generate PDF:", errorData.message || "Unknown error")
                alert("Failed to generate PDF report. Please try again.")
            }
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Failed to generate PDF report. Please try again.")
        }
    }

    useEffect(() => {
        if (!authenticated && !authLoading) {
            router.push("/")
            return
        }

        if (authenticated && loanId) {
            fetchPaymentHistory()
        }
    }, [authenticated, authLoading, router, loanId])

    const handlePayClick = (payment: Payment) => {
        if (payment.status !== 'paid') {
            setSelectedPayment(payment)
            setPaymentModalOpen(true)
        }
    }

    const handlePaymentSuccess = () => {
        setLoading(true)
        fetchPaymentHistory()
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                    </Badge>
                )
            case 'overdue':
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                    </Badge>
                )
            case 'missed':
                return (
                    <Badge className="bg-gray-600 text-white border-gray-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missed
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'border-green-200 bg-green-50/30'
            case 'overdue':
                return 'border-red-200 bg-red-50/30'
            case 'missed':
                return 'border-gray-300 bg-gray-50'
            default:
                return 'border-blue-200 bg-blue-50/20'
        }
    }

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!paymentSchedule) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex-1 lg:ml-0">
                    <div className="lg:hidden h-16" />
                    <header className="border-b border-border bg-card">
                        <div className="px-4 sm:px-6 py-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="mb-2 -ml-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-3xl font-bold text-primary">Loan Payment Schedule</h1>
                        </div>
                    </header>
                    <main className="p-4 sm:p-6">
                        <Card className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Loan Not Found</h3>
                            <p className="text-muted-foreground">This loan could not be found.</p>
                        </Card>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-payment-card {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="flex min-h-screen bg-background">
                <div className="flex-1 lg:ml-0">
                    <div className="lg:hidden h-16" />

                    <header className="border-b border-border bg-card no-print">
                        <div className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    className="-ml-2"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="gap-2"
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handlePrintPDF}
                                        className="gap-2 bg-red-600 hover:bg-red-700"
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print PDF
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-primary">Loan Payment Schedule</h1>
                                <Badge variant="outline" className="text-sm">
                                    ID: {loanId}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Complete payment schedule for Loan #{paymentSchedule.loan.id}
                            </p>
                        </div>
                    </header>

                    <main className="p-4 sm:p-6 print-area">
                        {error && (
                            <Card className="p-4 mb-6 border-destructive/30 bg-destructive/5 no-print">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            </Card>
                        )}

                        <Card className="p-6">
                            {/* Loan Header */}
                            <div className="mb-6 pb-4 border-b">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">
                                            Loan #{paymentSchedule.loan.loan_number}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {paymentSchedule.loan.type} • {paymentSchedule.loan.term_months} months • {paymentSchedule.loan.interest_rate}% interest
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                                        <p className="text-2xl font-bold">
                                            ₱{parseFloat(paymentSchedule.loan.amount).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Schedule Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(() => {

                                    const paidCount = paymentSchedule.payments.filter(p => p.status === 'paid').length;
                                    const amount = paymentSchedule.payments[0]?.amount;

                                    const paymentCards = [];

                                    // Anchor on the first active payment’s due_date
                                    const firstActivePayment = paymentSchedule.payments[paidCount - 1];
                                    const startDate = new Date(firstActivePayment?.due_date);

                                    for (let i = 0; i < paidCount; i++) {
                                        const payment[i] = {
                                            id: `placeholder-${i}`,
                                            payment_number: i + 1,
                                            amount: amount,
                                            status: 'paid',
                                            due_date: new Date(
                                                startDate.getFullYear(),
                                                startDate.getMonth() + i,
                                                startDate.getDate(),
                                            ), // or calculate based on loan start };
                                        };

                                        paymentCards.push(
                                            <Card
                                                key={payment.id}
                                                className={`p-4 print-payment-card ${payment.status !== 'paid' ? 'cursor-pointer' : 'cursor-default'} transition-all hover:shadow-md ${getStatusColor(payment.status)}`}
                                                onClick={() => handlePayClick(payment)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-medium">
                                                            Payment {payment.payment_number} of {paymentSchedule.loan.term_months}
                                                        </p>
                                                        <p className="text-lg font-bold mt-1">
                                                            ₱{parseFloat(payment.amount).toLocaleString("en-US", {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(payment.status)}
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>
                                                            Due: {new Date(payment.due_date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>

                                                </div>
                                            </Card>
                                        );
                                    }

                                    return paymentCards;
                                })()}

                            </div>
                            {/* Pending Payments Section */}
                            {(() => {
                                const paidCount = paymentSchedule.payments.filter(p => p.status === 'paid').length;
                                const pendingCount = paymentSchedule.loan.term_months - paidCount;

                                if (pendingCount > 0) {
                                    const paymentCards = [];
                                    const amount = paymentSchedule.payments[0]?.amount;
                                    const loanStartDate = new Date(paymentSchedule.payments[0]?.due_date);

                                    console.log("paymentCards: ", paymentSchedule.payments.length);
                                    // Start at the first unpaid payment index (paidCount), 
                                    // and loop until the end of the loan term
                                    for (let i = paidCount; i <= paymentSchedule.loan.term_months; i++) {

                                        const payment = paymentSchedule.payments[i] || {
                                            id: `placeholder-${i}`,
                                            payment_number: i + 1,
                                            amount: 0,
                                            status: 'pending',
                                            due_date: new Date(
                                                loanStartDate.getFullYear(),
                                                loanStartDate.getMonth() + i,
                                                loanStartDate.getDate(),
                                            ), // or calculate based on loan start };
                                        };

                                        paymentCards.push(
                                            <Card
                                                key={payment.id}
                                                className={`p-4 print-payment-card cursor-pointer transition-all hover:shadow-md ${getStatusColor(payment.status)}`}
                                                onClick={() => handlePayClick(payment)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-medium">
                                                            Payment {payment.payment_number} of {paymentSchedule.loan.term_months}
                                                        </p>
                                                        <p className="text-lg font-bold mt-1">
                                                            ₱{parseFloat(amount).toLocaleString("en-US", {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(payment.status)}
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center justify-end  gap-2 text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>
                                                            Due: {new Date(payment.due_date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                        {i === paidCount ? (
                                                            <Button
                                                                size="sm"
                                                                variant={payment.status === 'overdue' || payment.status === 'missed' ? 'destructive' : 'default'}
                                                                className="w-32 mt-2 no-print"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePayClick(payment);
                                                                }}
                                                            >
                                                                <CreditCard className="h-3.5 w-2.5 mr-1" />
                                                                Pay Now
                                                            </Button>
                                                        ) : ('')}

                                                    </div>


                                                </div>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {paymentCards}
                                        </div>
                                    );
                                }

                                return null;
                            })()}
                            {/* Summary Footer */}
                            <div className="mt-6 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Paid</p>
                                    <p className="font-semibold text-green-600">
                                        {paymentSchedule.payments.filter(p => p.status === 'paid').length} / {paymentSchedule.loan.term_months}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Pending</p>
                                    <p className="font-semibold text-blue-600">
                                        {(() => {
                                            const paidCount = paymentSchedule.payments.filter(p => p.status === 'paid').length;
                                            const pendingCount = paymentSchedule.loan.term_months - paidCount;
                                            return pendingCount;
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Overdue</p>
                                    <p className="font-semibold text-red-600">
                                        {paymentSchedule.payments.filter(p => p.status === 'overdue').length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Missed</p>
                                    <p className="font-semibold text-gray-600">
                                        {paymentSchedule.payments.filter(p => p.status === 'missed').length}
                                    </p>
                                </div>
                            </div>
                        </Card>



                    </main>
                </div>

                {/* Payment Modal */}
                <PaymentModal
                    payment={selectedPayment}
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </>
    )
}