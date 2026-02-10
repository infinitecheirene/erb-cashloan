"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-context"
import {
  LogOut,
  Menu,
  X,
  Building2,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  File,
  User,
  CreditCard,
  DollarSign,
  House
} from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation items for each role
const navigationByRole = {
  borrower: [
    {
      name: "Home",
      href: "/",
      icon: House,
    },
    {
      name: "Dashboard",
      href: "/borrower/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Loans",
      href: "/borrower/loans",
      icon: DollarSign,
    },
    {
      name: "Payments",
      href: "/borrower/payments",
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: "/borrower/settings",
      icon: Settings,
    },
  ],
  lender: [
    {
      name: "Home",
      href: "/",
      icon: House,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Loans",
      href: "/lender/loans",
      icon: FileText,
    },
    {
      name: "Payments",
      href: "/lender/payments",
      icon: CreditCard,
    },
    {
      name: "Borrowers",
      href: "/lender/borrowers",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/lender/settings",
      icon: Settings,
    },
  ],
  admin: [
    {
      name: "Home",
      href: "/",
      icon: House,
    },
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Loans",
      href: "/admin/loans",
      icon: FileText,
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: File,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: User,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
  loan_officer: [
    {
      name: "Dashboard",
      href: "/loan-officer",
      icon: LayoutDashboard,
    },
    {
      name: "Applications",
      href: "/loan-officer/applications",
      icon: FileText,
    },
    {
      name: "Borrowers",
      href: "/loan-officer/borrowers",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/loan-officer/settings",
      icon: Settings,
    },
  ],
}

// Portal names for each role
const portalNames = {
  borrower: "Borrower Portal",
  lender: "Lender Portal",
  admin: "Admin Portal",
  loan_officer: "Loan Officer Portal",
}

export function RoleBasedSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false)
  }

  function isMenuActive(pathname: string, itemHref: string) {
    // Exact match
    if (pathname === itemHref) return true

    // Check if pathname is a child route (dynamic segment)
    // Only consider it a child if it starts with itemHref + "/" AND has at least one more segment
    if (pathname.startsWith(itemHref + "/")) {
      const extraPath = pathname.slice(itemHref.length + 1) // remove itemHref + "/"
      return extraPath.length > 0 && !extraPath.includes("/") // optional: only highlight for immediate child
    }

    return false
  }

  // Don't render sidebar on landing page, auth pages, or public pages
  const publicPaths = [
    "/",
    "/loans",
    "/blogs",
    "/promos",
    "/shop",
    "/blog",
    "/help",
    "/profile",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/pricing",
  ]
  if (publicPaths.includes(pathname || "")) {
    return null
  }

  // Show loading state
  if (loading) {
    return null
  }

  // Don't show sidebar if user is not authenticated
  if (!user) {
    return null
  }

  // Get navigation for current user role
  const userRole = user?.role as keyof typeof navigationByRole
  const navigation = navigationByRole[userRole] || []
  const portalName = portalNames[userRole] || "Portal"

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b h-16 shadow-sm">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{portalName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border w-64 shadow-lg",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-2 px-6 h-16 border-b border-border">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{portalName}</span>
          </div>

          {/* Mobile Header (inside sidebar) */}
          <div className="lg:hidden flex items-center gap-2 px-6 h-16 border-b border-border">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{portalName}</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = "/dashboard".includes(item.href)
                ? pathname === item.href // exact match only
                : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary",
                    isActive &&
                      "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Button>
              )
            })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <p className="text-sm font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                <span className="font-medium">Role:</span>{" "}
                {user.role?.replace("_", " ")}
              </p>
            </div>
          )}

          {/* Logout */}
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
