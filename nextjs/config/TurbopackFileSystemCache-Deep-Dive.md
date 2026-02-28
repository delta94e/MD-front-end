# turbopackFileSystemCache — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. turbopackFileSystemCache Là Gì?

```
  turbopackFileSystemCache — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Persist Turbopack cache vào .next folder! ★★★          │
  │  → Giữ cache giữa các lần dev/build! ★★★                 │
  │  → Tăng tốc subsequent builds + dev sessions! ★★★        │
  │                                                              │
  │  STATUS:                                                      │
  │  → Dev (turbopackFileSystemCacheForDev): STABLE! ★★★      │
  │  → Build (turbopackFileSystemCacheForBuild): EXPERIMENTAL!★ │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                  │    │
  │  │    experimental: {                                     │    │
  │  │      turbopackFileSystemCacheForDev: true,  ★★★       │    │
  │  │      turbopackFileSystemCacheForBuild: true ★          │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HOW IT WORKS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Lần 1 (next dev):                                    │    │
  │  │  Source files → Turbopack compile → Build output      │    │
  │  │                       ↓                                │    │
  │  │              Save cache to .next/ ★★★                 │    │
  │  │                                                       │    │
  │  │  Lần 2 (next dev):                                    │    │
  │  │  Source files → Check .next/ cache ★★★                │    │
  │  │       ↓                    ↓                           │    │
  │  │  Changed?              Unchanged?                      │    │
  │  │  Recompile             Restore from cache! ★★★        │    │
  │  │  (chỉ files changed)   (instant!) ★★★                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VERSION HISTORY:                                             │
  │  → v15.5.0: introduced ★                                  │
  │  → v16.0.0: stable for dev ★                              │
  │  → v16.1.0: latest ★                                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — TurbopackFSCacheEngine!

```javascript
var TurbopackFSCacheEngine = (function () {
  // ═══════════════════════════════════
  // 1. FILE SYSTEM CACHE
  // ═══════════════════════════════════
  var cache = {}; // simulate .next/ folder
  var stats = { hits: 0, misses: 0, saves: 0 };

  function save(moduleId, hash, result) {
    cache[moduleId] = { hash: hash, result: result, savedAt: Date.now() };
    stats.saves++;
    return { saved: moduleId, note: "Saved to .next/ cache ★" };
  }

  function restore(moduleId, currentHash) {
    var entry = cache[moduleId];
    if (entry && entry.hash === currentHash) {
      stats.hits++;
      return {
        moduleId: moduleId,
        cached: true,
        note: "Cache HIT! Restored from .next/ ★★★",
      };
    }
    stats.misses++;
    return {
      moduleId: moduleId,
      cached: false,
      note: "Cache MISS! Recompile ★",
    };
  }

  // ═══════════════════════════════════
  // 2. BUILD SIMULATOR
  // ═══════════════════════════════════
  function build(modules, cacheEnabled) {
    var compiled = 0;
    var restored = 0;

    for (var i = 0; i < modules.length; i++) {
      var mod = modules[i];
      if (cacheEnabled) {
        var result = restore(mod.id, mod.hash);
        if (result.cached) {
          restored++;
          continue;
        }
      }
      // Compile and save
      compiled++;
      if (cacheEnabled) {
        save(mod.id, mod.hash, "compiled-output");
      }
    }

    return {
      total: modules.length,
      compiled: compiled,
      restored: restored,
      cacheEnabled: cacheEnabled,
      speedup:
        restored > 0
          ? Math.round((restored / modules.length) * 100) + "% faster ★★★"
          : "No speedup (first build) ★",
      stats: { hits: stats.hits, misses: stats.misses, saves: stats.saves },
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TurbopackFSCache Engine ═══");

    var modules = [
      { id: "page.tsx", hash: "abc123" },
      { id: "layout.tsx", hash: "def456" },
      { id: "utils.ts", hash: "ghi789" },
      { id: "api.ts", hash: "jkl012" },
    ];

    console.log("\n── 1. First build (no cache) ──");
    console.log(build(modules, true));

    console.log("\n── 2. Second build (cached!) ──");
    console.log(build(modules, true));

    console.log("\n── 3. Third build (1 file changed) ──");
    modules[0].hash = "changed!";
    console.log(build(modules, true));
  }

  return { demo: demo };
})();
// Chạy: TurbopackFSCacheEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: turbopackFileSystemCache dùng làm gì?                  │
  │  → Persist Turbopack cache vào .next/! ★★★                │
  │  → Giữ cache giữa các lần dev/build! ★                   │
  │  → Subsequent builds nhanh hơn! ★★★                      │
  │                                                              │
  │  ❓ 2: 2 options?                                              │
  │  → turbopackFileSystemCacheForDev: STABLE! ★★★            │
  │  → turbopackFileSystemCacheForBuild: EXPERIMENTAL! ★      │
  │  → Cả 2 trong experimental config! ★                     │
  │                                                              │
  │  ❓ 3: Cache hoạt động thế nào?                                │
  │  → Lần 1: compile + save cache! ★                        │
  │  → Lần 2: check hash, unchanged → restore! ★★★          │
  │  → Changed files → chỉ recompile changed! ★★★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
