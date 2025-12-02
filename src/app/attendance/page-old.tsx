// src/app/attendance/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import { FormEvent, useMemo, useState } from "react";

interface AttendanceCourse {
  courseCode: string;
  courseName: string;
  componentName: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
  courseComponentId?: number;
  courseVariant?: string;
  courseId?: number;
}

interface StudentInfo {
  fullName?: string;
  registrationNumber?: string;
  branchShortName?: string;
  semesterName?: string;
  admissionBatchName?: string;
}

interface DaywiseEntry {
  date: string;
  day: string;
  timeSlot: string;
  status: string;
}

export default function AttendancePage() {
  const [cyberId, setCyberId] = useState("");
  const [cyberPass, setCyberPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [courses, setCourses] = useState<AttendanceCourse[]>([]);

  // daywise modal state
  const [daywiseOpen, setDaywiseOpen] = useState(false);
  const [daywiseCourse, setDaywiseCourse] =
    useState<AttendanceCourse | null>(null);
  const [daywiseLoading, setDaywiseLoading] = useState(false);
  const [daywiseError, setDaywiseError] = useState<string | null>(null);
  const [daywiseEntries, setDaywiseEntries] = useState<DaywiseEntry[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!cyberId || !cyberPass) {
      setError("Please enter your CyberVidya credentials.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cyberId, cyberPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Failed to fetch attendance");
        setHasLoggedIn(false);
        setStudent(null);
        setCourses([]);
        return;
      }

      setMsg(data.msg || "Attendance loaded");
      setStudent(data.student || null);
      setCourses(data.courses || []);
      setHasLoggedIn(true);
      // keep cyberPass for daywise API
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setHasLoggedIn(false);
      setStudent(null);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  const overallPercentage = useMemo(() => {
    const valid = courses.filter((c) => c.totalClasses > 0);
    if (!valid.length) return 0;
    const present = valid.reduce((sum, c) => sum + c.presentClasses, 0);
    const total = valid.reduce((sum, c) => sum + c.totalClasses, 0);
    if (!total) return 0;
    return (present / total) * 100;
  }, [courses]);

  const getAbsent = (c: AttendanceCourse) =>
    Math.max(c.totalClasses - c.presentClasses, 0);

  async function handleOpenDaywise(course: AttendanceCourse) {
    if (!course.courseComponentId) return;
    if (!cyberId || !cyberPass) {
      setError("CyberVidya login expired. Please login again.");
      return;
    }

    setDaywiseCourse(course);
    setDaywiseOpen(true);
    setDaywiseError(null);
    setDaywiseEntries([]);
    setDaywiseLoading(true);

    try {
      const res = await fetch("/api/attendance/daywise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cyberId,
          cyberPass,
          courseComponentId: course.courseComponentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDaywiseError(data.msg || "Failed to load daywise attendance");
        return;
      }

      setDaywiseEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      setDaywiseError("Something went wrong while fetching daywise attendance");
    } finally {
      setDaywiseLoading(false);
    }
  }

  function handleCloseDaywise() {
    setDaywiseOpen(false);
    setDaywiseCourse(null);
    setDaywiseEntries([]);
    setDaywiseError(null);
  }

  const overallColor =
    overallPercentage >= 75
      ? "bg-emerald-500"
      : overallPercentage >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold mb-2">Attendance</h1>
        <p className="text-sm text-slate-600 mb-4">
          CyberVidya attendance is fetched live. Your credentials are not stored
          in our database – they are used only for this session.
        </p>

        {/* Login card */}
        <section className="rounded-xl bg-white border shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold">Login to CyberVidya</h2>
          <p className="text-xs text-slate-500">
            Use your KIET/CyberVidya student ID and password. We will fetch only
            your attendance data.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Student ID (CyberVidya username)
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                value={cyberId}
                onChange={(e) => setCyberId(e.target.value)}
                placeholder="202501100300040"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                CyberVidya password
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                type="password"
                value={cyberPass}
                onChange={(e) => setCyberPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800"
            >
              {loading ? "Fetching…" : "Fetch attendance"}
            </button>
          </form>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {msg && !error && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {msg}
            </div>
          )}
        </section>

        {/* Student card + summary */}
        {hasLoggedIn && (
          <>
            {/* Student profile / header */}
            <section className="rounded-xl bg-white border shadow-sm p-4 sm:p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                    {student?.fullName || "Student"}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
                    {student?.registrationNumber && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5">
                        {student.registrationNumber}
                      </span>
                    )}
                    {student?.branchShortName && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5">
                        {student.branchShortName}
                      </span>
                    )}
                    {student?.semesterName && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5">
                        Sem {student.semesterName}
                      </span>
                    )}
                    {student?.admissionBatchName && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5">
                        Batch {student.admissionBatchName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Overall attendance bar */}
            <section className="rounded-xl bg-white border shadow-sm p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold">Overall Attendance</h2>
              <div className="w-full h-6 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full ${overallColor} transition-all`}
                  style={{
                    width: `${Math.min(Math.max(overallPercentage, 0), 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                {overallPercentage.toFixed(1)}%
              </p>
            </section>

            {/* Subject table */}
            <section className="rounded-xl bg-white border shadow-sm p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold mb-1">
                Subject-wise Attendance
              </h2>

              {courses.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No attendance data found for this account.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          Code
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Subject
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Component
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Present
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Absent
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Total
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          %
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Daywise
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2 font-mono">
                            {c.courseCode || "-"}
                          </td>
                          <td className="px-3 py-2">{c.courseName || "-"}</td>
                          <td className="px-3 py-2">{c.componentName}</td>
                          <td className="px-3 py-2 text-right">
                            {c.presentClasses}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {getAbsent(c)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {c.totalClasses}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {c.percentage.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right">
                            {c.courseComponentId ? (
                              <button
                                type="button"
                                onClick={() => handleOpenDaywise(c)}
                                className="inline-flex items-center rounded border border-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:bg-slate-900 hover:text-white"
                              >
                                See daywise
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                N/A
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Daywise modal */}
        {daywiseOpen && daywiseCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  Daywise Attendance for{" "}
                  <span className="font-bold">
                    {daywiseCourse.courseName}
                  </span>{" "}
                  -{" "}
                  <span className="uppercase">
                    {daywiseCourse.componentName}
                  </span>
                </h3>
                <button
                  onClick={handleCloseDaywise}
                  className="text-red-500 font-bold text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {daywiseError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                  {daywiseError}
                </div>
              )}

              {daywiseLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : daywiseEntries.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No daywise entries found for this course.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[70vh]">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Day
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Time Slot
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Attendance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {daywiseEntries.map((d, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{d.date}</td>
                          <td className="px-3 py-2">{d.day}</td>
                          <td className="px-3 py-2">{d.timeSlot}</td>
                          <td className="px-3 py-2 font-semibold">
                            <span
                              className={
                                d.status?.toUpperCase() === "PRESENT"
                                  ? "text-emerald-600"
                                  : d.status?.toUpperCase() === "ABSENT"
                                  ? "text-red-600"
                                  : "text-slate-700"
                              }
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
