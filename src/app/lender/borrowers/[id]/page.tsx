"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  User,
  Mail,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface Payment {
  id: number
  transaction_id: string
  amount: string
  status: string
  due_date: string
  paid_at?: string
  created_at: string
  updated_at: string
  proof_of_payment?: string
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
  approved_at?: string
  payments?: Payment[]
  documents?: Array<{
    id: number
    name?: string
    file_name?: string
    loan_id: number
    [key: string]: any
  }>
}

interface Borrower {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  profile_url?: string
  created_at?: string
  loans?: Loan[]
}

const statusConfig: Record<string, {
  label: string
  className: string
  icon: React.ReactNode
}> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <Clock className="h-3 w-3" />
  },
  approved: {
    label: "Approved",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: <TrendingUp className="h-3 w-3" />
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  defaulted: {
    label: "Defaulted",
    className: "bg-black text-white border-black",
    icon: <AlertCircle className="h-3 w-3" />
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  late: {
    label: "Late",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <AlertCircle className="h-3 w-3" />
  },
  missed: {
    label: "Missed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="h-3 w-3" />
  },
  awaiting_verification: {
    label: "Awaiting Verification",
    className: "bg-yellow-200 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-3 w-3" />
  },
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
        router.push("/lender/borrowers")
      } finally {
        setLoading(false)
      }
    }

    fetchBorrower()
  }, [id, router])

  const downloadDocument = async (
    loanId: number,
    docId: number,
    fileName?: string,
  ) => {
    setDownloading(docId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/loans/${loanId}/documents/${docId}/download`, {
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
      toast.success("Document downloaded successfully")
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

      const proxyUrl = `/api/payments/${paymentId}/proof/download`

      const res = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch file")

      const blob = await res.blob()

      const disposition = res.headers.get("content-disposition")
      let fileName = "proof.png"

      if (disposition?.includes("filename=")) {
        const match = disposition.match(/filename="?(.+)"?/)
        if (match && match[1]) fileName = match[1]
      }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading borrower details...</p>
        </div>
      </div>
    )
  }

  if (!borrower) return null

  const InfoCard: React.FC<{
    icon: React.ReactNode
    label: string
    value: string | number
    className?: string
  }> = ({ icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground mt-1 break-words">
          {value}
        </p>
      </div>
    </div>
  )

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant="outline" className={`${config.className} gap-1.5`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const totalLoans = borrower.loans?.length || 0
  const activeLoans = borrower.loans?.filter(l => l.status === 'active').length || 0
  const totalBorrowed = borrower.loans?.reduce((sum, loan) =>
    sum + Number(loan.approved_amount || loan.principal_amount || 0), 0
  ) || 0
  const totalOutstanding = borrower.loans?.reduce((sum, loan) =>
    sum + Number(loan.outstanding_balance || 0), 0
  ) || 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-white hover:bg-blue-500/20 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Profile Image */}
                {borrower.profile_url ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-lg flex-shrink-0">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${borrower.profile_url}`}
                      alt={`${borrower.first_name} ${borrower.last_name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 border-4 border-white/20">
                    {borrower.first_name.charAt(0).toUpperCase()}
                    {borrower.last_name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Borrower Info */}
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {borrower.first_name} {borrower.last_name}
                  </h1>
                  <p className="text-blue-100 text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Borrower ID: #{borrower.id}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs text-blue-100 mb-1">Total Loans</p>
                  <p className="text-2xl font-bold">{totalLoans}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs text-blue-100 mb-1">Active</p>
                  <p className="text-2xl font-bold">{activeLoans}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs text-blue-100 mb-1">Total Borrowed</p>
                  <p className="text-lg font-bold">₱{totalBorrowed.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs text-blue-100 mb-1">Outstanding</p>
                  <p className="text-lg font-bold">₱{totalOutstanding.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Contact Information
              </CardTitle>
              <CardDescription>Borrower contact details and account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard
                  icon={<Mail className="h-5 w-5 text-blue-600" />}
                  label="Email Address"
                  value={borrower.email || "Not provided"}
                />
                <InfoCard
                  icon={<User className="h-5 w-5 text-blue-600" />}
                  label="Phone Number"
                  value={borrower.phone || "Not provided"}
                />
                <InfoCard
                  icon={<Calendar className="h-5 w-5 text-blue-600" />}
                  label="Member Since"
                  value={borrower.created_at
                    ? new Date(borrower.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : "N/A"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="loans" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="loans" className="gap-2">
                <FileText className="h-4 w-4" />
                Loans
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <Receipt className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            {/* LOANS TAB */}
            <TabsContent value="loans" className="space-y-4">
              {borrower.loans?.length ? (
                borrower.loans.map((loan) => (
                  <Card key={loan.id} className="overflow-hidden border-l-4 border-l-blue-600">
                    <CardHeader className="bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Loan #{loan.id}
                            <StatusBadge status={loan.status} />
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {loan.type} • Created {new Date(loan.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Loan Financial Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <InfoCard
                          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                          label="Principal Amount"
                          value={`₱${Number(loan.principal_amount).toLocaleString()}`}
                        />
                        <InfoCard
                          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                          label="Approved Amount"
                          value={loan.approved_amount
                            ? `₱${Number(loan.approved_amount).toLocaleString()}`
                            : "Pending"
                          }
                        />
                        <InfoCard
                          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
                          label="Outstanding Balance"
                          value={loan.outstanding_balance
                            ? `₱${Number(loan.outstanding_balance).toLocaleString()}`
                            : "₱0"
                          }
                        />
                        <InfoCard
                          icon={<Percent className="h-5 w-5 text-purple-600" />}
                          label="Interest Rate"
                          value={`${loan.interest_rate}% per annum`}
                        />
                      </div>

                      <Separator className="my-6" />

                      {/* Loan Schedule Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <InfoCard
                          icon={<Clock className="h-5 w-5 text-blue-600" />}
                          label="Term Duration"
                          value={`${loan.term_months ?? "N/A"} months`}
                        />
                        <InfoCard
                          icon={<Calendar className="h-5 w-5 text-blue-600" />}
                          label="Start Date"
                          value={loan.start_date
                            ? new Date(loan.start_date).toLocaleDateString()
                            : "Not started"
                          }
                        />
                        <InfoCard
                          icon={<Calendar className="h-5 w-5 text-blue-600" />}
                          label="First Payment Date"
                          value={loan.first_payment_date
                            ? new Date(loan.first_payment_date).toLocaleDateString()
                            : "Not scheduled"
                          }
                        />
                      </div>

                      {/* Notes and Rejection Reason */}
                      {(loan.notes || loan.rejection_reason) && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-3">
                            {loan.notes && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-blue-900 mb-1 uppercase tracking-wider">
                                  Notes
                                </p>
                                <p className="text-sm text-blue-800">{loan.notes}</p>
                              </div>
                            )}
                            {loan.rejection_reason && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-red-900 mb-1 uppercase tracking-wider">
                                  Rejection Reason
                                </p>
                                <p className="text-sm text-red-800">{loan.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Documents Section */}
                      {loan.documents && loan.documents.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Loan Documents ({loan.documents.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {loan.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {doc.name || doc.file_name || "Untitled Document"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        PDF Document
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={downloading === doc.id}
                                    onClick={() => downloadDocument(loan.id, doc.id, doc.file_name)}
                                    className="ml-3 flex-shrink-0"
                                  >
                                    {downloading === doc.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      This borrower has no loans yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-4">
              {borrower.loans?.flatMap((loan) => loan.payments || []).length ? (
                borrower.loans.flatMap((loan) =>
                  loan.payments?.map((payment) => (
                    <Card key={payment.id} className="overflow-hidden">
                      <CardHeader className="bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              Payment for Loan #{loan.id}
                              <StatusBadge status={payment.status} />
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Transaction ID: {payment.transaction_id}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <InfoCard
                            icon={<DollarSign className="h-5 w-5 text-green-600" />}
                            label="Payment Amount"
                            value={`₱${Number(payment.amount).toLocaleString()}`}
                          />
                          <InfoCard
                            icon={<Calendar className="h-5 w-5 text-blue-600" />}
                            label="Due Date"
                            value={payment.due_date
                              ? new Date(payment.due_date).toLocaleDateString()
                              : "Not set"
                            }
                          />
                          <InfoCard
                            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                            label="Paid At"
                            value={payment.paid_at
                              ? new Date(payment.paid_at).toLocaleDateString()
                              : "Not paid yet"
                            }
                          />
                        </div>

                        {/* Proof of Payment */}
                        {payment.proof_of_payment && (
                          <>
                            <Separator className="my-6" />
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Proof of Payment
                              </h4>
                              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {payment.proof_of_payment.split("/").pop()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Payment Receipt
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadFile(String(payment.id))}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No payments recorded yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TIMELINE TAB */}
            <TabsContent value="timeline" className="space-y-6">
              {borrower.loans?.length ? (
                borrower.loans.map((loan) => (
                  <Card key={loan.id} className="overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Loan #{loan.id} Timeline
                      </CardTitle>
                      <CardDescription>
                        Complete history and payment schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Key Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <InfoCard
                          icon={<Calendar className="h-5 w-5 text-blue-600" />}
                          label="Created At"
                          value={new Date(loan.created_at).toLocaleDateString()}
                        />
                        <InfoCard
                          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                          label="Approved At"
                          value={loan.approved_at
                            ? new Date(loan.approved_at).toLocaleDateString()
                            : "Not approved"
                          }
                        />
                        <InfoCard
                          icon={<Calendar className="h-5 w-5 text-blue-600" />}
                          label="Start Date"
                          value={loan.start_date
                            ? new Date(loan.start_date).toLocaleDateString()
                            : "Not started"
                          }
                        />
                        <InfoCard
                          icon={<Calendar className="h-5 w-5 text-blue-600" />}
                          label="First Payment"
                          value={loan.first_payment_date
                            ? new Date(loan.first_payment_date).toLocaleDateString()
                            : "Not scheduled"
                          }
                        />
                      </div>

                      {/* Payment Schedule */}
                      {loan.payments && loan.payments.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-blue-600" />
                              Payment Schedule ({loan.payments.length} payments)
                            </h4>
                            <div className="space-y-2">
                              {loan.payments.map((payment, index) => (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-blue-600">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                                        <p className="text-sm font-medium truncate">
                                          {payment.transaction_id || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className="text-sm font-medium">
                                          {payment.due_date
                                            ? new Date(payment.due_date).toLocaleDateString()
                                            : "N/A"
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Amount</p>
                                        <p className="text-sm font-medium">
                                          ₱{Number(payment.amount).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <StatusBadge status={payment.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No timeline available.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  )
}