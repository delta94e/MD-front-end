# cacheLife() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/cacheLife
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks + tables!
> **Requires**: `cacheComponents: true` trong next.config.js!

---

## §1. cacheLife() Là Gì?

```
  cacheLife() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Set CACHE LIFETIME cho function/component! ★               │
  │  → Dùng cùng 'use cache' directive! ★                        │
  │  → Kiểm soát bao lâu cache SỐNG! ★                          │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { cacheLife } from 'next/cache'                      │
  │                                                              │
  │  SETUP (next.config.js):                                      │
  │  { cacheComponents: true }  ← BẮT BUỘC bật! ★               │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  'use cache'                                          │    │
  │  │  cacheLife('days')  ← Chọn profile! ★                 │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  3 TIMING PROPERTIES:                                  │    │
  │  │  ┌─────────────────────────────────────────────┐      │    │
  │  │  │ stale     = Client dùng cache bao lâu! ★    │      │    │
  │  │  │ revalidate = Server refresh sau bao lâu! ★  │      │    │
  │  │  │ expire     = Cache chết sau bao lâu! ★      │      │    │
  │  │  └─────────────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  "Good to know":                                               │
  │  → cacheLife PHẢI ở TRONG function được cache! ★              │
  │  → Kể cả khi 'use cache' ở file level! ★                     │
  │  → Chỉ 1 cacheLife() chạy / invocation! ★                    │
  │  → Có thể có nhiều nhánh, nhưng chỉ 1 chạy! ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 3 Timing Properties — stale, revalidate, expire!

```
  3 TIMING PROPERTIES — TIMELINE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TIME ──────────────────────────────────────────────────→    │
  │                                                              │
  │  ├── stale ──┤── revalidate ──────────┤── expire ──────┤    │
  │  │           │                        │                │    │
  │  │ Client    │ Server background      │ Cache CHẾT!    │    │
  │  │ dùng      │ refresh! (ISR-like!)   │ Phải chờ       │    │
  │  │ cache     │ Serve cached + regen   │ fresh content!  │    │
  │  │ NGAY!     │ in background! ★       │ (sync!) ★      │    │
  │  │ Không     │                        │                │    │
  │  │ request!  │                        │                │    │
  │                                                              │
  │  ★ stale (client-side):                                       │
  │  → Client-side router cache duration! ★                      │
  │  → Trong thời gian này: NO NETWORK REQUEST! ★                │
  │  → Instant page loads từ client cache! ★                     │
  │  → Default: 5 phút (staleTimes config!) ★                   │
  │  → Gửi qua header: x-nextjs-stale-time! ★                  │
  │  → MINIMUM 30 giây! (prefetch links!) ★                     │
  │                                                              │
  │  ★ revalidate (server-side):                                  │
  │  → Sau bao lâu server regenerate background! ★               │
  │  → Giống ISR (Incremental Static Regeneration!) ★            │
  │  → Serve cached → regen background → update cache! ★         │
  │  → Default: 15 phút! ★                                      │
  │                                                              │
  │  ★ expire (maximum lifetime!):                                │
  │  → Cache CHẾT hoàn toàn sau thời gian này! ★                 │
  │  → Nếu không có traffic → sync regenerate! ★                │
  │  → PHẢI > revalidate! (else → ERROR!) ★★★                   │
  │  → Default: never expires! ★                                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  STALE vs REVALIDATE vs EXPIRE — SO SÁNH:
  ┌──────────────┬────────────┬────────────┬──────────────────┐
  │              │ stale      │ revalidate │ expire           │
  ├──────────────┼────────────┼────────────┼──────────────────┤
  │ Ở đâu?      │ CLIENT ★   │ SERVER ★   │ SERVER ★         │
  │ Loại         │ Router     │ Background │ Hard delete! ★   │
  │              │ cache!     │ refresh!   │                  │
  │ Hết hạn?     │ Check      │ Regen      │ Wait fresh! ★   │
  │              │ server!    │ background!│ (blocking!)      │
  │ Default      │ 5 min      │ 15 min     │ never            │
  │ Header       │ x-nextjs-  │ N/A        │ N/A              │
  │              │ stale-time │            │                  │
  └──────────────┴────────────┴────────────┴──────────────────┘
```

---

## §3. Preset Cache Profiles!

```
  7 PRESET PROFILES:
  ┌──────────────┬──────────┬────────────┬──────────┬──────────┐
  │ Profile      │ stale    │ revalidate │ expire   │ Use Case │
  ├──────────────┼──────────┼────────────┼──────────┼──────────┤
  │ "default"    │ 5 min    │ 15 min     │ never    │ Mặc định │
  │ "seconds"    │ 0        │ 1 s        │ 60 s     │ Stock!   │
  │ "minutes"    │ 5 min    │ 1 min      │ 1 hour   │ News!    │
  │ "hours"      │ 5 min    │ 1 hour     │ 1 day    │ Product! │
  │ "days"       │ 5 min    │ 1 day      │ 1 week   │ Blog!    │
  │ "weeks"      │ 5 min    │ 1 week     │ 1 month  │ Podcast! │
  │ "max"        │ 5 min    │ 1 month    │ never    │ Legal!   │
  └──────────────┴──────────┴────────────┴──────────┴──────────┘

  CHỌN PROFILE:
  ┌──────────────────────────────────────────────────────────────┐
  │  "seconds"  → Real-time! Stock prices, live scores! ★       │
  │  "minutes"  → Social feeds, breaking news! ★                │
  │  "hours"    → Product inventory, weather! ★                 │
  │  "days"     → Blog posts, articles! ★                       │
  │  "weeks"    → Podcasts, newsletters! ★                      │
  │  "max"      → Legal pages, archived content! ★              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Custom + Override + Inline Profiles!

```
  3 CÁCH CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① CUSTOM PROFILES (next.config.ts): ★                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ cacheLife: {                                          │    │
  │  │   biweekly: {                                         │    │
  │  │     stale: 60*60*24*14,    // 14 days                 │    │
  │  │     revalidate: 60*60*24,  // 1 day                   │    │
  │  │     expire: 60*60*24*14,   // 14 days                 │    │
  │  │   },                                                  │    │
  │  │   editorial: {                                        │    │
  │  │     stale: 600,            // 10 min                  │    │
  │  │     revalidate: 3600,      // 1 hour                  │    │
  │  │     expire: 86400,         // 1 day                   │    │
  │  │   },                                                  │    │
  │  │ }                                                     │    │
  │  │ → Dùng: cacheLife('biweekly') ★                       │    │
  │  │ → Props bỏ trống → inherit "default"! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② OVERRIDE PRESETS (next.config.ts): ★                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ cacheLife: {                                          │    │
  │  │   days: {    // Override "days" preset!                │    │
  │  │     stale: 3600,           // 1 hour (was 5 min!)     │    │
  │  │     revalidate: 900,       // 15 min (was 1 day!)     │    │
  │  │     expire: 86400,         // 1 day (was 1 week!)     │    │
  │  │   },                                                  │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ INLINE PROFILES (one-off!): ★                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ cacheLife({                                           │    │
  │  │   stale: 3600,                                        │    │
  │  │   revalidate: 900,                                    │    │
  │  │   expire: 86400,                                      │    │
  │  │ })                                                    │    │
  │  │ → Chỉ apply cho function/component ĐÓ! ★             │    │
  │  │ → cacheLife({}) = "default" profile! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Client Router Cache + Nested + Conditional!

```
  CLIENT ROUTER CACHE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  stale → KHÔNG phải Cache-Control header! ★★★                │
  │  → Kiểm soát CLIENT router cache! ★                         │
  │  → Gửi qua: x-nextjs-stale-time header! ★                  │
  │  → Minimum 30 giây (prefetch usability!) ★                  │
  │                                                              │
  │  REVALIDATION FUNCTIONS → XÓA CLIENT CACHE NGAY! ★           │
  │  → revalidateTag() → clear! ★                               │
  │  → revalidatePath() → clear! ★                              │
  │  → updateTag() → clear! ★                                   │
  │  → refresh() → clear! ★                                     │
  │  → Bypass stale time! ★                                     │
  │                                                              │
  │  stale (cacheLife) vs staleTimes (config):                    │
  │  → staleTimes: GLOBAL cho tất cả routes! ★                  │
  │  → cacheLife: PER-FUNCTION / PER-ROUTE! ★                   │
  │  → staleTimes.static → default profile's stale! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  NESTED CACHING — 2 TRƯỜNG HỢP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÓ explicit outer cacheLife:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Dashboard ('use cache', cacheLife('hours'))            │    │
  │  │   └── Widget ('use cache', cacheLife('minutes'))      │    │
  │  │                                                       │    │
  │  │ → Dashboard DÙNG 'hours'! ★                           │    │
  │  │ → Widget bên trong BỊ IGNORE! ★                       │    │
  │  │ → Explicit cacheLife LUÔN THẮNG! ★★★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÔNG explicit outer cacheLife:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Dashboard ('use cache', NO cacheLife)                 │    │
  │  │   └── Widget ('use cache', cacheLife('minutes'))      │    │
  │  │                                                       │    │
  │  │ → Dashboard default = 15 min!                         │    │
  │  │ → Widget = 5 min (shorter!) → ĐÈ default! ★          │    │
  │  │ → Dashboard → 5 min! (shorter wins!) ★                │    │
  │  │                                                       │    │
  │  │ → Nếu Widget = 1 hour (longer!)?                      │    │
  │  │ → Dashboard VẪN 15 min! (default cap!) ★              │    │
  │  │ → Shorter inner ĐÈ! Longer inner KHÔNG! ★★★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → KHUYẾN NGHỊ: LUÔN explicit cacheLife! ★★★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  CONDITIONAL CACHE LIFETIMES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  async function getPostContent(slug) {                        │
  │    'use cache'                                                │
  │    const post = await fetchPost(slug)                        │
  │    cacheTag(`post-${slug}`)                                  │
  │                                                              │
  │    if (!post) {                                               │
  │      cacheLife('minutes')  ← Draft/missing! ★                │
  │      return null                                             │
  │    }                                                         │
  │                                                              │
  │    cacheLife('days')  ← Published! ★                         │
  │    return post.data                                          │
  │  }                                                           │
  │                                                              │
  │  → Chỉ 1 cacheLife CHẠY mỗi invocation! ★                   │
  │  → Different outcomes = different lifetimes! ★               │
  │                                                              │
  │  DYNAMIC LIFETIME TỪ DATA:                                    │
  │  cacheLife({                                                  │
  │    revalidate: post.revalidateSeconds ?? 3600                │
  │  })                                                          │
  │  → Đọc giá trị từ CMS! ★                                    │
  │  → stale + expire inherit "default"! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — CacheLifeEngine!

```javascript
var CacheLifeEngine = (function () {
  // ═══════════════════════════════════
  // 1. PRESET PROFILES
  // ═══════════════════════════════════
  var PRESETS = {
    default: { stale: 300, revalidate: 900, expire: Infinity },
    seconds: { stale: 0, revalidate: 1, expire: 60 },
    minutes: { stale: 300, revalidate: 60, expire: 3600 },
    hours: { stale: 300, revalidate: 3600, expire: 86400 },
    days: { stale: 300, revalidate: 86400, expire: 604800 },
    weeks: { stale: 300, revalidate: 604800, expire: 2592000 },
    max: { stale: 300, revalidate: 2592000, expire: Infinity },
  };

  // ═══════════════════════════════════
  // 2. RESOLVE PROFILE
  // ═══════════════════════════════════
  function resolveProfile(input, customProfiles) {
    customProfiles = customProfiles || {};

    // String = preset or custom profile name
    if (typeof input === "string") {
      if (customProfiles[input]) {
        var custom = customProfiles[input];
        return mergeWithDefault(custom);
      }
      if (PRESETS[input]) return Object.assign({}, PRESETS[input]);
      return { error: "Unknown profile: " + input + "!" };
    }

    // Object = inline profile
    if (typeof input === "object") {
      return mergeWithDefault(input);
    }

    // No input = default
    return Object.assign({}, PRESETS["default"]);
  }

  function mergeWithDefault(profile) {
    var def = PRESETS["default"];
    return {
      stale: profile.stale !== undefined ? profile.stale : def.stale,
      revalidate:
        profile.revalidate !== undefined ? profile.revalidate : def.revalidate,
      expire: profile.expire !== undefined ? profile.expire : def.expire,
    };
  }

  // ═══════════════════════════════════
  // 3. VALIDATOR
  // ═══════════════════════════════════
  function validateProfile(profile) {
    var errors = [];
    if (profile.expire !== Infinity && profile.revalidate > profile.expire) {
      errors.push(
        "expire (" +
          profile.expire +
          "s) PHẢI > revalidate (" +
          profile.revalidate +
          "s)! ★",
      );
    }
    if (profile.stale < 0) errors.push("stale không thể < 0!");
    if (profile.revalidate < 0) errors.push("revalidate không thể < 0!");

    // Minimum stale = 30s (client router cache)
    var effectiveStale = Math.max(profile.stale, 30);

    return {
      valid: errors.length === 0,
      errors: errors,
      effectiveStale: effectiveStale,
      note:
        profile.stale < 30
          ? "stale tăng lên 30s (minimum cho prefetch!) ★"
          : null,
    };
  }

  // ═══════════════════════════════════
  // 4. NESTED CACHE RESOLVER
  // ═══════════════════════════════════
  function resolveNested(outerProfile, innerProfile, outerExplicit) {
    if (outerExplicit) {
      return {
        result: outerProfile,
        reason: "Outer có explicit cacheLife → DÙNG outer! ★",
        innerIgnored: true,
      };
    }

    // No explicit outer = default, inner can REDUCE but not EXTEND
    var def = PRESETS["default"];
    var effective = Object.assign({}, def);

    if (innerProfile.revalidate < def.revalidate) {
      effective.revalidate = innerProfile.revalidate;
    }

    return {
      result: effective,
      reason:
        innerProfile.revalidate < def.revalidate
          ? "Inner shorter (" + innerProfile.revalidate + "s) → ĐÈ default! ★"
          : "Inner longer → KHÔNG ĐÈ! Default giữ nguyên! ★",
      innerIgnored: false,
    };
  }

  // ═══════════════════════════════════
  // 5. CACHE STATE CHECKER
  // ═══════════════════════════════════
  function getCacheState(profile, elapsedSeconds, isClientSide) {
    if (isClientSide) {
      var effectiveStale = Math.max(profile.stale, 30);
      if (elapsedSeconds < effectiveStale) {
        return {
          state: "FRESH",
          action: "Dùng client cache NGAY! Không request! ✅",
        };
      }
      return { state: "STALE", action: "Check server! ★" };
    }

    // Server-side
    if (elapsedSeconds < profile.revalidate) {
      return { state: "FRESH", action: "Serve cached! ✅" };
    }
    if (profile.expire !== Infinity && elapsedSeconds >= profile.expire) {
      return {
        state: "EXPIRED",
        action: "CHẾT! Phải regenerate sync! ❌ Blocking!",
      };
    }
    return {
      state: "STALE",
      action: "Serve cached + regen background! (ISR!) ★",
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheLife Engine ═══");

    console.log("\n── Resolve Profiles ──");
    console.log("'days':", resolveProfile("days"));
    console.log("'seconds':", resolveProfile("seconds"));
    console.log("inline:", resolveProfile({ revalidate: 3600 }));
    console.log(
      "custom:",
      resolveProfile("editorial", {
        editorial: { stale: 600, revalidate: 3600, expire: 86400 },
      }),
    );

    console.log("\n── Validate ──");
    console.log(
      "OK:",
      validateProfile({ stale: 300, revalidate: 900, expire: 3600 }),
    );
    console.log(
      "BAD:",
      validateProfile({ stale: 300, revalidate: 3600, expire: 900 }),
    );
    console.log(
      "Low stale:",
      validateProfile({ stale: 5, revalidate: 60, expire: 3600 }),
    );

    console.log("\n── Nested ──");
    console.log(
      "Explicit outer:",
      resolveNested(PRESETS["hours"], PRESETS["minutes"], true),
    );
    console.log(
      "No explicit, inner shorter:",
      resolveNested(PRESETS["default"], PRESETS["minutes"], false),
    );
    console.log(
      "No explicit, inner longer:",
      resolveNested(PRESETS["default"], PRESETS["hours"], false),
    );

    console.log("\n── Cache State ──");
    var profile = PRESETS["days"];
    console.log("Client 60s:", getCacheState(profile, 60, true));
    console.log("Client 600s:", getCacheState(profile, 600, true));
    console.log("Server 100s:", getCacheState(profile, 100, false));
    console.log("Server 100000s:", getCacheState(profile, 100000, false));
    console.log("Server 700000s:", getCacheState(profile, 700000, false));
  }

  return { demo: demo };
})();
// Chạy: CacheLifeEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: stale vs revalidate vs expire — khác gì?                │
  │  → stale: CLIENT cache duration (no network!) ★              │
  │  → revalidate: SERVER background refresh (ISR!) ★            │
  │  → expire: Cache CHẾT hoàn toàn (blocking regen!) ★         │
  │  → expire PHẢI > revalidate! ★★★                             │
  │                                                              │
  │  ❓ 2: Preset profiles có bao nhiêu? Kể tên!                  │
  │  → 7 profiles: default, seconds, minutes, hours,             │
  │    days, weeks, max! ★                                       │
  │  → Chọn theo tần suất content thay đổi! ★                   │
  │                                                              │
  │  ❓ 3: Nested caching — outer vs inner?                        │
  │  → CÓ explicit outer → outer WINS! Inner IGNORED! ★★★       │
  │  → KHÔNG explicit → default (15 min)!                        │
  │  → Inner shorter → ĐÈ default! ★                            │
  │  → Inner longer → KHÔNG ĐÈ! Default giữ nguyên! ★          │
  │  → ALWAYS set explicit cacheLife! ★★★                        │
  │                                                              │
  │  ❓ 4: stale có minimum bao nhiêu?                             │
  │  → MINIMUM 30 GIÂY! ★ (client router cache!)                 │
  │  → Đảm bảo prefetched links usable! ★                       │
  │  → Gửi qua header: x-nextjs-stale-time! ★                  │
  │                                                              │
  │  ❓ 5: Conditional cache lifetime — cách nào?                  │
  │  → Gọi cacheLife() ở DIFFERENT BRANCHES! ★                   │
  │  → Chỉ 1 CHẠY per invocation! ★                              │
  │  → Ví dụ: draft → 'minutes', published → 'days'! ★          │
  │  → Dynamic: cacheLife({ revalidate: post.ttl }) ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
