"use client"

import { useState, useEffect, ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from "lucide-react"
import { authenticatedFetch, handleApiResponse } from "@/lib/auth"
import { useRouter } from "next/navigation"

// Generic types
export interface ColumnDef<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: "left" | "center" | "right"
  render?: (value: any, row: T) => ReactNode
}

export interface FilterConfig {
  key: string
  label: string
  type: "select" | "search"
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: string
}

export interface DataTableProps<T> {
  // Data fetching
  apiEndpoint: string
  refresh?: boolean

  // Column configuration
  columns: ColumnDef<T>[]

  // Filter configuration
  filters?: FilterConfig[]
  searchPlaceholder?: string
  searchFields?: string[] // Fields to search in

  // Row actions
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void

  // Details dialog
  detailsDialog?: {
    enabled: boolean
    title: string
    render: (row: T) => ReactNode
  }

  // Styling
  className?: string
  emptyMessage?: string
  loadingMessage?: string

  // Additional features
  defaultPerPage?: number
  defaultSort?: { field: string; order: "asc" | "desc" }
  hideFilters?: boolean
  hidePagination?: boolean
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

type SortOrder = "asc" | "desc" | null

export function ReusableDataTable<T extends Record<string, any>>({
  apiEndpoint,
  refresh = false,
  columns,
  filters = [],
  searchPlaceholder = "Search...",
  searchFields = [],
  rowActions,
  onRowClick,
  detailsDialog,
  className = "",
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  defaultPerPage = 5,
  defaultSort,
  hideFilters = false,
  hidePagination = false,
}: DataTableProps<T>) {
  const router = useRouter()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRow, setSelectedRow] = useState<T | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: defaultPerPage,
    total: 0,
    from: 0,
    to: 0,
  })

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [perPage, setPerPage] = useState(defaultPerPage.toString())
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {}
      filters.forEach((filter) => {
        initial[filter.key] =
          filter.defaultValue || (filter.type === "select" ? "all" : "")
      })
      return initial
    },
  )
  const [sortField, setSortField] = useState<string | null>(
    defaultSort?.field || null,
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    defaultSort?.order || null,
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPagination((prev) => ({ ...prev, current_page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [
    pagination.current_page,
    perPage,
    searchTerm,
    refresh,
    sortField,
    sortOrder,
    filterValues,
  ])

  const fetchData = async () => {
    setLoading(true)
    try {
      const currentPage = pagination.current_page || 1
      const itemsPerPage = perPage || defaultPerPage.toString()

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage,
      })

      // Add search
      if (searchTerm) {
        params.append("search", searchTerm)
        if (searchFields.length > 0) {
          params.append("search_fields", searchFields.join(","))
        }
      }

      // Add filters
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value)
        }
      })

      // Add sorting
      if (sortField && sortOrder) {
        params.append("sort_by", sortField)
        params.append("sort_order", sortOrder)
      }

      const url = `${apiEndpoint}?${params}`

      console.log("📡 [DataTable] Fetching:", url)

      // Use authenticatedFetch instead of direct fetch
      const response = await authenticatedFetch(url)
      const result = await handleApiResponse<any>(response, router)

      console.log("📦 [DataTable] Full response:", result)
      console.log("📊 [DataTable] Data array:", result.data)
      console.log("📈 [DataTable] Pagination:", {
        current_page: result.current_page,
        last_page: result.last_page,
        total: result.total,
      })

      // ✅ Direct Laravel pagination format
      const dataArray = Array.isArray(result.data) ? result.data : []

      console.log("✅ [DataTable] Setting data:", dataArray.length, "items")

      setData(dataArray)
      setPagination({
        current_page: result.current_page || 1,
        last_page: result.last_page || 1,
        per_page: result.per_page || defaultPerPage,
        total: result.total || 0,
        from: result.from || 0,
        to: result.to || 0,
      })
    } catch (error) {
      console.error("❌ [DataTable] Error fetching data:", error)
      setData([])
      // Error is already handled by handleApiResponse (401 redirects to login)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortField(null)
        setSortOrder(null)
      }
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 text-blue-800" />
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-blue-800" />
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }

  const clearFilters = () => {
    setSearchInput("")
    setSearchTerm("")
    const resetFilters: Record<string, string> = {}
    filters.forEach((filter) => {
      resetFilters[filter.key] =
        filter.defaultValue || (filter.type === "select" ? "all" : "")
    })
    setFilterValues(resetFilters)
    setSortField(null)
    setSortOrder(null)
    setPagination((prev) => ({ ...prev, current_page: 1 }))
  }

  const hasActiveFilters = () => {
    if (searchTerm) return true
    if (sortField) return true
    return Object.entries(filterValues).some(([key, value]) => {
      const filter = filters.find((f) => f.key === key)
      const defaultVal =
        filter?.defaultValue || (filter?.type === "select" ? "all" : "")
      return value !== defaultVal
    })
  }

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row)
    }
    if (detailsDialog?.enabled) {
      setSelectedRow(row)
      setIsDetailsOpen(true)
    }
  }

  // Get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((curr, key) => curr?.[key], obj)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters Section */}
      {!hideFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Filters */}
            {filters.map((filter) => {
              if (filter.type === "select") {
                return (
                  <Select
                    key={filter.key}
                    value={filterValues[filter.key]}
                    onValueChange={(value) =>
                      handleFilterChange(filter.key, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }
              return null
            })}
          </div>

          {/* Active Filters */}
          {hasActiveFilters() && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button
                    onClick={() => {
                      setSearchInput("")
                      setSearchTerm("")
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {Object.entries(filterValues).map(([key, value]) => {
                const filter = filters.find((f) => f.key === key)
                const defaultVal =
                  filter?.defaultValue ||
                  (filter?.type === "select" ? "all" : "")
                if (value && value !== defaultVal) {
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {filter?.label}:{" "}
                      <span className="capitalize">{value}</span>
                      <button
                        onClick={() => handleFilterChange(key, defaultVal)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                }
                return null
              })}
              {sortField && (
                <Badge variant="secondary" className="gap-1">
                  <span className="capitalize">
                    Sort: {sortField} ({sortOrder})
                  </span>
                  <button
                    onClick={() => {
                      setSortField(null)
                      setSortOrder(null)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/20 align-top transition-colors">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`text-blue-800 font-semibold ${column.width || ""} ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                          ? "text-right"
                          : ""
                    }`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center justify-center gap-1 transition-colors w-full"
                      >
                        {column.label}
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                {rowActions && (
                  <TableHead className="text-blue-800 font-semibold text-center w-[100px]">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="flex items-center justify-center gap-1 transition-colors w-full"
                  >
                    {loadingMessage}
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="flex items-center justify-center gap-1 transition-colors w-full"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={`hover:bg-blue-50/50 transition-colors border-b border-gray-100 ${
                      onRowClick || detailsDialog?.enabled
                        ? "cursor-pointer"
                        : ""
                    }`}
                  >
                    {columns.map((column) => {
                      const value = getNestedValue(row, column.key)
                      return (
                        <TableCell
                          key={column.key}
                          className={`
                            ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""}`}
                          onClick={() => handleRowClick(row)}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      )
                    })}
                    {rowActions && (
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div onClick={() => handleRowClick(row)}>
                          {rowActions(row)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!hidePagination && (
        <div className="bg-primary/10 text-blue-800 border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-blue-800 whitespace-nowrap">
                Showing {pagination.from} to {pagination.to} of{" "}
                {pagination.total} items
              </p>
              <Select
                value={perPage}
                onValueChange={(value) => {
                  setPerPage(value)
                  setPagination((prev) => ({ ...prev, current_page: 1 }))
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, current_page: 1 }))
                }
                disabled={pagination.current_page === 1}
              >
                <ChevronsLeft className="h-4 w-4 text-blue-800" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current_page: prev.current_page - 1,
                  }))
                }
                disabled={pagination.current_page === 1}
              >
                <ChevronLeft className="h-4 w-4 text-blue-800" />
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-blue-800 whitespace-nowrap">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current_page: prev.current_page + 1,
                  }))
                }
                disabled={pagination.current_page === pagination.last_page}
              >
                <ChevronRight className="h-4 w-4 text-blue-800" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current_page: pagination.last_page,
                  }))
                }
                disabled={pagination.current_page === pagination.last_page}
              >
                <ChevronsRight className="h-4 w-4 text-blue-800" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      {detailsDialog?.enabled && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{detailsDialog.title}</DialogTitle>
            </DialogHeader>
            {selectedRow && detailsDialog.render(selectedRow)}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
