
"use client";
import React, { useState } from 'react';

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;

        setStatus("Uploading...");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/syllabus/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setStatus("Uploaded successfully!");
            } else {
                setStatus("Error: " + (data.msg || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            setStatus("Upload failed");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-white shadow-sm">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select PDF</label>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
            </div>
            <button
                type="submit"
                disabled={!file}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
                Upload
            </button>
            {status && <p className="text-sm text-slate-600">{status}</p>}
        </form>
    );
}
