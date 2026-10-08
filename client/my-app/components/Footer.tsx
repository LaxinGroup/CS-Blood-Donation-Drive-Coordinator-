import React from 'react';
import Link from 'next/link';
import { Heart, Phone, Mail, Shield, Award, Users } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/10 glass-panel mt-20 text-slate-400 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Col */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                                <Heart className="w-4 h-4 text-white fill-white" />
                            </div>
                            <span className="font-bold text-white text-base">Campus Blood Coordinator</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Digitizing campus blood donation drives: real-time scheduling, zero double-booking concurrency engine, on-site check-ins, and live turnout analytics.
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-red-400">
                            <span className="flex items-center space-x-1">
                                <Shield className="w-3.5 h-3.5" />
                                <span>POPIA / HIPAA Compliant</span>
                            </span>
                        </div>
                    </div>

                    {/* Quick Portals */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Role Portals</h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link href="/donor" className="hover:text-red-400 transition-colors">Donor Pre-Screening & Booking</Link></li>
                            <li><Link href="/coordinator" className="hover:text-red-400 transition-colors">Organizer Drive Management & Analytics</Link></li>
                            <li><Link href="/staff" className="hover:text-red-400 transition-colors">Medical Staff Check-In & Queue Desk</Link></li>
                            <li><Link href="/admin" className="hover:text-red-400 transition-colors">System Admin & Audit Logs</Link></li>
                        </ul>
                    </div>

                    {/* Eligibility & Guidelines */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Donor Eligibility</h4>
                        <ul className="space-y-2 text-xs">
                            <li>• Minimum Age: 16+ years</li>
                            <li>• Minimum Weight: 50 kg (110 lbs)</li>
                            <li>• Cooldown Interval: 56 Days (+8 weeks)</li>
                            <li>• Hydration: Drink 500ml water prior</li>
                            <li>• Nutrition: Eat a solid meal 2h before</li>
                        </ul>
                    </div>

                    {/* Campus Support */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Campus Blood Hotline</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-red-400" />
                                <span>+27 (0) 11 717 1000</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-red-400" />
                                <span>blooddrive@campus.edu</span>
                            </div>
                            <p className="text-[11px] text-slate-500 pt-2">
                                Version 1.0.0 • Developed for University Campus Blood Drives.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} CS Blood Donation Drive Coordinator. All rights reserved.</p>
                    <p className="mt-2 sm:mt-0 text-[11px]">Save up to 3 lives per whole blood donation.</p>
                </div>
            </div>
        </footer>
    );
}
