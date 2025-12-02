"use client";
import { useState } from "react";
import SearchBox from "../components/SearchBox";
import ResultCard from "../components/ResultCard";

export default function Page() {
    const [results, setResults] = useState<any[]>([]);
    return (
        <main className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Syllabus search</h1>
            <SearchBox onResults={(r) => setResults(r)} />
            <div className="mt-6">
                {results.length > 0 ? (
                    <table className="w-full border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left">Subject Code</th>
                                <th className="border border-slate-300 p-2 text-left">Subject Name</th>
                                <th className="border border-slate-300 p-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res: any) => {
                                const meta = res.matchData.metadata;
                                const link = `/subject/${res.id}${res.entryId ? `?entry=${res.entryId}` : ""}`;
                                return (
                                    <tr key={res.ref} className="hover:bg-slate-50">
                                        <td className="border border-slate-300 p-2 font-mono">{meta.code || "-"}</td>
                                        <td className="border border-slate-300 p-2">{meta.subject || meta.title}</td>
                                        <td className="border border-slate-300 p-2 text-center">
                                            <a href={link} className="text-blue-600 hover:underline font-bold">
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-slate-500">No results found. Try searching by Subject Code (e.g., MA101).</div>
                )}
            </div>
        </main>
    );
}
