import React from "react";
export default function ResultCard({ item }: { item: any }) {
  const docKey = item.ref; // docId::pageNo
  const [docId, pageNo] = docKey.split("::");
  const meta = item.matchData.metadata;

  return (
    <div className="border rounded p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg text-blue-700">
            <a href={`/subject/${docId}${item.entryId ? `?entry=${item.entryId}` : ''}`}>{meta.subject || meta.title || "Unknown Subject"}</a>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {meta.code ? <span className="font-mono bg-slate-100 px-1 rounded mr-2">{meta.code}</span> : null}
            <span>Page {meta.pageNumber || pageNo}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
          Score: {typeof item.score === 'number' ? Math.round(item.score * 10) / 10 : 'N/A'}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700 line-clamp-3 font-serif leading-relaxed">
        {meta.text}
      </p>
      <div className="mt-3 flex gap-2">
        <a className="text-xs font-medium text-blue-600 hover:underline" href={`/subject/${docId}${item.entryId ? `?entry=${item.entryId}` : ''}`}>View Subject</a>
        {/* Future: Link to specific page viewer */}
      </div>
    </div>
  );
}
