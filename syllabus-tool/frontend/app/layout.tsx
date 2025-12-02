import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata = {
  title: 'Syllabus Tool',
  description: 'Search and view syllabus',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
