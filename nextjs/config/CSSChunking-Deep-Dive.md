# cssChunking — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/cssChunking
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Status**: Experimental (`experimental.cssChunking`)!

---

## §1. cssChunking Là Gì?

```
  cssChunking — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Chiến lược CHIA NHỎ CSS files thành chunks! ★★★        │
  │  → Chỉ load CSS CẦN THIẾT cho route hiện tại! ★           │
  │  → Thay vì load TẤT CẢ CSS cùng lúc! ★                   │
  │  → Cải thiện performance! ★                                │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig = {                                  │    │
  │  │    experimental: {                                     │    │
  │  │      cssChunking: true  ← default! ★★★                │    │
  │  │    }                                                   │    │
  │  │  } satisfies NextConfig                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW (true — mặc định):                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  a.css ─┐                                              │    │
  │  │  b.css ─┤→ MERGE → chunk-1.css ★ (ít request hơn!)   │    │
  │  │  c.css ─┘                                              │    │
  │  │                                                       │    │
  │  │  Route /home  → load chunk-1.css! ★                   │    │
  │  │  Route /about → load chunk-2.css! ★                   │    │
  │  │  → Chỉ CSS cần thiết! ★★★                            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 3 Options!

```
  OPTIONS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────┬──────────────────────────────────────────┐  │
  │  │ Value         │ Hành vi                                  │  │
  │  ├─────────────┼──────────────────────────────────────────┤  │
  │  │ true          │ MERGE CSS files! ★★★                     │  │
  │  │ (default)     │ → Tối ưu: ít chunks, ít requests! ★   │  │
  │  │              │ → Xác định dependencies từ import! ★   │  │
  │  │              │ → RECOMMENDED! ★★★                      │  │
  │  ├─────────────┼──────────────────────────────────────────┤  │
  │  │ false         │ KHÔNG merge, KHÔNG re-order! ★            │  │
  │  │              │ → Mỗi CSS file = 1 request! ★           │  │
  │  │              │ → Nhiều requests hơn! ★                  │  │
  │  ├─────────────┼──────────────────────────────────────────┤  │
  │  │ 'strict'      │ Load đúng THỨ TỰ import! ★★★            │  │
  │  │              │ → Không merge! Không re-order! ★        │  │
  │  │              │ → Nhiều chunks + requests hơn! ★        │  │
  │  │              │ → Dùng khi CSS có dependencies! ★★★     │  │
  │  └─────────────┴──────────────────────────────────────────┘  │
  │                                                              │
  │  SO SÁNH MERGE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  true (merge):                                         │    │
  │  │  a.css + b.css + c.css → 1 chunk! ★ (ít request!)    │    │
  │  │                                                       │    │
  │  │  false (no merge):                                     │    │
  │  │  a.css → request 1                                     │    │
  │  │  b.css → request 2                                     │    │
  │  │  c.css → request 3  (3 requests!) ★                   │    │
  │  │                                                       │    │
  │  │  'strict' (order preserved):                           │    │
  │  │  a.css → request 1 (PHẢI trước b.css!) ★★★           │    │
  │  │  b.css → request 2                                     │    │
  │  │  c.css → request 3  (đúng thứ tự!) ★                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Khi Nào Dùng 'strict'?

```
  KHI NÀO STRICT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ VỚI true (merge):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // File X:                                            │    │
  │  │  import 'a.css'  // a TRƯỚC b! ★                      │    │
  │  │  import 'b.css'                                        │    │
  │  │                                                       │    │
  │  │  // File Y:                                            │    │
  │  │  import 'b.css'  // b TRƯỚC a! ★                      │    │
  │  │  import 'a.css'                                        │    │
  │  │                                                       │    │
  │  │  → true merge: THỨ TỰ BẤT KỲ! ★★★                   │    │
  │  │  → Nếu b.css DEPENDS on a.css → BUG! ★★★             │    │
  │  │  → CSS specificity bị sai! ★★★                       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: 'strict'! ★★★                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  'strict': load a.css TRƯỚC b.css! ★★★                │    │
  │  │  → Đúng thứ tự import! ★                             │    │
  │  │  → Nhiều requests hơn nhưng ĐÚNG! ★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ CSS DEPENDENCY:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  /* a.css — base styles */                             │    │
  │  │  .btn { padding: 10px; background: blue; }            │    │
  │  │                                                       │    │
  │  │  /* b.css — overrides — DEPENDS on a.css! */           │    │
  │  │  .btn { background: red; }  ← override! ★            │    │
  │  │                                                       │    │
  │  │  Nếu b.css load TRƯỚC a.css → btn = blue! BUG! ★★★  │    │
  │  │  Nếu a.css load TRƯỚC b.css → btn = red! ĐÚNG! ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — CSSChunkingEngine!

```javascript
var CSSChunkingEngine = (function () {
  // ═══════════════════════════════════
  // 1. CSS FILE SIMULATOR
  // ═══════════════════════════════════
  function createCSSFile(name, content, size) {
    return { name: name, content: content, size: size || content.length };
  }

  // ═══════════════════════════════════
  // 2. CHUNKING STRATEGIES
  // ═══════════════════════════════════
  function chunkCSS(files, mode) {
    if (mode === true || mode === undefined) {
      // MERGE: combine into fewer chunks
      var merged = [];
      var currentChunk = { name: "chunk-1.css", files: [], totalSize: 0 };
      for (var i = 0; i < files.length; i++) {
        currentChunk.files.push(files[i].name);
        currentChunk.totalSize += files[i].size;
      }
      merged.push(currentChunk);

      return {
        mode: "true (merge)",
        chunks: merged,
        requests: merged.length,
        note: "MERGED! Fewest requests! ★★★",
      };
    }

    if (mode === false) {
      // NO MERGE: each file = 1 chunk
      var chunks = files.map(function (f, idx) {
        return { name: f.name, files: [f.name], totalSize: f.size };
      });

      return {
        mode: "false (no merge)",
        chunks: chunks,
        requests: chunks.length,
        note: "NO merge! " + chunks.length + " requests! ★",
      };
    }

    if (mode === "strict") {
      // STRICT: preserve import order, no merge
      var strictChunks = files.map(function (f, idx) {
        return {
          name: f.name,
          files: [f.name],
          totalSize: f.size,
          order: idx + 1,
        };
      });

      return {
        mode: "'strict' (order preserved)",
        chunks: strictChunks,
        requests: strictChunks.length,
        orderGuaranteed: true,
        note: "STRICT order! " + strictChunks.length + " requests! ★★★",
      };
    }
  }

  // ═══════════════════════════════════
  // 3. DEPENDENCY CHECKER
  // ═══════════════════════════════════
  function checkCSSOrder(imports1, imports2) {
    // Check if same files imported in different order
    var conflicts = [];
    for (var i = 0; i < imports1.length; i++) {
      for (var j = 0; j < imports2.length; j++) {
        if (imports1[i] === imports2[j]) {
          var idx1 = i;
          var idx2 = j;
          // Find if relative order differs
          for (var k = i + 1; k < imports1.length; k++) {
            for (var l = 0; l < j; l++) {
              if (imports1[k] === imports2[l]) {
                conflicts.push({
                  file1Order: imports1[i] + " → " + imports1[k],
                  file2Order: imports2[l] + " → " + imports2[j],
                  issue: "Different import order! ★★★",
                });
              }
            }
          }
        }
      }
    }

    if (conflicts.length > 0) {
      return {
        hasConflicts: true,
        conflicts: conflicts,
        recommendation: "Use cssChunking: 'strict'! ★★★",
      };
    }
    return {
      hasConflicts: false,
      recommendation: "cssChunking: true is fine! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CSSChunking Engine ═══");

    var files = [
      createCSSFile("reset.css", "* { margin: 0; }", 200),
      createCSSFile("base.css", ".btn { padding: 10px; }", 500),
      createCSSFile("theme.css", ".btn { background: red; }", 300),
    ];

    console.log("\n── 1. Chunking Modes ──");
    console.log("true:", chunkCSS(files, true));
    console.log("false:", chunkCSS(files, false));
    console.log("strict:", chunkCSS(files, "strict"));

    console.log("\n── 2. Dependency Check ──");
    console.log(
      "Same order:",
      checkCSSOrder(["a.css", "b.css", "c.css"], ["a.css", "b.css", "c.css"]),
    );
    console.log(
      "Different order:",
      checkCSSOrder(["a.css", "b.css"], ["b.css", "a.css"]),
    );
  }

  return { demo: demo };
})();
// Chạy: CSSChunkingEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cssChunking có mấy options?                             │
  │  → 3: true (merge, mặc định), false (no merge),            │
  │    'strict' (preserve order)! ★★★                           │
  │                                                              │
  │  ❓ 2: true vs 'strict'?                                       │
  │  → true: MERGE CSS, ít requests, NHANH hơn! ★★★           │
  │  → 'strict': giữ THỨ TỰ import, nhiều requests! ★        │
  │  → true có thể gây BUG nếu CSS phụ thuộc thứ tự! ★★★    │
  │                                                              │
  │  ❓ 3: Khi nào dùng 'strict'?                                  │
  │  → CSS files PHỤTHUỘC nhau (override specificity)! ★★★   │
  │  → Import order KHÁC NHAU ở file khác nhau! ★              │
  │  → Thấy CSS behavior bất ngờ! ★                           │
  │                                                              │
  │  ❓ 4: Recommend nào?                                          │
  │  → true cho hầu hết apps! Ít requests + tốt hiệu năng! ★ │
  │  → 'strict' chỉ khi có CSS dependency issues! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
