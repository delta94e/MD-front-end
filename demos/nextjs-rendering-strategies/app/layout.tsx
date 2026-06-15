import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Rendering Strategies — Before & After",
  description:
    "Learn SSR, SSG, ISR by comparing Before (CSR) and After patterns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 antialiased`}>
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                🚀 Rendering Strategies
              </Link>
              <div className="flex items-center gap-1 text-sm">
                <Link
                  href="/before"
                  className="px-3 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors font-medium"
                >
                  🐌 Before
                </Link>
                <Link
                  href="/after/ssr"
                  className="px-3 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors font-medium"
                >
                  ⚡ SSR
                </Link>
                <Link
                  href="/after/ssg"
                  className="px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors font-medium"
                >
                  🏗️ SSG
                </Link>
                <Link
                  href="/after/isr"
                  className="px-3 py-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors font-medium"
                >
                  🔄 ISR
                </Link>
                <Link
                  href="/after/hybrid"
                  className="px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium"
                >
                  🎯 Hybrid
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
            Next.js 14 Rendering Strategies Demo — Built for learning SSR, SSG,
            ISR patterns
          </div>
        </footer>
      </body>
    </html>
  );
}
