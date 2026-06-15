import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Next.js Rendering Strategies — Before & After Demo",
  description:
    "Learn SSR, SSG, ISR, and Hybrid rendering by comparing Before (CSR) and After patterns",
};

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Hero */}
      <div className="text-center mb-16 pt-8">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          Next.js 14 Rendering Strategies
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Interactive demo comparing{" "}
          <span className="text-red-600 font-semibold">Before (CSR)</span> vs{" "}
          <span className="text-green-600 font-semibold">
            After (SSR/SSG/ISR)
          </span>{" "}
          — see the performance difference yourself
        </p>
      </div>

      {/* Before Card */}
      <div className="mb-8">
        <Link
          href="/before"
          className="block bg-red-50 border-2 border-red-200 rounded-2xl p-8 hover:shadow-xl hover:border-red-400 transition-all group"
        >
          <div className="flex items-start gap-6">
            <span className="text-5xl">🐌</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-800 group-hover:text-red-900 mb-2">
                BEFORE: Client-Side Rendering (CSR)
              </h2>
              <p className="text-red-700 mb-4">
                Traditional React pattern with useEffect + useState. See how
                empty HTML, loading spinners, and client-side waterfalls hurt
                performance and SEO.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Empty HTML",
                  "Loading spinners",
                  "~800ms+ TTFB",
                  "Poor SEO",
                  "JS waterfall",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full"
                  >
                    ❌ {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-red-400 text-2xl group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </Link>
      </div>

      {/* After Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          {
            href: "/after/ssr",
            emoji: "⚡",
            title: "SSR",
            subtitle: "Server-Side Rendering",
            desc: "Data fetched on server, full HTML on first response. Always fresh data.",
            tags: ["Dynamic content", "Always fresh", "~100ms TTFB"],
            color: "green",
            useCase: "Dashboards, Search results, User profiles",
          },
          {
            href: "/after/ssg",
            emoji: "🏗️",
            title: "SSG",
            subtitle: "Static Site Generation",
            desc: "Pre-built at deploy time. Served from CDN edge for instant loading.",
            tags: ["Build-time", "CDN edge", "~10ms TTFB"],
            color: "blue",
            useCase: "Blog, Docs, Marketing, Landing pages",
          },
          {
            href: "/after/isr",
            emoji: "🔄",
            title: "ISR",
            subtitle: "Incremental Static Regeneration",
            desc: "Static speed with periodic freshness. Best of SSG + SSR.",
            tags: ["Cached + Fresh", "Background revalidation", "~50ms TTFB"],
            color: "purple",
            useCase: "Product listings, News feeds, Pricing",
          },
          {
            href: "/after/hybrid",
            emoji: "🎯",
            title: "Hybrid",
            subtitle: "Production Pattern",
            desc: "Mix strategies per component: SSG shell + ISR data + Client interactivity.",
            tags: ["Real-world", "Streaming", "Suspense"],
            color: "amber",
            useCase: "E-commerce, SaaS platforms, Complex apps",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block bg-${item.color}-50 border-2 border-${item.color}-200 rounded-2xl p-6 hover:shadow-xl hover:border-${item.color}-400 transition-all group`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <h3
                  className={`text-lg font-bold text-${item.color}-800 group-hover:text-${item.color}-900`}
                >
                  {item.title}
                </h3>
                <p className={`text-sm text-${item.color}-600`}>
                  {item.subtitle}
                </p>
              </div>
            </div>
            <p className={`text-${item.color}-700 text-sm mb-3`}>
              {item.desc}
            </p>
            <p className="text-xs text-gray-500 mb-3 italic">
              Use case: {item.useCase}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs bg-${item.color}-100 text-${item.color}-700 px-2 py-0.5 rounded-full`}
                >
                  ✅ {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* TTFB Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          ⏱ Performance Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  Strategy
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  TTFB
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  SEO
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  Data Freshness
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  When to Use
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: "CSR (Before)",
                  ttfb: "~800ms+",
                  ttfbColor: "text-red-600",
                  seo: "❌ Poor",
                  freshness: "Always fresh",
                  when: "SPAs, auth-only pages",
                },
                {
                  name: "SSR (After)",
                  ttfb: "~100ms",
                  ttfbColor: "text-green-600",
                  seo: "✅ Excellent",
                  freshness: "Always fresh",
                  when: "Dynamic, personalized",
                },
                {
                  name: "SSG (After)",
                  ttfb: "~10ms",
                  ttfbColor: "text-blue-600",
                  seo: "✅ Perfect",
                  freshness: "Build-time only",
                  when: "Static content",
                },
                {
                  name: "ISR (After)",
                  ttfb: "~50ms",
                  ttfbColor: "text-purple-600",
                  seo: "✅ Excellent",
                  freshness: "Periodic refresh",
                  when: "Semi-dynamic content",
                },
              ].map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{row.name}</td>
                  <td className={`py-3 px-4 font-mono font-bold ${row.ttfbColor}`}>
                    {row.ttfb}
                  </td>
                  <td className="py-3 px-4">{row.seo}</td>
                  <td className="py-3 px-4">{row.freshness}</td>
                  <td className="py-3 px-4 text-gray-500">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
