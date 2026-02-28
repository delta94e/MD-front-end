# Next.js CSS-in-JS — Deep Dive!

> **Chủ đề**: CSS-in-JS trong Next.js App Router — Hiểu sâu cơ chế!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/css-in-js
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. CSS-in-JS Là Gì? — Tổng Quan](#1)
2. [§2. Thách Thức Với Server Components](#2)
3. [§3. 3 Bước Cấu Hình CSS-in-JS](#3)
4. [§4. styled-jsx — Built-in Solution](#4)
5. [§5. styled-components — Setup Chi Tiết](#5)
6. [§6. SSR Streaming & Style Flushing](#6)
7. [§7. 13 Libraries Được Hỗ Trợ](#7)
8. [§8. Tự Viết — CSSInJSEngine](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. CSS-in-JS Là Gì? — Tổng Quan!

```
  CSS-IN-JS — TẠI SAO TỒN TẠI?
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CSS TRUYỀN THỐNG:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  .button { color: red; }     ← File .css riêng      │  │
  │  │  .button { color: blue; }    ← File khác XUNG ĐỘT! │  │
  │  │                                                      │  │
  │  │  VẤN ĐỀ:                                            │  │
  │  │  → Global scope → naming conflicts!                 │  │
  │  │  → Khó quản lý khi project lớn!                    │  │
  │  │  → Dead CSS khó phát hiện!                          │  │
  │  │  → Dynamic styles phải dùng inline style!           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CSS-IN-JS:                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const Button = styled.button`                       │  │
  │  │    color: ${props => props.primary ? 'blue' : 'red'};│  │
  │  │  `                                                   │  │
  │  │                                                      │  │
  │  │  LỢI ÍCH:                                           │  │
  │  │  ✅ Scoped styles → không xung đột!                │  │
  │  │  ✅ Dynamic styles → dựa trên props!               │  │
  │  │  ✅ Co-located → style + component CÙNG FILE!       │  │
  │  │  ✅ Dead code elimination tự động!                  │  │
  │  │  ✅ TypeScript support!                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Thách Thức Với Server Components!

```
  CSS-IN-JS + SERVER COMPONENTS = KHÓ!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ CỐT LÕI:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  CSS-in-JS hoạt động bằng cách:                     │  │
  │  │  ① Component render → tạo CSS rules                 │  │
  │  │  ② Thu thập (collect) tất cả CSS rules              │  │
  │  │  ③ Inject CSS vào <head> của HTML                   │  │
  │  │                                                      │  │
  │  │  Server Components thách thức:                       │  │
  │  │  → Render trên SERVER → không có DOM!              │  │
  │  │  → Streaming → HTML gửi TỪNG PHẦN!                │  │
  │  │  → Concurrent rendering → render NHIỀU lúc!        │  │
  │  │                                                      │  │
  │  │  ⚠️ CSS-in-JS libraries PHẢI hỗ trợ React 18!     │  │
  │  │  ⚠️ Library KHÔNG hỗ trợ concurrent = KHÔNG DÙNG! │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP CỦA NEXT.JS:                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  CSS-in-JS CHỈ DÙNG TRONG CLIENT COMPONENTS!        │  │
  │  │  (Server Components dùng CSS Modules / Tailwind)    │  │
  │  │                                                      │  │
  │  │  Next.js cung cấp:                                   │  │
  │  │  → useServerInsertedHTML hook                        │  │
  │  │  → Cho phép inject CSS VÀO HTML trong SSR!         │  │
  │  │  → Hoạt động với Streaming!                         │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. 3 Bước Cấu Hình CSS-in-JS!

```
  3-STEP OPT-IN PROCESS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  BƯỚC 1: Style Registry                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Tạo "registry" = nơi THU THẬP tất cả CSS rules!   │  │
  │  │                                                      │  │
  │  │  const [sheet] = useState(() => new Registry())      │  │
  │  │  → Lazy init → tạo 1 lần duy nhất!                 │  │
  │  │  → Thu thập CSS từ TẤT CẢ components trong render! │  │
  │  └──────────────────────────────────────────────────────┘  │
  │    │                                                       │
  │    ▼                                                       │
  │  BƯỚC 2: useServerInsertedHTML                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Hook inject CSS rules vào HTML TRƯỚC content!       │  │
  │  │                                                      │  │
  │  │  useServerInsertedHTML(() => {                        │  │
  │  │    const styles = sheet.getStyles()                  │  │
  │  │    sheet.flush()  // clear sau khi inject!           │  │
  │  │    return <>{styles}</>                              │  │
  │  │  })                                                  │  │
  │  │                                                      │  │
  │  │  → Gọi ĐÚNG THỜI ĐIỂM trong SSR!                   │  │
  │  │  → Hoạt động với Streaming (mỗi chunk!)            │  │
  │  │  → Styles TRƯỚC content = không FOUC!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │    │                                                       │
  │    ▼                                                       │
  │  BƯỚC 3: Client Component Wrapper                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Wrap toàn bộ app trong Root Layout!                 │  │
  │  │                                                      │  │
  │  │  // app/layout.tsx                                    │  │
  │  │  <StyledRegistry>{children}</StyledRegistry>          │  │
  │  │                                                      │  │
  │  │  → 'use client' → chạy trên cả server + client!   │  │
  │  │  → Top-level wrap = hiệu quả nhất!                 │  │
  │  │  → Extract CSS 1 lần, không re-generate!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW TỔNG THỂ:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ SSR Request                                          │  │
  │  │   ↓                                                  │  │
  │  │ Registry COLLECT CSS từ tất cả components            │  │
  │  │   ↓                                                  │  │
  │  │ useServerInsertedHTML INJECT vào <head>               │  │
  │  │   ↓                                                  │  │
  │  │ HTML + CSS gửi cho browser (streaming!)              │  │
  │  │   ↓                                                  │  │
  │  │ Hydration → CSS-in-JS library take over              │  │
  │  │   ↓                                                  │  │
  │  │ Dynamic styles inject bình thường (client-side)      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. styled-jsx — Built-in Solution!

```
  STYLED-JSX — NEXT.JS BUILT-IN:
  ┌──────────────────────────────────────────────────────────┐
  │ → Tích hợp sẵn trong Next.js!                          │
  │ → Scoped CSS = chỉ ảnh hưởng component hiện tại!      │
  │ → Yêu cầu v5.1.0+ cho App Router!                     │
  └──────────────────────────────────────────────────────────┘
```

**Bước 1: Tạo Registry (app/registry.tsx):**

```typescript
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { StyleRegistry, createStyleRegistry } from 'styled-jsx'

export default function StyledJsxRegistry({
  children,
}: { children: React.ReactNode }) {
  // Lazy init → tạo registry 1 lần duy nhất!
  const [jsxStyleRegistry] = useState(() => createStyleRegistry())

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles()
    jsxStyleRegistry.flush()  // Clear sau khi inject!
    return <>{styles}</>
  })

  return (
    <StyleRegistry registry={jsxStyleRegistry}>
      {children}
    </StyleRegistry>
  )
}
```

**Bước 2: Wrap Root Layout (app/layout.tsx):**

```typescript
import StyledJsxRegistry from './registry'

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  )
}
```

```
  PHÂN TÍCH FLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ createStyleRegistry()                                    │
  │   │ → Tạo registry object (thu thập CSS)               │
  │   ▼                                                       │
  │ <StyleRegistry> wrap children                              │
  │   │ → Mọi styled-jsx CSS trong children → registry     │
  │   ▼                                                       │
  │ useServerInsertedHTML callback                             │
  │   │ → jsxStyleRegistry.styles() = lấy CSS đã collect   │
  │   │ → jsxStyleRegistry.flush() = CLEAR (tránh duplicate)│
  │   │ → return <>{styles}</> = inject vào <head>         │
  │   ▼                                                       │
  │ Browser nhận HTML → CSS đã inject → no FOUC!            │
  │                                                          │
  │ FOUC = Flash Of Unstyled Content                          │
  │ → Khi CSS chưa load → user thấy nội dung chưa style!  │
  │ → useServerInsertedHTML NGĂN CHẶN FOUC!                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. styled-components — Setup Chi Tiết!

```
  STYLED-COMPONENTS — 3 BƯỚC:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① Enable trong next.config.js (compiler flag!)           │
  │ ② Tạo Registry component (Client Component!)            │
  │ ③ Wrap Root Layout                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

**Bước 1: next.config.js**

```javascript
module.exports = {
  compiler: {
    styledComponents: true, // Enable SWC transform!
  },
};
```

```
  TẠI SAO CẦN compiler flag?
  ┌──────────────────────────────────────────────────────────┐
  │ → Next.js SWC compiler optimize styled-components!     │
  │ → Tạo unique class names (deterministic!)              │
  │ → Smaller bundle size!                                  │
  │ → Better debugging (displayName!)                      │
  │ → SSR support tự động!                                 │
  └──────────────────────────────────────────────────────────┘
```

**Bước 2: Registry (app/lib/registry.tsx):**

```typescript
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({
  children,
}: { children: React.ReactNode }) {
  const [styledComponentsStyleSheet] = useState(
    () => new ServerStyleSheet()
  )

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  // Client-side: KHÔNG cần StyleSheetManager!
  if (typeof window !== 'undefined') return <>{children}</>

  // Server-side: wrap với StyleSheetManager!
  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  )
}
```

**Bước 3: Root Layout (app/layout.tsx):**

```typescript
import StyledComponentsRegistry from './lib/registry'

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
```

```
  PHÂN TÍCH FLOW CHI TIẾT:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  SERVER-SIDE:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ServerStyleSheet = collector chuyên dụng!            │  │
  │  │   ↓                                                  │  │
  │  │ StyleSheetManager wrap children                      │  │
  │  │   → Mọi styled() call → CSS ghi vào sheet!         │  │
  │  │   ↓                                                  │  │
  │  │ useServerInsertedHTML:                                │  │
  │  │   → getStyleElement() = lấy <style> elements!       │  │
  │  │   → clearTag() = CLEAR (tránh duplicate khi stream!)│  │
  │  │   → Inject vào <head>!                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CLIENT-SIDE:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ typeof window !== 'undefined' → return {children}    │  │
  │  │   → KHÔNG cần StyleSheetManager trên client!        │  │
  │  │   → styled-components tự inject CSS bình thường!    │  │
  │  │   → Dynamic styles (hover, active) hoạt động!       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STREAMING:                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Chunk 1 → collect CSS → inject → send              │  │
  │  │ Chunk 2 → collect CSS → APPEND → send              │  │
  │  │ Chunk 3 → collect CSS → APPEND → send              │  │
  │  │ Hydration complete → styled-components take over!   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. SSR Streaming & Style Flushing!

```
  STREAMING + CSS-IN-JS = TRICKY:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Streaming gửi HTML TỪNG PHẦN!                   │
  │  → CSS phải SẴN SÀNG cho mỗi phần!                      │
  │  → Không thể chờ render XONG rồi mới inject CSS!        │
  │                                                            │
  │  GIẢI PHÁP: useServerInsertedHTML                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  Stream chunk 1:                                     │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │ <head>                                         │  │  │
  │  │  │   <style>.btn-a1b2 { color: red; }</style>     │  │  │
  │  │  │ </head>                                        │  │  │
  │  │  │ <body>                                         │  │  │
  │  │  │   <nav class="btn-a1b2">...</nav>              │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │  → CSS cho nav ĐÃ CÓ trước khi nav hiển thị!      │  │
  │  │                                                      │  │
  │  │  Stream chunk 2:                                     │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │   <style>.card-x3y4 { padding: 16px; }</style> │  │  │
  │  │  │   <div class="card-x3y4">...</div>             │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │  → CSS cho card APPEND thêm, không đè!             │  │
  │  │                                                      │  │
  │  │  Hydration complete:                                 │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │ styled-components / styled-jsx TAKE OVER!      │  │  │
  │  │  │ → Dynamic styles inject bình thường!           │  │  │
  │  │  │ → Hover, active, theme changes → client-side!  │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TẠI SAO CLIENT COMPONENT Ở TOP-LEVEL?                    │
  │  → Extract CSS rules 1 lần = HIỆU QUẢ!                  │
  │  → Tránh re-generate styles ở server renders sau!        │
  │  → Không gửi styles trong Server Component payload!      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. 13 Libraries Được Hỗ Trợ!

```
  LIBRARIES HỖ TRỢ APP ROUTER:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ✅ HOẠT ĐỘNG (13 libraries):                           │
  │  ┌────────────────────────┬─────────────────────────┐    │
  │  │ Library                │ Loại                    │    │
  │  ├────────────────────────┼─────────────────────────┤    │
  │  │ ant-design             │ Component library + CSS │    │
  │  │ chakra-ui              │ Component library       │    │
  │  │ @fluentui/react        │ Microsoft Design System │    │
  │  │ kuma-ui                │ Zero-runtime CSS-in-JS  │    │
  │  │ @mui/material          │ Material Design         │    │
  │  │ @mui/joy               │ Joy UI (MUI)            │    │
  │  │ pandacss               │ Build-time CSS-in-JS    │    │
  │  │ styled-jsx             │ Next.js built-in!       │    │
  │  │ styled-components      │ Runtime CSS-in-JS       │    │
  │  │ stylex                 │ Meta/Facebook           │    │
  │  │ tamagui                │ Universal UI            │    │
  │  │ tss-react              │ TypeScript Stylesheets  │    │
  │  │ vanilla-extract        │ Zero-runtime            │    │
  │  └────────────────────────┴─────────────────────────┘    │
  │                                                          │
  │  ⏳ ĐANG PHÁT TRIỂN (1 library):                         │
  │  ┌────────────────────────┬─────────────────────────┐    │
  │  │ emotion                │ Đang thêm support       │    │
  │  └────────────────────────┴─────────────────────────┘    │
  │                                                          │
  │  PHÂN LOẠI:                                              │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Runtime CSS-in-JS:                               │    │
  │  │  → styled-components, styled-jsx, emotion        │    │
  │  │  → Tạo CSS tại RUNTIME → cần Registry!          │    │
  │  │                                                  │    │
  │  │ Zero-runtime CSS-in-JS:                          │    │
  │  │  → vanilla-extract, pandacss, kuma-ui, stylex    │    │
  │  │  → Tạo CSS tại BUILD TIME → no Registry!        │    │
  │  │  → Performance tốt hơn!                         │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — CSSInJSEngine!

```javascript
var CSSInJSEngine = (function () {
  // ═══════════════════════════════════
  // 1. STYLE REGISTRY (thu thập CSS)
  // ═══════════════════════════════════
  var styleRules = [];
  var classCounter = 0;

  function generateClassName(prefix) {
    classCounter++;
    return (
      (prefix || "sc") +
      "-" +
      classCounter.toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  function registerStyle(css) {
    var className = generateClassName();
    styleRules.push({
      className: className,
      css: "." + className + " { " + css + " }",
    });
    return className;
  }

  // ═══════════════════════════════════
  // 2. SERVER STYLE SHEET
  // ═══════════════════════════════════
  function getStyleElements() {
    if (styleRules.length === 0) return "";
    var css = styleRules
      .map(function (r) {
        return r.css;
      })
      .join("\n");
    return '<style data-css-in-js="true">' + css + "</style>";
  }

  function flush() {
    var count = styleRules.length;
    styleRules = [];
    return count;
  }

  // ═══════════════════════════════════
  // 3. STYLED FUNCTION (như styled.div)
  // ═══════════════════════════════════
  function styled(tag, templateCSS, props) {
    var css = templateCSS;
    if (typeof templateCSS === "function") {
      css = templateCSS(props || {});
    }
    var className = registerStyle(css);
    return {
      tag: tag,
      className: className,
      html:
        "<" +
        tag +
        ' class="' +
        className +
        '">' +
        ((props && props.children) || "") +
        "</" +
        tag +
        ">",
    };
  }

  // ═══════════════════════════════════
  // 4. useServerInsertedHTML SIM
  // ═══════════════════════════════════
  function serverInsertedHTML() {
    var styles = getStyleElements();
    var flushed = flush();
    console.log("  📋 Collected " + flushed + " rules → injected into <head>");
    return styles;
  }

  // ═══════════════════════════════════
  // 5. STREAMING SIMULATION
  // ═══════════════════════════════════
  function simulateStreaming() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CSS-IN-JS STREAMING DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    // Chunk 1: Navbar
    console.log("\n── Stream Chunk 1: Navbar ──");
    var nav = styled("nav", "display: flex; gap: 16px; background: #1a1a2e;");
    console.log("  Created: " + nav.html);
    var chunk1Styles = serverInsertedHTML();
    console.log("  Styles: " + chunk1Styles);

    // Chunk 2: Hero section
    console.log("\n── Stream Chunk 2: Hero ──");
    var hero = styled("section", "padding: 64px; text-align: center;");
    var btn = styled(
      "button",
      function (p) {
        return (
          "padding: 12px 24px; background: " +
          (p.primary ? "#e94560" : "#533483") +
          ";"
        );
      },
      { primary: true, children: "Click me" },
    );
    console.log("  Created: " + hero.html);
    console.log("  Created: " + btn.html);
    var chunk2Styles = serverInsertedHTML();
    console.log("  Styles (appended): " + chunk2Styles);

    // Chunk 3: Footer
    console.log("\n── Stream Chunk 3: Footer ──");
    var footer = styled("footer", "padding: 32px; border-top: 1px solid #333;");
    console.log("  Created: " + footer.html);
    var chunk3Styles = serverInsertedHTML();
    console.log("  Styles (appended): " + chunk3Styles);

    console.log("\n── Hydration Complete ──");
    console.log("  CSS-in-JS library takes over!");
    console.log("  Dynamic styles now handled client-side.");
    console.log("  Total classes generated: " + classCounter);
  }

  return { demo: simulateStreaming };
})();
// Chạy: CSSInJSEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: 3 bước cấu hình CSS-in-JS trong App Router là gì?

<details><summary>Đáp án</summary>

1. **Style Registry** — Tạo object thu thập (collect) TẤT CẢ CSS rules sinh ra trong render pass. Dùng `useState(() => new Sheet())` (lazy init, tạo 1 lần).

2. **`useServerInsertedHTML` hook** — Inject CSS rules vào HTML TRƯỚC content sử dụng chúng. Hook này chạy đúng thời điểm trong SSR và hoạt động với Streaming. Sau khi inject → `flush()` để tránh duplicate.

3. **Client Component wrapper** — Component 'use client' ở top-level (Root Layout) wrap toàn bộ app. Hiệu quả nhất vì extract CSS 1 lần, tránh re-generate, và không gửi styles trong Server Component payload.

</details>

---

**Câu 2**: Tại sao styled-components Registry kiểm tra `typeof window !== 'undefined'`?

<details><summary>Đáp án</summary>

```typescript
if (typeof window !== 'undefined') return <>{children}</>
```

- **Server-side** (`window === undefined`): Cần `StyleSheetManager` để thu thập CSS vào `ServerStyleSheet` → inject vào HTML response.
- **Client-side** (`window !== undefined`): Styled-components tự hoạt động bình thường (inject CSS vào DOM, handle dynamic styles). `StyleSheetManager` KHÔNG CẦN THIẾT và chỉ gây overhead.

Đây là pattern phổ biến: **server needs registry, client doesn't.**

</details>

---

**Câu 3**: Runtime vs Zero-runtime CSS-in-JS — khác nhau thế nào?

<details><summary>Đáp án</summary>

|                    | Runtime                                | Zero-runtime                               |
| ------------------ | -------------------------------------- | ------------------------------------------ |
| **Tạo CSS khi?**   | Runtime (render)                       | Build time                                 |
| **Registry cần?**  | ✅ CẦN (SSR)                           | ❌ Không cần                               |
| **Dynamic styles** | ✅ Mạnh (props-based)                  | ⚠️ Hạn chế                                 |
| **Performance**    | Chậm hơn (generate CSS mỗi render)     | Nhanh hơn (CSS đã có sẵn)                  |
| **Bundle size**    | Lớn hơn (runtime library)              | Nhỏ hơn (chỉ CSS output)                   |
| **Ví dụ**          | styled-components, styled-jsx, emotion | vanilla-extract, pandacss, stylex, kuma-ui |

Zero-runtime = CSS được extract tại build time → output là file `.css` thông thường → **KHÔNG CẦN** JavaScript runtime để tạo CSS.

</details>

---

**Câu 4**: useServerInsertedHTML hoạt động thế nào với Streaming?

<details><summary>Đáp án</summary>

Streaming gửi HTML **từng chunk**. Với mỗi chunk:

1. Components trong chunk render → CSS-in-JS collect CSS rules
2. `useServerInsertedHTML` callback chạy → lấy CSS đã collect
3. CSS inject vào HTML **TRƯỚC** content của chunk
4. `flush()` clear registry → tránh duplicate ở chunk sau
5. Chunk gửi cho browser (CSS + content cùng lúc)

Khi hydration hoàn tất: CSS-in-JS library **take over** — dynamic styles (hover, theme change) được handle client-side bình thường.

**Key insight**: Mỗi chunk có CSS riêng, APPEND (không đè) vào CSS trước đó → không FOUC!

</details>
