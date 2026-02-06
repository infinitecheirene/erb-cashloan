"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// import { LenderSidebar } from "@/components/lender/lender-sidebar"
import { DollarSign, TrendingUp, FileText } from "lucide-react"
import LenderDashboardPage from "../lender/page"
import AdminDashboard from "@/components/admin/admin-dashboard"
import BorrowerDashboard from "@/components/borrower/borrower-dashboard"

// function StatCard({ title, value, icon }: any) {
//   return (
//     <Card className="p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm text-muted-foreground">{title}</p>
//           <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
//         </div>
//         <div className="text-primary/30">{icon}</div>
//       </div>
//     </Card>
//   )
// }

export default function DashboardPage() {
  const router = useRouter()
  const { user, authenticated } = useAuth()

  const getRoleDashboard = () => {
    switch (user?.role) {
      case "admin":
        return <AdminDashboard />
      case "lender":
        return <LenderDashboardPage />
      case "borrower":
        return <BorrowerDashboard />
      default:
        return <BorrowerDashboard />
    }
  }

  if (!authenticated) {
    router.push("/")
    return null
  }

  return getRoleDashboard()
}

// function LenderDashboard({ onLogout, user }: any) {
//   return (
//     <div className="min-h-screen bg-background">
//       <LenderSidebar />
//       <header className="border-b border-border bg-card">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//           <h1 className="text-2xl font-bold text-primary">LoanHub Lender</h1>
//           <div className="flex items-center gap-4">
//             <span className="text-sm text-muted-foreground">
//               {user.firstName} {user.lastName}
//             </span>
//             <Button variant="outline" onClick={onLogout}>
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>
//       <main className="max-w-7xl mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//           <StatCard title="Portfolio Value" value="$450K" icon={<DollarSign className="h-5 w-5" />} />
//           <StatCard title="Active Loans" value="12" icon={<FileText className="h-5 w-5" />} />
//           <StatCard title="Monthly Returns" value="$3,200" icon={<TrendingUp className="h-5 w-5" />} />
//         </div>

//         <Card className="p-6">
//           <h2 className="text-lg font-semibold mb-4">Your Loans</h2>
//           <p className="text-muted-foreground">Loan management interface coming soon...</p>
//         </Card>
//       </main>
//     </div>
//   )
// }
