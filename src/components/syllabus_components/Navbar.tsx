// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  function linkClass(path: string) {
    const active = pathname === path;
    return (
      "px-3 py-1.5 text-sm font-medium rounded-md " +
      (active
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100")
    );
  }

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              Syllabus<span className="text-blue-600">Tool</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/search" className={linkClass("/search")}>
            Search
          </Link>
          <Link href="/upload" className={linkClass("/upload")}>
            Upload
          </Link>
        </div>
      </nav>
    </header>
  );
}
