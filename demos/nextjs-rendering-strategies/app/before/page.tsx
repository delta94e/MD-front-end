// =============================================================
// BEFORE: Client-Side Rendering (CSR) — Products Page
// =============================================================
// Problems demonstrated:
// 1. Empty HTML sent to browser (poor SEO)
// 2. JavaScript must load → then fetch data → then render
// 3. User sees loading spinner (poor UX, high TTFB)
// 4. Search engines can't index dynamic content
// 5. Waterfall: HTML → JS → API → Render
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { Product } from "@/lib/data";
import Link from "next/link";

export default function BeforeProductsPage() {
  // ❌ PROBLEM: State managed on client — initial HTML is empty
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    const start = performance.now();

    // ❌ PROBLEM: Data fetched AFTER JavaScript loads and component mounts
    // Timeline: Server sends empty HTML → Browser downloads JS bundle →
    //           JS executes → Component mounts → useEffect fires →
    //           API request sent → Wait for response → setState → Re-render
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProducts(data);
        setRenderTime(performance.now() - start);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Performance Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🐌</span>
          <h2 className="text-red-800 font-bold text-lg">
            BEFORE: Client-Side Rendering (CSR)
          </h2>
        </div>
        <div className="text-red-700 text-sm space-y-1">
          <p>
            ❌ Empty HTML sent to browser → Poor SEO, search engines see blank
            page
          </p>
          <p>
            ❌ Data fetched in useEffect → User sees loading spinner first
          </p>
          <p>❌ Waterfall: HTML → JS Bundle → API Call → Render</p>
          <p>❌ TTFB includes only empty shell, content appears much later</p>
          {renderTime > 0 && (
            <p className="font-mono mt-2 text-red-900 font-bold">
              ⏱ Client-side data load time: {renderTime.toFixed(0)}ms
            </p>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products (CSR — Before)
          </h1>
          <p className="text-gray-500 mt-1">
            View source → You&apos;ll see NO product data in the HTML
          </p>
        </div>
        <Link
          href="/after/ssr"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          See AFTER (SSR) →
        </Link>
      </div>

      {/* ❌ Loading State — User sees this while data is being fetched */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
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
                  <span className="text-xl font-bold text-indigo-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Explanation */}
      <div className="mt-12 bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-yellow-400 font-bold mb-4 text-lg">
          ❌ Before Code Pattern (CSR)
        </h3>
        <pre className="text-sm leading-relaxed">
          <code>{`"use client"; // ← Forces client-side rendering

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ❌ Data fetched AFTER JS loads & component mounts
    // ❌ Creates waterfall: HTML → JS → API → Render
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  // ❌ User sees loading spinner while waiting
  if (loading) return <Skeleton />;

  return <ProductGrid products={products} />;
}`}</code>
        </pre>
      </div>
    </div>
  );
}
