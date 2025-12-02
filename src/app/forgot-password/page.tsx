// src/app/forgot-password/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null); // dev helper

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setResetUrl(null);

    if (!email && !studentId) {
      setMessage("Please enter email or student ID");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, studentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to request reset");
        return;
      }

      setMessage(
        data.msg ||
          "If an account exists, a password reset link has been generated."
      );

      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-slate-600">
          Enter your registered Cybervidya ID. If your account exists, a
          reset link will be generated.
        </p>

        {message && (
          <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {/* <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email (optional)
            </label>
            <input
              className="border rounded-md px-2 py-1 w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div> */}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Cybervidya ID
            </label>
            <input
              className="border rounded-md px-2 py-1 w-full"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 202501100300000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-slate-800"
          >
            {loading ? "Generating link…" : "Request Reset Link"}
          </button>
        </form>

        {resetUrl && (
          <div className="text-xs text-slate-700 break-words border border-dashed border-slate-300 rounded-md p-2 mt-2">
            <p className="font-semibold mb-1">Reset URL (click to open):</p>
            <a
              href={resetUrl}
              className="text-blue-600 hover:underline break-words"
            >
              {resetUrl}
            </a>
          </div>
        )}

        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Back to Login
          </a>
        </div>
      </main>
    </div>
  );
}
