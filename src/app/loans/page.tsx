'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Check, Plus, Minus, ChevronRight, Badge, Clock, Percent, ShieldCheck, CreditCard } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function LoanPage() {

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section*/}
            <section className="bg-linear-to-r from-cyan-950 to-blue-900">
                <div className="flex gap-2">
                    <div className="text-center py-16 px-6 mx-auto">
                        <div className="flex flex-col justify-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Find the Perfect Loan For You
                            </h1>
                            <p className="text-lg text-blue-200 mb-8 max-w-2xl">
                                Choose from our range of loan products designed to meet your financial needs. Competitive rates, flexible terms, and fast approval.                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Loan Plans */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="text-center">
                    <h1 className="text-3xl font-semibold">Our Loan Plans</h1>
                    <p>Explore our range of loan options tailored for different needs</p>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-6 border-2 border-emerald-400 gap-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Personal Loan</h2>
                            <p className="w-24 h-5 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center">Most Popular</p>
                        </div>
                        <p className="text-start">Ideal for personal expenses, debt consolidation or unexpected costs.</p>
                        <div className="flex justify-between max-w-sm">
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Loan Amount</h3>
                                <span className="text-sm lg:text-md font-semibold">₱1,000 - ₱25,000</span>
                            </div>
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Term</h3>
                                <span className="text-sm lg:text-md font-semibold text-emerald-600">3-24 Months</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-gray-700 text-justify md:text-start">
                            <span className="flex gap-2"><Check className="text-emerald-500" />Fast approval process</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />No collateral required</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Flexible repayment options</span>
                        </div>
                        <Button className="bg-emerald-500 text-white hover:bg-emerald-400 rounded-md px-6">Apply Now <ChevronRight /></Button>
                    </Card>

                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">Calamity Loan</h2>
                        <p className="text-start">Designed to help from natural disasters and unforeseen emergencies.</p>
                        <div className="flex justify-between max-w-sm">
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Loan Amount</h3>
                                <span className="text-sm lg:text-md font-semibold">₱5,000 - ₱100,000</span>
                            </div>
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Term</h3>
                                <span className="text-sm lg:text-md font-semibold text-emerald-600">6-36 Months</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-gray-700 text-justify md:text-start">
                            <span className="flex gap-2"><Check className="text-emerald-500" />Quick approval for calamity victims</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Minimal requirements</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Affordable interest and repayment terms</span>
                        </div>
                        <Button className="bg-emerald-500 text-white hover:bg-emerald-400 rounded-md px-6">Apply Now <ChevronRight /></Button>
                    </Card>

                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">Emergency Loan</h2>
                        <p className="text-start">Fast cash when you need it most.</p>
                        <div className="flex justify-between max-w-sm">
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Loan Amount</h3>
                                <span className="text-sm lg:text-md font-semibold">₱5,000 - ₱50,000</span>
                            </div>
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Term</h3>
                                <span className="text-sm lg:text-md font-semibold text-emerald-600">6-28 Months</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-gray-700 text-justify md:text-start">
                            <span className="flex gap-2"><Check className="text-emerald-500" />Same-day disbursement</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Minimal documentation</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />24/7 application</span>
                        </div>
                        <Button className="bg-emerald-500 text-white hover:bg-emerald-400 rounded-md px-6">Apply Now <ChevronRight /></Button>
                    </Card>

                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">Business Loan</h2>
                        <p className="text-start">Fuel your business growth.</p>
                        <div className="flex justify-between max-w-sm">
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Loan Amount</h3>
                                <span className="text-sm lg:text-md font-semibold">₱5,000 - ₱200,000</span>
                            </div>
                            <div>
                                <h3 className="text-md lg:text-lg text-gray-600">Term</h3>
                                <span className="text-sm lg:text-md font-semibold text-emerald-600">6-48 Months</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-gray-700 text-justify md:text-start">
                            <span className="flex gap-2"><Check className="text-emerald-500" />Flexible use of funds</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Competitive rates</span>
                            <span className="flex gap-2"><Check className="text-emerald-500" />Business-friendly terms</span>
                        </div>
                        <Button className="bg-emerald-500 text-white hover:bg-emerald-400 rounded-md px-6">Apply Now <ChevronRight /></Button>
                    </Card>
                </div>
            </section>

            <section className="max-w-5xl flex-col my-12 justify-center mx-auto px-6 border-t pt-12">
                <div className="text-center mx-auto flex-1 items-center justify-center">
                    <h1 className="text-3xl font-bold">Why Choose Loan Hub?</h1>
                    <span className="text-lg text-muted-foreground">We make borrowing simple, fast, and transparent</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Fast Approval</h2>
                        <p className="text-sm text-muted-foreground">
                            Get approved in as little as 5 minutes with our streamlined process.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Percent className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Competitive Rates</h2>
                        <p className="text-sm text-muted-foreground">
                            We offer some of the lowest interest rates in the market.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Secure & Safe</h2>
                        <p className="text-sm text-muted-foreground">
                            Your data is protected with bank-level encryption.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Flexible Terms</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose repayment terms that fit your budget.
                        </p>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}