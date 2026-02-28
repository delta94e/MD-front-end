# template.js — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/template
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Hình ảnh**: 1 diagram (file tree) + nhiều code-based component tree diagrams!

---

## Mục Lục

1. [§1. template.js Là Gì?](#1)
2. [§2. Convention — Cách Viết!](#2)
3. [§3. Props — children!](#3)
4. [§4. Behavior — 5 Đặc Điểm Quan Trọng!](#4)
5. [§5. Template vs Layout — So Sánh Chi Tiết!](#5)
6. [§6. Navigation & Remounting — 5 Bước!](#6)
7. [§7. Phân Tích Hình — Diagram từ Docs!](#7)
8. [§8. Khi Nào Dùng template Thay layout?](#8)
9. [§9. Tự Viết — TemplateEngine!](#9)
10. [§10. Câu Hỏi Phỏng Vấn!](#10)

---

## §1. template.js Là Gì?

```
  template.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Tương tự layout.js — WRAP children (page hoặc layout con)│
  │  → NHƯNG tạo INSTANCE MỚI mỗi khi navigation! ★★★          │
  │                                                              │
  │  KEY DIFFERENCE với layout:                                   │
  │  ┌──────────────┬──────────────────┬────────────────────┐    │
  │  │              │ layout.js         │ template.js         │    │
  │  ├──────────────┼──────────────────┼────────────────────┤    │
  │  │ Re-render?   │ ❌ KHÔNG!        │ ✅ MỖI navigation! │    │
  │  │ State        │ ✅ PERSIST!      │ ❌ RESET!           │    │
  │  │ useEffect    │ ❌ Chạy 1 lần!  │ ✅ RE-RUN!          │    │
  │  │ DOM          │ ✅ Giữ nguyên!  │ ❌ TẠO LẠI!        │    │
  │  │ Key          │ Không có!        │ ✅ Unique key!      │    │
  │  │ Default      │ Server Component │ Server Component    │    │
  │  └──────────────┴──────────────────┴────────────────────┘    │
  │                                                              │
  │  MECHANISM:                                                    │
  │  → React key={routeParam} → key ĐỔI → UNMOUNT + REMOUNT!   │
  │  → Đây là React reconciliation chuẩn! ★                     │
  │                                                              │
  │  SINCE: Next.js v13.0.0!                                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Convention — Cách Viết!

```
  CONVENTION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Export DEFAULT React component từ template.js/.tsx! ★       │
  │  Component PHẢI nhận children prop! ★                        │
  │                                                              │
  │  // app/template.tsx                                            │
  │  export default function Template({                           │
  │    children                                                   │
  │  }: {                                                         │
  │    children: React.ReactNode                                  │
  │  }) {                                                         │
  │    return <div>{children}</div>                               │
  │  }                                                            │
  │                                                              │
  │  NESTING (simplified output):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <Layout>                                              │    │
  │  │   {/* Template được gán UNIQUE KEY! ★ */}             │    │
  │  │   <Template key={routeParam}>                         │    │
  │  │     {children}  ← page hoặc layout con!              │    │
  │  │   </Template>                                         │    │
  │  │ </Layout>                                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → Template nằm GIỮA Layout và Children! ★★★                 │
  │  → Layout > Template > Children!                              │
  │  → Key AUTOMATICALLY assigned bởi Next.js! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Props — children (required)!

```
  PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  children (required!):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Type: React.ReactNode                              │    │
  │  │ → Chứa page.tsx hoặc layout con!                     │    │
  │  │ → Template WRAP children, tương tự layout!            │    │
  │  │                                                       │    │
  │  │ Nesting hierarchy:                                     │    │
  │  │ <Layout>                                               │    │
  │  │   <Template key={routeParam}>                          │    │
  │  │     {children}  ← page hoặc nested layout!           │    │
  │  │   </Template>                                          │    │
  │  │ </Layout>                                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CHỈ có 1 prop duy nhất: children!                        │
  │  → KHÔNG có params, searchParams! ★                          │
  │  → Muốn dùng params → dùng useParams() hook! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Behavior — 5 Đặc Điểm Quan Trọng!

```
  5 BEHAVIORS (từ docs):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Server Components by default! ★                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Template mặc định là Server Component!              │    │
  │  │ → CÓ THỂ thêm 'use client' nếu cần! ★               │    │
  │  │ → Nhưng thường giữ Server Component! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Navigation → Remount theo SEGMENT LEVEL! ★★★               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Template nhận unique key cho SEGMENT LEVEL của nó!  │    │
  │  │ → Segment (+ dynamic params) ĐỔI → REMOUNT! ★        │    │
  │  │ → Navigation deeper segments → KHÔNG remount          │    │
  │  │   template ở level cao hơn! ★                         │    │
  │  │ → Search params (?q=test) → KHÔNG trigger remount! ★ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ State RESET! ★★★                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → BẤT KỲ Client Component nào TRONG template         │    │
  │  │ → State sẽ RESET khi navigation! ★★★                  │    │
  │  │ → useState → về initial value!                         │    │
  │  │ → Input values → bị xóa!                              │    │
  │  │ → Scroll position → reset!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ useEffect RE-RUN! ★★★                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Component REMOUNT → useEffect chạy LẠI! ★          │    │
  │  │ → useLayoutEffect cũng chạy lại! ★                    │    │
  │  │ → Cleanup function chạy trước! ★                      │    │
  │  │ → Perfect cho: analytics log, page view tracking! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ DOM FULLY RECREATED! ★★★                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → DOM elements bên trong template → TẠO LẠI hoàn toàn│    │
  │  │ → Không phải patch/update → CREATE MỚI! ★             │    │
  │  │ → Animation CSS → restart!                            │    │
  │  │ → Ref → reset!                                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Template vs Layout — So Sánh Chi Tiết!

```
  TEMPLATE vs LAYOUT — DEEP COMPARISON:
  ┌──────────────────┬─────────────────────┬─────────────────────┐
  │ Tiêu chí         │ layout.js           │ template.js          │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Persist state     │ ✅ GIỮ state!      │ ❌ RESET mỗi nav!   │
  │ Re-render        │ ❌ KHÔNG!           │ ✅ REMOUNT!          │
  │ useEffect        │ ❌ Chạy 1 lần!     │ ✅ RE-RUN mỗi nav!  │
  │ DOM              │ ✅ Giữ nguyên!     │ ❌ Recreate!         │
  │ Suspense fallback│ Chỉ lần đầu!       │ MỖI navigation! ★   │
  │ Key              │ Không có key!       │ key={routeParam}! ★  │
  │ Default          │ Server Component    │ Server Component     │
  │ Props            │ children + params!  │ CHỈ children! ★      │
  │ Metadata         │ ✅ Có thể export!  │ ❌ Không!            │
  └──────────────────┴─────────────────────┴─────────────────────┘

  VÍ DỤ TRỰC QUAN:

  Layout behavior (navigate / → /about → /blog):
  ┌──────────────────────────────────────────┐
  │ <Layout>  ← KHÔNG re-render! GIỮ state!│
  │   <NavBar count={5} />  ← count=5 giữ! │
  │   <Page /> ← CHỈ page thay đổi!         │
  │ </Layout>                                │
  └──────────────────────────────────────────┘

  Template behavior (navigate / → /about → /blog):
  ┌──────────────────────────────────────────┐
  │ <Layout>  ← KHÔNG re-render!             │
  │   <Template key="/about"> ← REMOUNT! ★  │
  │     <NavBar count={0} />  ← RESET! ★    │
  │     <Page />                              │
  │   </Template>                             │
  │ </Layout>                                │
  └──────────────────────────────────────────┘
```

---

## §6. Navigation & Remounting — 5 Bước Chi Tiết!

```
  PROJECT TREE (từ docs!):
  app/
  ├── about/
  │   └── page.tsx
  ├── blog/
  │   ├── [slug]/
  │   │   └── page.tsx
  │   ├── page.tsx
  │   └── template.tsx         ← Blog template!
  ├── layout.tsx
  ├── page.tsx
  └── template.tsx             ← Root template!

  5 BƯỚC NAVIGATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① URL: / (trang chủ!)                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <RootLayout>                                          │    │
  │  │   {/* app/template.tsx */}                             │    │
  │  │   <Template key="/">                                   │    │
  │  │     <Page />                                           │    │
  │  │   </Template>                                          │    │
  │  │ </RootLayout>                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Navigate: / → /about (first segment ĐỔI!)                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <RootLayout>                                          │    │
  │  │   {/* app/template.tsx */}                             │    │
  │  │   <Template key="/about">  ← KEY ĐỔI → REMOUNT! ★★★│    │
  │  │     <AboutPage />                                      │    │
  │  │   </Template>                                          │    │
  │  │ </RootLayout>                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │  → key "/" → "/about" → React UNMOUNT cũ + MOUNT mới! ★    │
  │                                                              │
  │  ③ Navigate: /about → /blog (first segment ĐỔI!)             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <RootLayout>                                          │    │
  │  │   {/* app/template.tsx (root) */}                      │    │
  │  │   <Template key="/blog">  ← ROOT REMOUNT! ★           │    │
  │  │     {/* app/blog/template.tsx */}                       │    │
  │  │     <Template key="/blog">  ← BLOG MOUNT! ★           │    │
  │  │       <BlogIndexPage />                                │    │
  │  │     </Template>                                        │    │
  │  │   </Template>                                          │    │
  │  │ </RootLayout>                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │  → CẢ HAI template đều mount/remount! ★                     │
  │  → Root template: key đổi → remount!                        │
  │  → Blog template: mới mount lần đầu!                        │
  │                                                              │
  │  ④ Navigate: /blog → /blog/first-post (child segment ĐỔI!)   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <RootLayout>                                          │    │
  │  │   {/* app/template.tsx (root) */}                      │    │
  │  │   <Template key="/blog">  ← KHÔNG ĐỔI! GIỮ! ★       │    │
  │  │     {/* app/blog/template.tsx */}                       │    │
  │  │     {/* child segment changed → REMOUNT! */}           │    │
  │  │     <Template key="/blog/first-post"> ← REMOUNT! ★★★ │    │
  │  │       <BlogPostPage slug="first-post" />               │    │
  │  │     </Template>                                        │    │
  │  │   </Template>                                          │    │
  │  │ </RootLayout>                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │  → Root template: key="/blog" KHÔNG đổi → GIỮ NGUYÊN! ★    │
  │  → Blog template: key đổi → REMOUNT! ★★★                    │
  │                                                              │
  │  ⑤ Navigate: /blog/first-post → /blog/second-post             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <RootLayout>                                          │    │
  │  │   {/* app/template.tsx (root) */}                      │    │
  │  │   <Template key="/blog">  ← KHÔNG ĐỔI! ★             │    │
  │  │     {/* app/blog/template.tsx */}                       │    │
  │  │     {/* child segment changed → REMOUNT AGAIN! */}     │    │
  │  │     <Template key="/blog/second-post"> ← REMOUNT! ★★★│    │
  │  │       <BlogPostPage slug="second-post" />              │    │
  │  │     </Template>                                        │    │
  │  │   </Template>                                          │    │
  │  │ </RootLayout>                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │  → Root: GIỮ! Blog: REMOUNT lần nữa (slug đổi)! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  QUY TẮC REMOUNT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ Template nhận KEY dựa trên SEGMENT LEVEL! ★                │
  │                                                              │
  │  → Segment CÙNG level thay đổi → REMOUNT! ★                 │
  │  → Segment CHA không đổi → template cha GIỮ! ★              │
  │  → Dynamic params ([slug]) thay đổi → REMOUNT! ★★★          │
  │  → Search params (?q=test) → KHÔNG trigger remount! ★       │
  │  → Deeper navigation → KHÔNG remount higher template! ★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Tích Hình — Diagram từ Docs!

```
  PHÂN TÍCH HÌNH DUY NHẤT: "template.js special file"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ hiển thị file tree (giống VS Code sidebar):           │
  │                                                              │
  │  app/                                                        │
  │  ├── layout.js                                               │
  │  ├── template.js    ● ← HIGHLIGHTED! (blue dot + bar)      │
  │  └── page.js                                                 │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → template.js đặt CÙNG CẤP với layout.js + page.js! │    │
  │  │ → Blue dot (●) đánh dấu file đang thảo luận!        │    │
  │  │ → Thứ tự render: Layout > Template > Page!           │    │
  │  │ → template.js là OPTIONAL! (không bắt buộc!)         │    │
  │  │ → Nếu có: wrap children GIỮA layout và page!         │    │
  │  │ → File extensions: .js, .jsx, .tsx đều được!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  COMPONENT HIERARCHY (từ hình):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │   layout.js    ←─── outermost wrapper!               │    │
  │  │      │                                                │    │
  │  │      ▼                                                │    │
  │  │   template.js  ←─── GIỮA! key={routeParam}! ★       │    │
  │  │      │                                                │    │
  │  │      ▼                                                │    │
  │  │   page.js      ←─── innermost content!               │    │
  │  │                                                       │    │
  │  │   Render order: Layout → Template → Page              │    │
  │  │   Nesting: <Layout><Template>{children}</Template>    │    │
  │  │            </Layout>                                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Khi Nào Dùng template Thay layout?

```
  KHI NÀO DÙNG template?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① useEffect chạy lại MỖI navigation! ★                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Use case: Page view analytics!                        │    │
  │  │ Layout: useEffect CHỈ chạy 1 lần → miss page views! │    │
  │  │ Template: useEffect chạy LẠI → log ĐÚNG! ★           │    │
  │  │                                                       │    │
  │  │ 'use client'                                           │    │
  │  │ useEffect(() => {                                      │    │
  │  │   analytics.track('page_view', { url: pathname })     │    │
  │  │ }, [])  // chạy lại vì component remount!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Reset form/input state! ★                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Use case: Search input clear khi đổi trang!          │    │
  │  │ Layout: input GIỮ giá trị cũ!                         │    │
  │  │ Template: input RESET về rỗng! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ Suspense fallback MỖI LẦN! ★                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Layout: <Suspense> fallback chỉ hiện lần đầu load!   │    │
  │  │ Template: fallback hiện MỖI navigation! ★             │    │
  │  │ Use case: Loading skeleton cho mỗi route change!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CSS animation restart! ★                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Use case: Enter animation mỗi khi vào page!          │    │
  │  │ Layout: animation chỉ chạy 1 lần!                     │    │
  │  │ Template: animation RESTART mỗi nav! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ MẶC ĐỊNH NÊN DÙNG layout! ★                              │
  │  → Template chỉ khi CẦN remount behavior! ★                 │
  │  → Performance: layout tốt hơn (không recreate DOM!) ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — TemplateEngine!

```javascript
var TemplateEngine = (function () {
  // ═══════════════════════════════════
  // 1. TEMPLATE KEY RESOLVER
  // ═══════════════════════════════════
  function resolveTemplateKey(templateSegmentPath, currentUrl) {
    // Template nhận key dựa trên segment level!
    var urlSegments = currentUrl.split("/").filter(Boolean);
    var templateSegments = templateSegmentPath.split("/").filter(Boolean);
    var depth = templateSegments.length;

    // Key = URL segments từ đầu đến depth của template
    var relevantSegments = urlSegments.slice(0, depth + 1);
    var key = "/" + relevantSegments.join("/");
    if (key === "/") key = "/";

    return { templatePath: templateSegmentPath, url: currentUrl, key: key };
  }

  // ═══════════════════════════════════
  // 2. REMOUNT CHECKER
  // ═══════════════════════════════════
  function shouldRemount(templatePath, oldUrl, newUrl) {
    var oldKey = resolveTemplateKey(templatePath, oldUrl).key;
    var newKey = resolveTemplateKey(templatePath, newUrl).key;

    return {
      templatePath: templatePath,
      oldKey: oldKey,
      newKey: newKey,
      remount: oldKey !== newKey,
      reason:
        oldKey !== newKey
          ? "Key ĐỔI: " + oldKey + " → " + newKey + " → REMOUNT! ★"
          : "Key KHÔNG đổi: " + oldKey + " → GIỮ nguyên! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. TEMPLATE VS LAYOUT ADVISOR
  // ═══════════════════════════════════
  function chooseTemplateOrLayout(requirements) {
    var needsTemplate = false;
    var reasons = [];

    if (requirements.resetStateOnNav) {
      needsTemplate = true;
      reasons.push("State reset mỗi navigation → template! ★");
    }
    if (requirements.rerunEffectsOnNav) {
      needsTemplate = true;
      reasons.push("useEffect re-run → template! ★");
    }
    if (requirements.suspenseFallbackEveryNav) {
      needsTemplate = true;
      reasons.push("Suspense fallback mỗi nav → template! ★");
    }
    if (requirements.animationRestartOnNav) {
      needsTemplate = true;
      reasons.push("CSS animation restart → template! ★");
    }
    if (requirements.analyticsPageView) {
      needsTemplate = true;
      reasons.push("Page view analytics → template! ★");
    }

    return {
      recommendation: needsTemplate ? "template.js" : "layout.js",
      reasons: reasons.length > 0 ? reasons : ["Mặc định dùng layout! ★"],
    };
  }

  // ═══════════════════════════════════
  // 4. NAVIGATION SIMULATOR
  // ═══════════════════════════════════
  function simulateNavigation(templates, navigationSteps) {
    var results = [];
    for (var i = 0; i < navigationSteps.length; i++) {
      var step = navigationSteps[i];
      var stepResult = {
        from: step.from,
        to: step.to,
        templates: [],
      };

      for (var j = 0; j < templates.length; j++) {
        var check = shouldRemount(templates[j], step.from, step.to);
        stepResult.templates.push({
          path: templates[j],
          remount: check.remount,
          oldKey: check.oldKey,
          newKey: check.newKey,
        });
      }
      results.push(stepResult);
    }
    return results;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Template Engine ═══");

    // Template key resolution
    console.log("\n── Template Keys ──");
    console.log("root at /:", resolveTemplateKey("", "/"));
    console.log("root at /about:", resolveTemplateKey("", "/about"));
    console.log("blog at /blog:", resolveTemplateKey("blog", "/blog"));
    console.log(
      "blog at /blog/first:",
      resolveTemplateKey("blog", "/blog/first-post"),
    );

    // Remount checks
    console.log("\n── Remount Checks ──");
    console.log("root: / → /about:", shouldRemount("", "/", "/about"));
    console.log(
      "root: /blog → /blog/post:",
      shouldRemount("", "/blog", "/blog/post"),
    );
    console.log(
      "blog: /blog → /blog/post:",
      shouldRemount("blog", "/blog", "/blog/post"),
    );
    console.log(
      "blog: /blog/a → /blog/b:",
      shouldRemount("blog", "/blog/a", "/blog/b"),
    );

    // Layout vs Template
    console.log("\n── Choose Template or Layout ──");
    console.log(
      "Analytics:",
      chooseTemplateOrLayout({ analyticsPageView: true }),
    );
    console.log("No special needs:", chooseTemplateOrLayout({}));
    console.log(
      "Reset + Effects:",
      chooseTemplateOrLayout({
        resetStateOnNav: true,
        rerunEffectsOnNav: true,
      }),
    );

    // Full navigation simulation
    console.log("\n── Full Navigation ──");
    var sim = simulateNavigation(
      ["", "blog"],
      [
        { from: "/", to: "/about" },
        { from: "/about", to: "/blog" },
        { from: "/blog", to: "/blog/first-post" },
        { from: "/blog/first-post", to: "/blog/second-post" },
      ],
    );
    for (var i = 0; i < sim.length; i++) {
      console.log(sim[i].from + " → " + sim[i].to + ":");
      for (var j = 0; j < sim[i].templates.length; j++) {
        var t = sim[i].templates[j];
        console.log(
          "  " +
            (t.path || "root") +
            ": " +
            (t.remount ? "REMOUNT!" : "KEEP!") +
            " (" +
            t.oldKey +
            " → " +
            t.newKey +
            ")",
        );
      }
    }
  }

  return { demo: demo };
})();
// Chạy: TemplateEngine.demo();
```

---

## §10. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: template vs layout — khác nhau cốt lõi?                │
  │  → Layout: PERSIST state, KHÔNG re-mount! ★                 │
  │  → Template: unique key → REMOUNT mỗi navigation! ★         │
  │  → Template: useEffect re-run, state reset, DOM recreate! ★│
  │  → Mechanism: React key={routeParam} reconciliation! ★      │
  │                                                              │
  │  ❓ 2: Template nhận those props nào?                          │
  │  → CHỈ children! (required!) ★                                │
  │  → KHÔNG có params, searchParams! ★                           │
  │  → Khác với layout (có params!) và page (có cả hai!)         │
  │                                                              │
  │  ❓ 3: Khi nào template KHÔNG remount?                         │
  │  → Search params thay đổi (?q=test) → KHÔNG remount! ★      │
  │  → Deeper segment thay đổi → template CHA không remount! ★ │
  │  → CHỈ remount khi segment CÙNG LEVEL đổi! ★                │
  │                                                              │
  │  ❓ 4: /blog → /blog/post-1: root template remount không?     │
  │  → KHÔNG! ★ (first segment "/blog" KHÔNG đổi!)               │
  │  → Blog template: CÓ remount! (child segment đổi!) ★        │
  │  → Root dùng key="/blog" → giữ nguyên! ★                    │
  │                                                              │
  │  ❓ 5: Mặc định nên dùng layout hay template?                  │
  │  → MẶC ĐỊNH: layout! ★                                       │
  │  → Template CHỈ khi cần: reset state, re-run effects,       │
  │    suspense fallback mỗi nav, animation restart! ★           │
  │  → Performance: layout tốt hơn (không recreate DOM!) ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
