'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Calendar, 
  DollarSign, 
  FileText, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Loan {
  id: number;
  type: string;
  principal_amount: string | number;
  approved_amount: string | number | null;
  interest_rate: string | number;
  term_months: number;
  status: string;
  purpose: string;
  employment_status: string | null;
  created_at: string;
  borrower?: {
    id: number;
    name: string;
    email: string;
  };
  lender?: {
    id: number;
    name: string;
    email: string;
  } | null;
  loan_officer?: {
    id: number;
    name: string;
    email: string;
  } | null;
  documents?: any[];
}

interface LoansListProps {
  onViewLoan: (loanId: number) => void;
}

export function LoansList({ onViewLoan }: LoansListProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, [currentPage]);

  const fetchLoans = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/loans?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loans');
      }

      const data = await response.json();
      
      // Handle pagination data
      if (data.loans?.data) {
        setLoans(data.loans.data);
        setCurrentPage(data.loans.current_page);
        setTotalPages(data.loans.last_page);
      } else if (Array.isArray(data.loans)) {
        setLoans(data.loans);
      } else {
        setLoans([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load loans';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      defaulted: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLoanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      personal: 'Personal Loan',
      auto: 'Auto Loan',
      home: 'Home Loan',
      business: 'Business Loan',
      student: 'Student Loan',
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') {
      return '₱0.00';
    }
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return '₱0.00';
    }
    
    return `₱${numAmount.toLocaleString('en-PH', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (loans.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No loans found</h3>
        <p className="text-muted-foreground">
          You don&apos;t have any loan applications yet. Click &quot;New Application&quot; to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <Card key={loan.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Loan Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">
                  {getLoanTypeLabel(loan.type)}
                </h3>
                <Badge className={getStatusColor(loan.status)}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(loan.principal_amount)}
                  </span>
                </div>

                {loan.approved_amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(loan.approved_amount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium">{loan.term_months} months</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Interest:</span>
                  <span className="font-medium">
                    {typeof loan.interest_rate === 'string' 
                      ? parseFloat(loan.interest_rate).toFixed(2) 
                      : loan.interest_rate.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Applied:</span>
                  <span className="font-medium">{formatDate(loan.created_at)}</span>
                </div>

                {loan.documents && loan.documents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Documents:</span>
                    <span className="font-medium">{loan.documents.length}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  <span className="font-medium">Purpose:</span> {loan.purpose}
                </p>
              </div>

              {/* Borrower/Lender info for admins */}
              {loan.borrower && (
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Borrower:</span>{' '}
                    <span className="font-medium">{loan.borrower.name}</span>
                  </p>
                </div>
              )}

              {loan.lender && (
                <div className="pt-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Lender:</span>{' '}
                    <span className="font-medium">{loan.lender.name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex lg:flex-col gap-2">
              <Button
                onClick={() => onViewLoan(loan.id)}
                className="w-full lg:w-auto bg-[#1e3a8a] hover:bg-[#1e40af]"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}