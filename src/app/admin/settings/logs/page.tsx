// src/app/admin/settings/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface ActorInfo {
  studentId?: string;
  name?: string;
  role?: string;
}

interface AdminLogItem {
  _id: string;
  action: string;
  actorStudentId: string;
  actorRole: string;
  actorId?: ActorInfo;
  details?: string | null;
  metadata?: {
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export default function SettingsLogsPage() {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [myRole, setMyRole] =
    useState<"student" | "admin" | "superadmin" | null>(null);

  async function fetchMe() {
    try {
      const res = await fetch("/api/user/me");
      if (!res.ok) return;
      const data = await res.json();
      const me = data.user ?? data;
      if (me?.role) setMyRole(me.role);
    } catch {
      // ignore
    }
  }

  async function loadLogs(opts?: { keepPage?: boolean }) {
    setLoading(true);
    setError(null);

    try {
      const effectivePage = opts?.keepPage ? page : 1;
      if (!opts?.keepPage && page !== 1) setPage(1);

      const params = new URLSearchParams();
      params.set("page", String(effectivePage));
      params.set("limit", String(limit));
      // only SYSTEM_SETTINGS_UPDATE logs
      params.set("action", "SYSTEM_SETTINGS_UPDATE");

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Failed to load settings logs");
        return;
      }

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load settings logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLogs({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  const pageInfo =
    total > 0
      ? `Showing ${(page - 1) * limit + 1}–${Math.min(
          page * limit,
          total
        )} of ${total}`
      : "No logs";

  // Only superadmin allowed
  if (myRole && myRole !== "superadmin") {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-2">Settings Logs</h1>
          <p className="text-sm text-slate-600">
            Only superadmin can view settings change history.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">System Settings Change Log</h1>
            <p className="text-sm text-slate-600">
              History of all updates made in the System Settings page.
            </p>
          </div>
          <button
            onClick={() => loadLogs({ keepPage: true })}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl bg-white border shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Time</th>
                <th className="px-3 py-2 text-left font-semibold">Actor</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Registration
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Maintenance
                </th>
                <th className="px-3 py-2 text-left font-semibold">
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Loading logs…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No settings changes found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const created = new Date(log.createdAt).toLocaleString();

                  const actorName =
                    (log.actorId as any)?.name ||
                    (log.actorId as any)?.studentId ||
                    log.actorStudentId;

                  const actorRole =
                    (log.actorId as any)?.role || log.actorRole || "";

                  const allowReg =
                    log.metadata?.allowRegistration === true
                      ? "Enabled"
                      : log.metadata?.allowRegistration === false
                      ? "Disabled"
                      : "—";

                  const maint =
                    log.metadata?.maintenanceMode === true
                      ? "ON"
                      : log.metadata?.maintenanceMode === false
                      ? "OFF"
                      : "—";

                  const msg =
                    log.metadata?.maintenanceMessage ||
                    log.details ||
                    "";

                  return (
                    <tr key={log._id} className="border-t">
                      <td className="px-3 py-2 text-xs">{created}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">
                            {actorName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {log.actorStudentId} • {actorRole}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{allowReg}</td>
                      <td className="px-3 py-2 text-xs">{maint}</td>
                      <td className="px-3 py-2 text-xs max-w-xs">
                        {msg ? (
                          <span className="line-clamp-3">{msg}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="text-slate-600">{pageInfo}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 border rounded-md disabled:opacity-50 bg-white hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 border rounded-md disabled:opacity-50 bg-white hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
