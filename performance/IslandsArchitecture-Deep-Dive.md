# Islands Architecture — Deep Dive

> 📅 2026-02-15 · ⏱ 22 phút đọc
>
> Islands Concept & Component Islands,
> Static vs Dynamic Regions,
> Hydration Problem & Progressive Hydration,
> Partial Hydration,
> Astro Framework & client:\* Directives,
> Streaming & Out-of-Order Rendering,
> So sánh SPA vs MPA vs Islands,
> 0KB JavaScript & Progressive Enhancement,
> Real-World & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Rendering Architecture Pattern

---

## Mục Lục

| #   | Phần                                     |
| --- | ---------------------------------------- |
| 1   | Islands Architecture là gì?              |
| 2   | Vấn đề — Hydration Cost                  |
| 3   | Static vs Dynamic Regions                |
| 4   | Progressive Hydration                    |
| 5   | Partial Hydration — Chỉ hydrate cái CẦN  |
| 6   | Astro — Islands Framework                |
| 7   | Astro client:\* Directives               |
| 8   | Islands vs SPA vs MPA vs SSR             |
| 9   | 0KB JavaScript — Progressive Enhancement |
| 10  | Streaming & Out-of-Order Rendering       |
| 11  | Frameworks hỗ trợ Islands                |
| 12  | Real-World Applications                  |
| 13  | Tradeoffs — Ưu & Nhược điểm              |
| 14  | Tóm tắt                                  |

---

## §1. Islands Architecture là gì?

```
ISLANDS ARCHITECTURE — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Kiến trúc chia page thành ISLANDS (hòn đảo!)
  → Mỗi island = 1 INTERACTIVE component ĐỘC LẬP!
  → Phần còn lại = STATIC HTML thuần!
  → Mỗi island tự HYDRATE riêng, không phụ thuộc nhau!
  → → Giảm ĐÁNG KỂ JavaScript gửi tới client!

  COINED BY:
  → Katie Sylor-Miller (Frontend Architect, Etsy!) — 2019
  → Jason Miller (Creator of Preact!) — phổ biến hóa 2020

  VÍ DỤ THỰC TẾ: ĐẠI DƯƠNG VÀ CÁC HÒN ĐẢO!

  ┌─────────────────────────────────────────────────────┐
  │  🌊 STATIC HTML OCEAN (No JavaScript!)              │
  │                                                     │
  │  ┌──────────┐              ┌───────────────────┐   │
  │  │ 🏝️ Nav   │              │ 🏝️ Image Carousel │   │
  │  │ Menu     │              │ (Interactive!)     │   │
  │  │ (JS!)    │              │ (JS!)              │   │
  │  └──────────┘              └───────────────────┘   │
  │                                                     │
  │  Static article text... no JS needed...             │
  │  Static images... no JS needed...                   │
  │                                                     │
  │  ┌──────────────┐    ┌────────────────────────┐    │
  │  │ 🏝️ Share     │    │ 🏝️ Comments Section    │    │
  │  │ Buttons      │    │ (Interactive! JS!)      │    │
  │  │ (JS!)        │    │                         │    │
  │  └──────────────┘    └────────────────────────┘    │
  │                                                     │
  │  Static footer... no JS needed...                   │
  └─────────────────────────────────────────────────────┘

  → 90% page = STATIC HTML! Không cần JavaScript!
  → 10% page = ISLANDS! Chỉ ship JS cho islands!
  → → Thay vì ship JS cho TOÀN BỘ page!
```

---

## §2. Vấn đề — Hydration Cost

```
HYDRATION — VẤN ĐỀ GỐC:
═══════════════════════════════════════════════════════════════

  HYDRATION LÀ GÌ?
  → Server render HTML → gửi tới browser!
  → Browser DOWNLOAD JavaScript bundle!
  → JavaScript "HYDRATE" HTML = gắn event handlers!
  → → Biến HTML tĩnh thành INTERACTIVE!

  SPA HYDRATION FLOW:
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Server      │     │ Browser      │     │ Interactive  │
  │ Render HTML │────→│ Download JS  │────→│ Page Ready!  │
  │ (fast!)     │     │ Parse + Exec │     │ (CHẬM!)      │
  │             │     │ Hydrate ALL  │     │              │
  └─────────────┘     └──────────────┘     └──────────────┘
                       ↑ ĐÂY LÀ NÚT THẮT!
                       ↑ Download 1.5MB JS!
                       ↑ Parse tất cả!
                       ↑ Hydrate TOÀN BỘ page!
                       ↑ Kể cả phần TĨNH!

  VẤN ĐỀ:
  → ① Blog post 10KB text + 500KB JS bundle??? 🤯
  → ② User THẤY page nhưng KHÔNG click được!
  → ③ JavaScript OVERHEAD cho cả phần TĨNH!
  → ④ TTI (Time to Interactive) RẤT CAO!
  → ⑤ Mobile/3G → TRẢI NGHIỆM TỆ!

  ISLANDS GIẢI QUYẾT:
  → CHỈ hydrate components INTERACTIVE!
  → Phần tĩnh = HTML thuần, KHÔNG JS!
  → → Bundle 1.5MB → có thể chỉ còn 50KB!
  → → TTI GIẢM đáng kể!
```

```
TRADITIONAL SSR vs ISLANDS:
═══════════════════════════════════════════════════════════════

  TRADITIONAL SSR (React/Next.js!):
  ┌─────────────────────────────────────────┐
  │ ████████████████████████████████████████ │ ← TẤT CẢ hydrate!
  │ █ Header █ Nav █ Content █ Footer █████ │
  │ ████████████████████████████████████████ │ ← 1 app duy nhất!
  │ Bundle: main.js (500KB!)                │
  └─────────────────────────────────────────┘
  → 1 application kiểm soát TOÀN BỘ page!
  → Hydrate từ root → xuống tất cả children!
  → Header tĩnh? VẪN hydrate!
  → Footer tĩnh? VẪN hydrate!

  ISLANDS ARCHITECTURE:
  ┌─────────────────────────────────────────┐
  │ [Static] [🏝️Nav] [Static content...   ] │
  │ [Static] [Static] [🏝️Carousel] [Static] │
  │ [Static] [🏝️Share] [Static footer...  ] │
  │ Islands JS: nav.js(10KB) +              │
  │   carousel.js(25KB) + share.js(5KB)     │
  │ Total: 40KB! (vs 500KB!)               │
  └─────────────────────────────────────────┘
  → NHIỀU entry points ĐỘC LẬP!
  → Mỗi island = 1 mini app!
  → Static = 0 JavaScript!
```

---

## §3. Static vs Dynamic Regions

```
PHÂN LOẠI NỘI DUNG TRÊN PAGE:
═══════════════════════════════════════════════════════════════

  STATIC REGIONS (Đại dương!):
  → Text, headings, paragraphs!
  → Images (static!)
  → Links (anchor tags!)
  → Footer, legal text!
  → KHÔNG cần event handlers!
  → KHÔNG cần rehydration!
  → → Render HTML trên server = XONG!

  DYNAMIC REGIONS (Hòn đảo!):
  → Navigation menus (dropdown!)
  → Search bars (autocomplete!)
  → Image carousels (swipe!)
  → Social share buttons (click!)
  → Comment sections (form, submit!)
  → Shopping carts (add/remove!)
  → Chat widgets (real-time!)
  → → CẦN JavaScript + event handlers!
  → → CẦN hydration!

  THỰC TẾ:
  ┌──────────────────────────────────────────────┐
  │ Blog post page:                              │
  │ → 95% STATIC (article text, images!)        │
  │ → 5% DYNAMIC (share buttons, comments!)      │
  │ → SPA: ship JS cho 100%! ❌                 │
  │ → Islands: ship JS cho 5%! ✅               │
  ├──────────────────────────────────────────────┤
  │ E-commerce product page:                      │
  │ → 70% STATIC (description, specs, reviews!) │
  │ → 30% DYNAMIC (carousel, cart, search!)      │
  │ → SPA: ship JS cho 100%! ❌                 │
  │ → Islands: ship JS cho 30%! ✅              │
  ├──────────────────────────────────────────────┤
  │ Social media feed page:                       │
  │ → 10% STATIC (header, footer!)              │
  │ → 90% DYNAMIC (feed, reactions, comments!)   │
  │ → Islands KHÔNG phù hợp ở đây! ❌           │
  │ → SPA tốt hơn! ✅                           │
  └──────────────────────────────────────────────┘
```

---

## §4. Progressive Hydration

```
PROGRESSIVE HYDRATION — HYDRATE DẦN DẦN:
═══════════════════════════════════════════════════════════════

  TRADITIONAL HYDRATION:
  → Load page → hydrate TẤT CẢ NGAY!
  → → Block main thread!
  → → Không tương tác được cho đến khi XONG!

  PROGRESSIVE HYDRATION:
  → Load page → hydrate DẦN DẦN!
  → Components quan trọng → hydrate TRƯỚC!
  → Components below-the-fold → hydrate SAU!
  → Dùng requestIdleCallback() hoặc IntersectionObserver!

  FLOW:
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │ Nav  │  │Search│  │Carsl │  │Commt │
  │ ✅   │  │ ✅   │  │ ⏳   │  │ ⏳   │
  │ 1st! │  │ 2nd! │  │ idle │  │visible│
  └──────┘  └──────┘  └──────┘  └──────┘
  ↑ Hydrate ngay!     ↑ Hydrate khi idle!
                       ↑ Hydrate khi scroll tới!

  SO SÁNH:
  Traditional:  ███████████████████ (block = chậm!)
  Progressive:  ██ · ██ · ██ · ██  (dần dần = nhanh hơn!)
  Islands:      ██ ··· ██ ········ (chỉ interactive!)

  KHÁC BIỆT ISLANDS vs PROGRESSIVE:
  → Progressive: TOP-DOWN! App root controls scheduling!
  → Islands: INDEPENDENT! Mỗi island tự hydrate!
  → → Islands: lỗi island A KHÔNG ảnh hưởng island B!
  → → Progressive: lỗi root = LỖI TẤT CẢ!
```

---

## §5. Partial Hydration — Chỉ hydrate cái CẦN

```
PARTIAL HYDRATION:
═══════════════════════════════════════════════════════════════

  KHÁI NIỆM:
  → CHỈ ship JavaScript cho components INTERACTIVE!
  → Components STATIC → KHÔNG có trong JS bundle!
  → Compiler TỰ ĐỘNG phát hiện component nào cần JS!
  → → Developer viết code NHƯ BÌNH THƯỜNG!
  → → Framework tự tách static/dynamic!

  SO SÁNH CÁC CÁCH TIẾP CẬN:

  FULL HYDRATION (React SSR!):
  → Server render → ship TẤT CẢ JS → hydrate TẤT CẢ!
  → JS bundle = TOÀN BỘ app!

  PROGRESSIVE HYDRATION:
  → Server render → ship TẤT CẢ JS → hydrate DẦN DẦN!
  → JS bundle = TOÀN BỘ app! (vẫn giống!)
  → Chỉ khác THỜI ĐIỂM hydrate!

  PARTIAL HYDRATION / ISLANDS:
  → Server render → ship CHỈ interactive JS → hydrate ÍT!
  → JS bundle = CHỈ interactive components!
  → → GIẢM lượng JS shipped!

  VÍ DỤ CỤ THỂ:

  Page có 10 components:
  → 3 interactive (nav, search, cart!)
  → 7 static (header, text, images, footer!)

  Full Hydration:   10 components JS shipped! (100%)
  Progressive:      10 components JS shipped! (100%, step by step)
  Partial/Islands:  3 components JS shipped!  (30%!) ← WIN!
```

---

## §6. Astro — Islands Framework

```javascript
// ═══ ASTRO — ISLANDS FRAMEWORK ═══

// SamplePost.astro — Server Component (STATIC!):
---
// Frontmatter — chạy trên SERVER!
import { SocialButtons } from '../components/SocialButtons';
import ImageCarousel from '../components/ImageCarousel';

const title = "Islands Architecture Deep Dive";
const content = await fetch('/api/post/123').then(r => r.json());
---

<html lang="vi">
<head>
    <title>{title}</title>
    <link rel="stylesheet" href="/blog.css" />
</head>
<body>
    <div class="layout">
        <article class="content">
            {/* ← STATIC! Không JS! */}
            <section class="intro">
                <h1>{title}</h1>
                <p>{content.subtitle}</p>
            </section>

            {/* ← STATIC! Không JS! */}
            <section class="body">
                <p>{content.body}</p>
                <img src={content.image} alt="illustration" />
            </section>

            {/* ← 🏝️ ISLAND! Có JS! */}
            <section class="carousel">
                <ImageCarousel client:visible images={content.images} />
                {/* client:visible = hydrate khi SCROLL TỚI! */}
            </section>

            {/* ← 🏝️ ISLAND! Có JS! */}
            <section class="social">
                <SocialButtons client:idle url={content.url} />
                {/* client:idle = hydrate khi main thread RẢNH! */}
            </section>
        </article>

        {/* ← STATIC! Không JS! */}
        <footer>
            <p>© 2026 My Blog</p>
        </footer>
    </div>
</body>
</html>

// → HTML output:
// → Article text = STATIC HTML! Render ngay!
// → ImageCarousel = placeholder + JS chunk riêng!
// → SocialButtons = placeholder + JS chunk riêng!
// → Footer = STATIC HTML!
// → → Chỉ 2 JS chunks thay vì 1 monolithic bundle!
```

---

## §7. Astro client:\* Directives

```
ASTRO CLIENT DIRECTIVES — KIỂM SOÁT HYDRATION:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────────────────────────┐
  │ Directive       │ Khi nào hydrate?                      │
  ├─────────────────┼──────────────────────────────────────┤
  │ (không có)      │ KHÔNG hydrate! Static HTML only!     │
  │                 │ → Server render, no JS shipped!      │
  ├─────────────────┼──────────────────────────────────────┤
  │ client:load     │ NGAY khi page load!                   │
  │                 │ → Cho components CẦN NGAY!           │
  │                 │ → Nav menu, search bar!              │
  ├─────────────────┼──────────────────────────────────────┤
  │ client:idle     │ Khi main thread RẢNH!                 │
  │                 │ → requestIdleCallback()!             │
  │                 │ → Components KHÔNG urgent!           │
  │                 │ → Share buttons, analytics!          │
  ├─────────────────┼──────────────────────────────────────┤
  │ client:visible  │ Khi component SCROLL VÀO viewport!    │
  │                 │ → IntersectionObserver!              │
  │                 │ → Below-the-fold content!            │
  │                 │ → Image carousel, comments!          │
  ├─────────────────┼──────────────────────────────────────┤
  │ client:media    │ Khi media query MATCH!                │
  │                 │ → Mobile-only components!            │
  │                 │ → client:media="(max-width:768px)"   │
  ├─────────────────┼──────────────────────────────────────┤
  │ client:only     │ CHỈ render trên CLIENT!               │
  │                 │ → Skip SSR hoàn toàn!                │
  │                 │ → Components dùng window/document!   │
  └─────────────────┴──────────────────────────────────────┘
```

```javascript
// ═══ ASTRO DIRECTIVES — VÍ DỤ ═══

---
import NavMenu from '../components/NavMenu.jsx';
import SearchBar from '../components/SearchBar.vue';
import ShareButtons from '../components/ShareButtons.svelte';
import Comments from '../components/Comments.jsx';
import MobileDrawer from '../components/MobileDrawer.jsx';
import MapWidget from '../components/MapWidget.jsx';
---

{/* Hydrate NGAY — cần tương tác từ đầu! */}
<NavMenu client:load />

{/* Hydrate khi RẢNH — không urgent! */}
<SearchBar client:idle />
<ShareButtons client:idle />

{/* Hydrate khi VISIBLE — below the fold! */}
<Comments client:visible />

{/* Hydrate CHỈ trên mobile! */}
<MobileDrawer client:media="(max-width: 768px)" />

{/* CHỈ client render — dùng browser APIs! */}
<MapWidget client:only="react" />

// → Astro hỗ trợ MULTI-FRAMEWORK!
// → React, Vue, Svelte, Preact, Solid, Lit!
// → Trong CÙNG 1 page!
// → Mỗi island dùng framework RIÊNG!
```

---

## §8. Islands vs SPA vs MPA vs SSR

```
SO SÁNH KIẾN TRÚC:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────┬──────────┬──────────┬────────────┐
  │          │ MPA      │ SPA      │ SSR      │ Islands    │
  │          │(truyền   │(React    │(Next.js  │(Astro      │
  │          │ thống)   │ CRA)     │ SSR)     │ Marko)     │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ Render   │ Server   │ Client   │ Server+  │ Server +   │
  │          │ only     │ only     │ Client   │ partial    │
  │          │          │          │ hydrate  │ client     │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ JS Ship  │ Minimal  │ ALL      │ ALL      │ CHỈ islands│
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ FCP      │ ✅ Fast  │ ❌ Slow  │ ✅ Fast  │ ✅ Fast    │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ TTI      │ ✅ Fast  │ ❌ Slow  │ ⚠️ Medium│ ✅ Fast    │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ SEO      │ ✅       │ ❌       │ ✅       │ ✅         │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ Navigate │ Full     │ Client   │ Client   │ Full page  │
  │          │ reload   │ side     │ side     │ (MPA!)     │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ Interact │ ❌ Basic │ ✅ Rich  │ ✅ Rich  │ ⚠️ Per     │
  │          │          │          │          │ island     │
  └──────────┴──────────┴──────────┴──────────┴────────────┘

  JavaScript SHIPPED:
  MPA:     ░░░░ (minimal — jQuery nhỏ!)
  Islands: ██░░░░░░░░ (chỉ islands!)
  SSR:     ██████████ (full app JS!)
  SPA:     ██████████ (full app JS!)

  Islands = SWEET SPOT cho content-heavy sites!
  → Performance của MPA!
  → Interactivity CHỈ onde cần!
  → SEO native!
```

---

## §9. 0KB JavaScript — Progressive Enhancement

```javascript
// ═══ 0KB JAVASCRIPT — PROGRESSIVE ENHANCEMENT ═══

// HTML Forms hoạt động KHÔNG CẦN JavaScript!
// → <form> tự POST data!
// → <a> tự navigate!
// → Browser handles EVERYTHING!

// ═══ SvelteKit — Form Actions ═══

// +page.server.js:
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email");
    await db.newsletter.subscribe(email);
    return { success: true };
  },
};

// +page.svelte:
<form method="POST">
  <input name="email" type="email" required />
  <button type="submit">Subscribe</button>
</form>;
// → HOẠT ĐỘNG không cần JS!
// → Form POST → server xử lý → redirect!
// → Khi JS load → enhance thành AJAX submit!
// → → "Progressive Enhancement"!

// ═══ Remix — Form without JS ═══

// route/newsletter.tsx:
export async function action({ request }) {
  const formData = await request.formData();
  await subscribe(formData.get("email"));
  return redirect("/thank-you");
}

export default function Newsletter() {
  return (
    <Form method="post">
      <input name="email" type="email" />
      <button type="submit">Subscribe</button>
    </Form>
  );
}
// → Form hoạt động với 0KB JS!
// → Khi JS load → Remix enhance:
// →   fetch instead of full page reload!
// →   optimistic UI!
// →   error handling!
```

```
PROGRESSIVE ENHANCEMENT PYRAMID:
═══════════════════════════════════════════════════════════════

  Layer 3: ✨ Enhanced UX (JS loaded!)
  → Smooth transitions, optimistic UI!
  → Client-side validation!
  → AJAX form submission!

  Layer 2: 🎨 Styled (CSS loaded!)
  → Beautiful layout!
  → Responsive design!
  → Animations!

  Layer 1: 📄 Functional (HTML only!)
  → Links NAVIGATE!
  → Forms SUBMIT!
  → Content READABLE!
  → → FOUNDATION phải hoạt động!

  → Islands = Progressive Enhancement TỰ NHIÊN!
  → Static HTML = Layer 1 (luôn hoạt động!)
  → Islands JS = Layer 3 (enhance khi load!)
  → → User KHÔNG BAO GIỜ thấy blank page!
```

---

## §10. Streaming & Out-of-Order Rendering

```
STREAMING RENDERING — RENDER VÀ GỬI DẦN DẦN:
═══════════════════════════════════════════════════════════════

  TRADITIONAL SSR:
  → Server render TOÀN BỘ HTML!
  → Gửi 1 lần khi XONG TẤT CẢ!
  → → Slow data source? CHẶN toàn bộ!

  STREAMING SSR:
  → Server bắt đầu gửi HTML NGAY!
  → Static parts → gửi TRƯỚC!
  → Dynamic parts → gửi KHI CÓ DATA!
  → → Browser bắt đầu render NGAY!

  FLOW:
  Time →
  ─────────────────────────────────────────────
  Traditional: [═══════ waiting ═══════] → [Send ALL]

  Streaming:   [Header] → [Nav] → [Content] → [Comments]
               ↑ render ngay!     ↑ dữ liệu chậm → gửi sau!
               ↑ user thấy sớm!  ↑ placeholder → swap!

  OUT-OF-ORDER STREAMING (Marko!):
  → Gửi placeholder TRƯỚC!
  → Component nào có data TRƯỚC → swap TRƯỚC!
  → KHÔNG cần đợi theo thứ tự!
  → → Placeholder có thể là skeleton/spinner!
  → → Inline JS swap content khi ready!
  → → Nhưng JS này LÀ INLINE, không phải bundle!
```

---

## §11. Frameworks hỗ trợ Islands

```
FRAMEWORKS — ISLANDS ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬──────────────────────────────────────────┐
  │ Astro       │ Multi-framework meta-framework!          │
  │             │ → React, Vue, Svelte, Solid, Preact!    │
  │             │ → client:load/idle/visible/media!        │
  │             │ → 0 JS by default!                       │
  │             │ → Content-focused! Blogs, docs, marketing│
  ├─────────────┼──────────────────────────────────────────┤
  │ Marko       │ eBay's framework! (2014!)                │
  │             │ → Streaming + automatic partial hydration│
  │             │ → Compiler tự detect interactive!        │
  │             │ → Isomorphic rendering!                  │
  │             │ → Out-of-order streaming!                │
  ├─────────────┼──────────────────────────────────────────┤
  │ Fresh       │ Deno framework!                           │
  │             │ → Islands by default!                    │
  │             │ → Preact-based!                          │
  │             │ → Zero build step!                       │
  │             │ → Deploy on Deno Deploy (edge!)          │
  ├─────────────┼──────────────────────────────────────────┤
  │ Eleventy    │ Static site generator!                    │
  │             │ → + Preact islands (community plugin!)   │
  │             │ → WithHydration wrapper!                 │
  │             │ → Lazy hydration support!                │
  ├─────────────┼──────────────────────────────────────────┤
  │ Qwik        │ Resumability (KHÁC hydration!)            │
  │             │ → KHÔNG hydrate! Resume từ server state! │
  │             │ → Fine-grained lazy loading!             │
  │             │ → 0 JS upfront, load on interaction!     │
  └─────────────┴──────────────────────────────────────────┘

  Astro = PHỔI BIẾN NHẤT cho Islands!
  → 83% GIẢM JavaScript so với Next.js cho docs sites!
  → Content Collection API cho blogs!
  → View Transitions API!
```

---

## §12. Real-World Applications

```
ISLANDS PHÙ HỢP VỚI:
═══════════════════════════════════════════════════════════════

  ✅ RẤT PHÙ HỢP:
  → Blog, news sites! (95% static content!)
  → Documentation sites! (text + search island!)
  → Marketing/landing pages! (text + CTA islands!)
  → E-commerce product pages! (description + cart island!)
  → Portfolio sites! (projects + contact form island!)
  → Corporate websites! (info + chat widget island!)

  ⚠️ KHÔNG THỰC SỰ PHÙ HỢP:
  → Social media apps! (90% interactive!)
  → Real-time dashboards! (charts, live data!)
  → Complex web apps! (Figma, Google Docs!)
  → Chat applications! (real-time everywhere!)
  → → Quá nhiều islands = mất ý nghĩa!
  → → SPA tốt hơn cho highly interactive apps!

  REAL METRICS (Astro vs Next.js cho doc sites):
  → JavaScript: -83%! (340KB → 58KB!)
  → FCP: -46%!
  → TTI: -73%!
  → Lighthouse Score: 98-100!
```

```
ETSY — CASE STUDY GỐC:
═══════════════════════════════════════════════════════════════

  Katie Sylor-Miller @ Etsy (2019):
  → Product pages: mostly STATIC description!
  → Interactive: cart, image carousel, reviews!
  → Legacy: jQuery, PHP templates!
  → Goal: migrate to React WITHOUT shipping JS cho mọi thứ!

  APPROACH:
  → PHP render static HTML (prices, descriptions!)
  → React islands cho interactive parts!
  → Hypernova service: render React on server!
  → Inject rendered HTML vào PHP page!
  → Hydrate CHỈ interactive components!
  → → GRADUAL migration! Không big-bang rewrite!
  → → "Strangler Pattern" — dần dần thay thế!
```

---

## §13. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ PERFORMANCE:
  → GIẢM JavaScript shipped ĐÁNG KỂ!
  → TTI (Time to Interactive) THẤP!
  → FCP (First Contentful Paint) NHANH!
  → Core Web Vitals TỐT!
  → 83% giảm JS cho doc sites! (Astro benchmark!)

  ✅ SEO:
  → Static HTML = server rendered!
  → Content available NGAY cho crawlers!
  → Không cần JS để render content!

  ✅ INDEPENDENT ISLANDS:
  → Lỗi island A ≠ lỗi island B!
  → Performance island A ≠ performance island B!
  → → ISOLATION tốt!

  ✅ PROGRESSIVE ENHANCEMENT:
  → Static HTML hoạt động KHÔNG CẦN JS!
  → Islands ENHANCE khi JS load!
  → → User LUÔN thấy content!

  ✅ MULTI-FRAMEWORK:
  → Astro: React + Vue + Svelte trong cùng page!
  → → Migration DẦN DẦN từ framework cũ!

  ✅ ACCESSIBILITY:
  → Standard HTML links, forms!
  → Assistive technologies work NATIVE!
  → Không cần JS cho navigation!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ LIMITED INTERACTIVITY:
  → Highly interactive apps → quá nhiều islands!
  → Social media, real-time dashboards = KHÔNG phù hợp!
  → Island communication phức tạp!

  ❌ MPA NAVIGATION:
  → Full page reload giữa các pages!
  → Không có client-side routing smooth!
  → (Astro View Transitions giảm thiểu!)

  ❌ ECOSYSTEM MỚI:
  → Ít frameworks hỗ trợ (Astro, Marko, Fresh!)
  → Ít developers có kinh nghiệm!
  → Migrate existing app = EFFORT lớn!

  ❌ ISLAND COORDINATION:
  → Islands ĐỘC LẬP → shared state KHÓ!
  → Nav island cần biết Cart island count?
  → → Custom events, shared store, hoặc props!
  → → Phức tạp hơn SPA shared state!

  ❌ NOT FOR EVERY USE CASE:
  → "Thousands of islands" = anti-pattern!
  → Nếu >50% page interactive → dùng SPA!
```

---

## §14. Tóm tắt

```
ISLANDS ARCHITECTURE — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Islands Architecture là gì?"
  A: Chia page thành ISLANDS (interactive, có JS!)
  và OCEAN (static, HTML thuần!). Mỗi island
  hydrate ĐỘC LẬP! Giảm JS shipped đáng kể!
  Coined by Katie Sylor-Miller (Etsy, 2019!)

  Q: "Khác gì SSR + Hydration?"
  A: SSR hydrate TOÀN BỘ page (kể cả static!)
  Islands CHỈ hydrate interactive components!
  → JS bundle NHỎ hơn nhiều!
  → TTI NHANH hơn nhiều!

  Q: "Partial vs Progressive Hydration?"
  A: Progressive = hydrate TẤT CẢ nhưng DẦN DẦN!
  Partial/Islands = CHỈ hydrate interactive!
  → Progressive: same bundle, different timing!
  → Islands: SMALLER bundle, targeted hydration!

  Q: "Khi nào dùng Islands?"
  A: Content-heavy sites! Blogs, docs, e-commerce
  product pages, marketing! Nơi >70% static!
  KHÔNG dùng cho social apps, dashboards!

  Q: "Astro directives?"
  A: client:load (ngay!), client:idle (rảnh!),
  client:visible (scroll tới!),
  client:media (responsive!), client:only (no SSR!)

  Q: "0KB JavaScript?"
  A: Progressive Enhancement! HTML forms POST
  không cần JS! Links navigate không cần JS!
  Islands = JS CHỈ cho enhancement!
```

---

### Checklist

- [ ] **Islands concept**: page = STATIC ocean + INTERACTIVE islands; mỗi island hydrate độc lập!
- [ ] **Hydration problem**: SPA hydrate TOÀN BỘ page kể cả static; tốn JS + chậm TTI!
- [ ] **Static vs Dynamic**: blog 95% static, e-commerce 70% static; chỉ ship JS cho dynamic!
- [ ] **Progressive vs Partial Hydration**: Progressive = same JS, khác timing! Partial = LESS JS!
- [ ] **Astro**: multi-framework (React+Vue+Svelte); 0 JS by default; Islands bằng client:\* directives!
- [ ] **client:\* directives**: load (ngay!), idle (rảnh!), visible (scroll!), media (responsive!), only (no SSR!)
- [ ] **SPA vs Islands**: SPA cho highly interactive (>50% dynamic!); Islands cho content-heavy (<30% dynamic!)
- [ ] **Progressive Enhancement**: HTML forms + links hoạt động KHÔNG JS; JS chỉ ENHANCE!
- [ ] **Streaming**: server gửi HTML DẦN DẦN; user thấy content SỚM; out-of-order swap placeholders!
- [ ] **Frameworks**: Astro (phổ biến!), Marko (eBay, 2014!), Fresh (Deno!), Qwik (resumability!)
- [ ] **Performance**: -83% JS, -73% TTI, -46% FCP so với SSR framework cho doc sites!
- [ ] **Tradeoffs**: Ưu (performance, SEO, isolation!) vs Nhược (MPA nav, island coordination, limited ecosystem!)

---

_Nguồn: patterns.dev — Islands Architecture, Jason Miller — Islands Architecture, Katie Sylor-Miller (Etsy), Ryan Carniato — Is 0KB of JavaScript in your Future?_
_Cập nhật lần cuối: Tháng 2, 2026_
