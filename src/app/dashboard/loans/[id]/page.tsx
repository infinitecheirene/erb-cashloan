'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-context';
import { ArrowLeft, DollarSign, Calendar, Percent } from 'lucide-react';


interface Loan {
  id: number;
  loan_number: string;
  type: string;
  principal_amount: string;
  balance: string;
  interest_rate: string;
  term_months: number;
  status: string;
  start_date?: string;
  next_payment_date?: string;
  approved_amount?: string;
  borrower?: { first_name: string; last_name: string };
  lender?: { first_name: string; last_name: string };
  payments?: any[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  defaulted: 'bg-red-200 text-red-900',
};

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authenticated, loading: authLoading } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loanId = params.id;

  useEffect(() => {
    if (!authenticated && !authLoading) {
      router.push('/');
      return;
    }

    if (!loanId) return;

    const fetchLoan = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/loans/${loanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch loan');
        }

        const data = await response.json();
        setLoan(data.loan || data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load loan details');
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [loanId, authenticated, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/loans')}>Back to Loans</Button>
        </Card>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-muted-foreground mb-4">Loan not found</p>
          <Button onClick={() => router.push('/loans')}>Back to Loans</Button>
        </Card>
      </div>
    );
  }

  const monthlyPayment = loan.principal_amount
    ? (parseFloat(loan.principal_amount) / loan.term_months).toFixed(2)
    : '0';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/loans')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">{loan.loan_number}</h1>
              <p className="text-sm text-muted-foreground capitalize">{loan.type} Loan</p>
            </div>
          </div>
          <Badge className={statusColors[loan.status] || 'bg-gray-100'}>
            {loan.status}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${parseFloat(loan.principal_amount).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/30" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${parseFloat(loan.balance).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-accent/30" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-2xl font-bold text-foreground mt-1">{loan.interest_rate}%</p>
              </div>
              <Percent className="h-8 w-8 text-primary/30" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold text-foreground mt-1">${monthlyPayment}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/30" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Loan Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-medium">{loan.term_months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{loan.start_date || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Payment:</span>
                    <span className="font-medium">{loan.next_payment_date || 'Not scheduled'}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Parties Involved</h3>
                <div className="space-y-3">
                  {loan.borrower && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Borrower:</span>
                      <span className="font-medium">
                        {loan.borrower.first_name} {loan.borrower.last_name}
                      </span>
                    </div>
                  )}
                  {loan.lender && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lender:</span>
                      <span className="font-medium">
                        {loan.lender.first_name} {loan.lender.last_name}
                      </span>
                    </div>
                  )}
                  {loan.loan_officer && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Officer:</span>
                      <span className="font-medium">
                        {loan.loan_officer.first_name} {loan.loan_officer.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Payment Schedule</h3>
              <p className="text-muted-foreground">Payment schedule coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Documents</h3>
              <p className="text-muted-foreground">Document management coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
