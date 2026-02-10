'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, RefreshCw, PlusCircle, CheckCircle2, XCircle, User, DollarSign, Calendar, FileText, AlertCircle, Eye, PieChart, TrendingUp, CheckCircle, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface LoanDocument {
  id: number
  loan_id: number
  document_type: string
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_by: number
  verified_at?: string
  verified_by?: number
  created_at: string
  updated_at: string
}

interface WalletInfo {
  wallet_name: string
  wallet_number: string
  wallet_email?: string
  wallet_proof_url?: string
}

interface Lender {
  id: number
  first_name?: string
  last_name?: string
  email?: string
}

interface LoanStats {
  total_loans: number;
  pending_loans: number;
  approved_loans?: number;
  completed_loans: number;
  active_loans: number;
  total_disbursed: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  defaulted: "bg-black text-white border-black",
}

// Move helper functions outside component to prevent recreating on every render
const getStatusBadge = (status: string) => {
  return (
    <Badge variant="outline" className={statusColors[status] || "bg-gray-100"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const formatCurrency = (value: string | number) => {
  return `₱${Number(value).toLocaleString()}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Define columns outside component - they are static configuration
const getColumns = (): ColumnDef<LoanApplication>[] => [
  {
    key: "id",
    label: "Loan ID",
    sortable: true,
    width: "w-[120px]",
    render: (value) => (
      <span className="font-medium text-blue-800">
        #{value}
      </span>
    ),
  },
  {
    key: "borrower",
    label: "Borrower",
    width: "w-[180px]",
    render: (value) => (
      value ? `${value.first_name} ${value.last_name}` : "N/A"
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
    label: "Principal",
    sortable: true,
    width: "w-[140px]",
    render: (value) => (
      <span className="font-semibold">{formatCurrency(value)}</span>
    ),
  },
  {
    key: "approved_amount",
    label: "Approved",
    width: "w-[140px]",
    render: (value) => (
      value ? (
        <span className="font-semibold text-green-700">
          {formatCurrency(value)}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    ),
  },
  {
    key: "interest_rate",
    label: "Rate",
    width: "w-[80px]",
    align: "center",
    render: (value) => `${value}%`,
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

// Define filters outside component - they are static configuration
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
      { value: "defaulted", label: "Defaulted" },
    ],
  },
];

const LoansManagementPage = () => {
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [refresh, setRefresh] = useState(false);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  // Form states
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLenderId, setSelectedLenderId] = useState<number | null>(null);
  const [activateStartDate, setActivateStartDate] = useState("");
  const [activateFirstPaymentDate, setActivateFirstPaymentDate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loanDocuments, setLoanDocuments] = useState<LoanDocument[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Memoize columns to prevent recreation
  const columns = useMemo(() => getColumns(), []);

  // Fetch stats and lenders on mount
  useEffect(() => {
    fetchLoanStatistics();
    fetchLenders();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefresh(prev => !prev);
    fetchLoanStatistics();
  }, []);

  const fetchLoanStatistics = useCallback(async () => {
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
  }, []);

  const fetchLenders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error('No token available for fetching lenders');
        return;
      }

      const res = await fetch("/api/lenders", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch lenders: ${res.status}`);
      }

      const data = await res.json();
      setLenders(data.lenders || data.data || []);
    } catch (err) {
      console.error('Error fetching lenders:', err);
    }
  }, []);

  const fetchLoanDocuments = useCallback(async (loanId: number) => {
    try {
      setLoadingDocuments(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error('No token available for fetching documents');
        return;
      }

      const res = await fetch(`/api/loans/${loanId}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.status}`);
      }

      const data = await res.json();

      // Handle different response structures
      let documents = [];
      if (Array.isArray(data)) {
        documents = data;
      } else if (data.documents) {
        documents = data.documents;
      } else if (data.data) {
        documents = data.data;
      }

      setLoanDocuments(documents);
    } catch (err) {
      console.error('Error fetching loan documents:', err);
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Failed to fetch loan documents"
      });
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const fetchWalletInfo = useCallback(async (loanId: number) => {
    try {
      setLoadingWallet(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error('No token available for fetching wallet info');
        return;
      }

      const res = await fetch(`/api/loans/${loanId}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const wallet = data.wallet || data.data;
        setWalletInfo(wallet || null);
      } else if (res.status === 404) {
        // No wallet info exists yet
        setWalletInfo(null);
      } else {
        throw new Error('Failed to fetch wallet information');
      }
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      setWalletInfo(null);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const handleApprove = useCallback(async () => {
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
  }, [approvedAmount, selectedLoan, interestRate, selectedLenderId, handleRefresh]);

  const handleReject = useCallback(async () => {
    if (!selectedLoan) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const body = {
        reason: rejectionReason.trim(),
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
  }, [selectedLoan, rejectionReason, handleRefresh]);

  const handleActivate = useCallback(async () => {
    if (!selectedLoan) return;

    // Check if wallet info exists
    if (!walletInfo) {
      toast.error("Error", {
        description: "Wallet information is required before activating the loan. Please ask the lender to add their e-wallet details."
      });
      return;
    }

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
      setWalletInfo(null);
      setLoanDocuments([]);
      handleRefresh();
    } catch (err) {
      console.error('Activate error:', err);
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error("Error activating loan", { description: message });
    } finally {
      setUpdating(false);
    }
  }, [selectedLoan, activateStartDate, activateFirstPaymentDate, walletInfo, handleRefresh]);

  const handleActivateClick = useCallback((loan: LoanApplication) => {
    setSelectedLoan(loan);

    // Set start date to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setActivateStartDate(todayStr);

    // Set first payment date to 1 month from today
    const firstPayment = new Date(today);
    firstPayment.setMonth(firstPayment.getMonth() + 1);
    const firstPaymentStr = firstPayment.toISOString().split('T')[0];
    setActivateFirstPaymentDate(firstPaymentStr);

    // Fetch wallet info
    fetchWalletInfo(loan.id);

    setShowActivateModal(true);
  }, [fetchWalletInfo]);

  // Memoize rowActions to prevent recreation on every render
  // Memoize rowActions to prevent recreation on every render
  const rowActions = useCallback((loan: LoanApplication) => (
    <div className="flex items-center gap-2 justify-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedLoan(loan);
          fetchLoanDocuments(loan.id);
        }}
      >
        <Eye className="h-4 w-4 text-blue-500" />
      </Button>

      {loan.status === "approved" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            fetchLoanDocuments(loan.id);
            handleActivateClick(loan);
          }}
          title="Activate"
        >
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
        </Button>
      )}

      {/* FIXED: Changed from "approved" to "pending" */}
      {loan.status === "approved" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLoan(loan);
            setRejectionReason("");
            setShowRejectModal(true);
          }}
          title="Reject"
        >
          <XCircle className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  ), [fetchLoanDocuments, handleActivateClick]);

  // Memoize details dialog to prevent recreation
  const renderDetailsDialog = useCallback((loan: LoanApplication) => (
    <>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Loan Details #{loan.id}
        </h2>
        <p className="text-blue-100 text-sm">View detailed loan information</p>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
        {/* Status Section */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan
              </h3>
              <p className="text-sm text-gray-500">Loan #{loan.id}</p>
            </div>
            {getStatusBadge(loan.status)}
          </div>
        </div>

        {/* Information Grid */}
        <div className="bg-gray-50 px-8 py-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-800" />
            Borrower & Lender Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Borrower */}
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
                    <p className="text-balance text-xs font-bold text-gray-500 mt-1">{loan.borrower.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lender */}
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

          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-800" />
            Loan Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Principal Amount */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Principal Amount
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(loan.principal_amount)}
              </p>
            </div>

            {/* Approved Amount */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approved Amount
              </label>
              <p className="text-lg font-bold text-green-700 mt-1">
                {loan.approved_amount ? formatCurrency(loan.approved_amount) : "-"}
              </p>
            </div>

            {/* Interest Rate */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interest Rate
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">{loan.interest_rate}%</p>
            </div>

            {/* Term */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loan Term
              </label>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {loan.term_months ? `${loan.term_months} months` : "-"}
              </p>
            </div>

            {/* Submitted Date */}
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
                    {formatDate(loan.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Outstanding Balance */}
            {loan.outstanding_balance && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding Balance
                </label>
                <p className="text-lg font-bold text-red-700 mt-1">
                  {formatCurrency(loan.outstanding_balance)}
                </p>
              </div>
            )}

            {/* Purpose */}
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

            {/* Notes */}
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

            {/* Rejection Reason */}
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

        {/* Documents Section */}
        {loanDocuments.length > 0 && (
          <div className="bg-gray-50 px-8 py-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-800" />
              Uploaded Documents ({loanDocuments.length})
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {loanDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>

            {loadingDocuments && (
              <div className="text-center py-4 text-sm text-gray-500">
                Loading documents...
              </div>
            )}
          </div>
        )}
      </div>
    </>
  ), [loanDocuments, loadingDocuments]);

  return (
    <div className="min-h-screen">
      <main className="min-h-screen bg-white">
        <header className="border-b border-border bg-card sticky top-16 lg:top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">Loan Management</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Centralized administration of loan applications and accounts
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  onClick={() => window.location.href = '/admin/loans/new'}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">New Loan</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatsCard
              title="Total Loans"
              value={statsLoading ? "..." : loanStats?.total_loans ?? 0}
              icon={<FileText className="h-8 w-8 text-gray-400" />}
            />
            <StatsCard
              title="Pending"
              value={statsLoading ? "..." : loanStats?.pending_loans ?? 0}
              icon={
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-700">
                    {statsLoading ? "0" : loanStats?.pending_loans ?? 0}
                  </span>
                </div>
              }
            />
            <StatsCard
              title="Approved"
              value={statsLoading ? "..." : (loanStats as any)?.approved_loans ?? 0}
              icon={
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-700">
                    {statsLoading ? "0" : (loanStats as any)?.approved_loans ?? 0}
                  </span>
                </div>
              }
            />
            <StatsCard
              title="Completed"
              value={statsLoading ? "..." : loanStats?.completed_loans ?? 0}
              icon={
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-700" />
                </div>
              }
            />
            <StatsCard
              title="Active"
              value={statsLoading ? "..." : loanStats?.active_loans ?? 0}
              icon={
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-700">
                    {statsLoading ? "0" : loanStats?.active_loans ?? 0}
                  </span>
                </div>
              }
            />
          </div>
        </div>

        {/* Loans Table */}
        <div className="px-4 sm:px-6 lg:px-8">
          <ReusableDataTable<LoanApplication>
            apiEndpoint="/api/loans"
            refresh={refresh}
            columns={columns}
            filters={filters}
            searchPlaceholder="Search by loan ID or borrower name..."
            searchFields={['id', 'borrower.first_name', 'borrower.last_name']}
            rowActions={rowActions}
            detailsDialog={{
              enabled: true,
              title: "Loan Details",
              render: renderDetailsDialog,
            }}
            defaultPerPage={5}
            defaultSort={{ field: 'created_at', order: 'desc' }}
            emptyMessage="No loans found"
            loadingMessage="Loading loans..."
          />
        </div>
      </main>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason (Optional)</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleReject}
              variant="destructive"
              disabled={updating || !rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {updating ? "Rejecting..." : "Reject Loan"}
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              variant="ghost"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Modal */}
      <Dialog open={showActivateModal} onOpenChange={(open) => {
        setShowActivateModal(open);
        if (!open) {
          setLoanDocuments([]);
          setWalletInfo(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Activate Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Wallet Information Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold">Lender E-Wallet Information</Label>
              </div>

              {loadingWallet ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">Loading wallet information...</p>
                </div>
              ) : walletInfo ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                  <div className="grid grid-cols-1  gap-6">
                    {/* Wallet Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Account Name
                        </label>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {walletInfo.wallet_name}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Mobile Number
                        </label>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {walletInfo.wallet_number}
                        </p>
                      </div>

                      {walletInfo.wallet_email && (
                        <div>
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Email
                          </label>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {walletInfo.wallet_email}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Wallet Proof Image */}
                    {walletInfo.wallet_proof_url && (
                      <div>
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
                          E-Wallet Proof
                        </label>
                        <div className="relative rounded-lg overflow-hidden border-2 border-green-300 shadow-md">
                          <img
                            src={(() => {
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                              return walletInfo.wallet_proof_url?.startsWith('http')
                                ? walletInfo.wallet_proof_url
                                : `${apiUrl}${walletInfo.wallet_proof_url}`;
                            })()}
                            alt="Wallet proof"
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                              const fullUrl = walletInfo.wallet_proof_url?.startsWith('http')
                                ? walletInfo.wallet_proof_url
                                : `${apiUrl}${walletInfo.wallet_proof_url}`;
                              window.open(fullUrl, '_blank');
                            }}
                            onError={(e) => {
                              console.error('Failed to load wallet proof image');
                              e.currentTarget.src = '/placeholder-image.png';
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 right-2"
                            onClick={() => {
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                              const fullUrl = walletInfo.wallet_proof_url?.startsWith('http')
                                ? walletInfo.wallet_proof_url
                                : `${apiUrl}${walletInfo.wallet_proof_url}`;
                              window.open(fullUrl, '_blank');
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        No E-Wallet Information Available
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        The lender has not yet added their e-wallet information. Please ask them to add their e-wallet details before activating this loan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Loan Documents</Label>

              {loadingDocuments ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">Loading documents...</p>
                </div>
              ) : loanDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loanDocuments.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {doc.mime_type.startsWith('image/') ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doc.file_path}`}
                          alt={doc.file_name}
                          className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() =>
                            window.open(
                              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doc.file_path}`,
                              '_blank'
                            )
                          }
                          onError={(e) => {
                            console.error('Failed to load image:', doc.file_path);
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-100">
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="p-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-900 truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.file_path, '_blank')}
                            className="h-6 px-2"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                </div>
              )}
            </div>

            {/* Loan Period Display */}
            {selectedLoan?.term_months && activateStartDate && (
              <LoanPeriodDisplay
                startDate={activateStartDate}
                termMonths={selectedLoan.term_months}
              />
            )}

            {/* Hidden Inputs */}
            <div className="hidden">
              <Input
                type="text"
                value={activateStartDate}
                readOnly
              />
              <Input
                type="text"
                value={activateFirstPaymentDate}
                readOnly
              />
            </div>

            {/* Activate Button */}
            <Button
              className="w-full"
              onClick={handleActivate}
              disabled={updating || !walletInfo}
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {updating ? "Activating..." : "Activate Loan"}
            </Button>

            {!walletInfo && (
              <p className="text-sm text-center text-yellow-600">
                E-wallet information is required to activate the loan
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowActivateModal(false);
                setLoanDocuments([]);
                setWalletInfo(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

// Extracted components to prevent recreation on every render
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <Card className="p-6 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </div>
  </Card>
);

const DocumentCard = ({ doc }: { doc: LoanDocument }) => {
  const apiUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:8000';
  const fullPath = `${apiUrl}/${doc.file_path}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {doc.mime_type.startsWith('image/') ? (
        <img
          src={fullPath}
          alt={doc.file_name}
          className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(fullPath, '_blank')}
          onError={(e) => {
            console.error('Failed to load image:', doc.file_path);
            console.error('Attempted URL:', e.currentTarget.src);
          }}
        />
      ) : (
        <div className="w-full h-40 flex items-center justify-center bg-gray-100">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-900 truncate" title={doc.file_name}>
          {doc.file_name}
        </p>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-xs">
            {doc.document_type}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(fullPath, '_blank')}
            className="h-6 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const LoanPeriodDisplay = ({ startDate, termMonths }: { startDate: string; termMonths: number }) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + termMonths);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Calendar className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <Label className="text-xs font-medium text-blue-700 uppercase tracking-wider">
            Loan Period
          </Label>
          <p className="text-sm font-semibold text-blue-900 mt-1">
            {new Date(startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
            {' → '}
            {endDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {termMonths} month{termMonths !== 1 ? 's' : ''} term
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoansManagementPage;