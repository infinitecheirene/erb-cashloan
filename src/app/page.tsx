'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Minus, Clock, Percent, Shield, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function HomePage() {
  const [loanAmount, setLoanAmount] = useState(30000);
  const [loanTerm, setLoanTerm] = useState(24);

  const interestRate = 12;
  const processingFeeRate = 0.02;

  const processingFee = Math.round(loanAmount * processingFeeRate);
  const disbursedAmount = loanAmount - processingFee;

  function calculateMonthlyPayment(principal: number, rate: number, months: number) {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / months;

    return (
      principal *
      ((monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1))
    );
  }

  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    interestRate,
    loanTerm
  );

  const handleAmountChange = (value: number) => {
    const newAmount = Math.max(5000, Math.min(5000000, value));
    setLoanAmount(newAmount);
  };

  const termOptions = [6, 9, 12, 18, 24, 30, 36, 45, 48, 60];

  // --------------------------
  // PWA INSTALL LOGIC (FIXED)
  // --------------------------

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);

      timeoutId = setTimeout(() => {
        setShowInstallPopup(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setShowInstallPopup(false);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPopup(false);
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismissPopup = () => {
    setShowInstallPopup(false);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-r from-cyan-950 to-blue-900">
        <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-16 mx-auto">
          <div>
            <h1 className="text-5xl font-bold mb-4 text-white">
              Fast & Easy <br />
              <span className="text-emerald-600">Cash Loans</span> <br />
              When You Need It
            </h1>

            <p className="text-lg max-w-md text-gray-300">
              Get approved in minutes with competitive rates. Apply now and
              receive funds directly to your account within 24 hours.
            </p>

            <div className="space-x-3">
              <Link href="/login">
                <Button className="mt-6 bg-emerald-600 text-white hover:bg-white hover:text-primary">
                  Apply Now
                </Button>
              </Link>
              <Link href="/about">
                <Button className="mt-6 border border-white text-white bg-transparent hover:bg-white hover:text-primary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Clock,
                title: 'Quick Approval',
                desc: 'Get approved in as fast as 5 minutes',
              },
              {
                icon: Percent,
                title: 'Low Interest Rates',
                desc: 'Competitive rates starting at 5% APR',
              },
              {
                icon: Shield,
                title: 'Secure & Reliable',
                desc: 'Your financial security is our priority',
              },
              {
                icon: Zap,
                title: 'Instant Funds',
                desc: 'Receive funds within 24 hours of approval',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col border rounded-2xl shadow p-4"
              >
                <item.icon className="w-10 h-10 text-emerald-600" />
                <h1 className="text-xl font-bold mt-2 text-white">
                  {item.title}
                </h1>
                <span className="text-md font-medium text-gray-300 mt-2">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Try our Cash Loan Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Want to check how much your monthly payments will be? Try our
            calculator for a quick breakdown.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 rounded-2xl">
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3">
                How much money do you need?
              </label>

              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => handleAmountChange(loanAmount - 5000)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) =>
                    handleAmountChange(Number(e.target.value))
                  }
                  className="text-center font-semibold"
                />

                <button
                  onClick={() => handleAmountChange(loanAmount + 5000)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <input
                type="range"
                min="5000"
                max="5000000"
                step="1000"
                value={loanAmount}
                onChange={(e) =>
                  handleAmountChange(Number(e.target.value))
                }
                className="w-full mt-4"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {termOptions.map((term) => (
                <button
                  key={term}
                  onClick={() => setLoanTerm(term)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    loanTerm === term
                      ? 'bg-primary text-white'
                      : 'border'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-yellow-50 p-8 rounded-2xl">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Loan Term</span>
                <span>{loanTerm} months</span>
              </div>

              <div className="flex justify-between">
                <span>Loan Amount</span>
                <span>₱{loanAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Processing Fee</span>
                <span>-₱{processingFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Disbursed Amount</span>
                <span>₱{disbursedAmount.toLocaleString()}</span>
              </div>

              <div className="bg-white p-4 rounded-lg mt-6">
                <p className="text-sm text-muted-foreground">
                  Estimated Monthly Installment
                </p>
                <p className="text-3xl font-bold">
                  ₱{Math.round(monthlyPayment).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
