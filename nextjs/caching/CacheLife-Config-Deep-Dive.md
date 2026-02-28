# cacheLife (Config) — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Yêu cầu**: `cacheComponents: true`!

---

## §1. cacheLife (Config) Là Gì?

```
  cacheLife (CONFIG) — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Định nghĩa CUSTOM CACHE PROFILES! ★★★                   │
  │  → Dùng trong next.config.js! ★                             │
  │  → Để cacheLife() function tham chiếu! ★                   │
  │  → Trong phạm vi 'use cache' directive! ★                  │
  │                                                              │
  │  PIPELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① next.config.js:                                     │    │
  │  │     Định nghĩa profile 'blog' { stale, revalidate,   │    │
  │  │                                  expire }! ★           │    │
  │  │                     ↓                                  │    │
  │  │  ② Component/Function:                                 │    │
  │  │     'use cache'                                        │    │
  │  │     cacheLife('blog')  ← tham chiếu profile! ★★★     │    │
  │  │                     ↓                                  │    │
  │  │  ③ Next.js cache system:                               │    │
  │  │     Apply stale/revalidate/expire rules! ★            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Hình + Usage!

```
  CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.ts                                    │    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig: NextConfig = {                     │    │
  │  │    cacheComponents: true,  ← BẮT BUỘC! ★★★           │    │
  │  │    cacheLife: {                                        │    │
  │  │      blog: {                                           │    │
  │  │        stale: 3600,      // 1 giờ! ★                  │    │
  │  │        revalidate: 900,  // 15 phút! ★                │    │
  │  │        expire: 86400,    // 1 ngày! ★                 │    │
  │  │      }                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SỬ DỤNG TRONG CODE:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import { cacheLife } from 'next/cache'               │    │
  │  │                                                       │    │
  │  │  export async function getCachedData() {               │    │
  │  │    'use cache'            ← directive! ★               │    │
  │  │    cacheLife('blog')      ← profile name! ★★★         │    │
  │  │    const data = await fetch('/api/data')              │    │
  │  │    return data                                         │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. 3 Properties — stale · revalidate · expire!

```
  3 PROPERTIES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────┬─────────┬────────────────────────────────┐   │
  │  │ Property     │ Type     │ Mô tả                          │   │
  │  ├────────────┼─────────┼────────────────────────────────┤   │
  │  │ stale        │ number   │ Thời gian (giây) client cache  │   │
  │  │              │ (seconds)│ KHÔNG cần check server! ★★★   │   │
  │  │              │          │ → Serve stale content! ★       │   │
  │  ├────────────┼─────────┼────────────────────────────────┤   │
  │  │ revalidate   │ number   │ Thời gian (giây) server       │   │
  │  │              │ (seconds)│ revalidate cache! ★★★          │   │
  │  │              │          │ → Check fresh data! ★          │   │
  │  ├────────────┼─────────┼────────────────────────────────┤   │
  │  │ expire       │ number   │ Thời gian (giây) tối đa! ★    │   │
  │  │              │ (seconds)│ → Entry bị XÓA! ★★★            │   │
  │  │              │          │ → Phải >= stale! ★              │   │
  │  └────────────┴─────────┴────────────────────────────────┘   │
  │                                                              │
  │  TIMELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  t=0        t=stale    t=revalidate    t=expire       │    │
  │  │  │           │           │               │             │    │
  │  │  ├───────────┤           │               │             │    │
  │  │  │ FRESH!    │           │               │             │    │
  │  │  │ Serve     │           │               │             │    │
  │  │  │ instantly ├───────────┤               │             │    │
  │  │  │ ★         │ STALE!    │               │             │    │
  │  │  │           │ Serve old ├───────────────┤             │    │
  │  │  │           │ + check   │ REVALIDATE!   │             │    │
  │  │  │           │ server ★ │ Must refetch ★│             │    │
  │  │  │           │           │               │ DELETE! ★★★ │    │
  │  │  │           │           │               │ Entry gone! │    │
  │  │  ▼           ▼           ▼               ▼             │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: blog { stale: 3600, revalidate: 900, expire: 86400 }│
  │  → 0-15m: server revalidate! ★                              │
  │  → 0-1h: client dùng cached (stale)! ★                     │
  │  → 1h+: phải refetch! ★                                    │
  │  → 24h: entry bị xóa hoàn toàn! ★★★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Ví Dụ Profiles!

```
  CÁC PROFILE PHỔ BIẾN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────┬──────────┬────────────┬──────────────────┐   │
  │  │ Profile      │ stale     │ revalidate  │ expire            │   │
  │  ├────────────┼──────────┼────────────┼──────────────────┤   │
  │  │ realtime     │ 0         │ 0           │ 30 (30s)         │   │
  │  │ dashboard    │ 60        │ 30          │ 300 (5m)         │   │
  │  │ blog         │ 3600      │ 900         │ 86400 (1d)       │   │
  │  │ static       │ 86400     │ 3600        │ 604800 (7d)      │   │
  │  │ immutable    │ 31536000  │ 31536000    │ 31536000 (1y)    │   │
  │  └────────────┴──────────┴────────────┴──────────────────┘   │
  │                                                              │
  │  GIẢI THÍCH:                                                   │
  │  → realtime: KHÔNG cache! Fresh mỗi request! ★             │
  │  → dashboard: stale 1m, revalidate 30s! ★                  │
  │  → blog: stale 1h, revalidate 15m, expire 1 ngày! ★       │
  │  → static: stale 1 ngày, expire 1 tuần! ★                 │
  │  → immutable: cache 1 năm! Build hash files! ★★★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — CacheLifeEngine!

```javascript
var CacheLifeEngine = (function () {
  // ═══════════════════════════════════
  // 1. PROFILE REGISTRY
  // ═══════════════════════════════════
  var profiles = {};

  function defineProfile(name, config) {
    // Validate
    var errors = [];
    if (typeof config.stale !== "number" || config.stale < 0) {
      errors.push("stale phải là number >= 0! ★");
    }
    if (typeof config.revalidate !== "number" || config.revalidate < 0) {
      errors.push("revalidate phải là number >= 0! ★");
    }
    if (typeof config.expire !== "number" || config.expire < 0) {
      errors.push("expire phải là number >= 0! ★");
    }
    if (config.expire < config.stale) {
      errors.push("expire PHẢI >= stale! ★★★");
    }

    if (errors.length > 0) {
      return { name: name, valid: false, errors: errors };
    }

    profiles[name] = {
      stale: config.stale,
      revalidate: config.revalidate,
      expire: config.expire,
    };
    return { name: name, valid: true, profile: profiles[name] };
  }

  // ═══════════════════════════════════
  // 2. CACHE SIMULATOR
  // ═══════════════════════════════════
  var cache = {};

  function cacheSet(key, value, profileName) {
    var profile = profiles[profileName];
    if (!profile) {
      return { error: "Profile '" + profileName + "' not found! ★" };
    }

    cache[key] = {
      value: value,
      profile: profileName,
      createdAt: Date.now(),
      staleUntil: Date.now() + profile.stale * 1000,
      revalidateAfter: Date.now() + profile.revalidate * 1000,
      expireAt: Date.now() + profile.expire * 1000,
    };
    return {
      key: key,
      profile: profileName,
      note: "Cached with profile '" + profileName + "'! ★",
    };
  }

  function cacheGet(key) {
    var entry = cache[key];
    if (!entry) {
      return { status: "MISS", note: "Not in cache! ★" };
    }

    var now = Date.now();
    var age = Math.round((now - entry.createdAt) / 1000);

    // Expired
    if (now > entry.expireAt) {
      delete cache[key];
      return {
        status: "EXPIRED",
        age: age + "s",
        note: "Cache DELETED! Past expire time! ★★★",
      };
    }

    // Needs revalidation
    if (now > entry.revalidateAfter) {
      return {
        status: "REVALIDATE",
        value: entry.value,
        age: age + "s",
        note: "Serve stale + trigger background revalidate! ★★★",
      };
    }

    // Stale but within window
    if (now > entry.staleUntil) {
      return {
        status: "STALE",
        value: entry.value,
        age: age + "s",
        note: "Stale content, consider revalidate! ★",
      };
    }

    // Fresh
    return {
      status: "FRESH",
      value: entry.value,
      age: age + "s",
      note: "Fresh! Serve instantly! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. TIMELINE VISUALIZER
  // ═══════════════════════════════════
  function visualize(profileName) {
    var profile = profiles[profileName];
    if (!profile) {
      return { error: "Profile not found!" };
    }

    var total = profile.expire;
    var barLen = 50;

    function toBar(seconds) {
      return Math.round((seconds / total) * barLen);
    }

    var stalePos = toBar(profile.stale);
    var revalPos = toBar(profile.revalidate);
    var expirePos = barLen;

    var bar = "";
    for (var i = 0; i < barLen; i++) {
      if (i < Math.min(stalePos, revalPos))
        bar += "█"; // fresh
      else if (i < Math.max(stalePos, revalPos))
        bar += "▓"; // stale
      else bar += "░"; // revalidate needed
    }

    return {
      profile: profileName,
      config: profile,
      timeline: bar,
      legend: {
        "█": "FRESH (0-" + Math.min(profile.stale, profile.revalidate) + "s)",
        "▓": "STALE (serve old + background check)",
        "░": "MUST REVALIDATE / EXPIRE",
      },
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheLife Engine ═══");

    console.log("\n── 1. Define Profiles ──");
    console.log(
      defineProfile("realtime", { stale: 0, revalidate: 0, expire: 30 }),
    );
    console.log(
      defineProfile("blog", { stale: 3600, revalidate: 900, expire: 86400 }),
    );
    console.log(
      defineProfile("static", {
        stale: 86400,
        revalidate: 3600,
        expire: 604800,
      }),
    );

    // Invalid
    console.log(
      defineProfile("bad", { stale: 100, revalidate: 50, expire: 10 }),
    );

    console.log("\n── 2. Cache Operations ──");
    console.log(cacheSet("post-1", { title: "Hello" }, "blog"));
    console.log(cacheGet("post-1"));
    console.log(cacheGet("missing-key"));

    console.log("\n── 3. Timeline ──");
    console.log(visualize("blog"));
    console.log(visualize("static"));
    console.log(visualize("realtime"));
  }

  return { demo: demo };
})();
// Chạy: CacheLifeEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cacheLife config dùng làm gì?                           │
  │  → Định nghĩa CUSTOM CACHE PROFILES! ★                     │
  │  → { stale, revalidate, expire } (seconds)! ★★★           │
  │  → Tham chiếu qua cacheLife('profileName')! ★              │
  │  → Cần cacheComponents: true! ★★★                         │
  │                                                              │
  │  ❓ 2: stale vs revalidate vs expire?                          │
  │  → stale: client serve old content! ★                       │
  │  → revalidate: server check fresh data! ★                  │
  │  → expire: entry bị XÓA hoàn toàn! ★★★                   │
  │  → expire PHẢI >= stale! ★                                  │
  │                                                              │
  │  ❓ 3: Pipeline hoạt động thế nào?                             │
  │  → ① Config: định nghĩa profile (next.config.js)! ★       │
  │  → ② Code: 'use cache' + cacheLife('blog')! ★             │
  │  → ③ Runtime: Next.js apply stale/revalidate/expire! ★    │
  │                                                              │
  │  ❓ 4: Khi nào dùng profile nào?                               │
  │  → realtime: dashboard, stock prices! ★                    │
  │  → blog: content thay đổi ít! ★                            │
  │  → static: docs, marketing pages! ★                        │
  │  → immutable: build artifacts! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
