// C:\Users\ankit\Desktop\attendance-system\frontend\app\page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Attendance System</h1>
        <p className="text-gray-600">
          Frontend is running from <code>attendance-system/frontend</code>.
        </p>

        <div className="space-x-4">
          <Link
            href="/attendance"
            className="underline"
          >
            Go to Attendance Page
          </Link>

          <Link
            href="/dashboard/attendance"
            className="underline"
          >
            Go to Attendance Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
