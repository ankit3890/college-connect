"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!agreeToTerms) {
            setError("You must agree to the Terms and Conditions");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.msg || "Registration failed");
                return;
            }

            // Redirect to login
            router.push("/login");
        } catch (err) {
            console.error(err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg px-8 py-10 border-2 border-black">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
                        Create Account
                    </h1>
                    <p className="text-center text-slate-600 text-sm mb-8">
                        Join CollegeConnect to access your dashboard.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                CYBERVIDYA ID
                            </label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="202412345678901"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                EMAIL
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                CONFIRM PASSWORD
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-start">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                className="w-4 h-4 mt-1 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-slate-700">
                                I agree to the{" "}
                                <Link href="/terms" className="text-blue-600 hover:underline">
                                    Terms and Conditions
                                </Link>
                            </label>
                        </div>

                        {/* Password Policy Notice */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-900">
                                <strong>Important:</strong> This password is unique to CollegeConnect. We only store your CyberVidya ID for profile sync. Your CyberVidya password is never stored or accessed by our system.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-500 mt-6">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Your information is stored securely.
                    </p>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
