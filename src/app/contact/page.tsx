'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Check, Plus, Minus, ChevronRight, Badge, Clock, Percent, ShieldCheck, CreditCard, MapPin, Phone, Mail } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function ContactPage() {

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section*/}
            <section className="bg-linear-to-r from-cyan-950 to-blue-900">
                <div className="flex gap-2">
                    <div className="text-center py-16 px-6 mx-auto">
                        <div className="flex flex-col justify-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Get In Touch
                            </h1>
                            <p className="text-lg text-blue-200 mb-8 max-w-2xl">
                                Have questions? We&apos;re here to help. Reach out to us through any of the channels below or send us a message.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-5xl flex-col my-12 justify-center mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Visit Us</h2>
                        <p className="text-sm text-muted-foreground">
                            LoanHub Tower, 123 Urban Avenue
                            Makati City, Metro Manila 1200
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Call Us</h2>
                        <p className="text-sm text-muted-foreground">
                            Hotline: 1-800-3456<br />
                            Mobile: +63 917 123 4567
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Email Us</h2>
                        <p className="text-sm text-muted-foreground">
                            support@loanhub.ph
                            business@loanhub.ph
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Business Hours</h2>
                        <p className="text-sm text-muted-foreground">
                            Monday - Friday: <br />8:00 AM - 6:00 PM<br />
                            Saturday: <br />9:00 AM - 1:00 PM<br />
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Card className="p-6 gap-6">
                        <h2 className="text-2xl font-bold text-center">Send Us a Message</h2>
                        <form className="flex flex-col gap-4">
                            <Input type="text" placeholder="Your Name" required />
                            <Input type="email" placeholder="Your Email" required />
                            <Input type="text" placeholder="Subject" required />
                            <Input type="textarea" placeholder="Your Message" className="h-32 resize-none" required />
                            <Button type="submit" className="bg-emerald-500 text-white hover:bg-emerald-400 rounded-md px-6 self-center">
                                Send Message
                            </Button>
                        </form>
                    </Card>

                    <div className="w-full aspect-cover rounded-xl overflow-hidden items-center text-center border border-border">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.6856026073838!2d121.013871!3d14.559963000000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9df6c047e17%3A0x12957e8fd785f26f!2sinfinitech%20advertising%20corporation!5e0!3m2!1sen!2sph!4v1770271584546!5m2!1sen!2sph"
                            width="800"
                            height="600"
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                </div>
            </section>

            <section className="max-w-5xl flex-col my-12 justify-center mx-auto px-6 border-t border-border pt-12">
                <div className="text-center mx-auto flex-1 items-center justify-center">
                    <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
                    <span className="text-lg text-muted-foreground">Answers to common questions about our services</span>
                </div>

                <div className="mt-10 flex flex-col gap-8">
                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">How do I apply for a loan?</h2>
                        <p className="text-start">You can apply for a loan through our website or mobile app. Simply select the loan product that suits your needs, fill out the application form, and submit the required documents.</p>
                    </Card>
                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">What are the requirements for applying?</h2>
                        <p className="text-start">Basic requirements include a valid ID, proof of income, and a bank account. Specific requirements may vary based on the loan product you choose.</p>
                    </Card>
                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">How long does it take to get approved?</h2>
                        <p className="text-start">Our approval process is designed to be fast and efficient. Most applications are reviewed within minutes, and you can receive funds within 24 hours after approval.</p>
                    </Card>
                    <Card className="p-6 gap-3">
                        <h2 className="text-2xl font-bold">What if I have trouble making payments?</h2>
                        <p className="text-start">If you encounter difficulties making payments, please contact our customer support team as soon as possible. We are here to help and can discuss alternative payment arrangements if needed.</p>
                    </Card>
                </div>
            </section>
            <Footer />
        </main>
    );
}