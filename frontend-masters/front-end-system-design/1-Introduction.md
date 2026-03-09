# Front-End System Design — Phần 1: Introduction — "Fundamentals Behind Every Library, Framework & Pattern!"

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Introduction — "Frontend = API Communication + Data Management + Complex UI Interactions + Asset Management. Core Fundamentals → DOM API → Observer API → Virtualization → State Design → Network → Performance!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Foundation — hiểu được TẠI SAO mọi library/framework hoạt động như vậy!

---

## Mục Lục

| #   | Phần                                                               |
| --- | ------------------------------------------------------------------ |
| 1   | Giới Thiệu Giảng Viên — "JetBrains → Meta, Complex UI Apps!"       |
| 2   | Triết Lý Khoá Học — "Understand HOW Libraries Work!"               |
| 3   | Frontend System Design Là Gì? — "4 Pillars!"                       |
| 4   | Pillar 1: API Communication — "Giao Tiếp Server-Client!"           |
| 5   | Pillar 2: Data Management — "Lưu Trữ Hiệu Quả, Tối Ưu Memory!"     |
| 6   | Pillar 3: Complex User Interactions — "1000s Elements on Screen!"  |
| 7   | Pillar 4: Asset Management — "Multiple Chunks, Fast Loading!"      |
| 8   | Course Roadmap — "7 Sections, From Browser to Interview!"          |
| 9   | Section 1: Core Fundamentals — "Browser Rendering, GPU, Layers!"   |
| 10  | Section 2: DOM API — "Low-Level Shovel for DOM Tree!"              |
| 11  | Section 3: Observer API — "Efficient Tool for Complex Patterns!"   |
| 12  | Section 4: Virtualization — "Live-Code From Scratch!"              |
| 13  | Section 5: Application State Design — "Efficient Search & Access!" |
| 14  | Section 6: Network — "Protocols, REST vs GraphQL!"                 |
| 15  | Section 7: Web Application Performance — "JS, CSS, Images, Fonts!" |
| 16  | Bonus: Mock Interview — "Design a 3D-like Newsfeed!"               |
| 17  | Prerequisites — "Browser, Networking, Basic JS, Chrome!"           |
| 18  | Deep Dive: Frontend Architecture Overview                          |
| 19  | Deep Dive: The Three Layers — Backend, API, Frontend               |
| 20  | Deep Dive: Why "Fundamentals" Matter                               |

---

## §1. Giới Thiệu Giảng Viên — "JetBrains → Meta, Complex UI Apps!"

> Evgenii: _"I've been working in the industry for the last decade. I spent a good chunk of my career working on complex UI apps. I was at JetBrains for three years, and currently I work as a frontend engineer at Meta."_

Evgenii Ray là một frontend engineer với hơn **10 năm kinh nghiệm** trong ngành công nghiệp phần mềm. Điều đặc biệt ở Evgenii là ông đã dành phần lớn sự nghiệp của mình để xây dựng **complex UI applications** — không phải những landing page hay form đơn giản, mà là những ứng dụng phức tạp đòi hỏi hiểu biết sâu sắc về cách browser hoạt động, cách quản lý state ở quy mô lớn, và cách tối ưu hóa hiệu suất rendering.

**JetBrains** — công ty đứng sau những IDE huyền thoại như IntelliJ IDEA, WebStorm, PhpStorm — là nơi mà Evgenii đã trải qua 3 năm. Khi bạn nghĩ về những IDE này, bạn sẽ nhận ra rằng chúng là những ứng dụng UI phức tạp bậc nhất: editor với syntax highlighting, autocomplete, file tree, terminal, debugger, tất cả chạy đồng thời trên cùng một giao diện. Đây chính là loại "complex UI" mà Evgenii nói đến.

**Meta** (Facebook) — hiện tại Evgenii đang làm việc tại đây. Facebook, Instagram, WhatsApp Web — tất cả đều là những ứng dụng frontend quy mô khổng lồ với hàng tỷ người dùng, infinite scrolling, real-time updates, và yêu cầu performance khắt khe.

### Tại Sao Background Này Quan Trọng?

```
CAREER PATH → COURSE DESIGN:
═══════════════════════════════════════════════════════════════

  JetBrains (3 years)
  Complex IDE UI → Hiểu sâu about:
  ├── Browser rendering pipeline
  ├── Virtual DOM / DOM manipulation
  ├── Large-scale state management
  └── Performance optimization

  Meta (current)
  Billions of users → Hiểu sâu about:
  ├── Scalable frontend architecture
  ├── Network optimization (REST/GraphQL)
  ├── Asset loading strategies
  └── Web Vitals metrics

  → Khoá học = Tổng hợp kiến thức THỰC TẾ
    từ hai công ty hàng đầu thế giới!
```

Điều này có nghĩa là khoá học này không phải là lý thuyết suông. Mỗi concept được dạy đều xuất phát từ kinh nghiệm thực tế xây dựng những sản phẩm mà hàng triệu, thậm chí hàng tỷ người dùng mỗi ngày.

---

## §2. Triết Lý Khoá Học — "Understand HOW Libraries Work!"

> Evgenii: _"I was thinking it could be useful to have some fundamental course that explains how all these libraries and frameworks that we as UI specialists use every day work."_

### Vấn Đề: "Magic Box" Syndrome

Hầu hết frontend developers sử dụng React, Vue, Angular, hay Svelte mỗi ngày mà không thực sự hiểu **cách chúng hoạt động bên trong**. Chúng ta biết `useState` cập nhật state, nhưng không hiểu **tại sao** re-render xảy ra. Chúng ta biết `useEffect` chạy side effects, nhưng không hiểu **khi nào** nó chạy trong rendering pipeline.

```
"MAGIC BOX" SYNDROME:
═══════════════════════════════════════════════════════════════

  Developer writes:
  const [count, setCount] = useState(0);

  Developer KNOWS:
  ✅ "setCount updates the count"
  ✅ "Component re-renders"

  Developer DOESN'T KNOW:
  ❌ How does React batch updates?
  ❌ When does the DOM actually update?
  ❌ What triggers a browser repaint?
  ❌ How is the virtual DOM diffed?
  ❌ Why is some code slow and some fast?
  ❌ How does the event system work?
```

### Giải Pháp: Hiểu Fundamentals

Khoá học này đi **dưới lớp abstraction** của các frameworks. Thay vì dạy cách sử dụng React hay Vue, nó dạy:

- **Browser rendering pipeline** hoạt động ra sao
- **DOM API** thực sự cung cấp những gì
- **Observer API** có thể giải quyết những bài toán phức tạp nào
- **Virtualization** được implement từ đầu như thế nào
- **State management** nên được thiết kế ra sao
- **Network protocols** khác nhau thế nào
- **Performance optimization** cần tập trung vào đâu

```
FUNDAMENTAL KNOWLEDGE = SUPERPOWER:
═══════════════════════════════════════════════════════════════

  Hiểu fundamentals →
  ├── Debug BẤT KỲ framework nào
  ├── Optimize BẤT KỲ ứng dụng nào
  ├── Design BẤT KỲ system nào
  ├── Interview tại BẤT KỲ công ty nào
  └── Chuyển đổi giữa frameworks DỄ DÀNG

  "You know how EVERY library is designed.
   What are the APIs used for certain complex patterns."
   — Evgenii
```

### Everyday Job vs. Job Interview

Evgenii nhấn mạnh rằng kiến thức này hữu ích cho **cả hai** mục đích:

1. **Everyday Job**: Khi bạn gặp bug performance, khi bạn cần thiết kế một feature phức tạp, khi bạn cần chọn đúng data structure cho state — hiểu fundamentals giúp bạn đưa ra quyết định tốt hơn.

2. **Job Interview**: Các công ty lớn (FAANG/MAANG) thường hỏi system design cho frontend. Không phải "tạo một component" mà là "thiết kế toàn bộ hệ thống". Hiểu fundamentals là chìa khóa để trả lời những câu hỏi này.

---

## §3. Frontend System Design Là Gì? — "4 Pillars!"

> Evgenii: _"If we split the application design into three parts — backend, API, and frontend. The frontend is about API communication, data management, complex user interactions, and asset management."_

### The Three Layers

```
APPLICATION ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                  FRONTEND                         │
  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
  │  │ UI Render  │ │   State    │ │ Asset Mgmt   │ │
  │  │ Components │ │ Management │ │ Chunks/Lazy  │ │
  │  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ │
  │        │              │               │          │
  │  ┌─────┴──────────────┴───────────────┴───────┐  │
  │  │          API Communication Layer            │  │
  │  │    (fetch, WebSocket, SSE, GraphQL...)       │  │
  │  └────────────────────┬────────────────────────┘  │
  └───────────────────────┼──────────────────────────-┘
                          │
  ┌───────────────────────┼──────────────────────────-┐
  │                   API LAYER                        │
  │  REST, GraphQL, gRPC, WebSocket endpoints          │
  └───────────────────────┼──────────────────────────-┘
                          │
  ┌───────────────────────┼──────────────────────────-┐
  │                   BACKEND                          │
  │  Database, Business Logic, Authentication          │
  └──────────────────────────────────────────────────-┘
```

### The 4 Pillars of Frontend System Design

```
4 PILLARS:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │           FRONTEND SYSTEM DESIGN                 │
  ├─────────────┬─────────────┬────────────┬────────┤
  │     API     │    Data     │  Complex   │ Asset  │
  │Communication│ Management  │    UI      │ Mgmt   │
  │             │             │Interactions│        │
  ├─────────────┼─────────────┼────────────┼────────┤
  │ How we talk │ How we store│ How we     │How we  │
  │ to server   │ data        │ render     │load    │
  │             │ efficiently │ 1000s of   │chunks  │
  │ fetch, WS,  │             │ elements   │        │
  │ SSE, GQL    │ Memory mgmt │            │ Fast   │
  │             │ Device-aware│ Limited    │loading │
  │             │             │ RAM/screen │Web     │
  │             │             │            │Vitals  │
  └─────────────┴─────────────┴────────────┴────────┘
```

---

## §4. Pillar 1: API Communication — "Giao Tiếp Server-Client!"

> Evgenii: _"The frontend is about API communication — how we communicate with the API."_

### Tại Sao API Communication Quan Trọng?

Mỗi ứng dụng frontend hiện đại đều cần giao tiếp với server. Nhưng **cách** bạn giao tiếp quyết định rất nhiều thứ:

```
API COMMUNICATION IMPACTS:
═══════════════════════════════════════════════════════════════

  ┌─── Performance ───┐
  │ Latency            │  Chọn sai protocol
  │ Bandwidth          │  → App chậm, user bỏ đi
  │ Caching            │
  └────────────────────┘

  ┌─── User Experience ─┐
  │ Real-time updates    │  Chọn đúng protocol
  │ Offline support      │  → App nhanh, responsive
  │ Optimistic UI        │
  └──────────────────────┘

  ┌─── Scalability ────┐
  │ Connection limits    │  Hiểu trade-offs
  │ Data overfetching    │  → Scale tốt
  │ Request batching     │
  └──────────────────────┘
```

### Các Phương Thức Giao Tiếp

| Method                 | Use Case                | Direction       |
| ---------------------- | ----------------------- | --------------- |
| **REST** (fetch/XHR)   | CRUD operations         | Client → Server |
| **GraphQL**            | Flexible queries        | Client → Server |
| **WebSocket**          | Real-time bidirectional | Both ways       |
| **Server-Sent Events** | Real-time server push   | Server → Client |
| **Long Polling**       | Fallback real-time      | Client → Server |
| **gRPC-Web**           | High-performance        | Client → Server |

---

## §5. Pillar 2: Data Management — "Lưu Trữ Hiệu Quả, Tối Ưu Memory!"

> Evgenii: _"How we store this data in a way that we can utilize the device resource efficiently, so we don't overuse the memory of the device."_

### Device Resource Awareness

Điều mà Evgenii nhấn mạnh ở đây là **device-aware programming**. Không phải mọi user đều có MacBook Pro M3 Max với 96GB RAM. Rất nhiều người dùng web trên:

```
DEVICE REALITY:
═══════════════════════════════════════════════════════════════

  Flagship Phone
  ├── RAM: 8-12 GB (shared with OS + other apps!)
  ├── Available for browser: ~2-4 GB
  └── Browser tab limit: varies

  Budget Phone
  ├── RAM: 2-4 GB
  ├── Available for browser: ~500 MB - 1 GB
  └── Kill tabs aggressively!

  Old Laptop
  ├── RAM: 4-8 GB
  ├── Multiple tabs open
  └── Swapping to disk = SLOW!

  → Nếu app của bạn dùng 500MB memory
    trên flagship = OK
    trên budget phone = CRASH! 💀
```

### Data Storage Strategies

```
STORAGE HIERARCHY:
═══════════════════════════════════════════════════════════════

  Speed ←──────────────────────────→ Capacity

  ┌─── JavaScript Memory (Heap) ───┐
  │ Fastest access                  │
  │ Limited by device RAM           │
  │ Lost on page refresh            │
  │ → In-memory state (Redux, etc.) │
  └─────────────┬───────────────────┘
                │
  ┌─────────────┴── Browser Storage ─┐
  │ localStorage: 5-10 MB            │
  │ sessionStorage: 5-10 MB          │
  │ IndexedDB: 100s of MB            │
  │ Cache API: 100s of MB            │
  │ → Persistent, structured data    │
  └─────────────┬────────────────────┘
                │
  ┌─────────────┴── Network Cache ───┐
  │ Service Worker cache             │
  │ HTTP cache (browser)             │
  │ CDN cache                        │
  │ → Offline support, fast reload   │
  └──────────────────────────────────┘
```

---

## §6. Pillar 3: Complex User Interactions — "1000s Elements on Screen!"

> Evgenii: _"You need to display thousands of elements on a screen — how will you do that? Having limited RAM or having a small screen."_

### Vấn Đề: DOM Explosion

Khi bạn cần hiển thị một danh sách dài (ví dụ: feed của Facebook, bảng dữ liệu với 100,000 hàng, danh sách chat messages), bạn không thể tạo DOM nodes cho TẤT CẢ items:

```
DOM EXPLOSION PROBLEM:
═══════════════════════════════════════════════════════════════

  100,000 items × ~10 DOM nodes each = 1,000,000 DOM nodes!

  Memory: ~500 MB – 1 GB (just for DOM!) 💀
  Layout: Browser phải tính toán position cho 1M elements!
  Paint: Browser phải vẽ 1M elements!
  → Scrolling = LAG, UI = FROZEN

  GIẢI PHÁP: VIRTUALIZATION!
  ══════════════════════════
  Chỉ render 20-50 items visible trên screen!

  ┌──────────────────────────┐
  │  ████████████████████    │ ← Visible: 20 items rendered!
  │                          │
  │  (rest of 99,980 items   │
  │   NOT in DOM!)           │
  └──────────────────────────┘

  User scrolls → swap items in/out!
  Memory: ~50 KB (chỉ 20 DOM nodes!) ✅
```

### Complex Interaction Patterns

```
COMPLEX UI PATTERNS:
═══════════════════════════════════════════════════════════════

  Virtualization       → Render only visible items!
  Infinite Scrolling   → Load more on demand!
  Drag & Drop          → Reorder with animations!
  Rich Text Editor     → Content-editable + formatting!
  Canvas/WebGL         → Drawing, charts, 3D!
  Gesture Handling     → Touch, pinch, swipe!
  Intersection Observer→ Lazy loading, analytics!
  Resize Observer      → Responsive components!
```

---

## §7. Pillar 4: Asset Management — "Multiple Chunks, Fast Loading!"

> Evgenii: _"Complex apps tend to have multiple chunks we need to load. How would we load them efficiently so our application loads fast and web vitals metrics are at a high level?"_

### Web Vitals và Tại Sao Chúng Quan Trọng

```
CORE WEB VITALS:
═══════════════════════════════════════════════════════════════

  LCP (Largest Contentful Paint)
  ├── "How fast does the main content appear?"
  ├── Good: ≤ 2.5s
  └── → Optimize: images, fonts, critical CSS!

  INP (Interaction to Next Paint)
  ├── "How responsive is the page?"
  ├── Good: ≤ 200ms
  └── → Optimize: JS bundle size, event handlers!

  CLS (Cumulative Layout Shift)
  ├── "Does the page jump around?"
  ├── Good: ≤ 0.1
  └── → Optimize: image dimensions, font loading!
```

### Asset Loading Strategies

```
ASSET LOADING:
═══════════════════════════════════════════════════════════════

  ┌──── Code Splitting ────┐
  │ Split by route          │  /home → home.js (50 KB)
  │ Split by feature        │  /dashboard → dashboard.js
  │ Split by vendor         │  react.js, lodash.js
  └─────────────────────────┘

  ┌──── Lazy Loading ──────┐
  │ Load on demand          │  import('./Modal')
  │ Load on visibility      │  IntersectionObserver
  │ Load on interaction     │  onClick → import()
  └─────────────────────────┘

  ┌──── Preloading ────────┐
  │ <link rel="preload">   │  Critical resources
  │ <link rel="prefetch">  │  Future navigation
  │ modulepreload          │  JS modules
  └─────────────────────────┘
```

---

## §8. Course Roadmap — "7 Sections, From Browser to Interview!"

```
COURSE ROADMAP:
═══════════════════════════════════════════════════════════════

  ┌─── Section 1: Core Fundamentals ──────────────────┐
  │ Browser rendering cycle                            │
  │ Stacking context + Formatting context              │
  │ Composition layers + GPU optimization              │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 2: DOM API ────────────────────────────┐
  │ DOM API refresher                                  │
  │ Low-level APIs to modify DOM tree                  │
  │ "The shovel" for frontend engineers                │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 3: Observer API ───────────────────────┐
  │ Efficient tool for complex patterns                │
  │ Live-coding exercises                              │
  │ IntersectionObserver, ResizeObserver, etc.          │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 4: Virtualization (Code-Heavy!) ───────┐
  │ How virtualization works                           │
  │ Live-code from scratch!                            │
  │ Everything applied together                        │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 5: Application State Design ───────────┐
  │ Efficient search operations                        │
  │ Efficient access operations                        │
  │ Browser storage API for memory offload             │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 6: Network ────────────────────────────┐
  │ Communication protocols                            │
  │ Ways of talking to server                          │
  │ REST vs GraphQL debate                             │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Section 7: Web App Performance ────────────────┐
  │ JavaScript optimization                            │
  │ CSS optimization                                   │
  │ Images + Fonts optimization                        │
  └────────────────────┬───────────────────────────────┘
                       ↓
  ┌─── Bonus: Mock Interview ─────────────────────────┐
  │ Simulate interview environment                     │
  │ Design a 3D-like newsfeed application              │
  └────────────────────────────────────────────────────┘
```

---

## §9. Section 1: Core Fundamentals — "Browser Rendering, GPU, Layers!"

> Evgenii: _"This is one of the most important sections. It will give you exposure of how browser treats HTML elements, how stacking context is connected to formatting context, and how everything is connected to the GPU."_

### Tại Sao Đây Là Section Quan Trọng Nhất

Section Core Fundamentals được Evgenii coi là **nền tảng quan trọng nhất** vì mọi thứ trong frontend đều xây dựng trên nó. Mọi framework, mọi library, mọi pattern — tất cả đều phải tương tác với browser rendering pipeline.

```
CORE FUNDAMENTALS — WHAT WE'LL LEARN:
═══════════════════════════════════════════════════════════════

  1. Browser Rendering Cycle
     ├── HTML Parsing → DOM Tree
     ├── CSS Parsing → CSSOM
     ├── DOM + CSSOM → Render Tree
     ├── Layout (calculate positions)
     ├── Paint (draw pixels)
     └── Composite (combine layers)

  2. Stacking Context ↔ Formatting Context
     ├── z-index, position, opacity
     ├── Block formatting context (BFC)
     ├── Flex/Grid formatting context
     └── How they connect!

  3. Composition Layers + GPU
     ├── What triggers layer creation?
     ├── will-change, transform, opacity
     ├── GPU acceleration benefits
     └── GPU acceleration pitfalls!
```

### Browser Rendering Pipeline Deep Dive

```
BROWSER RENDERING PIPELINE:
═══════════════════════════════════════════════════════════════

  HTML              CSS
   ↓                 ↓
  DOM Tree    +   CSSOM
   ↓                 ↓
  ├── Style Calculation ──┤
  ↓
  Layout Tree (Render Tree)
  ↓
  Paint Records
  ↓
  Composition Layers
  ↓
  ┌─────────────────────┐
  │   GPU COMPOSITING    │  ← Fastest path!
  │   transform, opacity │
  └─────────────────────┘
  ↓
  PIXELS ON SCREEN! 🖥️
```

### Tại Sao Stacking Context + Formatting Context Connected?

```
STACKING CONTEXT vs FORMATTING CONTEXT:
═══════════════════════════════════════════════════════════════

  Stacking Context (Z-axis: depth!)
  ├── Controls OVERLAP order
  ├── Created by: z-index + position
  │               opacity < 1
  │               transform, filter
  │               will-change
  └── Determines: which element is "on top"

  Formatting Context (X/Y-axis: layout!)
  ├── Controls FLOW and PLACEMENT
  ├── Block Formatting Context (BFC)
  │   → Margins, floats, clearfix
  ├── Flex Formatting Context
  │   → flex-direction, justify, align
  ├── Grid Formatting Context
  │   → grid-template, grid-area
  └── Determines: where elements GO

  CONNECTION:
  ═══════════
  Some properties create BOTH contexts!
  Example: "display: flex" creates:
  → A new formatting context (flex layout!)
  → Potentially a new stacking context!
```

### GPU + Composition Layers

```
GPU OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  WITHOUT GPU (Main thread):
  Change color → Style → Layout → Paint → Composite
  ← EXPENSIVE! Blocks main thread!

  WITH GPU (Compositor thread):
  Change transform → Composite ONLY!
  ← CHEAP! Runs on GPU, doesn't block!

  CHEAP properties (GPU-accelerated):
  ✅ transform: translate(), scale(), rotate()
  ✅ opacity: 0 → 1

  EXPENSIVE properties (trigger layout):
  ❌ width, height → Layout + Paint + Composite
  ❌ top, left → Layout + Paint + Composite
  ❌ font-size → Layout + Paint + Composite
```

---

## §10. Section 2: DOM API — "Low-Level Shovel for DOM Tree!"

> Evgenii: _"The DOM API for us is like a shovel. We need to know how to work with the low-level APIs to modify the DOM tree."_

### "The Shovel" Metaphor

Evgenii so sánh DOM API như **cái xẻng** (shovel). Framework như React, Vue cung cấp cho bạn máy xúc (excavator) — mạnh mẽ, tự động, nhưng bạn không biết cơ chế đào bên dưới. DOM API là cái xẻng — bạn phải tự đào, nhưng bạn hiểu rõ từng cú đào.

```
DOM API — THE SHOVEL:
═══════════════════════════════════════════════════════════════

  Creating:
  document.createElement('div')
  document.createTextNode('hello')
  document.createDocumentFragment()   ← Batch operations!

  Reading:
  element.querySelector('.class')
  element.querySelectorAll('div')
  element.getAttribute('data-id')
  element.getBoundingClientRect()      ← Layout info!

  Modifying:
  element.appendChild(child)
  element.insertBefore(new, ref)
  element.replaceChild(new, old)
  element.removeChild(child)
  element.setAttribute('class', 'foo')

  Modern:
  element.append(...nodes)              ← Multiple!
  element.prepend(...nodes)
  element.before(...nodes)
  element.after(...nodes)
  element.replaceWith(...nodes)
  element.remove()                      ← Self-remove!
```

---

## §11. Section 3: Observer API — "Efficient Tool for Complex Patterns!"

> Evgenii: _"The Observer API is a very efficient tool to design complex patterns. We're going to use live-coding exercises to show how we can utilize observers."_

```
OBSERVER APIs:
═══════════════════════════════════════════════════════════════

  IntersectionObserver
  ├── "Is element visible in viewport?"
  ├── Use: lazy loading images
  ├── Use: infinite scroll trigger
  ├── Use: analytics (impression tracking)
  └── Use: animation on scroll

  ResizeObserver
  ├── "Did element change size?"
  ├── Use: responsive components
  ├── Use: chart resizing
  └── Use: virtualization recalc

  MutationObserver
  ├── "Did DOM tree change?"
  ├── Use: third-party script monitoring
  ├── Use: content-editable tracking
  └── Use: accessibility tree updates

  PerformanceObserver
  ├── "What performance events happened?"
  ├── Use: Web Vitals measurement
  ├── Use: long task detection
  └── Use: resource timing

  WHY OBSERVERS > EVENT LISTENERS?
  ════════════════════════════════
  ✅ No polling (efficient!)
  ✅ No scroll listeners (janky!)
  ✅ Browser-optimized callbacks
  ✅ Automatic cleanup
  ✅ Batched notifications
```

---

## §12. Section 4: Virtualization — "Live-Code From Scratch!"

> Evgenii: _"We're going to take a look at how virtualization works. And we're going to live-code it from scratch, so you can understand how everything is applied together."_

### Virtualization — Concept

```
VIRTUALIZATION CONCEPT:
═══════════════════════════════════════════════════════════════

  DATA: [item0, item1, item2, ..., item99999]
  (100,000 items!)

  SCREEN shows only ~20 items at a time!

  ┌────────────────────────────┐
  │ ░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Buffer (5 items above)
  │ ░░░░░░░░░░░░░░░░░░░░░░░░░ │
  ├────────────────────────────┤
  │ █████ Item 45 ████████████ │ ← Viewport start
  │ █████ Item 46 ████████████ │
  │ █████ Item 47 ████████████ │   Visible items
  │ █████ Item 48 ████████████ │   rendered in DOM!
  │ █████ Item 49 ████████████ │
  │ █████ Item 50 ████████████ │
  │ █████ Item 51 ████████████ │
  │ █████ Item 52 ████████████ │
  │ █████ Item 53 ████████████ │
  │ █████ Item 54 ████████████ │ ← Viewport end
  ├────────────────────────────┤
  │ ░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Buffer (5 items below)
  │ ░░░░░░░░░░░░░░░░░░░░░░░░░ │
  └────────────────────────────┘

  Total DOM nodes: ~20-30 (visible + buffer)
  Not in DOM: 99,970 items!

  On scroll → recalculate which items visible
            → update DOM (swap items)
            → adjust scroll position!
```

### Key Concepts for Implementation

```
VIRTUALIZATION IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  1. Container height = totalItems × itemHeight
     → Creates scrollbar of correct size!

  2. scrollTop ÷ itemHeight = firstVisibleIndex
     → Know which item to start rendering!

  3. containerHeight ÷ itemHeight = visibleCount
     → Know how many items to render!

  4. On scroll event:
     → Recalculate firstVisibleIndex
     → Update items in DOM
     → Use transform: translateY() for positioning!
```

---

## §13. Section 5: Application State Design — "Efficient Search & Access!"

> Evgenii: _"We're going to check how can we design the state in a way that the search operation is efficient, the access operation is efficient, and how we can utilize browser storage API to offload device memory."_

### State Design Principles

```
STATE DESIGN — EFFICIENCY:
═══════════════════════════════════════════════════════════════

  ❌ BAD: Array of objects
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    ...
  ];
  → Find user by ID: O(N) linear scan!

  ✅ GOOD: Normalized (Map/Object)
  const usersById = {
    1: { id: 1, name: "Alice" },
    2: { id: 2, name: "Bob" },
  };
  → Find user by ID: O(1) direct access!

  ✅ BETTER: Multiple indexes
  const usersById = new Map();     // id → user
  const usersByEmail = new Map();  // email → user
  const userIds = [];              // ordered list
  → Access by ANY key: O(1)!
```

### Browser Storage Offloading

```
MEMORY OFFLOADING:
═══════════════════════════════════════════════════════════════

  HOT data (frequent access):
  → Keep in JavaScript memory (O(1) access!)

  WARM data (occasional access):
  → Store in sessionStorage (survives refresh!)
  → Store in IndexedDB (structured, queryable!)

  COLD data (rare access):
  → Store in Cache API (network responses!)
  → Don't store (re-fetch when needed!)

  "Don't overuse device memory!" — Evgenii
```

---

## §14. Section 6: Network — "Protocols, REST vs GraphQL!"

> Evgenii: _"I'm going to discuss a very Hollywood topic — REST vs GraphQL — and I'll provide my opinion on that."_

```
COMMUNICATION PROTOCOLS:
═══════════════════════════════════════════════════════════════

                     REST
  Client ────────── → Server
         ← ──────── Response
  (Multiple endpoints, fixed response shape)

                   GraphQL
  Client ────────── → Server
         ← ──────── Exact data requested
  (Single endpoint, flexible response shape)

                  WebSocket
  Client ← ─────── → Server
  (Bidirectional, persistent connection, real-time)

                     SSE
  Client ← ──────── Server
  (Server push only, simpler than WebSocket)

  "Hollywood topic" = REST vs GraphQL is overhyped!
  The right choice depends on YOUR use case! — Evgenii
```

---

## §15. Section 7: Web Application Performance — "JS, CSS, Images, Fonts!"

```
PERFORMANCE OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  JavaScript:
  ├── Code splitting (route-based, feature-based)
  ├── Tree shaking (remove unused code)
  ├── Minification + compression (gzip/brotli)
  └── defer/async loading

  CSS:
  ├── Critical CSS inline
  ├── Non-critical CSS async
  ├── Remove unused CSS
  └── Containment (CSS contain property)

  Images:
  ├── Modern formats (WebP, AVIF)
  ├── Responsive images (srcset)
  ├── Lazy loading (loading="lazy")
  └── CDN with auto-optimization

  Fonts:
  ├── font-display: swap
  ├── Preload critical fonts
  ├── Subset fonts (only needed chars)
  └── Variable fonts (one file, many weights)
```

---

## §16. Bonus: Mock Interview — "Design a 3D-like Newsfeed!"

> Evgenii: _"We're going to simulate the interview environment and try to design a 3D-like application newsfeed."_

Phần bonus này mô phỏng một buổi phỏng vấn system design thực tế. Evgenii sẽ đưa ra yêu cầu "thiết kế một newsfeed giống các ứng dụng 3D" và hướng dẫn cách tiếp cận vấn đề từ góc độ system design.

```
MOCK INTERVIEW APPROACH:
═══════════════════════════════════════════════════════════════

  1. Clarify Requirements
     ├── What is "3D-like"? Perspective? Depth?
     ├── How many items?
     ├── Real-time updates?
     └── Target devices?

  2. High-Level Architecture
     ├── Data flow (API → State → View)
     ├── Rendering strategy (DOM? Canvas? WebGL?)
     └── State management approach

  3. Core Components
     ├── Feed container (virtualized?)
     ├── Card component (3D transforms?)
     ├── Interaction handlers (scroll, gestures?)
     └── Data fetching layer

  4. Performance Considerations
     ├── GPU utilization (transform3d)
     ├── Memory management
     ├── Network strategy (pagination? infinite?)
     └── Animation frame budget (16ms!)

  5. Trade-offs Discussion
     ├── DOM vs Canvas vs WebGL
     ├── CSS transforms vs JavaScript animations
     └── Complexity vs Performance
```

---

## §17. Prerequisites — "Browser, Networking, Basic JS, Chrome!"

> Evgenii: _"You need to know how the browser renders the page, basic networking knowledge, basic JavaScript, and the latest Chrome browser."_

```
PREREQUISITES:
═══════════════════════════════════════════════════════════════

  ✅ Basic understanding of browser rendering
  ✅ Basic networking knowledge (HTTP, etc.)
  ✅ Basic JavaScript (not expert-level!)
  ✅ Latest Chrome browser installed
  ❌ No bundlers needed (run natively!)
  ❌ No frameworks needed (vanilla JS!)
```

---

## §18. Deep Dive: Frontend Architecture Overview

### Kiến Trúc Tổng Quan Của Một Frontend Application

Khi Evgenii nói về "Frontend System Design", ông đang nói về **toàn bộ hệ thống** chứ không chỉ là components hay pages. Hãy nhìn nhận frontend application như một hệ thống hoàn chỉnh:

```
FRONTEND APPLICATION ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                    PRESENTATION LAYER                     │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
  │  │  Pages    │  │Components│  │  Layouts │  │ Modals  │ │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
  │       │              │              │              │      │
  │  ┌────┴──────────────┴──────────────┴──────────────┴────┐ │
  │  │               RENDERING ENGINE                        │ │
  │  │  Virtual DOM / Reconciliation / Direct DOM            │ │
  │  └──────────────────────┬────────────────────────────────┘ │
  └─────────────────────────┼─────────────────────────────────┘
                            │
  ┌─────────────────────────┼─────────────────────────────────┐
  │                    STATE LAYER                             │
  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
  │  │  Local    │  │   Global     │  │   Derived/Cached   │  │
  │  │  State    │  │   Store      │  │   State            │  │
  │  └──────────┘  └──────────────┘  └────────────────────┘  │
  └─────────────────────────┼─────────────────────────────────┘
                            │
  ┌─────────────────────────┼─────────────────────────────────┐
  │                  DATA ACCESS LAYER                         │
  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
  │  │  API      │  │   Cache      │  │   Storage          │  │
  │  │  Client   │  │   Layer      │  │   (IndexedDB,      │  │
  │  │  (fetch)  │  │   (SWR,etc.) │  │    localStorage)   │  │
  │  └──────────┘  └──────────────┘  └────────────────────┘  │
  └─────────────────────────┼─────────────────────────────────┘
                            │
  ┌─────────────────────────┼─────────────────────────────────┐
  │                 INFRASTRUCTURE LAYER                       │
  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
  │  │  Routing  │  │   Error      │  │   Performance      │  │
  │  │          │  │   Handling    │  │   Monitoring       │  │
  │  └──────────┘  └──────────────┘  └────────────────────┘  │
  └────────────────────────────────────────────────────────────┘
```

### Mỗi Layer Có Vai Trò Riêng

Điều quan trọng mà khoá học này sẽ dạy bạn là **tại sao** mỗi layer tồn tại và **cách** thiết kế chúng hiệu quả. Không phải chỉ biết "dùng Redux" hay "dùng React Query", mà hiểu **nguyên lý** đằng sau để có thể áp dụng với BẤT KỲ tool nào.

---

## §19. Deep Dive: The Three Layers — Backend, API, Frontend

### Backend vs API vs Frontend — Ranh Giới Ở Đâu?

```
THE THREE LAYERS:
═══════════════════════════════════════════════════════════════

  BACKEND ("The Warehouse")
  ├── Database management
  ├── Business logic
  ├── Authentication/Authorization
  ├── File storage
  └── YOU control: data integrity, security

  API ("The Counter")
  ├── Defines the "contract"
  ├── REST endpoints / GraphQL schema
  ├── Request/Response format
  ├── Rate limiting, validation
  └── YOU negotiate: what data, what format

  FRONTEND ("The Showroom")
  ├── User interface
  ├── Client-side logic
  ├── State management
  ├── Performance optimization
  └── YOU control: UX, rendering, memory
```

### Frontend System Design Focus

Khoá học này tập trung vào **Frontend** layer, nhưng với sự hiểu biết rằng frontend không hoạt động một mình. Bạn cần hiểu:

- **Từ API**: bạn nhận data ở format nào? Trả về gì khi fetch?
- **Tại Frontend**: bạn lưu trữ, transform, display, và interact với data đó như thế nào?
- **Với Device**: bạn tối ưu cho memory, CPU, GPU, network của device user như thế nào?

---

## §20. Deep Dive: Why "Fundamentals" Matter

### Framework Dies, Fundamentals Live Forever

```
FRAMEWORK LIFECYCLE:
═══════════════════════════════════════════════════════════════

  2010: jQuery everywhere!
  2013: Angular 1.x revolution!
  2014: React changes everything!
  2016: Angular 2+ (complete rewrite!)
  2018: Vue 2.x gains popularity!
  2020: Svelte disrupts!
  2022: Solid, Qwik emerge!
  2024: React Server Components!
  2025: ???

  Frameworks change every 2-3 years!
  But fundamentals NEVER change:

  ✅ Browser rendering pipeline — same since 2010!
  ✅ DOM API — same since forever!
  ✅ HTTP protocol — same concepts!
  ✅ Event loop — same mechanism!
  ✅ Memory management — same principles!
  ✅ GPU compositing — same approach!
```

### The "T-Shaped" Engineer

```
T-SHAPED KNOWLEDGE:
═══════════════════════════════════════════════════════════════

  BROAD knowledge (horizontal bar of T):
  React, Vue, Angular, Svelte, Next.js, Nuxt, SvelteKit...

  DEEP knowledge (vertical bar of T):
  │
  │  Browser Rendering Pipeline
  │  DOM API & Manipulation
  │  Observer APIs
  │  Virtualization Algorithms
  │  State Design Patterns
  │  Network Protocols
  │  Performance Optimization
  │  GPU & Compositing
  │
  ↓

  THIS COURSE = THE VERTICAL BAR!
  "Understand HOW every library is designed." — Evgenii
```

---

## Tự Code: Minimal System Design Demo

```javascript
// ═══ MINIMAL FRONTEND SYSTEM — Vanilla JS ═══
// Demonstrates ALL 4 pillars in ~100 lines!

// PILLAR 1: API Communication
class APIClient {
  #baseURL;

  constructor(baseURL) {
    this.#baseURL = baseURL;
  }

  async get(path) {
    const res = await fetch(this.#baseURL + path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

// PILLAR 2: Data Management (efficient state)
class Store {
  #data = new Map(); // id → item (O(1) access!)
  #listeners = new Set();

  set(id, item) {
    this.#data.set(id, item);
    this.#notify();
  }

  get(id) {
    return this.#data.get(id); // O(1)!
  }

  getAll() {
    return [...this.#data.values()];
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #notify() {
    this.#listeners.forEach((fn) => fn());
  }
}

// PILLAR 3: Complex UI (simple virtualization concept)
class VirtualList {
  #container;
  #itemHeight;
  #items = [];

  constructor(container, itemHeight) {
    this.#container = container;
    this.#itemHeight = itemHeight;
    this.#container.style.overflow = "auto";

    this.#container.addEventListener("scroll", () => {
      this.#render();
    });
  }

  setItems(items) {
    this.#items = items;
    this.#render();
  }

  #render() {
    const scrollTop = this.#container.scrollTop;
    const viewH = this.#container.clientHeight;
    const startIdx = Math.floor(scrollTop / this.#itemHeight);
    const visibleCount = Math.ceil(viewH / this.#itemHeight) + 2;
    const endIdx = Math.min(startIdx + visibleCount, this.#items.length);

    // Only render visible items!
    const fragment = document.createDocumentFragment();
    for (let i = startIdx; i < endIdx; i++) {
      const div = document.createElement("div");
      div.textContent = this.#items[i];
      div.style.position = "absolute";
      div.style.top = `${i * this.#itemHeight}px`;
      div.style.height = `${this.#itemHeight}px`;
      fragment.appendChild(div);
    }

    const inner =
      this.#container.querySelector(".inner") || document.createElement("div");
    inner.className = "inner";
    inner.style.position = "relative";
    inner.style.height = `${this.#items.length * this.#itemHeight}px`;
    inner.innerHTML = "";
    inner.appendChild(fragment);

    if (!this.#container.querySelector(".inner")) {
      this.#container.appendChild(inner);
    }
  }
}

// PILLAR 4: Asset Management (lazy loading)
class LazyLoader {
  #observer;

  constructor() {
    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src; // Load actual image!
          this.#observer.unobserve(img);
        }
      });
    });
  }

  observe(imgElement) {
    this.#observer.observe(imgElement);
  }
}

// ═══ USAGE ═══
console.log("═══ FRONTEND SYSTEM DESIGN DEMO ═══\n");
console.log("Pillar 1: APIClient → fetch with error handling");
console.log("Pillar 2: Store → Map-based O(1) state");
console.log("Pillar 3: VirtualList → render only visible items");
console.log("Pillar 4: LazyLoader → IntersectionObserver");
console.log("\n✅ No frameworks, no libraries!");
console.log("✅ Just browser APIs + JavaScript!");
console.log("✅ 'Understand how every library is designed' — Evgenii");
```

---

## Checklist

```
[ ] Frontend System Design = 4 Pillars!
    [ ] API Communication: how we talk to server!
    [ ] Data Management: efficient storage, device-aware!
    [ ] Complex UI: virtualization, 1000s of elements!
    [ ] Asset Management: chunks, lazy loading, Web Vitals!
[ ] Course = 7 Sections + Bonus:
    [ ] Core Fundamentals (browser rendering, GPU!)
    [ ] DOM API ("the shovel!")
    [ ] Observer API (efficient patterns!)
    [ ] Virtualization (live-code from scratch!)
    [ ] State Design (efficient search/access!)
    [ ] Network (protocols, REST vs GraphQL!)
    [ ] Performance (JS, CSS, images, fonts!)
    [ ] Bonus: Mock Interview (3D newsfeed!)
[ ] Prerequisites: browser knowledge, basic JS, Chrome!
[ ] No bundlers — run everything natively!
[ ] "Know HOW every library is designed" — Evgenii
TIẾP THEO → Phần 2: Core Fundamentals!
```
