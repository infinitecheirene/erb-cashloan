"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface ConditionalMainWrapperProps {
  children: ReactNode
}

export function ConditionalMainWrapper({ children }: ConditionalMainWrapperProps) {
  const pathname = usePathname()

  // Public paths that should not have sidebar spacing
  const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/loans', '/settings']
  const isPublicPath = publicPaths.includes(pathname || '')

  if (isPublicPath) {
    // No sidebar spacing for public pages
    return (
      <main className="min-h-screen">
        {children}
      </main>
    )
  }

  // Apply sidebar spacing for authenticated pages
  return (
    <main className={`min-h-screen mx-auto ${isPublicPath ? '' : ' lg:pl-64'}`}>
      {children}
    </main>
  )
}