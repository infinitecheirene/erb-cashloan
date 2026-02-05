"use client"
import { LenderSidebar } from "@/components/lender/lender-sidebar"
import { DataTable } from "@/components/paginated-data-table"
import { Button } from "@/components/ui/button"
import { ColumnDef, SortingState } from "@tanstack/react-table"
import { Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Borrower {
  id: number
  first_name: string
  last_name: string
  email?: string
}

export default function LenderPaymentsPage() {
  const router = useRouter()
  const [data, setData] = useState<Borrower[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized")

      const sortBy = sorting[0]?.id ?? ""
      const sortDir = sorting[0]?.desc ? "desc" : "asc"

      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(sortBy ? { sortBy, sortDir } : {}),
      }).toString()

      const res = await fetch(`/api/borrowers?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch borrowers")
      }

      const json = await res.json()
      // Expecting the proxy to return the raw Laravel response, adjust if necessary
      setData(json.data ?? [])
      setTotal(json.total ?? json.data?.length ?? 0)
    } catch (error) {
      console.error("Error fetching borrowers:", error)
    }
  }

  // refetch on state changes
  useEffect(() => {
    fetchData()
  }, [page, pageSize, search, sorting])

  const columns: ColumnDef<Borrower>[] = [
    { accessorKey: "first_name", header: "First Name" },
    { accessorKey: "last_name", header: "Last Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/lender/borrowers/${row.original.id}`)}>
          <Eye className="h-4 w-4 text-blue-500" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <LenderSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-primary">Borrowers Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all borrowers</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <DataTable
            columns={columns}
            data={data}
            pageCount={Math.ceil(total / pageSize)}
            pageIndex={page - 1}
            pageSize={pageSize}
            onPageChange={(newPageIndex, newPageSize) => {
              setPage(newPageIndex + 1)
              setPageSize(newPageSize)
            }}
            search={search}
            onSearchChange={setSearch}
            onSortingChange={setSorting}
          />
        </main>
      </div>
    </div>
  )
}
