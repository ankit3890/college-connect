import React from "react";
import DocPreview from "../../components/DocPreview";

async function getSubjectData(id: string) {
    try {
        const res = await fetch(`http://localhost:4000/subject/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function SubjectPage({ params, searchParams }: { params: { id: string }, searchParams: { entry?: string } }) {
    const data = await getSubjectData(params.id);

    if (!data || !data.doc) {
        return <div className="p-6">Subject not found</div>;
    }

    const { doc, entries } = data;
    // Use the specific entry if requested, otherwise fallback to first
    const entryId = searchParams?.entry;
    const entry = (entries && entries.length > 0)
        ? (entryId ? entries.find((e: any) => e.id === entryId) || entries[0] : entries[0])
        : null;
    const title = entry ? entry.subjectName : doc.title;
    const code = entry ? entry.subjectCode : "";
    const credits = entry ? entry.credits : "";
    const prerequisites = entry ? entry.prerequisites : "";
    const objectives = entry ? entry.objectives : [];
    const outcomes = entry ? entry.outcomes : [];
    const topics = entry ? entry.topics : [];
    const marks = entry ? entry.marksCriteria : null;

    const pdfUrl = `http://localhost:4000/doc/${doc._id}/content${entry ? `#page=${entry.sourcePage}` : ""}`;

    return (
        <main className="max-w-4xl mx-auto p-8 font-serif text-slate-900">
            <a href="/search" className="text-blue-600 hover:underline text-sm mb-4 block no-print">← Back to search</a>

            <div className="border-2 border-black">
                {/* Header Row */}
                <div className="grid grid-cols-12 border-b border-black text-sm">
                    <div className="col-span-3 border-r border-black p-1 font-bold bg-slate-100">Course Code: {code}</div>
                    <div className="col-span-6 border-r border-black p-1 font-bold text-center bg-slate-100">Course Name: {title}</div>
                    <div className="col-span-3 grid grid-cols-4 text-center font-bold bg-slate-100">
                        <div className="border-r border-black">L</div>
                        <div className="border-r border-black">T</div>
                        <div className="border-r border-black">P</div>
                        <div>C</div>
                    </div>
                </div>
                {/* Credits Values */}
                <div className="grid grid-cols-12 border-b border-black text-sm">
                    <div className="col-span-9 border-r border-black p-1"></div>
                    <div className="col-span-3 grid grid-cols-4 text-center">
                        <div className="border-r border-black">{credits?.split(' ')[0] || '-'}</div>
                        <div className="border-r border-black">{credits?.split(' ')[1] || '-'}</div>
                        <div className="border-r border-black">{credits?.split(' ')[2] || '-'}</div>
                        <div>{credits?.split(' ')[3] || credits || '-'}</div>
                    </div>
                </div>

                {/* Prerequisites */}
                {prerequisites && (
                    <div className="border-b border-black p-1 text-sm">
                        <span className="font-bold">Pre-requisite: </span>
                        {prerequisites}
                    </div>
                )}

                {/* Course Objectives */}
                {objectives && objectives.length > 0 && (
                    <div className="border-b border-black p-1 text-sm">
                        <div className="font-bold mb-1">Course Objectives:</div>
                        <ul className="list-decimal list-inside">
                            {objectives.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Course Outcomes */}
                {outcomes && outcomes.length > 0 && (
                    <div className="border-b border-black p-1 text-sm">
                        <div className="font-bold mb-1">Course Outcome:</div>
                        <div className="mb-1">After completion of the course, the student will be able to</div>
                        <ul className="list-decimal list-inside">
                            {outcomes.map((out: string, i: number) => (
                                <li key={i}>{out}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Topics / Units */}
                {topics.map((topic: string, i: number) => {
                    // Format: Unit X || Title || Hours || Content
                    const parts = topic.split(' || ');
                    let unit = `Unit ${i + 1}`;
                    let title = "Topic";
                    let hours = "";
                    let content = topic;

                    if (parts.length >= 4) {
                        unit = parts[0];
                        title = parts[1];
                        hours = parts[2];
                        content = parts[3];
                    } else {
                        // Fallback for old data or unexpected format
                        const p = topic.split(':');
                        title = p[0] || "Topic";
                        content = p.slice(1).join(':') || topic;
                    }

                    return (
                        <div key={i} className="border-b border-black">
                            <div className="grid grid-cols-12 bg-slate-50 border-b border-black text-sm font-bold">
                                <div className="col-span-2 p-1 border-r border-black">{unit}</div>
                                <div className="col-span-8 p-1 border-r border-black">{title}</div>
                                <div className="col-span-2 p-1 text-center">{hours}</div>
                            </div>
                            <div className="p-2 text-sm text-justify whitespace-pre-wrap">
                                {content}
                            </div>
                        </div>
                    );
                })}

                {/* Evaluation Scheme */}
                {marks && (
                    <div className="border-b border-black">
                        <div className="p-1 font-bold bg-slate-100 border-b border-black text-sm">Mode of Evaluation</div>
                        <div className="grid grid-cols-12 text-center text-sm">
                            <div className="col-span-12 font-bold border-b border-black p-1">Evaluation Scheme</div>

                            {/* Header */}
                            <div className="col-span-4 border-r border-black border-b border-black p-1 font-bold">MSE</div>
                            <div className="col-span-4 border-r border-black border-b border-black p-1 font-bold">CA</div>
                            <div className="col-span-2 border-r border-black border-b border-black p-1 font-bold">ESE</div>
                            <div className="col-span-2 border-b border-black p-1 font-bold">Total</div>

                            {/* Values */}
                            <div className="col-span-2 border-r border-black p-1">MSE 1</div>
                            <div className="col-span-2 border-r border-black p-1">MSE 2</div>
                            <div className="col-span-4 border-r border-black p-1 grid grid-cols-3">
                                <div className="border-r border-black">CA1</div>
                                <div className="border-r border-black">CA2</div>
                                <div>CA3(ATT)</div>
                            </div>
                            <div className="col-span-2 border-r border-black p-1 row-span-2 flex items-center justify-center font-bold">{marks['ESE'] || 100}</div>
                            <div className="col-span-2 p-1 row-span-2 flex items-center justify-center font-bold">{marks['Total'] || 200}</div>

                            {/* Marks Row */}
                            <div className="col-span-2 border-r border-black border-t border-black p-1 font-bold">{marks['MSE 1'] || 40}</div>
                            <div className="col-span-2 border-r border-black border-t border-black p-1 font-bold">{marks['MSE 2'] || 40}</div>
                            <div className="col-span-4 border-r border-black border-t border-black p-1 grid grid-cols-3">
                                <div className="border-r border-black">{marks['CA1'] || 8}</div>
                                <div className="border-r border-black">{marks['CA2'] || 8}</div>
                                <div>{marks['CA3'] || 4}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 text-xs text-slate-500">
                * Data extracted from {doc.filename} (Page {entry?.sourcePage})
            </div>
        </main>
    );
}
