"use client"

import { useState, useEffect } from "react"
import { ReusableDataTable, ColumnDef, FilterConfig } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Eye, Calendar, User as UserIcon, RefreshCw, Users } from "lucide-react"
import Image from "next/image"

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  profile_url: string | null
  status: string
  created_at: string
}

const UserManagementPage = () => {
  const [refresh, setRefresh] = useState(false)

  // ✅ ADD THIS DEBUG EFFECT

  const handleRefresh = () => {
    setRefresh(!refresh)
  }

  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      approved: { className: "bg-green-100 text-green-800 border-green-200", label: "Approved" },
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  // Define columns
  const columns: ColumnDef<User>[] = [
    {
      key: "profile_url",
      label: "Profile",
      width: "w-[100px]",
      align: "center",
      render: (value, user) => (
        value ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden mx-auto border-2 border-blue-100">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${value}`}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-semibold shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      width: "w-[200px]",
      render: (value) => (
        <div className="font-medium text-gray-900 break-words whitespace-normal">
          {value}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: "w-[250px]",
      render: (value) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-4 w-4 text-blue-800/60 flex-shrink-0" />
          <span className="text-sm text-center break-words whitespace-normal">{value}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      width: "w-[180px]",
      align: "center",
      render: (value) => (
        value ? (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Phone className="h-4 w-4 text-blue-800/60 flex-shrink-0" />
            <span className="text-sm break-words whitespace-normal">{value}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">N/A</span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "w-[120px]",
      align: "center",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "actions",
      label: "Actions",
      width: "w-[100px]",
      align: "center",
      render: (value, user) => (
        <Button
          variant="outline"
          size="sm"
          className="group text-blue-800 hover:bg-blue-300 hover:text-white border-none transition-all"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ]

  // Define filters
  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      defaultValue: "all",
      options: [
        { value: "all", label: "All Status" },
        { value: "approved", label: "Approved" },
        { value: "pending", label: "Pending" },
      ],
    },
  ]

  // Details dialog render
  const renderDetailsDialog = (user: User) => (
    <>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Member Profile
        </h2>
        <p className="text-blue-100 text-sm">View detailed member information</p>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Profile Section */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {user.profile_url ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.profile_url}`}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-800 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name and Status */}
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {user.name}
              </h3>
              <div className="flex items-center gap-3">
                {getStatusBadge(user.status)}
                <span className="text-sm text-gray-500">
                  Member ID: #{user.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="bg-gray-50 px-8 py-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-800" />
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-all">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Since
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="w-full flex-1 ml-0 min-h-screen pt-16 lg:pt-0">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-16 lg:top-0 z-40 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                </div>
                <p className="text-slate-600">
                  Centralized administration of accounts and roles
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <ReusableDataTable<User>
            apiEndpoint="/api/users"
            refresh={refresh}
            columns={columns}
            filters={filters}
            searchPlaceholder="Search by name, email, or phone..."
            searchFields={['name', 'email', 'phone']}
            detailsDialog={{
              enabled: true,
              title: "Member Profile",
              render: renderDetailsDialog,
            }}
            defaultPerPage={5}
            defaultSort={{ field: 'created_at', order: 'desc' }}
            emptyMessage="No users found"
            loadingMessage="Loading users..."
          />
        </div>
      </main>
    </div>
  )
}

export default UserManagementPage