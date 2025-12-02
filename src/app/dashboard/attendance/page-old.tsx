// src/app/dashboard/attendance/page.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface CyberProfile {
  name: string;
  branch: string;
  year: number;
  userName?: string;
  email?: string;
  mobileNumber?: string;
}

interface AttendanceCourse {
  courseCode?: string;
  courseName?: string;
  componentName?: string;
  totalClasses?: number;
  attendedClasses?: number;
  attendancePercentage?: number;
  // keep it loose so any extra fields from API don't break UI
  [key: string]: any;
}

export default function AttendancePage() {
  const [cyberId, setCyberId] = useState("");
  const [cyberPass, setCyberPass] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<CyberProfile | null>(null);
  const [courses, setCourses] = useState<AttendanceCourse[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    setProfile(null);
    setCourses([]);

    try {
      const res = await fetch("/api/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cyberId, cyberPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "CyberVidya login failed");
        return;
      }

      setMsg(data.msg || "Login successful");
      setProfile(data.profile || null);
      setCourses(data.attendance?.courses || []);

      // clear password from memory/UI
      setCyberPass("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while contacting CyberVidya");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-600">
            Log in with your CyberVidya credentials to view live attendance.
            We don&apos;t store your password and you&apos;ll be asked again next time.
          </p>
        </header>

        {/* Status messages */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {msg && !error && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {msg}
          </div>
        )}

        {/* Login form */}
        <section className="rounded-xl border bg-white px-4 py-4 shadow-sm max-w-md">
          <h2 className="text-sm font-semibold mb-2 text-slate-900">
            CyberVidya login (attendance only)
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                CyberVidya ID
              </label>
              <input
                className="w-full border rounded-md px-2 py-1 bg-slate-50"
                value={cyberId}
                onChange={(e) => setCyberId(e.target.value)}
                placeholder="e.g. 202501100300040"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                CyberVidya Password
              </label>
              <input
                className="w-full border rounded-md px-2 py-1 bg-slate-50"
                type="password"
                value={cyberPass}
                onChange={(e) => setCyberPass(e.target.value)}
                placeholder="Your CyberVidya password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700"
            >
              {loading ? "Logging in…" : "View Attendance"}
            </button>
          </form>
        </section>

        {/* Profile summary */}
        {profile && (
          <section className="rounded-xl border bg-white px-4 py-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Student summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Branch</p>
                <p>{profile.branch}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Year</p>
                <p>{profile.year || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cyber ID</p>
                <p className="font-mono text-xs">
                  {profile.userName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-xs break-all">
                  {profile.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Mobile</p>
                <p className="text-xs">
                  {profile.mobileNumber || "—"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Attendance table */}
        {profile && courses.length > 0 && (
          <section className="rounded-xl border bg-white px-4 py-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Subject-wise attendance
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">
                      Course
                    </th>
                    <th className="px-2 py-2 text-left font-semibold">
                      Component
                    </th>
                    <th className="px-2 py-2 text-right font-semibold">
                      Attended
                    </th>
                    <th className="px-2 py-2 text-right font-semibold">
                      Total
                    </th>
                    <th className="px-2 py-2 text-right font-semibold">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, idx) => {
                    const attended =
                      c.attendedClasses ??
                      c.presentCount ??
                      c.conductedPresent ??
                      null;
                    const total =
                      c.totalClasses ??
                      c.totalCount ??
                      c.conductedClasses ??
                      null;
                    const percent =
                      c.attendancePercentage ??
                      c.attendancePercent ??
                      (attended != null && total
                        ? Math.round((attended / total) * 100)
                        : null);

                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {c.courseName || c.subjectName || "—"}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {c.courseCode || c.subjectCode || ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          {c.componentName || c.component || "—"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {attended != null ? attended : "—"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {total != null ? total : "—"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {percent != null ? `${percent}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {profile && courses.length === 0 && !loading && !error && (
          <p className="text-xs text-slate-500">
            Logged in successfully, but no attendance records were returned
            from CyberVidya.
          </p>
        )}
      </main>
    </div>
  );
}
