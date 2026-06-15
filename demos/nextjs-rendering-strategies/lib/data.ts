// =============================================================
// Mock Data & Fetch Functions
// Simulates a real API with network latency
// =============================================================

export interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: string;
  rating: number;
  image: string;
  lastUpdated: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  readTime: number;
}

// ---- Mock Data ----
const products: Product[] = [
  {
    id: 1,
    slug: "wireless-earbuds-pro",
    name: "Wireless Earbuds Pro",
    price: 2499000,
    description:
      "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Perfect for commuting and workouts.",
    category: "Electronics",
    rating: 4.8,
    image: "/products/earbuds.jpg",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 2,
    slug: "smart-watch-ultra",
    name: "Smart Watch Ultra",
    price: 8990000,
    description:
      "Advanced smartwatch with health monitoring, GPS tracking, and 5-day battery life. Titanium case with sapphire crystal display.",
    category: "Electronics",
    rating: 4.6,
    image: "/products/watch.jpg",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 3,
    slug: "mechanical-keyboard-rgb",
    name: "Mechanical Keyboard RGB",
    price: 3200000,
    description:
      "Hot-swappable mechanical keyboard with per-key RGB lighting, PBT keycaps, and gasket mount construction for premium typing feel.",
    category: "Accessories",
    rating: 4.9,
    image: "/products/keyboard.jpg",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 4,
    slug: "usb-c-hub-10in1",
    name: "USB-C Hub 10-in-1",
    price: 1590000,
    description:
      "All-in-one USB-C hub with HDMI 4K@60Hz, USB 3.0, SD card reader, ethernet, and 100W PD charging pass-through.",
    category: "Accessories",
    rating: 4.4,
    image: "/products/hub.jpg",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 5,
    slug: "noise-cancelling-headphones",
    name: "Noise Cancelling Headphones",
    price: 6790000,
    description:
      "Over-ear headphones with industry-leading ANC, 40-hour battery, multipoint connection, and premium comfort padding.",
    category: "Electronics",
    rating: 4.7,
    image: "/products/headphones.jpg",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 6,
    slug: "portable-charger-20000",
    name: "Portable Charger 20000mAh",
    price: 890000,
    description:
      "Compact power bank with 20000mAh capacity, 65W fast charging, dual USB-C ports, and LED display showing exact battery percentage.",
    category: "Accessories",
    rating: 4.5,
    image: "/products/charger.jpg",
    lastUpdated: new Date().toISOString(),
  },
];

const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "nextjs-14-app-router-migration",
    title: "Migrating to Next.js 14 App Router: A Complete Guide",
    excerpt:
      "Learn how to migrate from Pages Router to App Router with practical examples and performance comparisons.",
    content: `
# Migrating to Next.js 14 App Router

The App Router in Next.js 14 represents a fundamental shift in how we build React applications. 
It introduces React Server Components, nested layouts, and a new data fetching paradigm.

## Key Changes

### 1. Server Components by Default
In the App Router, all components are Server Components by default. This means they run on the server 
and send only the rendered HTML to the client.

### 2. New File Conventions
- \`page.tsx\` - Defines a route
- \`layout.tsx\` - Shared UI for a segment
- \`loading.tsx\` - Loading UI
- \`error.tsx\` - Error UI

### 3. Data Fetching
No more \`getServerSideProps\` or \`getStaticProps\`. Instead, use \`async/await\` directly in Server Components.
    `,
    author: "Truong Nguyen",
    publishedAt: "2024-03-15",
    category: "Next.js",
    readTime: 8,
  },
  {
    id: 2,
    slug: "ssr-vs-ssg-vs-isr-explained",
    title: "SSR vs SSG vs ISR: When to Use Each Rendering Strategy",
    excerpt:
      "A deep dive into Server-Side Rendering, Static Site Generation, and Incremental Static Regeneration with real-world use cases.",
    content: `
# SSR vs SSG vs ISR

Understanding when to use each rendering strategy is crucial for building performant Next.js applications.

## SSR (Server-Side Rendering)
Best for: Dynamic content that changes on every request (user dashboards, search results)

## SSG (Static Site Generation)  
Best for: Content that rarely changes (blog posts, documentation, marketing pages)

## ISR (Incremental Static Regeneration)
Best for: Content that changes periodically (product listings, news feeds)
    `,
    author: "Truong Nguyen",
    publishedAt: "2024-04-20",
    category: "Performance",
    readTime: 12,
  },
  {
    id: 3,
    slug: "react-server-components-deep-dive",
    title: "React Server Components: The Complete Deep Dive",
    excerpt:
      "Understanding RSC architecture, streaming, Suspense boundaries, and how they revolutionize frontend performance.",
    content: `
# React Server Components Deep Dive

React Server Components (RSC) are a new paradigm that allows components to run exclusively on the server.

## Benefits
- Zero bundle size for server components
- Direct database/API access
- Automatic code splitting
- Streaming with Suspense
    `,
    author: "Truong Nguyen",
    publishedAt: "2024-05-10",
    category: "React",
    readTime: 15,
  },
];

// ---- Simulated API Fetch Functions ----

/** Simulate network latency (300-800ms like real APIs) */
function simulateLatency(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * BEFORE pattern: Client-side fetch (used from useEffect)
 * Simulates slow API call that blocks rendering
 */
export async function fetchProductsClient(): Promise<Product[]> {
  // In real "before" scenario, this would be:
  // const res = await fetch('/api/products');
  // return res.json();
  await simulateLatency(800); // Simulate slow network
  return products.map((p) => ({
    ...p,
    lastUpdated: new Date().toISOString(),
  }));
}

/**
 * AFTER pattern: Server-side fetch (used in Server Components)
 * Data is fetched on server — no client-side waterfall
 */
export async function fetchProductsServer(): Promise<Product[]> {
  // In production, this would be a direct DB query or internal API call
  // No network hop needed since we're on the same server
  await simulateLatency(100); // Much faster — server-to-server
  return products.map((p) => ({
    ...p,
    lastUpdated: new Date().toISOString(),
  }));
}

export async function fetchProductBySlug(
  slug: string
): Promise<Product | null> {
  await simulateLatency(50);
  return products.find((p) => p.slug === slug) || null;
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  await simulateLatency(100);
  return blogPosts;
}

export async function fetchBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  await simulateLatency(50);
  return blogPosts.find((p) => p.slug === slug) || null;
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

/**
 * Format price in VND
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
