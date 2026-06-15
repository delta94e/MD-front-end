# Next.js 14 Rendering Strategies: Deep Dive & Mental Models

> Tài liệu học chuyên sâu — giải thích mental model, phân tích concept, Q&A phản biện cho phỏng vấn Senior Frontend Engineer

---

## Mục lục

1. [Mental Model: Rendering Timeline](#1-mental-model-rendering-timeline)
2. [CSR — Client-Side Rendering (Before)](#2-csr--client-side-rendering-before)
3. [SSR — Server-Side Rendering](#3-ssr--server-side-rendering)
4. [SSG — Static Site Generation](#4-ssg--static-site-generation)
5. [ISR — Incremental Static Regeneration](#5-isr--incremental-static-regeneration)
6. [Hybrid Strategy — Production Pattern](#6-hybrid-strategy--production-pattern)
7. [React Server Components (RSC)](#7-react-server-components-rsc)
8. [Streaming & Suspense](#8-streaming--suspense)
9. [Q&A Phản biện chuyên sâu](#9-qa-phản-biện-chuyên-sâu)
10. [Decision Framework](#10-decision-framework)

---

## 1. Mental Model: Rendering Timeline

### Rendering là gì thực sự?

"Rendering" trong web development có **2 nghĩa khác nhau** mà nhiều người nhầm lẫn:

1. **Server rendering** = Chuyển đổi React component tree → HTML string trên server
2. **Browser rendering** = Browser parse HTML → xây DOM → paint pixels lên màn hình

Khi ta nói "SSR", ta nói về nghĩa (1) — server tạo HTML. Khi ta nói "CSR", React chạy trên browser để tạo DOM trực tiếp, bỏ qua bước server tạo HTML.

### Mental Model: "Nhà hàng"

Hãy tưởng tượng mỗi rendering strategy như cách phục vụ ở nhà hàng:

| Strategy | Ẩn dụ nhà hàng |
|----------|----------------|
| **CSR** | Bạn được đưa vào bàn trống, đợi 10 phút gọi món, đợi thêm 20 phút nấu. Bạn nhìn bàn trống suốt 30 phút. |
| **SSR** | Bạn ngồi xuống, món đã được nấu sẵn trước khi bạn đến bàn. Bạn ăn ngay lập tức. Nhưng nhà bếp phải nấu mỗi lần có khách mới. |
| **SSG** | Nhà hàng nấu sẵn tất cả các món từ sáng sớm (build time). Khi bạn đến, thức ăn đã sẵn sàng trong tủ ấm. Nhanh nhất, nhưng thực đơn không đổi. |
| **ISR** | Giống SSG nhưng nhà bếp nấu lại mỗi 30 phút. Bạn có thể nhận được món cũ nếu đến giữa chu kỳ, nhưng luôn khá fresh. |
| **Hybrid** | Nhà hàng phục vụ: salad sẵn (SSG) + súp nấu mới mỗi 30 phút (ISR) + steak nấu theo order (SSR) + bạn tự pha nước chấm (Client). |

### Mental Model: "Request Timeline"

```
═══════════════════════════════════════════════════════════════════
CSR Timeline:
═══════════════════════════════════════════════════════════════════

Browser          Server          API Server
   │                │                │
   │──GET /page────>│                │
   │<──Empty HTML───│                │   ← TTFB: ~50ms (nhưng HTML rỗng!)
   │                │                │
   │  [Download JS bundle ~200KB]    │   ← Thêm ~200ms
   │  [Parse + Execute JS]           │   ← Thêm ~100ms
   │  [React hydrate + mount]        │   ← Thêm ~50ms
   │                │                │
   │  useEffect fires:               │
   │──GET /api/products─────────────>│
   │<──JSON data─────────────────────│   ← Thêm ~500-800ms
   │                │                │
   │  [setState → Re-render]         │   ← Thêm ~50ms
   │  [User sees content]            │
   │                                 │
   Total: ~950-1250ms trước khi user thấy nội dung
   SEO: ❌ Google thấy HTML rỗng

═══════════════════════════════════════════════════════════════════
SSR Timeline:
═══════════════════════════════════════════════════════════════════

Browser          Server          Database/API
   │                │                │
   │──GET /page────>│                │
   │                │──fetch data───>│
   │                │<──data─────────│   ← ~100ms (server-to-server)
   │                │                │
   │                │  [Render HTML] │   ← ~50ms
   │<──Full HTML────│                │   ← TTFB: ~150ms (HTML ĐẦY ĐỦ!)
   │                │                │
   │  [User sees content NGAY!]      │
   │  [Download JS → Hydrate]        │   ← Background, không block
   │                                 │
   Total: ~150ms trước khi user thấy nội dung
   SEO: ✅ Google thấy HTML đầy đủ

═══════════════════════════════════════════════════════════════════
SSG Timeline:
═══════════════════════════════════════════════════════════════════

BUILD TIME (deploy):
   Server fetches data → Generates HTML files → Upload to CDN

RUNTIME (user request):
Browser          CDN Edge
   │                │
   │──GET /page────>│
   │<──Cached HTML──│   ← TTFB: ~10-30ms (từ CDN gần nhất!)
   │                │
   │  [User sees content NGAY!]
   │  [Hydrate in background]
   │
   Total: ~10-30ms
   SEO: ✅ Perfect

═══════════════════════════════════════════════════════════════════
ISR Timeline:
═══════════════════════════════════════════════════════════════════

Request 1 (Cache miss):
   → Server generates HTML + caches it     ← Like SSR: ~150ms

Request 2 (Cache hit, within revalidate window):
   → Serve from cache                      ← Like SSG: ~30ms

Request 3 (Cache hit, past revalidate window):
   → Serve STALE from cache (user gets fast response)  ← ~30ms
   → Background: Server regenerates + updates cache    ← Invisible

Request 4 (After regeneration):
   → Serve FRESH from cache                ← ~30ms
```

---

## 2. CSR — Client-Side Rendering (Before)

### Concept sâu

CSR là mô hình mà **toàn bộ rendering logic chạy trên browser**. Server chỉ gửi một HTML shell rỗng chứa `<script>` tag. Browser phải:

1. Download JavaScript bundle
2. Parse và execute JavaScript
3. React tạo virtual DOM
4. Mount components, fire useEffect
5. Fetch data từ API
6. Re-render với data mới

### Tại sao CSR tồn tại?

CSR phổ biến vì:
- **Đơn giản**: Không cần server rendering infrastructure
- **SPA experience**: Navigation mượt mà không reload trang
- **Tách biệt frontend/backend**: API-driven architecture
- **Hosting rẻ**: Chỉ cần static hosting (Netlify, S3)

### CSR vẫn có chỗ đứng

> ⚠️ CSR không phải lúc nào cũng xấu! Nó phù hợp cho:
> - **Behind-auth pages**: Dashboard sau login (không cần SEO)
> - **Highly interactive apps**: Figma, Google Docs
> - **Internal tools**: Admin panels, CMS
> - **Real-time apps**: Chat, collaborative editing

### Code: Tại sao useEffect pattern có vấn đề

```tsx
"use client";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ❌ Vấn đề 1: Race condition — component có thể unmount trước khi fetch xong
    // ❌ Vấn đề 2: Không có error retry logic
    // ❌ Vấn đề 3: Không có caching — mỗi lần mount lại fetch lại
    // ❌ Vấn đề 4: Waterfall — parent phải fetch xong → child mới bắt đầu fetch
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />; // ← User nhìn cái này 800ms+
  return <ProductGrid products={products} />;
}
```

**HTML mà Google bot nhận được:**
```html
<!DOCTYPE html>
<html>
<head><title>Products</title></head>
<body>
  <div id="__next">
    <!-- TRỐNG! Không có product data nào -->
    <!-- Google bot thấy trang trống → SEO = 0 -->
  </div>
  <script src="/_next/static/chunks/main-abc123.js"></script>
</body>
</html>
```

---

## 3. SSR — Server-Side Rendering

### Concept sâu

SSR là mô hình mà **server chạy React rendering trên mỗi request**. Kết quả là HTML đầy đủ được gửi về browser.

### Mental Model: "Server làm hộ browser"

Thay vì browser phải:
1. Download JS → 2. Execute React → 3. Fetch API → 4. Render

Server làm tất cả bước 2-4 trước, rồi gửi kết quả HTML hoàn chỉnh. Browser chỉ cần hiển thị.

### SSR trong Next.js 14 App Router

```tsx
// Đây là Server Component — chạy TRÊN SERVER
// Không có "use client" → default = server

export const dynamic = "force-dynamic"; // Bắt buộc SSR mỗi request

export default async function ProductsPage() {
  // ✅ Chạy trên server — có thể access database trực tiếp
  // ✅ Không gửi code này xuống client
  // ✅ Secret keys an toàn — không bao giờ lộ ra browser
  const products = await db.query("SELECT * FROM products");

  return <ProductGrid products={products} />;
}
```

### Hydration: Khái niệm quan trọng

Sau khi browser nhận HTML từ SSR:

1. **First Paint**: Browser hiển thị HTML ngay (nhanh!)
2. **Hydration**: React download JS → attach event listeners → "tưới nước" cho HTML tĩnh
3. **Interactive**: Sau hydration, page hoàn toàn interactive

> 🧠 **Mental Model**: SSR HTML giống như mannequin trong cửa hàng — trông giống người thật nhưng không di chuyển được. Hydration là quá trình "thổi hồn" vào mannequin để nó có thể phản hồi (click, type, etc.)

### SSR Cost: Trade-offs

```
Pros:
✅ TTFB nhanh với content đầy đủ
✅ SEO tuyệt vời
✅ Luôn fresh data
✅ Không cần loading states

Cons:
❌ Server phải render mỗi request → tốn CPU
❌ TTFB phụ thuộc vào tốc độ data fetching
❌ Không cache được → mỗi user = 1 server render
❌ Cold start có thể chậm (serverless)
❌ Time to Interactive (TTI) > TTFB vì phải đợi hydration
```

---

## 4. SSG — Static Site Generation

### Concept sâu

SSG nghĩa là **React chạy 1 lần duy nhất tại build time**, tạo ra các file HTML tĩnh. Những file này được upload lên CDN và serve trực tiếp mà không cần server nào.

### Mental Model: "In sách"

- **SSR** = Viết thư tay mỗi lần có người hỏi (chậm nhưng personalized)
- **SSG** = In sách hàng loạt (nhanh, rẻ, nhưng nội dung cố định cho đến lần in tiếp)

### SSG trong Next.js 14

```tsx
// Không có dynamic = "force-dynamic"
// Không có revalidate
// → Next.js tự động làm SSG!

export default async function BlogPage() {
  // Chạy 1 lần tại build time
  const posts = await fetchBlogPosts();
  return <BlogList posts={posts} />;
}

// Cho dynamic routes: /blog/[slug]
export async function generateStaticParams() {
  // Next.js sẽ pre-render tất cả paths này
  return [
    { slug: "post-1" },
    { slug: "post-2" },
    { slug: "post-3" },
  ];
}
```

### Build output:

```
.next/
└── server/
    └── app/
        ├── blog.html           ← Static HTML
        ├── blog/
        │   ├── post-1.html     ← Static HTML
        │   ├── post-2.html     ← Static HTML  
        │   └── post-3.html     ← Static HTML
```

### Khi nào SSG thất bại?

SSG **không phù hợp** khi:
- Data thay đổi thường xuyên (giá sản phẩm, stock)
- Content personalized theo user
- Số lượng pages quá lớn (1M+ products → build time hàng giờ)
- Real-time data (chat, notifications)

→ Đây là lý do ISR ra đời.

---

## 5. ISR — Incremental Static Regeneration

### Concept sâu

ISR kết hợp **tốc độ của SSG** với **sự fresh của SSR** bằng cách:
1. Serve HTML từ cache (nhanh như SSG)
2. Sau khoảng thời gian `revalidate`, regenerate HTML mới ở background
3. Request tiếp theo nhận HTML mới

### Mental Model: "Báo giấy vs Báo online"

- **SSG** = Báo giấy in 1 lần/ngày. Bạn đọc tin sáng nay, dù bây giờ là chiều.
- **SSR** = Mỗi lần bạn mở báo, phóng viên chạy ra hiện trường viết bài mới. Fresh nhưng chậm.
- **ISR** = Báo tự cập nhật mỗi 30 phút. Bạn có thể đọc bản cũ 30 phút, nhưng phiên bản mới đang được chuẩn bị.

### Stale-While-Revalidate Pattern

ISR sử dụng HTTP caching pattern **stale-while-revalidate**:

```
Timeline với revalidate = 60s:

T=0s    Request → Cache MISS → Server renders → Cache HTML → Respond
T=10s   Request → Cache HIT → Respond immediately (cached HTML)
T=30s   Request → Cache HIT → Respond immediately (cached HTML)
T=60s   Request → Cache HIT (STALE) → Respond immediately
                 └─> Background: Server re-renders → Updates cache
T=61s   Request → Cache HIT (FRESH) → Respond with new HTML
```

> 🧠 **Insight**: User KHÔNG BAO GIỜ phải đợi regeneration. Họ luôn nhận cached version ngay lập tức. Regeneration xảy ra ẩn sau hậu trường.

### On-Demand Revalidation

Ngoài time-based, Next.js hỗ trợ **on-demand revalidation** — trigger refresh khi data thực sự thay đổi:

```tsx
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidation-secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CMS webhook gọi endpoint này khi content thay đổi
  revalidatePath("/products");     // Revalidate cả page
  revalidateTag("products");       // Hoặc theo tag

  return Response.json({ revalidated: true, now: Date.now() });
}
```

```tsx
// Trong data fetching — gắn tag:
async function getProducts() {
  const res = await fetch("https://api.example.com/products", {
    next: { tags: ["products"] },  // Tag cho on-demand revalidation
  });
  return res.json();
}
```

---

## 6. Hybrid Strategy — Production Pattern

### Concept sâu

Trong production, **KHÔNG BAO GIỜ** dùng duy nhất 1 strategy. Một trang web thực tế kết hợp nhiều strategies cho các phần khác nhau:

### Mental Model: "Tòa nhà"

```
┌──────────────────────────────────────────┐
│  Header / Navigation          [SSG]      │ ← Không bao giờ thay đổi
├──────────────────────────────────────────┤
│  Hero Banner                  [ISR 1h]   │ ← Marketing đổi mỗi giờ
├──────────────────────────────────────────┤
│  Product Carousel             [ISR 5m]   │ ← Giá/stock đổi thường
│  ┌────────────────────────────────┐      │
│  │ "Add to Cart" button [Client] │      │ ← Interactive, user-specific
│  └────────────────────────────────┘      │
├──────────────────────────────────────────┤
│  Personalized Recommendations  [SSR]     │ ← Khác nhau mỗi user
├──────────────────────────────────────────┤
│  Blog Posts                    [SSG]     │ ← Static content
├──────────────────────────────────────────┤
│  Footer                       [SSG]     │ ← Không bao giờ thay đổi
└──────────────────────────────────────────┘
```

### Suspense + Streaming: Chìa khóa của Hybrid

```tsx
import { Suspense } from "react";

export default function HomePage() {
  return (
    <>
      {/* SSG — render ngay, không đợi */}
      <Header />
      <Hero />

      {/* ISR + Streaming — show skeleton trước, data stream sau */}
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts /> {/* async server component */}
      </Suspense>

      {/* SSR — personalized, nhưng cũng streamed */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <PersonalizedRecommendations /> {/* cần user context */}
      </Suspense>

      {/* SSG — static */}
      <Footer />
    </>
  );
}
```

**Kết quả**: Browser nhận HTML theo chunks:
1. Header + Hero ngay (SSG) → User thấy page structure
2. Skeleton placeholders cho dynamic sections
3. Products stream vào khi server fetch xong → Replace skeleton
4. Recommendations stream vào sau → Replace skeleton

---

## 7. React Server Components (RSC)

### Concept sâu

RSC là paradigm mới mà Next.js 14 App Router dựa trên. Hiểu RSC là **bắt buộc** để hiểu rendering strategies.

### Mental Model: "Hai thế giới"

```
┌─────────────────────────────────────────────────┐
│                 SERVER WORLD                     │
│                                                  │
│  Server Components (default)                     │
│  ✅ Access database trực tiếp                    │
│  ✅ Dùng Node.js APIs (fs, crypto)               │
│  ✅ Giữ secrets an toàn                          │
│  ✅ Không ship JS xuống client (0 KB!)           │
│  ❌ KHÔNG dùng được useState, useEffect          │
│  ❌ KHÔNG dùng được browser APIs (window, DOM)   │
│                                                  │
│  ┌───────────── BOUNDARY ──────────────┐        │
│  │  "use client"                        │        │
│  │                                      │        │
│  │  Client Components                   │        │
│  │  ✅ useState, useEffect              │        │
│  │  ✅ Event handlers (onClick)         │        │
│  │  ✅ Browser APIs                     │        │
│  │  ❌ JS phải ship xuống client        │        │
│  │  ❌ Không access server resources    │        │
│  └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Composition Pattern: Server wrap Client

```tsx
// ✅ Server Component (parent) — không ship JS
async function ProductPage({ id }) {
  const product = await db.getProduct(id); // Chạy trên server

  return (
    <div>
      {/* Static content — 0 KB JS */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>{formatPrice(product.price)}</span>

      {/* Chỉ component này ship JS xuống client */}
      <AddToCartButton productId={product.id} />
      <ReviewForm productId={product.id} />
    </div>
  );
}
```

```tsx
// AddToCartButton.tsx
"use client"; // ← CHỈ component này cần JS!

export function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  // ... interactive logic
}
```

**Kết quả**: Thay vì ship toàn bộ ProductPage (5KB JS), chỉ ship AddToCartButton (0.5KB JS). Giảm 90% JS bundle cho page này.

---

## 8. Streaming & Suspense

### Concept sâu

Streaming cho phép server **gửi HTML theo chunks** thay vì đợi toàn bộ page render xong.

### Mental Model: "Netflix vs DVD"

- **Không Streaming (SSR truyền thống)**: Như mua DVD — phải đợi tải xong toàn bộ phim mới xem được
- **Streaming**: Như Netflix — xem ngay, phần còn lại load dần

### Cách Streaming hoạt động

```
Không Streaming:
Server: [Render Header]──[Fetch Products 500ms]──[Render Footer]
                                                        │
Client:                                                 └──Nhận TẤT CẢ HTML
        ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ 550ms đợi

Có Streaming (Suspense):
Server: [Render Header + Skeleton]──────────────→ gửi ngay!
        [Fetch Products 500ms]──[Render Products]→ gửi chunk 2!
        [Render Footer]────────────────────────→ gửi chunk 3!

Client: Nhận Header + Skeleton ──→ 50ms (thấy layout ngay!)
        Nhận Products ────────→ 550ms (replace skeleton)
        Nhận Footer ──────────→ 560ms
```

### Nested Suspense: Parallel Loading

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* 3 sections load SONG SONG, không waterfall */}
      <div className="grid grid-cols-3 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />        {/* Fetch 300ms */}
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <RecentOrders />        {/* Fetch 500ms */}
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <UserStats />           {/* Fetch 200ms */}
        </Suspense>
      </div>
    </div>
  );
}

// Tổng thời gian: max(300, 500, 200) = 500ms
// KHÔNG PHẢI: 300 + 500 + 200 = 1000ms (waterfall)
```

---

## 9. Q&A Phản biện chuyên sâu

### Q1: "SSR có thật sự nhanh hơn CSR không? Server cũng phải fetch data mà?"

**Trả lời ban đầu**: Có, SSR nhanh hơn vì server-to-server communication nhanh hơn client-to-server.

**Phản biện**: "Nhưng SSR thêm server rendering time. Nếu tính cả rendering, TTFB của SSR có thể chậm hơn TTFB của CSR (vì CSR TTFB chỉ là empty HTML)."

**Trả lời sâu**: Đúng, **TTFB** thuần túy của CSR có thể thấp hơn vì server chỉ gửi empty HTML. Nhưng TTFB không phải metric quan trọng nhất:

```
Metric thực sự quan trọng: Time to MEANINGFUL Content

CSR:  TTFB (50ms) → User thấy: trang trắng/skeleton
      FCP (1200ms) → User thấy: loading spinner
      LCP (1800ms) → User thấy: actual content ← ĐÂY MỚI QUAN TRỌNG

SSR:  TTFB (150ms) → User thấy: ACTUAL CONTENT ← Ngay lập tức!
      FCP = TTFB = 150ms
      LCP = ~200ms (images load)
```

**Kết luận**: SSR "chậm hơn" ở TTFB nhưng **nhanh hơn 8-10x** ở Largest Contentful Paint (LCP) — metric mà Google dùng để rank SEO và metric mà user thực sự cảm nhận.

---

### Q2: "Nếu SSG nhanh nhất, tại sao không dùng SSG cho tất cả?"

**Trả lời ban đầu**: Vì SSG build tại deploy time, data sẽ cũ cho đến lần deploy tiếp.

**Phản biện**: "Nhưng ta có thể tự động deploy mỗi khi data thay đổi? CI/CD trigger rebuild."

**Trả lời sâu**: Đúng, nhưng có 3 vấn đề thực tế:

1. **Build time**: Nếu site có 100K products, full rebuild mất 30-60 phút. Mỗi lần 1 sản phẩm thay đổi giá, bạn rebuild toàn bộ 100K pages?

2. **Personalization**: SSG không thể render content khác nhau cho từng user. User A và user B thấy cùng HTML. Không thể hiện "Xin chào, Trường" hoặc personalized recommendations.

3. **Real-time data**: Giá stock, inventory count, live chat — thay đổi mỗi giây. Build/deploy mỗi giây là không khả thi.

**Đó là lý do ISR tồn tại**: Giải quyết vấn đề (1) bằng incremental builds. Nhưng (2) và (3) vẫn cần SSR hoặc Client Components.

---

### Q3: "ISR revalidate = 60 nghĩa là user có thể thấy data cũ 60 giây. Làm sao chấp nhận được cho e-commerce?"

**Trả lời ban đầu**: Đối với hầu hết e-commerce, 60s staleness là chấp nhận được cho product listing pages.

**Phản biện**: "Nhưng nếu sản phẩm hết hàng và user vẫn thấy 'In Stock'? Hoặc giá thay đổi?"

**Trả lời sâu**: Cách giải quyết trong production:

```
Strategy phân lớp:

1. Product LISTING page → ISR revalidate=60
   - Hiển thị tên, ảnh, giá "hiển thị" (gần đúng)
   - Chấp nhận staleness vì đây là browsing phase

2. Product DETAIL page → ISR revalidate=30 + On-demand
   - Khi CMS/PIM update → webhook gọi revalidatePath()
   - Giá và stock được double-check ở bước 3

3. "Add to Cart" API → SSR / Real-time
   - Server kiểm tra giá THẬT và inventory THẬT
   - Nếu giá thay đổi → hiện thông báo "Giá đã cập nhật"
   - Nếu hết hàng → block action, hiện "Sold out"

4. Checkout → 100% SSR + Real-time validation
   - Không bao giờ trust cached data
   - Double-check mọi thứ trước khi charge tiền
```

**Kết luận**: ISR dùng cho **display optimization**, không phải **business logic**. Critical operations (checkout, payment) luôn verify real-time.

---

### Q4: "React Server Components có thật sự giảm bundle size? Bằng chứng?"

**Trả lời**: Có, và đây là cách đo lường:

```tsx
// TRƯỚC RSC: Toàn bộ page là client component
// Bundle: page.js = 45KB (gzip)
// Bao gồm: React render logic + data formatting + UI components

"use client";
import { formatDate, formatPrice } from "@/lib/utils"; // 3KB
import { ProductCard } from "@/components/ProductCard"; // 5KB
import { ReviewList } from "@/components/ReviewList";   // 8KB

export default function ProductPage({ product }) {
  // Tất cả 16KB+ được ship xuống client
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <ProductCard product={product} />
      <ReviewList reviews={product.reviews} />
    </div>
  );
}
```

```tsx
// SAU RSC: Chỉ interactive parts là client components
// Bundle: page.js = 2KB (gzip) — CHỈ AddToCartButton!
// 95% giảm!

// Server Component — 0KB shipped to client
import { formatDate, formatPrice } from "@/lib/utils"; // Server-only
import { ProductCard } from "@/components/ProductCard"; // Server-only
import { ReviewList } from "@/components/ReviewList";   // Server-only
import { AddToCartButton } from "./AddToCartButton";    // Client: 2KB

export default async function ProductPage({ params }) {
  const product = await db.getProduct(params.id); // Server-only

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <ProductCard product={product} />
      <ReviewList reviews={product.reviews} />
      <AddToCartButton productId={product.id} /> {/* Chỉ 2KB JS */}
    </div>
  );
}
```

**Cách verify**: `next build` → check `.next/static` folder size, hoặc Chrome DevTools → Network → filter JS.

---

### Q5: "Hydration có phải là bottleneck không? Tại sao cần hydrate nếu đã có HTML?"

**Trả lời ban đầu**: Hydration cần thiết để attach event listeners và make page interactive.

**Phản biện**: "Nhưng hydration phải re-render TOÀN BỘ component tree trên client, dù HTML đã có sẵn. Đây là duplicate work!"

**Trả lời sâu**: Đúng, đây là vấn đề được gọi là **"Hydration tax"**. Giải pháp:

1. **React Server Components giảm hydration**: Chỉ Client Components cần hydrate. Server Components gửi HTML nhưng KHÔNG CẦN hydrate.

2. **Selective Hydration (React 18+)**: React có thể hydrate từng phần theo priority, không phải toàn bộ tree cùng lúc.

3. **Partial Prerendering (Next.js 15 experimental)**: Combine static shell + dynamic holes — chỉ dynamic parts cần hydrate.

```
Traditional SSR Hydration:
[Render entire tree on server] → [Re-render entire tree on client] 😩

RSC + Selective Hydration:
[Render server components] → Send HTML (no hydration needed!)
[Render client components] → Hydrate ONLY these small parts ✅
```

---

### Q6: "Micro-Frontend có liên quan gì đến rendering strategies?"

**Trả lời sâu**: Rất liên quan! Trong Micro-Frontend:

```
Main Shell (Next.js Host):
├── Header MFE (Team A)  → SSG, shared across all pages
├── Product MFE (Team B) → ISR, revalidate=60
├── Cart MFE (Team C)    → Client-side, user-specific state
└── Footer MFE (Team D)  → SSG, static

Mỗi team CHỌN rendering strategy RIÊNG cho module của mình.
Host app orchestrate bằng Module Federation + Suspense boundaries.
```

Đây chính là pattern mà CV đề cập: "Architected Micro-Frontend infrastructure using Module Federation, enabling independent team deployments across 8+ autonomous squads."

---

### Q7: "Cache invalidation là hard problem. ISR giải quyết nó như thế nào?"

**Trả lời sâu**: ISR có 2 chiến lược invalidation:

**Strategy 1: Time-based (simple but coarse)**
```tsx
export const revalidate = 60; // Sau 60s, cache coi như stale
// Pro: Đơn giản, không cần webhook infrastructure
// Con: Data có thể stale tối đa 60s
```

**Strategy 2: On-demand (precise but complex)**
```tsx
// Webhook từ CMS/Database trigger:
revalidatePath("/products/shoe-123");
// Pro: Cache invalidate ngay khi data thay đổi
// Con: Cần webhook infrastructure, error handling, idempotency
```

**Phản biện**: "On-demand revalidation có thể fail silently. Webhook bị miss → stale data forever?"

**Trả lời**: Đúng. Production pattern kết hợp CẢ HAI:

```tsx
// "Belt and Suspenders" approach:
export const revalidate = 300; // Fallback: refresh mỗi 5 phút dù gì đi nữa

// + On-demand: refresh ngay khi biết data đổi
// → Worst case: data stale tối đa 5 phút (thay vì forever)
```

---

### Q8: "Nếu phỏng vấn hỏi: 'Giải thích kiến trúc web platform cho C-Ticket (bán vé concert, millions users trong vài phút)' — bạn trả lời thế nào?"

**Trả lời**: Đây là bài toán **high-traffic, time-sensitive** cần hybrid approach:

```
Architecture cho C-Ticket:

PRE-EVENT (days before):
├── Event landing pages → SSG (pre-build tất cả)
├── Event details → ISR revalidate=300 (cập nhật mỗi 5 phút)
├── Seat map → ISR revalidate=60 (hiển thị availability gần đúng)
└── CDN: Cloudflare/Fastly edge cache cho tất cả static assets

DURING SALE (minutes):
├── Ticket selection → SSR + WebSocket (real-time seat availability)
├── Queue system → Client + Server-Sent Events (vị trí trong hàng)
├── Checkout → SSR (validate real-time, prevent overselling)
├── Payment → Server-only (PCI DSS compliance)
└── Rate limiting + WAF at edge

POST-EVENT:
├── Confirmation pages → SSG (generate after purchase)
├── My tickets → SSR (user-specific)
└── Event recap → SSG (static content)

Key decisions:
1. SSG cho landing pages → handle 10M+ requests/s from CDN
2. SSR cho checkout → real-time inventory check
3. WebSocket cho seat map → live updates
4. Edge caching → minimize origin load
5. Queue system → prevent thundering herd
```

**Tại sao không pure CSR?** Vì khi millions users hit cùng lúc:
- CSR = millions API calls trực tiếp từ browsers → API server chết
- SSG + edge cache = CDN handle traffic, origin server chỉ xử lý checkout

---

### Q9: "TTFB giảm 65% — con số này có thực tế không? Làm sao đo?"

**Trả lời chi tiết**:

**Cách đo TTFB**:
```bash
# 1. curl
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://example.com

# 2. Lighthouse CI (automated)
lhci collect --url=https://example.com
lhci assert --preset=lighthouse:recommended

# 3. Web Vitals API (production monitoring)
```

```tsx
// Real User Monitoring (RUM) in production:
import { onTTFB } from "web-vitals";

onTTFB((metric) => {
  // Gửi về analytics
  analytics.track("TTFB", {
    value: metric.value,
    page: window.location.pathname,
    rating: metric.rating, // "good" | "needs-improvement" | "poor"
  });
});
```

**Con số 65% có thực tế không?**

```
Scenario thực tế (đo trên cùng 1 page):

CSR: 
  Server response: 45ms (empty HTML)
  + JS download:   180ms
  + JS parse:      80ms  
  + API call:      450ms
  + Render:        40ms
  = Content visible at: 795ms

SSR:
  Server fetch:    90ms  
  Server render:   35ms
  = Content visible at: 125ms (TTFB)
  + Hydration:     150ms (but content already visible!)

Improvement: (795 - 125) / 795 = 84% faster to content
Conservative TTFB only: (450 - 125) / 450 = 72%
Reported as: ~65% improvement (conservative)
```

**Phản biện**: "Nhưng đây là đo trong ideal conditions. Production có network latency, cold starts..."

**Trả lời**: Đúng. Các yếu tố ảnh hưởng:
- **Cold start** (serverless): +200-500ms cho request đầu tiên
- **Database latency**: +50-200ms tùy query complexity
- **Geographic distance**: +100-300ms nếu server xa user

→ Giải pháp: Edge rendering (Vercel Edge Runtime, Cloudflare Workers) đưa server gần user → giảm latency.

---

### Q10: "So sánh Next.js rendering với SPA frameworks (React Router, Vue Router). Tại sao cần Next.js?"

**Phản biện ngầm**: "SPA đủ tốt rồi, tại sao phức tạp thêm với SSR/SSG?"

**Trả lời sâu**:

```
SPA (React Router):
├── 1 HTML file cho TẤT CẢ routes
├── JavaScript routing (pushState)
├── Ưu điểm:
│   ├── Navigation mượt (no full page reload)
│   ├── Đơn giản deploy (static hosting)
│   └── Familiar development model
├── Nhược điểm:
│   ├── SEO rất kém (1 empty HTML)
│   ├── Slow initial load (download TOÀN BỘ app)
│   ├── No code splitting by default
│   └── Mọi user download mọi route's code

Next.js (App Router):
├── Mỗi route = 1 optimized HTML
├── Automatic code splitting per route  
├── Ưu điểm:
│   ├── Best-in-class SEO
│   ├── Optimal performance per route
│   ├── Flexible rendering per page/component
│   ├── Built-in image/font/script optimization
│   └── Edge-ready
├── Nhược điểm:
│   ├── More complex mental model
│   ├── Server infrastructure needed (not just static)
│   ├── Learning curve: RSC, caching, streaming
│   └── Vendor lock-in concerns (Vercel)
```

**Khi nào SPA đủ tốt?**
- Internal tools (behind auth, no SEO needed)
- Highly interactive apps (Figma, Notion)
- Offline-first PWAs
- Prototypes/MVPs

**Khi nào cần Next.js?**
- Public-facing pages (SEO matters)
- E-commerce (performance = revenue)
- Content sites (blog, docs, marketing)
- Apps cần cả SEO + interactivity

---

## 10. Decision Framework

### Flowchart quyết định

```
Trang cần SEO không?
├── KHÔNG → Cần real-time interactivity?
│           ├── CÓ → Client Component ("use client")
│           └── KHÔNG → Server Component (SSR, minimal JS)
│
└── CÓ → Data thay đổi thường xuyên không?
         ├── KHÔNG (blog, docs) → SSG
         ├── MỖI VÀI PHÚT (products) → ISR (revalidate=60-300)
         ├── MỖI REQUEST (search, dashboard) → SSR (force-dynamic)
         └── REAL-TIME (chat, stock prices) → SSR + WebSocket/SSE
```

### Cheat Sheet cho phỏng vấn

| Interviewer hỏi | Bạn trả lời |
|---|---|
| "Giải thích SSR vs CSR" | Timeline diagram + TTFB comparison + SEO impact |
| "Khi nào dùng ISR?" | Stale-while-revalidate pattern + on-demand + belt-and-suspenders |
| "RSC là gì?" | Two worlds model + composition pattern + bundle size impact |
| "Streaming hoạt động thế nào?" | Netflix vs DVD + Suspense boundaries + parallel loading |
| "Hybrid architecture?" | Building metaphor + per-component strategy + Suspense orchestration |
| "Performance measurement?" | Web Vitals (TTFB, FCP, LCP, CLS) + Lighthouse CI + RUM |

### Key Numbers to Remember

```
TTFB Targets (Google):
  Good:             < 200ms
  Needs Improvement: 200-600ms  
  Poor:             > 600ms

LCP Targets (Core Web Vitals):
  Good:             < 2.5s
  Needs Improvement: 2.5-4.0s
  Poor:             > 4.0s

Typical SSG TTFB:   10-50ms  (CDN edge)
Typical ISR TTFB:   30-100ms (cached)
Typical SSR TTFB:   100-300ms (server render)
Typical CSR TTFB:   30-80ms (empty HTML) 
  → but LCP: 1000-2000ms+ (after JS + API)
```
