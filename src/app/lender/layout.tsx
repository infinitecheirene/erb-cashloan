import { LenderSidebar } from "@/components/lender/lender-sidebar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <LenderSidebar />
      {children}
    </>
  )
}
