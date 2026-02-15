# Yahoo Search Interview — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> CORS Deep Dive, Lazy Loading (HTML/JS thuần),
> Infinite Scroll Component + System Design,
> Virtual Scrolling, Dynamic Window Sizing,
> Product List + Filter, Performance Optimization,
> Accessibility (a11y)
> Độ khó: ⭐️⭐️⭐️⭐️ | Yahoo Search Frontend Interview

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | Tổng quan quy trình phỏng vấn              |
| 2   | CORS — Cross-Origin Resource Sharing       |
| 3   | Lazy Loading chỉ với HTML/JS thuần         |
| 4   | Infinite Scroll — Component Implementation |
| 5   | Infinite Scroll — System Design            |
| 6   | Virtual Scrolling & Dynamic Window Sizing  |
| 7   | Performance Optimization tổng hợp          |
| 8   | Product List + Filter Component            |
| 9   | Accessibility (a11y)                       |
| 10  | Tóm tắt phỏng vấn                          |

---

## §1. Tổng quan quy trình phỏng vấn

```
YAHOO SEARCH — INTERVIEW ROUNDS:
═══════════════════════════════════════════════════════════════

  ① HIRING MANAGER ROUND:
  → Resume-based questions (kinh nghiệm, dự án!)
  → CORS — "Giải thích CORS!"
  → "Làm sao lazy load chỉ với HTML/JS?" (KHÔNG framework!)

  ② FINAL ROUND — 2 PHẦN:

  PHẦN A: FE SYSTEM DESIGN
  → "Build an infinite scroll component!"
  → Nửa đầu: CODE component!
  → Nửa sau: system design questions!
  → Dynamic window sizing, pagination!
  → Performance optimization!
  → Accessibility!

  PHẦN B: REACT COMPONENT
  → Render danh sách Products từ API!
  → Thêm input FILTER!
  → "How would you optimize performance?"
  → Accessibility!

  💡 TIPS TỪ ỨNG VIÊN:
  → Học GFE (GreatFrontEnd) system design: Newsfeed + Messenger!
  → Performance optimizations = DỰ PHÒNG cho nhiều câu hỏi!
  → Accessibility = ĐIỂM CỘNG lớn!
```

---

## §2. CORS — Cross-Origin Resource Sharing

```
CORS — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  Same-Origin Policy (SOP):
  → Browser CHẶN requests cross-origin!
  → Origin = protocol + host + port!
  → https://a.com ≠ https://b.com ≠ http://a.com ≠ https://a.com:8080

  CORS = cơ chế cho phép cross-origin requests!
  → Server nói: "Tôi cho phép origin X truy cập!"
  → Qua HTTP HEADERS!

  2 LOẠI CORS REQUEST:
  ┌────────────────────────────────────────────────────────┐
  │ ① SIMPLE REQUEST (KHÔNG cần preflight!):               │
  │ → Method: GET, HEAD, POST!                             │
  │ → Headers: chỉ Accept, Content-Type (3 loại!),         │
  │   Accept-Language, Content-Language!                    │
  │ → Content-Type: text/plain, multipart/form-data,       │
  │   application/x-www-form-urlencoded!                   │
  │                                                        │
  │ ② PREFLIGHT REQUEST (cần OPTIONS trước!):              │
  │ → Method: PUT, DELETE, PATCH!                          │
  │ → Content-Type: application/json!                      │
  │ → Custom headers!                                      │
  │ → Browser GỬI OPTIONS trước → kiểm tra permission!    │
  └────────────────────────────────────────────────────────┘
```

```
CORS FLOW:
═══════════════════════════════════════════════════════════════

  SIMPLE REQUEST:
  Browser ──── GET /api/data ──────────→ Server
               Origin: https://a.com
         ←── Response ────────────────
               Access-Control-Allow-Origin: https://a.com
               ✅ Browser cho phép!

  PREFLIGHT REQUEST:
  Browser ──── OPTIONS /api/data ──────→ Server
               Origin: https://a.com
               Access-Control-Request-Method: PUT
               Access-Control-Request-Headers: X-Custom
         ←── 204 No Content ──────────
               Access-Control-Allow-Origin: https://a.com
               Access-Control-Allow-Methods: PUT, POST
               Access-Control-Allow-Headers: X-Custom
               Access-Control-Max-Age: 86400
               ✅ Preflight OK!

  Browser ──── PUT /api/data ──────────→ Server
               Origin: https://a.com
         ←── 200 OK ──────────────────
               Access-Control-Allow-Origin: https://a.com
               ✅ Actual request OK!
```

```
CORS HEADERS:
═══════════════════════════════════════════════════════════════

  SERVER RESPONSE HEADERS:
  ┌──────────────────────────────────┬───────────────────────┐
  │ Header                           │ Mô tả                │
  ├──────────────────────────────────┼───────────────────────┤
  │ Access-Control-Allow-Origin      │ * hoặc specific origin│
  │ Access-Control-Allow-Methods     │ GET, POST, PUT, DELETE│
  │ Access-Control-Allow-Headers     │ Custom headers allowed│
  │ Access-Control-Allow-Credentials │ true (cho cookies!)   │
  │ Access-Control-Max-Age           │ Cache preflight (s!)  │
  │ Access-Control-Expose-Headers    │ Headers JS đọc được!  │
  └──────────────────────────────────┴───────────────────────┘

  ⚠️ QUAN TRỌNG:
  → Allow-Origin: * KHÔNG DÙNG ĐƯỢC với Credentials: true!
  → Phải chỉ ĐÍCH DANH origin khi gửi cookies!
```

---

## §3. Lazy Loading chỉ với HTML/JS thuần

```
"HOW WOULD YOU LAZY LOAD WITH ONLY HTML/JS?"
═══════════════════════════════════════════════════════════════

  3 CÁCH:

  ① HTML NATIVE: loading="lazy" (đơn giản nhất!)
  ② INTERSECTION OBSERVER API (modern JS!)
  ③ SCROLL EVENT + getBoundingClientRect (old school!)
```

```html
<!-- ═══ CÁCH 1: HTML NATIVE — loading="lazy" ═══ -->

<!-- Images: -->
<img src="photo.jpg" loading="lazy" alt="Photo" />

<!-- Iframes: -->
<iframe src="video.html" loading="lazy"></iframe>

<!--
  ✅ Browser support: Chrome 77+, Firefox 75+, Safari 15.4+!
  ✅ Không cần JS!
  ❌ Chỉ cho <img> và <iframe>!
  ❌ Không lazy load <div>, components, scripts!
-->
```

```javascript
// ═══ CÁCH 2: INTERSECTION OBSERVER — MODERN JS ═══

// HTML:
// <img data-src="photo.jpg" class="lazy" alt="Photo" />
// → Dùng data-src THAY VÌ src! Chưa tải!

document.addEventListener("DOMContentLoaded", () => {
  const lazyImages = document.querySelectorAll("img.lazy");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          // Chuyển data-src → src → BẮT ĐẦU TẢI!
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          // Ngừng observe (đã tải rồi!):
          obs.unobserve(img);
        }
      });
    },
    {
      // Options:
      root: null, // Viewport!
      rootMargin: "200px", // Tải TRƯỚC 200px khi gần viewport!
      threshold: 0.01, // 1% visible = trigger!
    },
  );

  lazyImages.forEach((img) => observer.observe(img));
});

// ✅ Performance tốt! Không block main thread!
// ✅ Lazy load BẤT KỲ element nào!
// ✅ rootMargin: preload TRƯỚC khi user thấy!
```

```javascript
// ═══ CÁCH 3: SCROLL EVENT — OLD SCHOOL ═══

function lazyLoadOnScroll() {
  const lazyImages = document.querySelectorAll("img.lazy");

  // THROTTLE! Không gọi mỗi pixel scroll!
  let throttleTimer;

  function handleScroll() {
    if (throttleTimer) return;

    throttleTimer = setTimeout(() => {
      throttleTimer = null;

      lazyImages.forEach((img) => {
        const rect = img.getBoundingClientRect();
        // Trong viewport (hoặc sắp vào!):
        if (rect.top < window.innerHeight + 200 && rect.bottom > 0) {
          img.src = img.dataset.src;
          img.classList.remove("lazy");
        }
      });

      // Nếu hết lazy images → remove listener!
      const remaining = document.querySelectorAll("img.lazy");
      if (remaining.length === 0) {
        window.removeEventListener("scroll", handleScroll);
      }
    }, 100); // 100ms throttle!
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Check initially!
}

// ❌ scroll event = PERFORMANCE HIT! (fire rất nhiều!)
// ❌ getBoundingClientRect = trigger reflow!
// → Chỉ dùng khi KHÔNG có IntersectionObserver!
```

```javascript
// ═══ LAZY LOAD SCRIPTS & COMPONENTS ═══

// Dynamic import (code splitting!):
async function loadModule() {
  const module = await import("./heavyModule.js");
  module.init();
}

// Lazy load script tag:
function lazyLoadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Lazy load CSS:
function lazyLoadCSS(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
```

---

## §4. Infinite Scroll — Component Implementation

```
INFINITE SCROLL — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  User scroll XUỐNG CUỐI → TỰ ĐỘNG tải thêm data!
  → Thay thế pagination truyền thống!
  → UX: mượt mà, không cần click "Next page"!

  2 CÁCH DETECT "GẦN CUỐI":
  ① SCROLL EVENT: scrollTop + clientHeight >= scrollHeight
  ② INTERSECTION OBSERVER: sentinel element ở cuối list
```

```jsx
// ═══ INFINITE SCROLL — INTERSECTION OBSERVER (BEST!) ═══

import { useState, useEffect, useRef, useCallback } from "react";

function InfiniteScroll() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  // FETCH DATA:
  const fetchData = useCallback(
    async (pageNum) => {
      if (loading || !hasMore) return;
      setLoading(true);

      try {
        const res = await fetch(`/api/items?page=${pageNum}&limit=20`);
        const data = await res.json();

        setItems((prev) => [...prev, ...data.items]);
        setHasMore(data.items.length === 20); // Hết nếu < 20!
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore],
  );

  useEffect(() => {
    fetchData(page);
  }, [page]);

  // INTERSECTION OBSERVER — SENTINEL:
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;

      // Disconnect observer cũ:
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1); // TRIGGER tải thêm!
          }
        },
        { threshold: 0.5 },
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore],
  );

  return (
    <div className="scroll-container">
      {items.map((item, index) => {
        // Gắn ref vào element CUỐI CÙNG:
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} ref={isLast ? lastItemRef : null} className="item">
            {item.title}
          </div>
        );
      })}
      {loading && <div className="spinner">Loading...</div>}
      {!hasMore && <div className="end">— Hết rồi —</div>}
    </div>
  );
}
```

```jsx
// ═══ INFINITE SCROLL — SCROLL EVENT (ALTERNATIVE) ═══

function InfiniteScrollEvent() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Gần cuối (100px buffer!):
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100 && !loading) {
        setPage((p) => p + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loading]);

  // ... fetchData same as above

  return (
    <div ref={containerRef} style={{ height: "80vh", overflow: "auto" }}>
      {items.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
      {loading && <p>Loading...</p>}
    </div>
  );
}
```

---

## §5. Infinite Scroll — System Design

```
SYSTEM DESIGN — CÂU HỎI SAU KHI CODE:
═══════════════════════════════════════════════════════════════

  Q: "How does pagination work?"
  ┌────────────────────────────────────────────────────────┐
  │ ① OFFSET PAGINATION:                                   │
  │ → /api/items?page=3&limit=20                           │
  │ → Server: SELECT * OFFSET 40 LIMIT 20                 │
  │ → ❌ Slow cho page lớn! OFFSET N → scan N rows!       │
  │                                                        │
  │ ② CURSOR PAGINATION (tốt hơn!):                       │
  │ → /api/items?cursor=abc123&limit=20                    │
  │ → cursor = ID hoặc timestamp của item cuối!            │
  │ → Server: WHERE id > cursor LIMIT 20                   │
  │ → ✅ O(1) bất kể page nào!                            │
  │ → ✅ Stripe, Twitter, Facebook đều dùng!              │
  └────────────────────────────────────────────────────────┘

  Q: "Dynamic window sizing?"
  ┌────────────────────────────────────────────────────────┐
  │ → Tính SỐ ITEMS vừa màn hình:                         │
  │   itemCount = Math.ceil(viewportHeight / itemHeight)   │
  │ → Dùng làm PAGE SIZE!                                  │
  │ → Màn 1080px, item 60px → pageSize = 18!              │
  │ → Màn 720px, item 60px → pageSize = 12!               │
  │ → → RESPONSIVE pagination!                             │
  └────────────────────────────────────────────────────────┘

  Q: "Data flow?"
  ┌────────────────────────────────────────────────────────┐
  │ User scrolls → Observer triggers → increment page     │
  │ → useEffect(page) → fetch API → append to state       │
  │ → React re-render → new items appear                   │
  │ → Observer re-attaches to NEW last item                │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Virtual Scrolling & Dynamic Window Sizing

```
VIRTUAL SCROLLING (WINDOWING):
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: 10,000 items → 10,000 DOM nodes → CHẬM!
  GIẢI PHÁP: CHỈ RENDER items ĐANG HIỂN THỊ!

  ┌──────────────────────────────────────────────────────┐
  │                 ↑ Spacer (top!)                       │
  │                 │ height = startIndex × itemHeight    │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │ │  Item 50  │ ← Chỉ render                          │
  │ │  Item 51  │   items trong                          │
  │ │  Item 52  │   VIEWPORT!                            │
  │ │  Item 53  │   (+ buffer!)                          │
  │ │  Item 54  │                                        │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │                 │ height = remaining × itemHeight     │
  │                 ↓ Spacer (bottom!)                    │
  └──────────────────────────────────────────────────────┘

  LIBRARIES:
  → react-window (nhẹ, đơn giản!)
  → react-virtuoso (feature-rich!)
  → @tanstack/react-virtual (headless, flexible!)
```

```jsx
// ═══ VIRTUAL SCROLL — IMPLEMENT TỪ ĐẦU ═══

function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  // Tính items ĐANG HIỂN THỊ:
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length,
  );

  // Buffer (render thêm vài items trên/dưới!):
  const bufferSize = 5;
  const visibleStart = Math.max(0, startIndex - bufferSize);
  const visibleEnd = Math.min(items.length, endIndex + bufferSize);
  const visibleItems = items.slice(visibleStart, visibleEnd);

  // Spacers:
  const topHeight = visibleStart * itemHeight;
  const bottomHeight = (items.length - visibleEnd) * itemHeight;
  const totalHeight = items.length * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${topHeight}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 10,000 items → chỉ render ~20 DOM nodes!
// Performance: O(1) thay vì O(N)!
```

```jsx
// ═══ DYNAMIC WINDOW SIZING ═══

function useDynamicPageSize(itemHeight = 60) {
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const calculatePageSize = () => {
      const viewportHeight = window.innerHeight;
      // Trừ header/footer (~150px):
      const availableHeight = viewportHeight - 150;
      const computed = Math.ceil(availableHeight / itemHeight);
      // Tối thiểu 10, tối đa 50:
      setPageSize(Math.max(10, Math.min(50, computed)));
    };

    calculatePageSize();
    window.addEventListener("resize", calculatePageSize);
    return () => window.removeEventListener("resize", calculatePageSize);
  }, [itemHeight]);

  return pageSize;
}

// Sử dụng:
function Feed() {
  const pageSize = useDynamicPageSize(80); // item cao 80px

  // fetch(`/api/feed?limit=${pageSize}&cursor=...`)
  // → Mobile (700px): pageSize = 7
  // → Desktop (1080px): pageSize = 12
  // → Large (1440px): pageSize = 16
}
```

---

## §7. Performance Optimization tổng hợp

```
PERFORMANCE OPTIMIZATION — TỔNG HỢP:
═══════════════════════════════════════════════════════════════

  ① RENDERING:
  ┌────────────────────────────────────────────────────────┐
  │ → React.memo: tránh re-render KHÔNG CẦN THIẾT!        │
  │ → useMemo: cache computed values!                      │
  │ → useCallback: cache functions!                        │
  │ → Virtual scrolling: chỉ render VISIBLE items!        │
  │ → key={unique}: giúp React reconciliation chính xác!  │
  └────────────────────────────────────────────────────────┘

  ② NETWORK:
  ┌────────────────────────────────────────────────────────┐
  │ → Debounce search input (300ms!)                       │
  │ → AbortController: hủy request cũ!                    │
  │ → Cursor pagination: O(1) vs offset O(N)!             │
  │ → Cache API responses (SWR / React Query staleTime!)  │
  │ → Prefetch next page (tải TRƯỚC khi user cần!)        │
  └────────────────────────────────────────────────────────┘

  ③ IMAGES:
  ┌────────────────────────────────────────────────────────┐
  │ → Lazy loading: loading="lazy" / IntersectionObserver! │
  │ → Responsive: srcset + sizes!                          │
  │ → Format: WebP / AVIF (nhỏ hơn 30-50%!)              │
  │ → Placeholder: blur-up hoặc skeleton!                  │
  │ → CDN: serve từ edge gần user nhất!                   │
  └────────────────────────────────────────────────────────┘

  ④ BUNDLE:
  ┌────────────────────────────────────────────────────────┐
  │ → Code splitting: React.lazy() + Suspense!             │
  │ → Dynamic import: import() only khi cần!              │
  │ → Tree shaking: loại bỏ dead code!                    │
  │ → Compression: Gzip / Brotli!                          │
  └────────────────────────────────────────────────────────┘

  ⑤ RUNTIME:
  ┌────────────────────────────────────────────────────────┐
  │ → Throttle scroll events!                              │
  │ → requestAnimationFrame cho animations!                │
  │ → Web Workers cho heavy computation!                   │
  │ → Avoid layout thrashing (batch DOM reads/writes!)     │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Product List + Filter Component

```jsx
// ═══ PRODUCT LIST + FILTER — YAHOO FINAL ROUND ═══

import { useState, useEffect, useMemo, useCallback } from "react";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FETCH PRODUCTS:
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, []);

  // FILTER — useMemo (tránh re-compute mỗi render!):
  const filteredProducts = useMemo(() => {
    if (!filter.trim()) return products;
    const query = filter.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [products, filter]);

  // DEBOUNCED FILTER (optimize nếu list LỚN!):
  const [debouncedFilter, setDebouncedFilter] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  // CONDITIONAL RENDERING:
  if (loading)
    return (
      <div role="status" aria-live="polite">
        Loading...
      </div>
    );
  if (error) return <div role="alert">Error: {error}</div>;

  return (
    <div>
      <label htmlFor="search">Filter products:</label>
      <input
        id="search"
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Tìm sản phẩm..."
        aria-label="Filter products"
      />

      <p aria-live="polite">{filteredProducts.length} products found</p>

      {filteredProducts.length === 0 ? (
        <p>No products match your search.</p>
      ) : (
        <ul role="list">
          {filteredProducts.map((product) => (
            <li key={product.id} role="listitem">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <span>${product.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

```
PERFORMANCE OPTIMIZATION CHO PRODUCT LIST:
═══════════════════════════════════════════════════════════════

  Q: "How would you optimize performance?"
  A:
  ① useMemo cho filtered list → không re-filter mỗi render!
  ② Debounce filter input → không filter mỗi keystroke!
  ③ Virtual scrolling nếu list > 1000 items!
  ④ React.memo cho mỗi ProductItem → skip re-render!
  ⑤ Lazy load images trong product cards!
  ⑥ Cache API response (React Query / SWR!)
  ⑦ Web Worker cho heavy filtering (regex, fuzzy search!)
```

---

## §9. Accessibility (a11y)

```
ACCESSIBILITY — ĐIỂM CỘNG PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  ① SEMANTIC HTML:
  → <ul> + <li> cho lists, KHÔNG <div>!
  → <button> cho clickable, KHÔNG <div onClick>!
  → <label htmlFor="id"> cho form inputs!
  → <nav>, <main>, <article>, <aside>!

  ② ARIA ATTRIBUTES:
  → role="list", role="listitem"!
  → aria-live="polite" → screen reader đọc updates!
  → aria-label → mô tả purpose!
  → role="status" → loading indicator!
  → role="alert" → error message!

  ③ KEYBOARD NAVIGATION:
  → tabIndex cho focusable elements!
  → Enter/Space cho buttons!
  → Escape cho close modals!
  → Arrow keys cho lists!

  ④ INFINITE SCROLL a11y:
  → aria-live="polite" trên loading indicator!
  → Announce: "20 more items loaded"!
  → Provide "Load more" button AS ALTERNATIVE!
  → Focus management: không mất focus khi load thêm!

  ⑤ FOCUS MANAGEMENT:
  → Sau khi filter: focus vẫn ở input!
  → Sau khi delete item: focus vào item tiếp theo!
  → Modal open: focus trap!
```

```jsx
// ═══ ACCESSIBLE INFINITE SCROLL ═══

function AccessibleInfiniteScroll() {
  const [items, setItems] = useState([]);
  const [announcement, setAnnouncement] = useState("");

  const loadMore = async () => {
    const newItems = await fetchMore();
    setItems((prev) => [...prev, ...newItems]);
    // ANNOUNCE cho screen reader:
    setAnnouncement(
      `${newItems.length} more items loaded. Total: ${items.length + newItems.length}`,
    );
  };

  return (
    <div>
      {/* Screen reader announcement: */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ul role="list" aria-label="Product list">
        {items.map((item) => (
          <li key={item.id} role="listitem">
            {item.title}
          </li>
        ))}
      </ul>

      {/* ALTERNATIVE cho infinite scroll: */}
      <button onClick={loadMore} aria-label="Load more products">
        Load More
      </button>
    </div>
  );
}

// CSS for screen-reader only:
// .sr-only {
//   position: absolute; width: 1px; height: 1px;
//   padding: 0; margin: -1px; overflow: hidden;
//   clip: rect(0,0,0,0); border: 0;
// }
```

---

## §10. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "CORS?"
  A: Browser chặn cross-origin (SOP).
  CORS = server cho phép qua headers.
  Simple (GET/POST) vs Preflight (OPTIONS trước PUT/DELETE).
  Headers: Allow-Origin, Allow-Methods, Allow-Headers!

  Q: "Lazy load chỉ HTML/JS?"
  A: 3 cách:
  → loading="lazy" (HTML native! img + iframe!)
  → IntersectionObserver + data-src (BEST! any element!)
  → scroll event + getBoundingClientRect (old, tốn perf!)

  Q: "Build infinite scroll?"
  A: IntersectionObserver + sentinel element + cursor pagination.
  Virtual scrolling cho large lists (chỉ render visible!).
  Dynamic window sizing: pageSize = viewport / itemHeight!

  Q: "Optimize performance?"
  A: useMemo, React.memo, debounce, virtual scroll,
  cursor pagination, lazy load images, code splitting,
  cache responses, Web Workers!

  Q: "Product list + filter?"
  A: fetch + useMemo filter + debounce input.
  Loading/error/empty states.
  Accessibility: aria-live, role, label, semantic HTML!
```

---

### Checklist

- [ ] **CORS**: SOP = same origin only; CORS = server headers cho phép; Simple vs Preflight (OPTIONS)!
- [ ] **Lazy load 3 cách**: `loading="lazy"` (HTML), IntersectionObserver (modern JS!), scroll event (old!)
- [ ] **IntersectionObserver**: root, rootMargin (preload!), threshold; unobserve sau khi load!
- [ ] **Infinite Scroll**: Observer + sentinel ref trên last item; cursor pagination O(1)!
- [ ] **Virtual Scrolling**: Chỉ render visible items + buffer; spacers trên/dưới; O(1) DOM nodes!
- [ ] **Dynamic Window Sizing**: pageSize = Math.ceil(viewportHeight / itemHeight); responsive!
- [ ] **Cursor vs Offset**: Cursor (WHERE id > X) O(1) vs Offset (SKIP N) O(N); dùng cursor!
- [ ] **Product Filter**: useMemo filtered list + debounce input + AbortController fetch!
- [ ] **Performance**: memo/useMemo/useCallback, debounce, virtual scroll, lazy images, code split, cache!
- [ ] **Accessibility**: semantic HTML, aria-live (updates!), role="list", label, keyboard nav, focus management!
- [ ] **Infinite Scroll a11y**: aria-live polite, announce count, provide "Load More" button alternative!

---

_Nguồn: Reddit — Yahoo Search frontend interview experience_
_Cập nhật lần cuối: Tháng 2, 2026_
