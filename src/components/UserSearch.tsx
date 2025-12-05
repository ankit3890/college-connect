"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserSearch() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Log Search Activity
        try {
            await fetch("/api/log/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "SEARCH_PROFILE",
                    details: `Searched for ${query.trim()}`
                })
            });
        } catch (err) {
            // ignore
        }

        // Redirect to the profile page of the searched user
        router.push(`/u/${query.trim()}`);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Friends
            </h2>
            <form onSubmit={handleSearch} className="flex gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Username or Student ID..."
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button
                    type="submit"
                    disabled={!query.trim()}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Search
                </button>
            </form>
            <p className="text-sm text-slate-500 mt-3 flex justify-between items-center">
                <span>Search for other students to view their profile and connect.</span>
                <button
                    type="button"
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + "/register");
                        alert("Registration link copied to clipboard!");
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Invite Friend
                </button>
            </p>
        </div>
    );
}
