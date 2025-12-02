// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-40 print:hidden">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              College<span className="text-blue-600">Connect</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Dashboard link */}
          <a
            href="http://localhost:3000/dashboard"
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </a>

          {/* Attendance link - active when on /attendance page */}
          <Link
            href="/attendance"
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${pathname === '/attendance'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            Attendance
          </Link>
        </div>
      </nav>
    </header>
  );
}
