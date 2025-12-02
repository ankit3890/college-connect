// show page or text snippets + highlight
import React from 'react';

export default function DocPreview({ doc }: { doc: any }) {
    if (!doc) return <div className="text-slate-500">Select a page to view</div>;
    return (
        <div className="border p-4 rounded bg-white shadow-sm">
            <div className="flex justify-between mb-4 border-b pb-2">
                <h3 className="font-bold">Page {doc.page}</h3>
                <span className="text-sm text-slate-500">{doc.subject} {doc.code}</span>
            </div>
            <div className="whitespace-pre-wrap font-mono text-sm">
                {doc.text}
            </div>
        </div>
    );
}
