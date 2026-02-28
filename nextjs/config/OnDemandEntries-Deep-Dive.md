# onDemandEntries — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/onDemandEntries
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. onDemandEntries Là Gì?

```
  onDemandEntries — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Quản lý pages trong MEMORY khi DEV! ★★★                │
  │  → Dispose pages không dùng → giải phóng RAM! ★           │
  │  → Chỉ ảnh hưởng development mode! ★★★                   │
  │                                                              │
  │  2 OPTIONS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  maxInactiveAge: 25 * 1000 (25 seconds) ★             │    │
  │  │  → Thời gian giữ page trong buffer! ★★★              │    │
  │  │  → Sau 25s không truy cập → DISPOSE! ★               │    │
  │  │                                                       │    │
  │  │  pagesBufferLength: 2 ★                                │    │
  │  │  → Số pages giữ đồng thời KHÔNG bị dispose! ★★★    │    │
  │  │  → Dù hết maxInactiveAge! ★                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Visit /page-a → compile + keep in memory ★          │    │
  │  │  Visit /page-b → compile + keep in memory ★          │    │
  │  │  Visit /page-c → compile + keep in memory ★          │    │
  │  │                                                       │    │
  │  │  ┌── Buffer: [page-a, page-b, page-c] ──┐             │    │
  │  │  │ pagesBufferLength = 2                  │             │    │
  │  │  │ page-a inactive > 25s?                 │             │    │
  │  │  │ → YES → DISPOSE page-a! ★★★           │             │    │
  │  │  │ Buffer: [page-b, page-c] ★            │             │    │
  │  │  └────────────────────────────────────────┘             │    │
  │  │                                                       │    │
  │  │  Re-visit /page-a → RE-COMPILE! ★                    │    │
  │  │  (đã bị disposed nên phải compile lại)                │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    onDemandEntries: {                                  │    │
  │  │      maxInactiveAge: 25 * 1000, ← 25s (default) ★    │    │
  │  │      pagesBufferLength: 2       ← 2 pages (default)★ │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — OnDemandEntriesEngine!

```javascript
var OnDemandEntriesEngine = (function () {
  // ═══════════════════════════════════
  // 1. PAGE BUFFER MANAGER
  // ═══════════════════════════════════
  var buffer = {}; // path → { compiledAt, lastAccessed }

  function accessPage(path, config) {
    var maxAge = (config && config.maxInactiveAge) || 25000;
    var bufferLen = (config && config.pagesBufferLength) || 2;
    var now = Date.now();

    // Compile or refresh
    if (!buffer[path]) {
      buffer[path] = { compiledAt: now, lastAccessed: now };
    } else {
      buffer[path].lastAccessed = now;
    }

    // Dispose old entries
    var paths = Object.keys(buffer);
    var active = paths.sort(function (a, b) {
      return buffer[b].lastAccessed - buffer[a].lastAccessed;
    });

    var disposed = [];
    for (var i = 0; i < active.length; i++) {
      var age = now - buffer[active[i]].lastAccessed;
      if (i >= bufferLen && age > maxAge) {
        disposed.push(active[i]);
        delete buffer[active[i]];
      }
    }

    return {
      accessed: path,
      inBuffer: Object.keys(buffer),
      disposed: disposed,
      bufferSize: Object.keys(buffer).length,
    };
  }

  function getStatus() {
    var result = {};
    for (var path in buffer) {
      result[path] = {
        age: Date.now() - buffer[path].lastAccessed + "ms",
        compiledAt: buffer[path].compiledAt,
      };
    }
    return result;
  }

  // ═══════════════════════════════════
  // 2. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ OnDemandEntries Engine ═══");
    buffer = {}; // reset

    var config = { maxInactiveAge: 100, pagesBufferLength: 2 };

    console.log("\n── 1. Visit pages ──");
    console.log(accessPage("/home", config));
    console.log(accessPage("/about", config));
    console.log(accessPage("/blog", config));

    console.log("\n── 2. Status ──");
    console.log(getStatus());

    console.log("\n── 3. Re-access keeps alive ──");
    console.log(accessPage("/home", config));
  }

  return { demo: demo };
})();
// Chạy: OnDemandEntriesEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: onDemandEntries dùng làm gì?                            │
  │  → Quản lý compiled pages trong memory (dev)! ★★★         │
  │  → Dispose pages không dùng → tiết kiệm RAM! ★           │
  │                                                              │
  │  ❓ 2: maxInactiveAge?                                         │
  │  → Thời gian (ms) giữ page trong buffer! ★★★              │
  │  → Default: 25000 (25 seconds)! ★                          │
  │  → Hết thời gian + ngoài buffer → dispose! ★              │
  │                                                              │
  │  ❓ 3: pagesBufferLength?                                      │
  │  → Số pages giữ đồng thời! ★★★                           │
  │  → Default: 2! ★                                           │
  │  → Pages trong buffer KHÔNG bị dispose! ★★★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
