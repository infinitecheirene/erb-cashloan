"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, LogOut, Menu, X, Download } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function Navbar() {
  const { user, authenticated, logout } = useAuth()
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallButton(false)
    }

    setDeferredPrompt(null)
  }

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
  }

  const shouldHideNavbar =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/lender") ||
    pathname?.startsWith("/loan-officer") ||
    pathname?.startsWith("/payments") ||
    pathname?.startsWith("/borrower") ||
    pathname?.startsWith("/settings")

  if (shouldHideNavbar) return null

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl text-primary">
          LOAN HUB
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm hover:text-primary">Home</Link>
          <Link href="/loans" className="text-sm hover:text-primary">Loans</Link>
          <Link href="/about" className="text-sm hover:text-primary">About</Link>
          <Link href="/contact" className="text-sm hover:text-primary">Contact</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {showInstallButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallApp}
              className="hidden lg:flex items-center space-x-1 border-[#dc143c]/50 text-[#dc143c] hover:bg-[#dc143c]/10 hover:border-[#dc143c] bg-transparent text-xs"
            >
              <Download className="h-3 w-3" />
              <span>Install</span>
            </Button>
          )}

          {authenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-emerald-500 hover:border-emerald-500"
                >
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
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {showInstallButton && (
                  <DropdownMenuItem onClick={handleInstallApp}>
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary"
                >
                  Register
                </Button>
              </Link>
              <Link href="/login">
                <Button className="rounded-full bg-primary text-white">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col border-t bg-white px-6 py-4 space-y-4">
          <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/loans" onClick={() => setMobileOpen(false)}>Loans</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>

          <div className="pt-4 border-t space-y-3">
            {authenticated && user ? (
              <div className="flex flex-col gap-2">
                <Link href="/dashboard">
                  <Button className="w-full">Dashboard</Button>
                </Link>
                <Link href="/settings">
                  <Button className="w-full">Settings</Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {showInstallButton && (
                  <Button
                    onClick={handleInstallApp}
                    className="w-full bg-[#dc143c] text-white"
                  >
                    Install App
                  </Button>
                )}
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Register
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full bg-primary text-white">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
