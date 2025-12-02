import React from "react";

interface DaywiseEntry {
    date: string | null;
    day: string | null;
    timeSlot: string | null;
    status: string | null;
    isUpcoming?: boolean;
}

export default function DaywiseTable({ entries }: { entries: DaywiseEntry[] }) {
    return (
        <div className="overflow-x-auto border rounded-lg mt-4">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {entries.map((e, i) => {
                        const status = (e.status || "").toUpperCase();
                        const isPresent = status === "PRESENT" || status === "P";
                        const isAbsent = status === "ABSENT" || status === "A";
                        const isUpcoming = e.isUpcoming;

                        let statusColor = "text-slate-500";
                        if (isUpcoming) statusColor = "text-blue-600";
                        else if (isPresent) statusColor = "text-emerald-600"; // Matching the "Present" green
                        else if (isAbsent) statusColor = "text-red-600";

                        return (
                            <tr key={i} className="bg-white hover:bg-slate-50">
                                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                                    {e.date || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-500 uppercase text-xs font-medium">
                                    {e.day || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                    {e.timeSlot || "-"}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-right font-bold ${statusColor}`}>
                                    {isUpcoming ? "SCHEDULED" : status}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
