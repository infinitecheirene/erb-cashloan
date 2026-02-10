'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, User, DollarSign, Calendar, FileText, AlertCircle, Eye, ArrowRight, ArrowLeft, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoanApplicationForm } from "@/components/loans/loan-application-form"
import { ReceiverWalletModal } from "@/components/loans/receiver-wallet-modal";
import { AddEditWalletForm } from "@/components/loans/add-edit-wallet-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ReusableDataTable, ColumnDef, FilterConfig } from "@/components/data-table";

interface LoanApplication {
  id: number
  type: string
  principal_amount: string
  approved_amount?: string
  interest_rate: string
  status: string
  term_months?: number
  purpose?: string
  created_at: string
  updated_at: string
  start_date?: string
  first_payment_date?: string
  notes?: string
  rejection_reason?: string
  outstanding_balance?: string
  borrower?: {
    first_name: string
    last_name: string
    email?: string
  }
  lender?: {
    id: number
    first_name: string
    last_name: string
    email?: string
  }
}

interface Lender {
  id: number
  first_name?: string
  last_name?: string
  email?: string
}

interface LoanStats {
  total_loans: number;
  active_loans: number;
  total_outstanding: number;
  total_borrowed: number;
}

interface NewLoanFormData {
  type: string;
  principal_amount: string;
  term_months: string;
  purpose: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  defaulted: "bg-black text-white border-black",
}

const LoansManagementPage = () => {
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState("my-loans");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Application step state (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletFormModal, setShowWalletFormModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  // Form states for admin actions
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLenderId, setSelectedLenderId] = useState<number | null>(null);
  const [activateStartDate, setActivateStartDate] = useState("");
  const [activateFirstPaymentDate, setActivateFirstPaymentDate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0)


  const handleApplicationSuccess = () => {
    setRefreshKey((prev) => prev + 1)
    toast.success("Success", { description: "Loan application submitted successfully" });
  }


  // New loan form state
  const [newLoanForm, setNewLoanForm] = useState<NewLoanFormData>({
    type: "",
    principal_amount: "",
    term_months: "",
    purpose: "",
  });

  useEffect(() => {
    fetchLoanStatistics();
    fetchLenders();
    
    // Get current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleRefresh = () => {
    setRefresh(!refresh);
    fetchLoanStatistics();
  };

  const fetchLoanStatistics = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication Error", { description: "Please log in again" });
        return;
      }

      const res = await fetch(`/api/loans/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch statistics: ${res.status}`);
      }

      const data = await res.json();
      setLoanStats(data.data || data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Failed to fetch loan statistics"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLenders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/lenders", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch lenders: ${res.status}`);

      const data = await res.json();
      setLenders(data.lenders || data.data || []);
    } catch (err) {
      console.error('Error fetching lenders:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={statusColors[status] || "bg-gray-100"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleApprove = async () => {
    if (!approvedAmount || !selectedLoan) {
      toast.error("Error", { description: "Amount is required" });
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const body: Record<string, any> = {
        approved_amount: Number(approvedAmount),
        interest_rate: interestRate ? Number(interestRate) : undefined,
      };

      if (selectedLenderId) body.lender_id = selectedLenderId;

      const res = await fetch(`/api/loans/${selectedLoan.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to approve loan" }));
        throw new Error(error.message || "Failed to approve loan");
      }

      const data = await res.json();
      toast.success("Success", { description: data.message || "Loan approved successfully" });

      setApprovedAmount("");
      setInterestRate("");
      setSelectedLoan(null);
      setShowApproveModal(false);
      handleRefresh();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error("Error", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLoan) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const body = {
        reason: rejectionReason || null,
      };

      const res = await fetch(`/api/loans/${selectedLoan.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to reject loan" }));
        throw new Error(error.message || "Failed to reject loan");
      }

      const data = await res.json();
      toast.success("Success", { description: data.message || "Loan rejected successfully" });

      setRejectionReason("");
      setSelectedLoan(null);
      setShowRejectModal(false);
      handleRefresh();
    } catch (err) {
      console.error('Reject error:', err);
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      toast.error("Error", { description: errorMsg });
    } finally {
      setUpdating(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedLoan) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const body = {
        start_date: activateStartDate || null,
        first_payment_date: activateFirstPaymentDate || null,
      };

      const res = await fetch(`/api/loans/${selectedLoan.id}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to activate loan" }));
        throw new Error(error.message || "Failed to activate loan");
      }

      const data = await res.json();
      toast.success("Loan activated successfully", { description: data.message });
      setShowActivateModal(false);
      setActivateStartDate("");
      setActivateFirstPaymentDate("");
      setSelectedLoan(null);
      handleRefresh();
    } catch (err) {
      console.error('Activate error:', err);
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error("Error activating loan", { description: message });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateLoan = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      if (!newLoanForm.type || !newLoanForm.principal_amount) {
        toast.error("Error", { description: "Please fill in all required fields" });
        return;
      }

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          type: newLoanForm.type,
          principal_amount: Number(newLoanForm.principal_amount),
          term_months: Number(newLoanForm.term_months),
          purpose: newLoanForm.purpose,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create loan" }));
        throw new Error(error.message || "Failed to create loan");
      }

      const data = await res.json();
      toast.success("Success", { description: data.message || "Loan application submitted successfully" });

      setNewLoanForm({
        type: "",
        principal_amount: "",
        term_months: "",
        purpose: "",
      });
      setCurrentStep(1);
      setActiveTab("my-loans");
      handleRefresh();
    } catch (err) {
      console.error('Create loan error:', err);
      toast.error("Error", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return newLoanForm.type && newLoanForm.principal_amount && newLoanForm.term_months;
      case 2:
        return true; // Employment info is optional for now
      case 3:
        return true; // Documents are optional for now
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  // Define columns for the data table
  const columns: ColumnDef<LoanApplication>[] = [
    {
      key: "id",
      label: "Loan ID",
      sortable: true,
      width: "w-[120px]",
      render: (value: number, row: LoanApplication) => (
        <span className="font-medium text-blue-800">
          #{value === 0 ? "N/A" : value}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      width: "w-[120px]",
      render: (value) => (
        <span className="capitalize">{value}</span>
      ),
    },
    {
      key: "principal_amount",
      label: "Amount",
      sortable: true,
      width: "w-[140px]",
      render: (value) => (
        <span className="font-semibold">₱{Number(value).toLocaleString()}</span>
      ),
    },
    {
      key: "term_months",
      label: "Term",
      width: "w-[100px]",
      align: "center",
      render: (value) => value ? `${value} months` : "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "w-[120px]",
      align: "center",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "created_at",
      label: "Submitted",
      sortable: true,
      width: "w-[140px]",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define filters
  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      defaultValue: "all",
      options: [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
    },
  ];

  // Row actions
  const rowActions = (loan: LoanApplication) => {
    const isLender = currentUser && loan.lender && currentUser.id === loan.lender.id;
    
    return (
      <div className="flex items-center gap-2 justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedLoan(loan)
          }}
          title="View Details"
        >
          <Eye className="h-4 w-4 text-blue-500" />
        </Button>
        {loan.status === 'approved' && loan.lender && (
          <>
            {isLender ? (
              // Lender sees Add/Edit button
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLoan(loan);
                  setShowWalletFormModal(true);
                }}
                title="Add/Edit E-Wallet Info"
              >
                <Wallet className="h-4 w-4 text-blue-600" />
              </Button>
            ) : (
              // Borrower sees View button
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLoan(loan);
                  setShowWalletModal(true);
                }}
                title="View Receiver Wallet"
              >
                <Wallet className="h-4 w-4 text-green-600" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // Details dialog render
  const renderDetailsDialog = (loan: LoanApplication) => (
    <>
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Loan Details #{loan.id}
        </h2>
        <p className="text-blue-100 text-sm">View detailed loan information</p>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan
              </h3>
              <p className="text-sm text-gray-500">Loan #{loan.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(loan.status)}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6">
          {loan.borrower && (
            <>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-800" />
                Borrower & Lender Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrower
                      </label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {loan.borrower ? `${loan.borrower.first_name} ${loan.borrower.last_name}` : "N/A"}
                      </p>
                      {loan.borrower?.email && (
                        <p className="text-xs text-gray-500 mt-1">{loan.borrower.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-green-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lender
                      </label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {loan.lender ? `${loan.lender.first_name} ${loan.lender.last_name}` : "Unassigned"}
                      </p>
                      {loan.lender?.email && (
                        <p className="text-xs text-gray-500 mt-1">{loan.lender.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-800" />
            Loan Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Principal Amount
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ₱{Number(loan.principal_amount).toLocaleString()}
              </p>
            </div>

            {loan.approved_amount && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Amount
                </label>
                <p className="text-lg font-bold text-green-700 mt-1">
                  ₱{Number(loan.approved_amount).toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interest Rate
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">{loan.interest_rate}%</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loan Term
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {loan.term_months ? `${loan.term_months} months` : "-"}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(loan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {loan.outstanding_balance && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding Balance
                </label>
                <p className="text-lg font-bold text-red-700 mt-1">
                  ₱{Number(loan.outstanding_balance).toLocaleString()}
                </p>
              </div>
            )}

            {loan.purpose && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Purpose
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{loan.purpose}</p>
                  </div>
                </div>
              </div>
            )}

            {loan.notes && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-yellow-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{loan.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {loan.rejection_reason && (
              <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-red-500 uppercase tracking-wider">
                      Rejection Reason
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{loan.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen">
        <header className="border-b border-border bg-white sticky top-16 lg:top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">Loans</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage and track all loan applications
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-2">Total Loans</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsLoading ? "..." : loanStats?.total_loans ?? 0}
              </p>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-2">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {statsLoading ? "..." : loanStats?.active_loans ?? 0}
              </p>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-2">Total Outstanding</p>
              <p className="text-xl font-bold text-orange-600">
                {statsLoading ? "..." : `₱${Number(loanStats?.total_outstanding ?? 0).toLocaleString()}`}
              </p>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-2">Total Borrowed</p>
              <p className="text-xl font-bold text-gray-900">
                {statsLoading ? "..." : `₱${Number(loanStats?.total_borrowed ?? 0).toLocaleString()}`}
              </p>
            </Card>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="my-loans">My Loans</TabsTrigger>
              <TabsTrigger value="apply">Apply for Loan</TabsTrigger>
            </TabsList>

            {/* My Loans Tab */}
            <TabsContent value="my-loans">
              <ReusableDataTable<LoanApplication>
                apiEndpoint="/api/loans"
                refresh={refresh}
                columns={columns}
                filters={filters}
                searchPlaceholder="Search by loan ID..."
                searchFields={['id']}
                rowActions={rowActions}
                detailsDialog={{
                  enabled: true,
                  title: "Loan Details",
                  render: renderDetailsDialog,
                }}
                defaultPerPage={10}
                defaultSort={{ field: 'created_at', order: 'desc' }}
                emptyMessage="No loans found"
                loadingMessage="Loading loans..."
              />
            </TabsContent>

            {/* Apply for Loan Tab */}
            <TabsContent value="apply" className="space-y-6 mt-6">
              <LoanApplicationForm onSuccess={handleApplicationSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Assign Lender (Optional)</Label>
              <Select value={selectedLenderId?.toString() || ""} onValueChange={(val) => setSelectedLenderId(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Lender" />
                </SelectTrigger>
                <SelectContent>
                  {lenders.map((lender) => (
                    <SelectItem key={lender.id} value={lender.id.toString()}>
                      {lender.first_name} {lender.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Approved Amount</Label>
              <Input
                type="number"
                placeholder="Approved Amount"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                placeholder="Interest Rate"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleApprove} disabled={updating}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {updating ? "Approving..." : "Approve"}
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowApproveModal(false)} variant="ghost">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <Button className="w-full" onClick={handleReject} variant="destructive" disabled={updating}>
              <XCircle className="h-4 w-4 mr-2" />
              {updating ? "Rejecting..." : "Reject"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRejectModal(false)} variant="ghost">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Modal */}
      <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={activateStartDate}
                onChange={(e) => setActivateStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>First Payment Date</Label>
              <Input
                type="date"
                value={activateFirstPaymentDate}
                onChange={(e) => setActivateFirstPaymentDate(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleActivate} disabled={updating}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {updating ? "Activating..." : "Activate Loan"}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowActivateModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receiver Wallet Modal (for borrowers to VIEW) */}
      <ReceiverWalletModal
        loan={selectedLoan}
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
      />

      {/* Wallet Form Modal (for lenders to ADD/EDIT) */}
      <AddEditWalletForm
        loan={selectedLoan}
        open={showWalletFormModal}
        onOpenChange={setShowWalletFormModal}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default LoansManagementPage;