// src/app/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  _id?: string;
  studentId: string;
  name?: string;
  email?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const raw = await res.json();
          const u: User | undefined = raw.user ?? raw;
          setUser(u ?? null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setCheckedAuth(true);
      }
    }

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Main heading */}
        <section className="text-center space-y-3">
          <h1 className="text-3xl font-bold">
            Welcome to <span className="text-green-600">CollegeConnect</span>
          </h1>
          <p className="text-sm text-slate-500">
            One place for your college profile, upcoming chat system, AI
            assistance, attendance and announcements.
          </p>
        </section>

        {/* Only render auth‑dependent UI after we checked */}
        {checkedAuth && (
          <>
            {/* NOT LOGGED IN: show Login / Register buttons */}
            {!user && (
              <section className="text-center space-y-4">
                <p className="text-sm text-slate-600">
                  Login or create an account to access all features.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/login"
                    className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Register
                  </Link>
                </div>
              </section>
            )}

            {/* LOGGED IN: show quick info */}
            {user && (
              <section className="space-y-3 text-center">
                <p className="text-sm text-slate-600">
                  You are logged in as{" "}
                  <span className="font-semibold">
                    {user.name || user.studentId}
                  </span>
                  .
                </p>
              </section>
            )}
          </>
        )}

        {/* Feature cards - available to everyone */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Attendance Card */}
          <Link
            href="/attendance"
            className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Attendance
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  View your attendance records and track your presence in classes
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Open
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Syllabus Card */}
          <Link
            href="/syllabus/search"
            className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-emerald-500"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  Syllabus
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Search and view course syllabi and subject details
                </p>
                <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                  Open
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/profile"
            className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Profile
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Manage your account settings and personal information
                </p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                  Open
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Settings Card */}
          <Link
            href="/settings"
            className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-slate-500"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-600 transition-colors">
                  Settings
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Configure your preferences and application settings
                </p>
                <div className="mt-4 flex items-center text-slate-600 text-sm font-medium">
                  Open
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <section className="text-center col-span-1 md:col-span-2 mt-6">
            <p className="text-sm text-slate-600">
              Created By-
              <span className="font-semibold text-cyan-600">
                Ankit Kumar singh , Nitin Kumar Singh, Sameer Sharma
              </span>
              .
            </p>
          </section>
        </section>
      </main>
    </div>
  );
}
