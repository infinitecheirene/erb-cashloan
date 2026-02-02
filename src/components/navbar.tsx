"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronDown, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, authenticated, logout } = useAuth()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
  }

  const shouldHideNavbar =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/lender") ||
    pathname?.startsWith("/loan-officer") ||
    pathname?.startsWith("/payments")

  if (shouldHideNavbar) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl text-primary leading-tight">
          LOAN
          <br />
          HUB
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-foreground hover:text-primary text-sm">
            Home
          </Link>
          <Link href="/loans" className="text-foreground hover:text-primary text-sm">
            Loans & Services
          </Link>
          <Link href="/shop" className="text-foreground hover:text-primary text-sm">
            Shop
          </Link>
          <Link href="/promos" className="text-foreground hover:text-primary text-sm">
            Promos
          </Link>
          <Link href="/blog" className="text-foreground hover:text-primary text-sm">
            Blog
          </Link>
          <Link href="/about" className="text-foreground hover:text-primary text-sm">
            About Us
          </Link>
          <Link href="/help" className="text-foreground hover:text-primary text-sm">
            Help Center
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">Get the App</Button>

          {authenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full bg-transparent">
                  {user.first_name} {user.last_name}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full bg-transparent">
                Login
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
