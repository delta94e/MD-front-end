// =============================================================
// AFTER: Static Site Generation (SSG) — Blog Posts
// =============================================================
// Best for: Content that doesn't change frequently
// Benefits:
// 1. Pages pre-built at BUILD TIME → instant loading
// 2. Served from CDN edge → lowest possible TTFB
// 3. Perfect SEO — complete HTML in static files
// 4. No server needed at runtime → ultra scalable
// =============================================================

import { fetchBlogPosts } from "@/lib/data";
import Link from "next/link";

// ✅ SSG: This page is statically generated at build time
// No 'dynamic' export = default static behavior in App Router
export const metadata = {
  title: "Blog | SSG Demo — Next.js Rendering Strategies",
  description:
    "Read our engineering blog. This page is statically generated at build time for instant loading.",
};

export default async function SSGBlogPage() {
  // ✅ This fetch happens at BUILD TIME, not on each request
  // The resulting HTML is cached and served from CDN
  const posts = await fetchBlogPosts();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Performance Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏗️</span>
          <h2 className="text-blue-800 font-bold text-lg">
            AFTER: Static Site Generation (SSG)
          </h2>
        </div>
        <div className="text-blue-700 text-sm space-y-1">
          <p>
            ✅ Pre-built at BUILD TIME → Zero server processing per request
          </p>
          <p>
            ✅ Served from CDN edge → Lowest possible TTFB (~10-50ms)
          </p>
          <p>✅ Perfect SEO — complete static HTML files</p>
          <p>✅ Infinitely scalable — no server bottleneck</p>
          <p className="font-mono mt-2 text-blue-900 font-bold">
            ⏱ TTFB: ~10-50ms (CDN edge) vs ~800ms+ (CSR)
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Engineering Blog (SSG)
          </h1>
          <p className="text-gray-500 mt-1">
            Pre-built at deploy time — instant loading from CDN
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/after/ssr"
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
          >
            ← SSR
          </Link>
          <Link
            href="/after/isr"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            See ISR →
          </Link>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {post.category}
              </span>
              <span className="text-xs text-gray-400">
                {post.readTime} min read
              </span>
              <span className="text-xs text-gray-400">
                📅 {post.publishedAt}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-700 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                By {post.author}
              </span>
              <span className="text-blue-600 text-sm font-medium">
                Read more →
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Code Explanation */}
      <div className="mt-12 bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-blue-400 font-bold mb-4 text-lg">
          ✅ SSG Code Pattern
        </h3>
        <pre className="text-sm leading-relaxed">
          <code>{`// No "use client", no "force-dynamic"
// → Default behavior: Static Generation!

export const metadata = {
  title: "Blog",
  description: "Engineering blog posts",
};

export default async function BlogPage() {
  // ✅ This runs at BUILD TIME only
  const posts = await fetchBlogPosts();

  return <BlogList posts={posts} />;
}

// For dynamic routes with SSG:
export async function generateStaticParams() {
  // ✅ Pre-generate all blog post pages at build time
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Build output:
// ├── blog.html           (static)
// ├── blog/post-1.html    (static)
// ├── blog/post-2.html    (static)
// └── blog/post-3.html    (static)
// All served directly from CDN!`}</code>
        </pre>
      </div>
    </div>
  );
}
