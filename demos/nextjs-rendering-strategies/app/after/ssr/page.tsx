// =============================================================
// AFTER: Server-Side Rendering (SSR)
// =============================================================
// Benefits demonstrated:
// 1. Full HTML with data sent on first response
// 2. Excellent SEO — search engines see complete content
// 3. Fast TTFB — no client-side waterfall
// 4. No loading states needed
// 5. Data always fresh (fetched on every request)
// =============================================================

import { fetchProductsServer, formatPrice } from "@/lib/data";
import Link from "next/link";
import { headers } from "next/headers";

// Force dynamic rendering (SSR) — fetch on every request
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products | SSR Demo — Next.js Rendering Strategies",
  description:
    "Browse our product catalog. This page is Server-Side Rendered for optimal SEO and always-fresh content.",
};

export default async function SSRProductsPage() {
  const startTime = Date.now();

  // ✅ Data fetched on SERVER before HTML is sent
  // No useEffect, no loading states, no client-side waterfall
  const products = await fetchProductsServer();

  // Read request headers to prove this is SSR (runs on every request)
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown";

  const fetchDuration = Date.now() - startTime;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Performance Banner */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <h2 className="text-green-800 font-bold text-lg">
            AFTER: Server-Side Rendering (SSR)
          </h2>
        </div>
        <div className="text-green-700 text-sm space-y-1">
          <p>
            ✅ Full HTML with product data sent on first response → Great SEO
          </p>
          <p>
            ✅ Data fetched on server (no client waterfall) → Fast TTFB
          </p>
          <p>✅ No loading spinners — content is immediately visible</p>
          <p>✅ Always fresh data — re-fetched on every request</p>
          <p className="font-mono mt-2 text-green-900 font-bold">
            ⏱ Server-side fetch: {fetchDuration}ms (vs ~800ms+ client-side)
          </p>
          <p className="font-mono text-xs text-green-600 truncate">
            🔍 UA: {userAgent.substring(0, 80)}...
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products (SSR — After)
          </h1>
          <p className="text-gray-500 mt-1">
            View source → You&apos;ll see ALL product data in the HTML!
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/before"
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            ← See BEFORE (CSR)
          </Link>
          <Link
            href="/after/ssg"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            See SSG →
          </Link>
        </div>
      </div>

      {/* ✅ No loading state! Data is already available */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/after/ssr/${product.slug}`}
            className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all overflow-hidden group"
          >
            <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center group-hover:from-green-100 group-hover:to-emerald-200 transition-colors">
              <span className="text-6xl">📦</span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <span className="text-xs text-gray-500">
                  ⭐ {product.rating}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(product.lastUpdated).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Code Explanation */}
      <div className="mt-12 bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-green-400 font-bold mb-4 text-lg">
          ✅ After Code Pattern (SSR)
        </h3>
        <pre className="text-sm leading-relaxed">
          <code>{`// No "use client" → This is a Server Component!
// Data is fetched on the server before HTML is sent

// Force SSR — re-fetch on every request
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products | Our Store",  // ✅ SEO metadata
  description: "Browse products",
};

export default async function ProductsPage() {
  // ✅ Fetched on server — no waterfall!
  // ✅ No useEffect, no useState, no loading state
  const products = await fetchProducts();

  // ✅ HTML contains all product data
  // ✅ Search engines see full content
  return <ProductGrid products={products} />;
}

// Timeline: Browser requests → Server fetches data →
//           Server renders HTML → Full HTML sent to browser
// Total TTFB: ~100ms (vs ~800ms+ with CSR)`}</code>
        </pre>
      </div>
    </div>
  );
}
