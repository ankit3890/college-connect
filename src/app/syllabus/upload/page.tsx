"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import UploadForm from "@/components/syllabus_components/UploadForm";

export default function UploadPage() {
    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Syllabus</h1>
                    <p className="text-slate-600">
                        Upload PDF syllabus documents for students to access
                    </p>
                </div>

                {/* Upload Card */}
                <div className="bg-white rounded-2xl shadow-lg px-8 py-8">
                    <UploadForm />
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-6 py-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-semibold text-blue-900 mb-1">Upload Guidelines</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Only PDF files are supported</li>
                                <li>• Maximum file size: 10MB</li>
                                <li>• Ensure the PDF contains clear subject information</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
