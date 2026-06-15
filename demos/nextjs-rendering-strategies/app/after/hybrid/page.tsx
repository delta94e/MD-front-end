// =============================================================
// AFTER: Hybrid Rendering Strategy
// =============================================================
// Real-world apps use MULTIPLE strategies on one page:
// - Static shell (SSG) for layout, nav, footer
// - Dynamic content (SSR) for personalized sections
// - ISR for semi-dynamic content
// - Client components for interactive widgets
// =============================================================

import { Suspense } from "react";
import { fetchProductsServer, fetchBlogPosts, formatPrice } from "@/lib/data";
import Link from "next/link";
import { AddToCartButton } from "./add-to-cart-button";

// ISR with 30-second revalidation
export const revalidate = 30;

export const metadata = {
  title: "Hybrid Strategy | Next.js Rendering Demo",
  description:
    "Real-world hybrid rendering: SSG shell + SSR dynamic content + ISR data + Client interactivity",
};

// ---- Server Component: Featured Products (ISR) ----
async function FeaturedProducts() {
  const products = await fetchProductsServer();
  const featured = products.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featured.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
            <span className="text-5xl">📦</span>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-600">
                {formatPrice(product.price)}
              </span>
              {/* ✅ Client Component inside Server Component */}
              <AddToCartButton productName={product.name} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Server Component: Latest Posts (ISR) ----
async function LatestPosts() {
  const posts = await fetchBlogPosts();
  const latest = posts.slice(0, 2);

  return (
    <div className="space-y-4">
      {latest.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow transition-shadow"
        >
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
            {post.category}
          </span>
          <h4 className="font-bold text-gray-900 mt-2">{post.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}

// ---- Loading Fallbacks for Suspense ----
function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
        >
          <div className="h-40 bg-gray-100 rounded-lg mb-4" />
          <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
          <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

// ---- Main Page Component ----
export default function HybridPage() {
  const generatedAt = new Date().toISOString();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Performance Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-amber-800 font-bold text-lg">
            AFTER: Hybrid Rendering Strategy (Production Pattern)
          </h2>
        </div>
        <div className="text-amber-700 text-sm space-y-1">
          <p>
            ✅ Static shell (SSG) — nav, footer, layout cached at CDN
          </p>
          <p>
            ✅ Streaming (Suspense) — progressive loading with skeletons
          </p>
          <p>
            ✅ ISR data — products/posts refresh every 30s
          </p>
          <p>
            ✅ Client components — interactive buttons, forms only where needed
          </p>
          <p className="font-mono mt-2 text-amber-900 font-bold">
            ⏱ Generated: {generatedAt} | Revalidates: 30s
          </p>
        </div>
      </div>

      {/* Header — Static (SSG) */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hybrid Strategy (Real-World)
          </h1>
          <p className="text-gray-500 mt-1">
            Mix of SSG + ISR + Streaming + Client Components
          </p>
        </div>
        <Link
          href="/before"
          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
        >
          ← Compare with BEFORE
        </Link>
      </div>

      {/* Featured Products — Streamed with Suspense */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-amber-500 rounded" />
          Featured Products
          <span className="text-xs font-normal text-gray-400 ml-2">
            (ISR + Streaming)
          </span>
        </h2>
        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Latest Posts — Streamed with Suspense */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded" />
          Latest Posts
          <span className="text-xs font-normal text-gray-400 ml-2">
            (ISR + Streaming)
          </span>
        </h2>
        <Suspense fallback={<PostsSkeleton />}>
          <LatestPosts />
        </Suspense>
      </section>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-gray-900">
          Hybrid Architecture Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              strategy: "SSG (Static)",
              parts: "Layout, Nav, Footer, Marketing content",
              speed: "~10ms",
              color: "border-blue-400 bg-blue-50",
            },
            {
              strategy: "ISR (Cached + Fresh)",
              parts: "Product listings, Blog posts, Pricing",
              speed: "~50ms",
              color: "border-purple-400 bg-purple-50",
            },
            {
              strategy: "SSR (Dynamic)",
              parts: "User dashboard, Search results, Cart",
              speed: "~100ms",
              color: "border-green-400 bg-green-50",
            },
            {
              strategy: "Client (Interactive)",
              parts: "Add to cart, Filters, Forms, Modals",
              speed: "Interactive",
              color: "border-amber-400 bg-amber-50",
            },
          ].map((item) => (
            <div
              key={item.strategy}
              className={`border-l-4 ${item.color} p-4 rounded-r-lg`}
            >
              <div className="font-bold text-sm text-gray-900">
                {item.strategy}
              </div>
              <div className="text-xs text-gray-600 mt-1">{item.parts}</div>
              <div className="text-xs font-mono text-gray-500 mt-1">
                ⏱ {item.speed}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Explanation */}
      <div className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-amber-400 font-bold mb-4 text-lg">
          ✅ Hybrid Pattern (Production Code)
        </h3>
        <pre className="text-sm leading-relaxed">
          <code>{`import { Suspense } from "react";
import { AddToCartButton } from "./add-to-cart-button";
// "use client" ↑ only for interactive components

export const revalidate = 30; // ISR for this page

// Server Component — fetches data on server
async function FeaturedProducts() {
  const products = await fetchProducts(); // Server-side
  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id} product={p}>
          {/* Client component nested in server component */}
          <AddToCartButton productId={p.id} />
        </ProductCard>
      ))}
    </div>
  );
}

// Main page — static shell + streamed content
export default function HomePage() {
  return (
    <Layout> {/* ← SSG (static) */}
      <Hero /> {/* ← SSG (static) */}
      <Suspense fallback={<Skeleton />}>
        <FeaturedProducts /> {/* ← ISR (streamed) */}
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <LatestPosts /> {/* ← ISR (streamed) */}
      </Suspense>
    </Layout>
  );
}`}</code>
        </pre>
      </div>
    </div>
  );
}
