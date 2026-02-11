import React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth-context";
import { RoleBasedSidebar } from "@/components/layout/sidebar";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { ConditionalMainWrapper } from "@/components/conditional-main-wrapper";

export const metadata: Metadata = {
  title: "LoanHub - Loan Management System",
  description: "Professional loan management platform for borrowers, lenders, and loan officers",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <div className="min-h-screen bg-background">
            <RoleBasedSidebar />
            <ConditionalMainWrapper>
              <Navbar />
              {children}
            </ConditionalMainWrapper>
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
