"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ColumnDef } from "@tanstack/react-table"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DataTable } from "@/components/paginated-data-table"
import { PaymentModal } from "@/components/payment-modal"

interface Borrower {
  name: string
  email: string
}
interface Loan {
  id: number
  loan_id: string
  borrower?: Borrower
}
interface Payment {
  id: number
  amount: string
  due_date: string
  status: string
  loan?: Loan
  loan_id: string
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { authenticated, loading: authLoading } = useAuth()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "upcoming" | "overdue" | "paid">("all")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10, total: 0 })
  const [sorting, setSorting] = useState<{ column: string; order: "asc" | "desc" }>({ column: "due_date", order: "asc" })
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  const fetchPayments = async (
    pageIndex = 0,
    pageSize = 10,
    searchValue = search,
    sortColumn = sorting.column,
    sortOrder: "asc" | "desc" = sorting.order,
  ) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      const params = new URLSearchParams({
        type: filterType,
        page: (pageIndex + 1).toString(),
        per_page: pageSize.toString(),
        search: searchValue,
        sort_column: sortColumn,
        sort_order: sortOrder,
      })

      const res = await fetch(`/api/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to fetch payments")
      }

      const data = await res.json()
      console.log("Fetched payments:", data)
      const flattenedPayments = (data.data || []).map((p: Payment) => ({
        ...p,
        borrower_name: p.loan?.borrower?.name || "",
        borrower_email: p.loan?.borrower?.email || "",
      }))
      setPayments(flattenedPayments)

      setPagination({ pageIndex: data.current_page - 1, pageSize: data.per_page, total: data.total })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // debounce search
    const handler = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push("/")
      return
    }
    if (authenticated) {
      fetchPayments(
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch, // use debounced value here
        sorting.column,
        sorting.order,
      )
    }
  }, [authenticated, authLoading, debouncedSearch, filterType, pagination.pageIndex, pagination.pageSize, sorting.column, sorting.order])

  const handlePayClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setPaymentModalOpen(true)
  }

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorFn: (row) => row.loan?.borrower?.name || "-", id: "userName", header: "Borrower" },
      { accessorFn: (row) => row.loan?.borrower?.email || "-", id: "userEmail", header: "Email" },
      { accessorFn: (row) => row.loan_id, id: "loan_id", header: "Loan #" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => `₱${parseFloat(info.getValue() as string).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const value = info.getValue() as Payment["status"]
          const color =
            value === "overdue" ? "bg-red-100 text-red-800" : value === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          return <Badge className={`${color} capitalize`}>{value}</Badge>
        },
      },
      { id: "actions", header: "Actions", cell: ({ row }) => <Button size="sm" onClick={() => handlePayClick(row.original)}></Button> },
    ],
    [],
  )

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all payments</p>
            </div>
            <div className="flex gap-2">
              {["all", "upcoming", "overdue", "paid"].map((t) => (
                <Button key={t} size="sm" variant={filterType === t ? "default" : "outline"} onClick={() => setFilterType(t as any)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 mb-6 border border-red-300 bg-red-50 text-red-700 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={payments}
            pageCount={Math.ceil(pagination.total / pagination.pageSize)}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPageChange={(pageIndex, pageSize) => setPagination((prev) => ({ ...prev, pageIndex, pageSize }))}
            search={search}
            searchFields={["borrower_name", "borrower_email", "loan_id", "id"]}
            searchPlaceholder="Search by user, email, or loan #"
            onSearchChange={(value) => setSearch(value)}
            onSortingChange={(state) => {
              const sort = state[0]
              if (sort) {
                const order = sort.desc ? "desc" : "asc"
                setSorting({ column: sort.id, order })
              }
            }}
          />

          <PaymentModal
            payment={selectedPayment}
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            onSuccess={() => fetchPayments(pagination.pageIndex, pagination.pageSize, search, sorting.column, sorting.order)}
          />
        </main>
      </div>
    </div>
  )
}
