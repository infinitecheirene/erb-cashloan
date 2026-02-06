'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Minus, Clock, Percent, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const [loanAmount, setLoanAmount] = useState(30000);
  const [loanTerm, setLoanTerm] = useState(24);
  const interestRate = 12;
  const processingFeeRate = 0.02; // 2% processing fee
  const processingFee = Math.round(loanAmount * processingFeeRate);

  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
  const disbursedAmount = loanAmount - processingFee;

  function calculateMonthlyPayment(principal: number, rate: number, months: number) {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  const handleAmountChange = (value: number) => {
    const newAmount = Math.max(5000, Math.min(5000000, value));
    setLoanAmount(newAmount);
  };

  const termOptions = [6, 9, 12, 18, 24, 30, 36, 45, 48, 60];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-linear-to-r from-cyan-950 to-blue-900">
        <div className="flex gap-2">
          <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-16 justify-center mx-auto">
            <div className="text-start mb-12">
              <h1 className="text-5xl font-bold mb-4 text-balance text-start text-white">
                Fast & Easy <br /><span className="text-emerald-600">Cash Loans</span> <br /> When You Need It
              </h1>
              <p className="text-lg max-w-md text-start text-gray-300">
                Get approved in minutes with competitive rates. Apply now and receive funds directly to your account within 24 hours.
              </p>

              <div className="space-x-3">
                <Link href="/login">
                  <Button className="mt-6 border border-emerald-600 bg-emerald-600 text-white hover:bg-white hover:text-primary">
                    Apply Now
                  </Button>
                </Link>
                <Link href="/about">
                  <Button className="mt-6 border border-white text-white hover:bg-white hover:text-primary bg-transparent">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <div className="w-full">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col border rounded-2xl shadow p-4 items-start">
                    <Clock className="w-10 h-10 text-emerald-600" />
                    <h1 className="text-xl font-bold mt-2 text-white">Quick Approval</h1>
                    <span className="text-md font-medium text-gray-300 mt-2">Get approved in as fast as 5 minutes</span>
                  </div>
                  <div className="flex flex-col border rounded-2xl shadow p-4 items-start">
                    <Percent className="w-10 h-10 text-emerald-600" />
                    <h1 className="text-xl font-bold text-white mt-2">Low Interest Rates</h1>
                    <span className="text-md font-medium text-gray-300 mt-2">Competitive rates starting at 5% APR</span>
                  </div>
                  <div className="flex flex-col border rounded-2xl shadow p-4 items-start">
                    <Shield className="w-10 h-10 text-emerald-600" />
                    <h1 className="text-xl font-bold text-white mt-2">Secure & Reliable</h1>
                    <span className="text-md font-medium text-gray-300 mt-2">Your financial security is our priority</span>
                  </div>
                  <div className="flex flex-col border rounded-2xl shadow p-4 items-start">
                    <Zap className="w-10 h-10 text-emerald-600" />
                    <h1 className="text-xl font-bold text-white mt-2">Instant Funds</h1>
                    <span className="text-md font-medium text-gray-300 mt-2">Receive funds within 24 hours of approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
            Try our Cash Loan Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Want to check how much your online loan&apos;s monthly payments will be? Try our calculator
            to get a sample breakdown!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Section */}
          <Card className="border border-border p-8 rounded-2xl">
            <div className="flex items-start gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                L
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Get a sample cash loan computation
                </h2>
              </div>
            </div>

            {/* Loan Amount Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-3">
                How much money do you need?
              </label>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => handleAmountChange(loanAmount - 5000)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-secondary text-primary font-bold text-xl"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="flex-1 text-center text-lg font-semibold border border-border"
                />
                <button
                  onClick={() => handleAmountChange(loanAmount + 5000)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-secondary text-primary font-bold text-xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Loan amount starts at ₱5,000 up to ₱5,000,000
              </p>

              {/* Slider */}
              <input
                type="range"
                min="5000"
                max="5000000"
                step="1000"
                value={loanAmount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer accent-primary mt-4"
              />
            </div>

            {/* Loan Terms */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-4">
                Sample Loan Terms (months)
              </label>
              <div className="flex flex-wrap gap-2">
                {termOptions.map((term) => (
                  <button
                    key={term}
                    onClick={() => setLoanTerm(term)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${loanTerm === term
                      ? 'bg-primary text-white'
                      : 'border border-border text-foreground hover:border-primary hover:text-primary'
                      }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <Card className="border-none bg-yellow-50 p-8 rounded-2xl">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-yellow-200">
                <span className="text-foreground font-medium">Loan Term</span>
                <span className="font-semibold text-foreground">{loanTerm} months</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-yellow-200">
                <span className="text-foreground font-medium">Loan Amount</span>
                <span className="font-semibold text-foreground">₱{loanAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-yellow-200">
                <span className="text-foreground font-medium">Processing Fee (2%)</span>
                <span className="font-semibold text-destructive">-₱{processingFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-yellow-200">
                <span className="text-foreground font-medium">Amount to be Disbursed</span>
                <span className="font-semibold text-foreground">
                  ₱{disbursedAmount.toLocaleString()}
                </span>
              </div>

              <div className="bg-white rounded-lg p-4 mt-8">
                <p className="text-sm text-muted-foreground mb-2">Estimated Monthly Installment</p>
                <p className="text-3xl font-bold text-foreground">
                  ₱{Math.round(monthlyPayment).toLocaleString()} per month
                </p>
              </div>

              <Link href="/dashboard/loans">
                <Button className="w-full bg-primary text-white hover:bg-primary/90 text-lg py-6 rounded-lg font-semibold">
                  Check if you are qualified for a cash loan
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Note: This is a sample computation. Actual amounts and rates may vary based on
                submitted application and information.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-5xl flex-col my-12 justify-center mx-auto px-6 border-t pt-12">
        <div className="text-center mx-auto flex-1 items-center justify-center">
          <h1 className="text-3xl font-bold">How It Works</h1>
          <span className="text-lg text-muted-foreground">Get your cash loan in three steps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
              1
            </div>
            <h2 className="text-xl font-bold mb-2">Apply Online</h2>
            <p className="text-sm text-muted-foreground">
              Fill out our simple online application form with your personal and financial details.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
              2
            </div>
            <h2 className="text-xl font-bold mb-2">Get Approved</h2>
            <p className="text-sm text-muted-foreground">
              Our lenders will review your application and notify you of the approval status within minutes.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
              3
            </div>
            <h2 className="text-xl font-bold mb-2">Receive Funds</h2>
            <p className="text-sm text-muted-foreground">
              Once approved, the funds will be disbursed directly to your bank account within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}