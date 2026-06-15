// =============================================================
// AFTER: Incremental Static Regeneration (ISR)
// =============================================================
// The BEST OF BOTH WORLDS:
// - Fast like SSG (served from cache/CDN)
// - Fresh like SSR (revalidates periodically)
// Perfect for: Product listings, news feeds, dashboards
// =============================================================

import { fetchProductsServer, formatPrice } from "@/lib/data";
import Link from "next/link";

// ✅ ISR: Revalidate every 60 seconds
// Page is statically generated, but refreshed every 60s
export const revalidate = 60;

export const metadata = {
  title: "Products | ISR Demo — Next.js Rendering Strategies",
  description:
    "Browse products with ISR. Static performance with periodic data freshness.",
};

export default async function ISRProductsPage() {
  const products = await fetchProductsServer();
  const generatedAt = new Date().toISOString();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Performance Banner */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔄</span>
          <h2 className="text-purple-800 font-bold text-lg">
            AFTER: Incremental Static Regeneration (ISR)
          </h2>
        </div>
        <div className="text-purple-700 text-sm space-y-1">
          <p>
            ✅ Static performance — served from cache like SSG
          </p>
          <p>
            ✅ Fresh data — revalidates every 60 seconds in background
          </p>
          <p>✅ No stale data — users always get recent content</p>
          <p>✅ Best of both worlds — SSG speed + SSR freshness</p>
          <p className="font-mono mt-2 text-purple-900 font-bold">
            ⏱ Generated at: {generatedAt}
          </p>
          <p className="font-mono text-xs text-purple-600">
            🔄 Revalidates every 60s — refresh the page to see timestamp update
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products (ISR — Best of Both)
          </h1>
          <p className="text-gray-500 mt-1">
            Static speed + fresh data every 60 seconds
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/after/ssg"
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
          >
            ← SSG
          </Link>
          <Link
            href="/after/hybrid"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            See Hybrid →
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all overflow-hidden"
          >
            <div className="h-48 bg-gradient-to-br from-purple-50 to-violet-100 flex items-center justify-center">
              <span className="text-6xl">📦</span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <span className="text-xs text-gray-500">
                  ⭐ {product.rating}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-purple-600">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ISR Timeline Visualization */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-6 text-gray-900">
          How ISR Works — Timeline
        </h3>
        <div className="space-y-4">
          {[
            {
              time: "T+0s",
              event: "First request → Page generated & cached",
              color: "bg-purple-500",
            },
            {
              time: "T+30s",
              event: "Request → Served from cache (stale-while-revalidate)",
              color: "bg-green-500",
            },
            {
              time: "T+60s",
              event: "Request → Served from cache + background regeneration triggered",
              color: "bg-amber-500",
            },
            {
              time: "T+61s",
              event: "Next request → Fresh page served from updated cache",
              color: "bg-purple-500",
            },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${step.color} flex-shrink-0`}
              />
              <span className="font-mono text-sm text-gray-500 w-16 flex-shrink-0">
                {step.time}
              </span>
              <span className="text-sm text-gray-700">{step.event}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code Explanation */}
      <div className="mt-8 bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-purple-400 font-bold mb-4 text-lg">
          ✅ ISR Code Pattern
        </h3>
        <pre className="text-sm leading-relaxed">
          <code>{`// ✅ Just add revalidate — that's it!
export const revalidate = 60; // Seconds

export default async function ProductsPage() {
  // Fetched at build time, then refreshed every 60s
  const products = await fetchProducts();
  return <ProductGrid products={products} />;
}

// Per-fetch revalidation (more granular):
async function getProducts() {
  const res = await fetch("https://api.example.com/products", {
    next: { revalidate: 60 }, // ✅ Cache for 60 seconds
  });
  return res.json();
}

// On-demand revalidation (webhook/CMS trigger):
// POST /api/revalidate
import { revalidatePath } from "next/cache";
export async function POST() {
  revalidatePath("/products"); // ✅ Instantly refresh
  return Response.json({ revalidated: true });
}`}</code>
        </pre>
      </div>
    </div>
  );
}
