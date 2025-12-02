"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
                    <p className="text-slate-600">
                        Last updated: December 3, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-slate-700 leading-relaxed">
                            By accessing and using CollegeConnect, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Account Registration</h2>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password that you use to access the service.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-sm text-blue-900">
                                <strong>Important:</strong> The password you create for CollegeConnect is unique to this platform and separate from your CyberVidya credentials.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Privacy & Data Protection</h2>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            We are committed to protecting your privacy and personal information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                            <li>We only store your CyberVidya Student ID for attendance synchronization purposes</li>
                            <li>Your CyberVidya password is <strong>never stored or accessed</strong> by our system</li>
                            <li>Your email and profile information are stored securely</li>
                            <li>We do not share your personal information with third parties without your consent</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Use of Service</h2>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            CollegeConnect provides the following services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                            <li>Attendance tracking and management</li>
                            <li>Syllabus search and viewing</li>
                            <li>User profile management</li>
                            <li>Academic resource access</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">5. User Responsibilities</h2>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            You agree to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                            <li>Provide accurate and truthful information</li>
                            <li>Keep your login credentials confidential</li>
                            <li>Not share your account with others</li>
                            <li>Use the service in compliance with all applicable laws</li>
                            <li>Not attempt to gain unauthorized access to any part of the service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Prohibited Activities</h2>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            You may not:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                            <li>Use the service for any illegal purpose</li>
                            <li>Attempt to interfere with the proper functioning of the service</li>
                            <li>Upload malicious code or viruses</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Scrape or extract data without permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Account Termination</h2>
                        <p className="text-slate-700 leading-relaxed">
                            We reserve the right to suspend or terminate your account if you violate these terms or engage in activities that may harm the service or other users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Disclaimer of Warranties</h2>
                        <p className="text-slate-700 leading-relaxed">
                            The service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Limitation of Liability</h2>
                        <p className="text-slate-700 leading-relaxed">
                            CollegeConnect and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Changes to Terms</h2>
                        <p className="text-slate-700 leading-relaxed">
                            We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the service after such modifications constitutes your acceptance of the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Contact Information</h2>
                        <p className="text-slate-700 leading-relaxed">
                            If you have any questions about these Terms & Conditions, please contact us through the platform or reach out to the development team.
                        </p>
                        <p className="text-sm text-slate-600 mt-3">
                            Created by: Ankit Kumar Singh, Nitin Kumar Singh, Sameer Sharma
                        </p>
                    </section>

                    {/* Back Button */}
                    <div className="pt-6 border-t border-slate-200">
                        <Link
                            href="/register"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Registration
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
