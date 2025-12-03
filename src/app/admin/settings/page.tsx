"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) {
        setMaintenanceMode(data.maintenanceMode || false);
        setMaintenanceMessage(data.maintenanceMessage || "");
        setEmailNotifications(data.emailNotifications ?? true);
        setAutoBackup(data.autoBackup ?? true);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode,
          maintenanceMessage,
          emailNotifications,
          autoBackup,
        }),
      });

      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">
            Configure system preferences and options
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">System Settings</h2>

              <div className="space-y-4">
                {/* Maintenance Mode */}
                <div className="flex items-start justify-between py-3 border-b border-slate-200">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">Maintenance Mode</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Enable maintenance mode to restrict access
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {maintenanceMode && (
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Maintenance Message
                    </label>
                    <input
                      type="text"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="System is under maintenance..."
                    />
                  </div>
                )}

                {/* Email Notifications */}
                <div className="flex items-start justify-between py-3 border-b border-slate-200">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">Email Notifications</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Send email notifications for important events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Auto Backup */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">Automatic Backups</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Automatically backup database daily
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Database Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Database</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Backup Now</div>
                    <div className="text-xs text-slate-600">Create manual backup</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Restore</div>
                    <div className="text-xs text-slate-600">Restore from backup</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
