'use client';

import { Check, Plus, Minus, ChevronRight, Badge, Clock, Percent, ShieldCheck, CreditCard, Target, Eye, Heart, TrendingUp, Users } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function AboutPage() {

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section*/}
            <section className="bg-linear-to-r from-cyan-950 to-blue-900">
                <div className="flex gap-2">
                    <div className="text-center py-16 px-6 mx-auto">
                        <div className="flex flex-col justify-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                About Loan Hub
                            </h1>
                            <p className="text-lg text-blue-200 mb-8 max-w-2xl">
                                We&apos;re on a mission to make financial services accessible, transparent, and empowering for every Filipino.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 border rounded-lg shadow-md">
                        <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mb-4 pt-4">
                            <Target className="w-6 h-6 mb-4 text-blue-900" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                        <p className="text-md text-muted-foreground mb-6">
                            At Loan Hub, our mission is to provide quick, reliable, and affordable cash loans to individuals and businesses in need.
                            We strive to empower our customers by offering transparent loan options with competitive rates and flexible terms.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg shadow-md">
                        <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mb-4 pt-4">
                            <Eye className="w-6 h-6 mb-4 text-blue-900" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                        <p className="text-md text-muted-foreground mb-6">
                            Our vision is to be the leading cash loan provider in the Philippines, recognized for our commitment to customer satisfaction,
                            innovation, and social responsibility. We aim to create a positive impact on the lives of our customers by helping them achieve
                            their financial goals.
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-5xl flex-col my-12 justify-center mx-auto px-6">
                <div className="text-center mx-auto flex-1 items-center justify-center">
                    <h1 className="text-3xl font-bold">Our Values</h1>
                    <span className="text-lg text-muted-foreground">The principles that guide everything we do</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Heart className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Customer First</h2>
                        <p className="text-sm text-muted-foreground">
                            Every decision we make starts with how it benefits our customers.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Target className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Transparency</h2>
                        <p className="text-sm text-muted-foreground">
                            No hidden fees, no surprises. We believe in clear, honest communication.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Innovation</h2>
                        <p className="text-sm text-muted-foreground">
                            We continuously improve our technology to serve you better.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Inclusivity</h2>
                        <p className="text-sm text-muted-foreground">
                            Financial services should be accessible to everyone, regardless of background.
                        </p>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}