"use client";
import { useState } from "react";

export default function SearchBox({ onResults }: { onResults: (r: any[]) => void }) {
  const [q, setQ] = useState("");
  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    console.log("Searching for:", q);
    if (!q) return onResults([]);
    try {
      const res = await fetch(`/api/syllabus/search?q=${encodeURIComponent(q)}`);
      console.log("Search response status:", res.status);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      console.log("Search data:", data);
      onResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      onResults([]);
    }
  }
  return (
    <form onSubmit={doSearch} className="flex gap-2">
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="flex-1 border px-3 py-2 rounded"
        placeholder="Search by Subject Code (e.g., MA101)..."
      />
      <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded">Search</button>
    </form>
  );
}
