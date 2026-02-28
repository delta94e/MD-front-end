# isolatedDevBuild — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/isolatedDevBuild
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **⚠️ EXPERIMENTAL — default TRUE từ v16!**

---

## §1. isolatedDevBuild Là Gì?

```
  isolatedDevBuild — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Tách dev + prod build thành KHÁC directory! ★★★         │
  │  → Dev server → .next/dev (thay vì .next)! ★★★            │
  │  → Tránh conflict khi chạy dev + build cùng lúc! ★        │
  │  → Mặc định: TRUE (bật)! ★★★                              │
  │                                                              │
  │  VẤN ĐỀ (KHÔNG có isolatedDevBuild):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Terminal 1: next dev                                  │    │
  │  │  → Ghi vào .next/  ★                                 │    │
  │  │                                                       │    │
  │  │  Terminal 2: next build (AI agent, CI...)              │    │
  │  │  → CŨNG ghi vào .next/  ★★★                         │    │
  │  │                                                       │    │
  │  │  → CONFLICT! ★★★                                      │    │
  │  │  → Dev server bị ảnh hưởng! ★★★                      │    │
  │  │  → Files ghi đè lẫn nhau! ★                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP (isolatedDevBuild: true — DEFAULT):                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Terminal 1: next dev                                  │    │
  │  │  → Ghi vào .next/dev/  ★★★ (TÁCH RIÊNG!)            │    │
  │  │                                                       │    │
  │  │  Terminal 2: next build                                │    │
  │  │  → Ghi vào .next/  ★                                 │    │
  │  │                                                       │    │
  │  │  → NO CONFLICT! ★★★                                   │    │
  │  │  → Dev server KHÔNG bị ảnh hưởng! ★★★                │    │
  │  │                                                       │    │
  │  │  .next/                                                │    │
  │  │  ├── dev/     ← next dev output! ★                   │    │
  │  │  │   ├── cache/                                       │    │
  │  │  │   ├── server/                                      │    │
  │  │  │   └── ...                                          │    │
  │  │  ├── cache/   ← next build output! ★                 │    │
  │  │  ├── server/                                          │    │
  │  │  └── ...                                              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG (opt out):                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                  │    │
  │  │    experimental: {                                     │    │
  │  │      isolatedDevBuild: false  ← tắt (default true)   │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  USE CASE:                                                    │
  │  → AI agents chạy next build validate! ★★★                │
  │  → CI tools chạy build song song! ★                       │
  │  → Multiple developers cùng machine! ★                    │
  │                                                              │
  │  VERSION: v16.0.0! ★                                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — IsolatedDevBuildEngine!

```javascript
var IsolatedDevBuildEngine = (function () {
  // ═══════════════════════════════════
  // 1. OUTPUT DIR RESOLVER
  // ═══════════════════════════════════
  function resolveOutputDir(command, isolated) {
    var base = ".next";
    if (command === "dev" && isolated) {
      return {
        command: command,
        outputDir: base + "/dev",
        isolated: true,
        note: "Dev output SEPARATED! No conflicts! ★★★",
      };
    }
    return {
      command: command,
      outputDir: base,
      isolated: false,
      note:
        command === "dev"
          ? "Dev + build share .next/ → CONFLICT RISK! ★★★"
          : "Production build in .next/ ★",
    };
  }

  // ═══════════════════════════════════
  // 2. CONFLICT DETECTOR
  // ═══════════════════════════════════
  function detectConflict(processes, isolated) {
    var devRunning = processes.indexOf("dev") >= 0;
    var buildRunning = processes.indexOf("build") >= 0;

    if (devRunning && buildRunning) {
      return {
        processes: processes,
        conflict: !isolated,
        note: isolated
          ? "SAFE! dev → .next/dev, build → .next/ ★★★"
          : "CONFLICT! Both write to .next/ ★★★",
      };
    }
    return { processes: processes, conflict: false, note: "No conflict ★" };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ IsolatedDevBuild Engine ═══");

    console.log("\n── 1. Output Dirs ──");
    console.log(resolveOutputDir("dev", true));
    console.log(resolveOutputDir("dev", false));
    console.log(resolveOutputDir("build", true));

    console.log("\n── 2. Conflict Detection ──");
    console.log(detectConflict(["dev", "build"], true));
    console.log(detectConflict(["dev", "build"], false));
    console.log(detectConflict(["dev"], true));
  }

  return { demo: demo };
})();
// Chạy: IsolatedDevBuildEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: isolatedDevBuild dùng làm gì?                           │
  │  → Tách dev output vào .next/dev! ★★★                     │
  │  → Tránh conflict với next build! ★                        │
  │  → Default: TRUE từ v16! ★★★                              │
  │                                                              │
  │  ❓ 2: Khi nào hữu ích?                                       │
  │  → AI agents chạy next build validate! ★★★                │
  │  → CI tools build song song với dev! ★                    │
  │  → Không phải restart dev server! ★                        │
  │                                                              │
  │  ❓ 3: Directory structure?                                    │
  │  → .next/dev/ ← next dev! ★                               │
  │  → .next/ ← next build! ★                                 │
  │  → Tách riêng, không ghi đè! ★★★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
