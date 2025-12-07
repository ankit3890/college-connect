// src/app/dashboard/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";

// 👇 Point to the attendance page on the same server
const ATTENDANCE_APP_URL = "/attendance";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      if (res.ok) setUser(data.user || data);
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="p-6">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.name || user?.firstName || "Student"}!
        </h1>
        <p className="text-slate-600">Your tools and shortcuts are below.</p>

        {/* --- FEATURE CARDS --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Attendance – now opens attendance page */}
          <Link
            href={ATTENDANCE_APP_URL}
            className="group"
          >
            <div className="p-4 rounded-lg bg-white shadow-md border border-emerald-200 group-hover:border-emerald-400 group-hover:shadow-lg transition">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                📝 Attendance
                <span className="text-[11px] px-2 py-[2px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                  Live
                </span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                View your KIET CyberVidya attendance with analytics and insights.
              </p>
            </div>
          </Link>

          {/* Chatting – future */}
          <div className="p-4 rounded-lg bg-white shadow-md border">
            <h2 className="font-semibold text-lg">💬 Chatting</h2>
            <p className="text-sm text-slate-600">
              Chat system will be added soon to connect with friends.
            </p>
          </div>

          {/* AI Assistance – future */}
          <div className="p-4 rounded-lg bg-white shadow-md border">
            <h2 className="font-semibold text-lg">🤖 AI Assistance</h2>
            <p className="text-sm text-slate-600">
              AI will help you with studies & suggestions.
            </p>
          </div>

          {/* Announcements – future */}
          <div className="p-4 rounded-lg bg-white shadow-md border">
            <h2 className="font-semibold text-lg">📢 Announcements</h2>
            <p className="text-sm text-slate-600">
              All college updates will appear here.
            </p>
          </div>
        </section>
      </main>
    </div >
  );
}
