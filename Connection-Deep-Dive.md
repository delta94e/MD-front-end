# connection() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/connection
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v15.0.0-RC → v15.0.0 (stable!)

---

## §1. connection() Là Gì?

```
  connection() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → BÁO cho Next.js: "CHỜ user request trước khi render!" ★  │
  │  → Biến component từ STATIC → DYNAMIC rendering! ★          │
  │  → Khi bạn KHÔNG dùng Dynamic APIs (cookies, headers...)    │
  │    nhưng VẪN muốn dynamic render! ★                         │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { connection } from 'next/server'                    │
  │                                                              │
  │  TYPE:                                                        │
  │  function connection(): Promise<void>                        │
  │  → Không nhận params! ★                                      │
  │  → Return void Promise! ★                                   │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  KHÔNG CÓ connection():                                │    │
  │  │  ┌────────────────────────────────────┐               │    │
  │  │  │ Math.random() = 0.42              │               │    │
  │  │  │ → Build time! → Static! ★          │               │    │
  │  │  │ → Mỗi user thấy CÙNG SỐ! ❌       │               │    │
  │  │  └────────────────────────────────────┘               │    │
  │  │                                                       │    │
  │  │  CÓ connection():                                      │    │
  │  │  ┌────────────────────────────────────┐               │    │
  │  │  │ await connection()                  │               │    │
  │  │  │ Math.random() = ???                 │               │    │
  │  │  │ → Runtime! → Dynamic! ★             │               │    │
  │  │  │ → Mỗi user thấy SỐ KHÁC! ✅        │               │    │
  │  │  └────────────────────────────────────┘               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO CẦN:                                                 │
  │  → Math.random() ★                                           │
  │  → new Date() ★                                              │
  │  → Crypto randomness ★                                      │
  │  → Bất kỳ external info muốn THAY ĐỔI mỗi request! ★      │
  │  → Mà KHÔNG dùng cookies()/headers()! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Example + "Good to Know"!

```
  EXAMPLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import { connection } from 'next/server'                    │
  │                                                              │
  │  export default async function Page() {                       │
  │    await connection()                                        │
  │    // ↑ "Đợi user request!" ★                                 │
  │    // ↓ Mọi thứ bên dưới EXCLUDED from prerendering! ★       │
  │                                                              │
  │    const rand = Math.random()                                │
  │    return <span>{rand}</span>                                │
  │  }                                                           │
  │                                                              │
  │  TIMELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Build time: Page KHÔNG prerender! → placeholder! ★   │    │
  │  │ Runtime: User request → connection() resolves        │    │
  │  │   → Math.random() chạy → render → gửi response! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  "GOOD TO KNOW":
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① connection() THAY THẾ unstable_noStore! ★                  │
  │  → Tên mới, API mới, cùng mục đích! ★                       │
  │  → Align tốt hơn với tương lai Next.js! ★                   │
  │                                                              │
  │  ② Chỉ CẦN khi:                                               │
  │  → Dynamic rendering REQUIRED! ★                             │
  │  → Nhưng KHÔNG dùng Dynamic APIs! ★                          │
  │  → Nếu đã dùng cookies()/headers() → KHÔNG CẦN! ★          │
  │                                                              │
  │  DECISION TREE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Cần dynamic render?                                   │    │
  │  │   │                                                   │    │
  │  │   ├── CÓ dùng cookies()/headers()? → KHÔNG cần! ✅  │    │
  │  │   │                                                   │    │
  │  │   └── KHÔNG dùng Dynamic APIs?                        │    │
  │  │         → DÙNG connection()! ★                        │    │
  │  │         → Math.random(), new Date()... ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. So Sánh: connection() vs Dynamic APIs vs 'use cache'!

```
  SO SÁNH:
  ┌────────────────┬────────────────────────────────────────────┐
  │ API            │ Mục đích                                   │
  ├────────────────┼────────────────────────────────────────────┤
  │ cookies()      │ Đọc cookies → AUTO dynamic! ★              │
  │ headers()      │ Đọc headers → AUTO dynamic! ★              │
  │ searchParams   │ Đọc query → AUTO dynamic! ★                │
  │ connection()   │ FORCE dynamic! Không đọc gì! ★             │
  │ unstable_      │ OLD API → DEPRECATED! ★                    │
  │   noStore      │ Dùng connection() thay thế! ★              │
  └────────────────┴────────────────────────────────────────────┘

  RENDERING DECISION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Component code:                                              │
  │  ┌────────────────────────────────────────┐                  │
  │  │ Có Dynamic API?                        │                  │
  │  │ (cookies/headers/searchParams)         │                  │
  │  │   YES → DYNAMIC rendering! ★ (auto!)  │                  │
  │  │   NO  → Có connection()?               │                  │
  │  │           YES → DYNAMIC rendering! ★  │                  │
  │  │           NO  → STATIC rendering! ★    │                  │
  │  │                 (prerender at build!)  │                  │
  │  └────────────────────────────────────────┘                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — ConnectionEngine!

```javascript
var ConnectionEngine = (function () {
  // ═══════════════════════════════════
  // 1. RENDERING MODE DETECTOR
  // ═══════════════════════════════════
  function detectRenderingMode(componentInfo) {
    var hasDynamicAPIs =
      componentInfo.usesCookies ||
      componentInfo.usesHeaders ||
      componentInfo.usesSearchParams;

    if (hasDynamicAPIs) {
      return {
        mode: "DYNAMIC",
        reason: "Dùng Dynamic APIs → auto dynamic! ★",
        needsConnection: false,
      };
    }

    if (componentInfo.usesConnection) {
      return {
        mode: "DYNAMIC",
        reason: "connection() → force dynamic! ★",
        needsConnection: true,
      };
    }

    if (componentInfo.usesMathRandom || componentInfo.usesNewDate) {
      return {
        mode: "STATIC",
        reason:
          "⚠️ Math.random()/Date() chạy tại BUILD TIME! " +
          "Cần thêm connection()! ★",
        needsConnection: true,
        warning: "Mỗi user sẽ thấy CÙNG giá trị! ❌",
      };
    }

    return {
      mode: "STATIC",
      reason: "Không có dynamic logic → static prerender! ★",
      needsConnection: false,
    };
  }

  // ═══════════════════════════════════
  // 2. connection() SIMULATOR
  // ═══════════════════════════════════
  function simulateConnection() {
    return {
      status: "resolved",
      effect: "Rendering CHỜ user request! → Excluded from prerendering! ★",
      afterConnection: {
        mathRandom: "Mỗi request = số KHÁC! ✅",
        newDate: "Mỗi request = thời gian THỰC! ✅",
      },
    };
  }

  // ═══════════════════════════════════
  // 3. MIGRATION ADVISOR
  // ═══════════════════════════════════
  function migrateFromNoStore(code) {
    if (code.indexOf("unstable_noStore") !== -1) {
      return {
        needsMigration: true,
        from: "import { unstable_noStore } from 'next/cache'",
        to: "import { connection } from 'next/server'",
        callFrom: "unstable_noStore()",
        callTo: "await connection()",
        note: "connection() là async! Phải await! ★",
      };
    }
    return { needsMigration: false };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Connection Engine ═══");

    console.log("\n── Detect Mode ──");
    console.log("With cookies:", detectRenderingMode({ usesCookies: true }));
    console.log(
      "With connection:",
      detectRenderingMode({ usesConnection: true }),
    );
    console.log(
      "Math.random no conn:",
      detectRenderingMode({ usesMathRandom: true }),
    );
    console.log("Pure static:", detectRenderingMode({}));

    console.log("\n── Simulate ──");
    console.log(simulateConnection());

    console.log("\n── Migration ──");
    console.log(migrateFromNoStore("unstable_noStore()"));
    console.log(migrateFromNoStore("connection()"));
  }

  return { demo: demo };
})();
// Chạy: ConnectionEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: connection() dùng để làm gì?                            │
  │  → Force DYNAMIC rendering! ★                                │
  │  → Khi KHÔNG dùng Dynamic APIs (cookies/headers)! ★         │
  │  → Nhưng VẪN muốn render tại runtime! ★                     │
  │  → Ví dụ: Math.random(), new Date()! ★                      │
  │                                                              │
  │  ❓ 2: connection() khác cookies()/headers() gì?               │
  │  → cookies()/headers() → đọc data + auto dynamic! ★         │
  │  → connection() → KHÔNG đọc gì, chỉ FORCE dynamic! ★       │
  │  → Nếu đã dùng cookies() → KHÔNG CẦN connection()! ★       │
  │                                                              │
  │  ❓ 3: connection() thay thế API nào?                          │
  │  → Thay thế unstable_noStore! ★                              │
  │  → Tên mới align với tương lai Next.js! ★                   │
  │  → unstable_noStore() → await connection()! ★               │
  │                                                              │
  │  ❓ 4: connection() return gì?                                 │
  │  → Promise<void>! ★                                         │
  │  → PHẢI await! ★                                             │
  │  → Không nhận params, không return data! ★                  │
  │                                                              │
  │  ❓ 5: Không dùng connection() với Math.random() — sao?       │
  │  → Math.random() chạy tại BUILD TIME! ★                     │
  │  → Kết quả ĐÓNG CỨNG trong static HTML! ★                   │
  │  → MỌI user thấy CÙNG SỐ! ❌                                │
  │  → Thêm connection() → mỗi request số MỚI! ✅              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
