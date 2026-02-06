'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';

export function Footer() {

    return (
        <footer className="bg-gradient-to-r from-cyan-950 to-blue-900 text-white">
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-blue-100">LOAN HUB</h2>
                    <p className="text-sm text-blue-200">
                        Your trusted partner for quick and easy cash loans. Get approved in minutes and receive funds within 24 hours.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-blue-100">Quick Links</h3>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/" className=" text-blue-200 text-sm">Home</Link>
                        </li>
                        <li>
                            <Link href="/loans" className="text-blue-200 hover:text-blue-100 text-sm">Loans</Link>
                        </li>
                        <li>
                            <Link href="/about" className="text-blue-200 hover:text-blue-100 text-sm">About</Link>
                        </li>
                        <li>
                            <Link href="/contact" className="text-blue-200 hover:text-blue-100 text-sm">Contact</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-blue-100">Contact Us</h3>
                    <p className="text-sm text-blue-200">123 Finance St.<br />Money City, MC 45678</p>
                    <p className="text-sm text-blue-200 mt-2">Email:
                        <a href="mailto:info@loanhub.com" className="text-blue-100 hover:text-blue-50">
                            info@loanhub.com
                        </a>
                    </p>
                    <p className="text-sm text-blue-200 mt-2">Phone:
                        <a href="tel:+1234567890" className="text-blue-100 hover:text-blue-50">
                            +1 (234) 567-890
                        </a>
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-blue-100">Subscribe to our Newsletter</h3>
                    <form>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 placeholder-blue-300"
                                required
                            />
                            <Button type="submit" className="bg-emerald-700 text-white hover:bg-emerald-600">
                                Subscribe
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="border-t border-blue-900 mt-8 pt-4 text-center text-sm text-blue-200 pb-5">
                &copy; {new Date().getFullYear()} LOAN HUB Powered by Infinitech Advertising Corporation. All rights reserved.
            </div>
        </footer>
    );
}