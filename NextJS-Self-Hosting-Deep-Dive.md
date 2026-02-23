# Next.js Self-Hosting — Deep Dive!

> **Chủ đề**: Self-Hosting — Tự Deploy Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/self-hosting
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Self-Hosting Architecture!](#1)
2. [§2. Reverse Proxy + Image Optimization](#2)
3. [§3. Environment Variables](#3)
4. [§4. Caching và ISR — Cache-Control Headers!](#4)
5. [§5. Custom Cache Handler — Multi-Server!](#5)
6. [§6. Multi-Server Deployments!](#6)
7. [§7. Version Skew + Streaming + CDN!](#7)
8. [§8. Graceful Shutdown — after()!](#8)
9. [§9. Tự Viết — SelfHostEngine!](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Self-Hosting Architecture!

```
  SELF-HOSTING NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VERCEL (managed):        SELF-HOSTED:                     │
  │  ┌──────────────┐         ┌──────────────┐                 │
  │  │ Auto-config! │         │ Your server! │                 │
  │  │ CDN included │         │ Your CDN!    │                 │
  │  │ Zero setup!  │         │ Your cache!  │                 │
  │  │ $$ for scale │         │ Full control!│                 │
  │  └──────────────┘         └──────────────┘                 │
  │                                                            │
  │  SELF-HOST ARCHITECTURE:                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  Internet                                            │  │
  │  │     │                                                │  │
  │  │     ▼                                                │  │
  │  │  ┌──────────────┐                                    │  │
  │  │  │ CDN (opt)    │  ← Static assets cache!          │  │
  │  │  └──────┬───────┘                                    │  │
  │  │         ▼                                            │  │
  │  │  ┌──────────────┐                                    │  │
  │  │  │ Reverse Proxy│  ← Nginx, Apache, Caddy!        │  │
  │  │  │ (recommended)│  ← Security, rate limit!         │  │
  │  │  └──────┬───────┘                                    │  │
  │  │         ▼                                            │  │
  │  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │  │
  │  │  │ Next.js      │ │ Next.js      │ │ Next.js    │   │  │
  │  │  │ Instance 1   │ │ Instance 2   │ │ Instance N │   │  │
  │  │  │ (container)  │ │ (container)  │ │ (container)│   │  │
  │  │  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘   │  │
  │  │         │                │               │           │  │
  │  │         └────────┬───────┘───────────────┘           │  │
  │  │                  ▼                                    │  │
  │  │           ┌──────────────┐                            │  │
  │  │           │ Shared Cache │  ← Redis, S3, DB!       │  │
  │  │           │ (optional)   │                            │  │
  │  │           └──────────────┘                            │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY FEATURES TO CONFIGURE:                                 │
  │  ① Reverse Proxy (nginx)                                  │
  │  ② Image Optimization (sharp)                             │
  │  ③ Environment Variables (build vs runtime!)              │
  │  ④ Caching + ISR (filesystem / shared)                    │
  │  ⑤ Multi-server sync (encryption key, build ID)          │
  │  ⑥ Version Skew protection                               │
  │  ⑦ Streaming (disable buffering!)                         │
  │  ⑧ Graceful Shutdown (SIGINT/SIGTERM)                    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Reverse Proxy + Image Optimization

```
  REVERSE PROXY — SECURITY LAYER!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  TẠI SAO DÙNG REVERSE PROXY?                            │
  │  ┌───────────────────┬──────────────────────────────┐    │
  │  │ Concern           │ Reverse Proxy handles!       │    │
  │  ├───────────────────┼──────────────────────────────┤    │
  │  │ Malformed requests│ ✅ Filter trước khi tới app │    │
  │  │ Slow connections  │ ✅ Timeout + close!          │    │
  │  │ Payload limits    │ ✅ Body size restriction!    │    │
  │  │ Rate limiting     │ ✅ Chặn DDoS!              │    │
  │  │ SSL termination   │ ✅ HTTPS offload!            │    │
  │  └───────────────────┴──────────────────────────────┘    │
  │  → Next.js server CHỈ lo RENDER! ⚡                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  IMAGE OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  next/image + next start = ZERO CONFIG! ✅               │
  │                                                          │
  │  ⚠️ LINUX (glibc):                                      │
  │  → sharp library cần cấu hình thêm                    │
  │  → Tránh excessive memory usage!                        │
  │                                                          │
  │  STATIC EXPORT:                                           │
  │  → Custom image loader trong next.config.js!            │
  │  → Images optimize at RUNTIME, not BUILD!                │
  │                                                          │
  │  OPTIONS:                                                 │
  │  ① Default: next/image (zero config!)                    │
  │  ② Custom loader (Cloudflare, imgix, Cloudinary...)      │
  │  ③ Disable: unoptimized={true} (self-optimize!)          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Environment Variables

```
  BUILD TIME vs RUNTIME VARIABLES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① NEXT_PUBLIC_* → BUILD TIME (inlined vào JS bundle!)  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ NEXT_PUBLIC_API_URL=https://api.example.com          │  │
  │  │                                                      │  │
  │  │ → Embedded vào bundle lúc next build!               │  │
  │  │ → Available cả SERVER + BROWSER!                    │  │
  │  │ → KHÔNG ĐỔI ĐƯỢC sau build!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② SERVER-ONLY → RUNTIME (đọc lúc request!)            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { connection } from 'next/server'             │  │
  │  │                                                      │  │
  │  │ export default async function Component() {          │  │
  │  │   await connection()  // opt-in dynamic rendering!   │  │
  │  │   const value = process.env.MY_VALUE                 │  │
  │  │   // MY_VALUE đọc TẠI RUNTIME! Đổi được!          │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │  → 1 Docker image → promote staging → production!       │
  │  → Chỉ đổi env vars, KHÔNG rebuild!                    │
  │                                                            │
  │  SO SÁNH:                                                   │
  │  ┌──────────────────┬────────────────┬─────────────────┐   │
  │  │                  │ NEXT_PUBLIC_*  │ Server-only     │   │
  │  ├──────────────────┼────────────────┼─────────────────┤   │
  │  │ Available        │ Server+Browser │ Server ONLY!    │   │
  │  │ When resolved?   │ BUILD time     │ RUNTIME!        │   │
  │  │ Change after     │ ❌ CẦN rebuild│ ✅ Just restart │   │
  │  │ build?           │                │                 │   │
  │  │ Docker multi-env?│ ❌ 1 build =  │ ✅ 1 image,    │   │
  │  │                  │ 1 env          │ many envs!      │   │
  │  └──────────────────┴────────────────┴─────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Caching và ISR — Cache-Control Headers!

```
  CACHE-CONTROL HEADERS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  3 CACHING MODES:                                           │
  │                                                            │
  │  ① IMMUTABLE ASSETS (JS, CSS, images with hash!)          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Cache-Control: public, max-age=31536000, immutable   │  │
  │  │                                                      │  │
  │  │ → 1 YEAR cache! SHA-hash trong filename!            │  │
  │  │ → file.abc123.js → content thay đổi = hash đổi  │  │
  │  │ → Safe to cache FOREVER!                             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② ISR PAGES (Incremental Static Regeneration!)            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Cache-Control: s-maxage: <revalidate>, stale-while-  │  │
  │  │                revalidate                             │  │
  │  │                                                      │  │
  │  │ → s-maxage: thời gian cache (từ revalidate prop!) │  │
  │  │ → stale-while-revalidate: serve stale + revalidate  │  │
  │  │   in background!                                      │  │
  │  │ → revalidate: false → 1 year cache!                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ DYNAMIC PAGES (user-specific data!)                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Cache-Control: private, no-cache, no-store,          │  │
  │  │                max-age=0, must-revalidate             │  │
  │  │                                                      │  │
  │  │ → NEVER cached! Mỗi request → render mới!         │  │
  │  │ → App Router + Pages Router!                         │  │
  │  │ → Draft Mode cũng áp dụng!                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  DEFAULT CACHE: Filesystem!                                 │
  │  → In-memory: 50MB default!                               │
  │  → On disk: .next/cache/                                   │
  │  → ISR + Data Cache cùng shared filesystem cache!        │
  │                                                            │
  │  STATIC ASSETS ON CDN:                                      │
  │  → assetPrefix trong next.config.js!                      │
  │  → JS/CSS served từ CDN domain!                          │
  │  → ⚠️ Extra DNS + TLS resolution time!                  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Custom Cache Handler — Multi-Server!

```
  CUSTOM CACHE HANDLER:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: KUBERNETES / DOCKER SWARM                       │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
  │  │ Pod 1    │  │ Pod 2    │  │ Pod 3    │                 │
  │  │ Cache A  │  │ Cache B  │  │ Cache C  │                 │
  │  │ (stale!) │  │ (fresh!) │  │ (stale!) │                 │
  │  └──────────┘  └──────────┘  └──────────┘                 │
  │  → Mỗi pod cache RIÊNG! → INCONSISTENT! 😱             │
  │                                                            │
  │  FIX: SHARED CACHE HANDLER!                                │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
  │  │ Pod 1    │  │ Pod 2    │  │ Pod 3    │                 │
  │  │          │  │          │  │          │                 │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
  │       │             │             │                         │
  │       └──────┬──────┘─────────────┘                         │
  │              ▼                                              │
  │       ┌──────────────┐                                     │
  │       │ Redis / S3   │  ← SINGLE SOURCE OF TRUTH!        │
  │       │ Shared Cache │                                     │
  │       └──────────────┘                                     │
  │                                                            │
  │  CONFIG:                                                    │
  │  // next.config.js                                         │
  │  module.exports = {                                        │
  │    cacheHandler: require.resolve('./cache-handler.js'),    │
  │    cacheMaxMemorySize: 0,  // disable in-memory!          │
  │  }                                                         │
  │                                                            │
  │  CACHE HANDLER CLASS:                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ class CacheHandler {                                 │  │
  │  │   async get(key)                                     │  │
  │  │     → Read from Redis/S3/DB!                       │  │
  │  │   async set(key, data, ctx)                          │  │
  │  │     → Write to Redis/S3/DB! (with tags!)           │  │
  │  │   async revalidateTag(tags)                          │  │
  │  │     → Delete entries matching tags!                 │  │
  │  │   resetRequestCache()                                │  │
  │  │     → Clear per-request temp cache!                │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  revalidatePath = revalidateTag with special default tag!  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Multi-Server Deployments!

```
  MULTI-SERVER CHECKLIST:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① BUILD ID — Consistent Across Containers!               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // next.config.js                                    │  │
  │  │ module.exports = {                                   │  │
  │  │   generateBuildId: async () => {                     │  │
  │  │     return process.env.GIT_HASH  // or any unique ID │  │
  │  │   },                                                 │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Same build = same ID = consistent serving!        │  │
  │  │ → Different stages? → Use GIT_HASH!                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② ENCRYPTION KEY — Server Functions!                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<base64-key>      │  │
  │  │                                                      │  │
  │  │ → Server Functions encrypt closure variables!       │  │
  │  │ → Unique key per build (default)!                   │  │
  │  │ → Multi-instance: ALL phải CÙNG key!               │  │
  │  │ → Otherwise: "Failed to find Server Action" ❌     │  │
  │  │ → Key: base64, 16/24/32 bytes (AES)!               │  │
  │  │ → Default: 32 bytes!                                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ DEPLOYMENT ID — Version Skew Protection!               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ module.exports = {                                   │  │
  │  │   deploymentId: process.env.DEPLOYMENT_VERSION,      │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Static assets: ?dpl=<deploymentId> query param!   │  │
  │  │ → Navigation: x-deployment-id header!               │  │
  │  │ → Mismatch? → HARD navigation (full reload!)       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ SHARED CACHE — External Storage!                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Default: in-memory (NOT shared across instances!) │  │
  │  │ → Fix: 'use cache: remote' + custom cache handler! │  │
  │  │ → Store in: Redis, S3, DynamoDB, etc!               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  MULTI-SERVER FLOW:                                         │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
  │  │ Pod 1    │ │ Pod 2    │ │ Pod 3    │                   │
  │  │ Same:    │ │ Same:    │ │ Same:    │                   │
  │  │ •BuildID │ │ •BuildID │ │ •BuildID │                   │
  │  │ •EncKey  │ │ •EncKey  │ │ •EncKey  │                   │
  │  │ •DeployID│ │ •DeployID│ │ •DeployID│                   │
  │  └────┬─────┘ └────┬─────┘ └────┬─────┘                   │
  │       └──────┬──────┘────────────┘                         │
  │              ▼                                              │
  │       ┌──────────────┐                                     │
  │       │ Shared Cache │                                     │
  │       │ (Redis/S3)   │                                     │
  │       └──────────────┘                                     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Version Skew + Streaming + CDN!

```
  VERSION SKEW — ROLLING DEPLOYMENT PROBLEM!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ:                                                │
  │  ┌──────────▶ Client loads v1 JS/CSS                    │
  │  │            Server rolls to v2                        │
  │  │            Client requests v1 assets → 404! 💥      │
  │  │            Client calls v1 Server Action → fail! 💥 │
  │  │            Prefetched v1 data → incompatible! 💥    │
  │  │                                                      │
  │  FIX: deploymentId!                                      │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Client (v1): GET /page.js?dpl=abc123             │    │
  │  │              Header: x-deployment-id: abc123     │    │
  │  │ Server (v2): deploymentId = xyz789               │    │
  │  │              abc123 ≠ xyz789 → MISMATCH!         │    │
  │  │              → Trigger HARD NAVIGATION!          │    │
  │  │              → Full page reload with v2! ✅      │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  ⚠️ useState state LOST after hard nav!                 │
  │  → URL state + localStorage persist!                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STREAMING + NGINX:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Nginx BUFFERS response by default!            │
  │  → Streaming (Suspense) KHÔNG work! 😱                 │
  │                                                          │
  │  FIX: Disable buffering!                                  │
  │  // next.config.js                                       │
  │  headers: [{                                             │
  │    source: '/:path*{/}?',                                │
  │    headers: [{                                           │
  │      key: 'X-Accel-Buffering',                           │
  │      value: 'no',    // ← Disable nginx buffering!     │
  │    }],                                                   │
  │  }]                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CDN + CACHE-CONTROL:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  DYNAMIC PAGE:                                            │
  │  → Cache-Control: private                                │
  │  → CDN KHÔNG cache! Mỗi request tới server!            │
  │                                                          │
  │  STATIC PAGE (fully prerendered):                         │
  │  → Cache-Control: public                                 │
  │  → CDN CÓ cache! Serve instantly! ⚡                   │
  │                                                          │
  │  MIX (PPR): Waiting for stable Deployment Adapters API!  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Graceful Shutdown — after()!

```
  after() + GRACEFUL SHUTDOWN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  after() → fully supported với next start! ✅           │
  │                                                          │
  │  GRACEFUL SHUTDOWN:                                       │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Server running...                                │    │
  │  │     │                                            │    │
  │  │     ▼                                            │    │
  │  │ Receive SIGINT or SIGTERM                        │    │
  │  │     │                                            │    │
  │  │     ▼                                            │    │
  │  │ Wait for pending after() callbacks/promises!     │    │
  │  │     │                                            │    │
  │  │     ▼                                            │    │
  │  │ All done → Server stops cleanly! ✅             │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  → SIGINT: Ctrl+C (terminal!)                           │
  │  → SIGTERM: kill <pid> (Docker stop!)                   │
  │  → Cho after() callbacks HOÀN THÀNH trước khi exit!   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — SelfHostEngine!

```javascript
var SelfHostEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG
  // ═══════════════════════════════════
  var config = {
    buildId: null,
    deploymentId: null,
    encryptionKey: null,
    cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
    assetPrefix: "",
  };

  function configure(opts) {
    for (var key in opts) {
      if (config.hasOwnProperty(key)) config[key] = opts[key];
    }
  }

  // ═══════════════════════════════════
  // 2. CACHE HANDLER
  // ═══════════════════════════════════
  var cache = {};

  function cacheGet(key) {
    var entry = cache[key];
    if (!entry) return null;
    return { value: entry.value, lastModified: entry.lastModified };
  }

  function cacheSet(key, data, tags) {
    cache[key] = {
      value: data,
      lastModified: Date.now(),
      tags: tags || [],
    };
  }

  function cacheRevalidateTag(tags) {
    if (typeof tags === "string") tags = [tags];
    for (var key in cache) {
      var entry = cache[key];
      for (var i = 0; i < entry.tags.length; i++) {
        if (tags.indexOf(entry.tags[i]) !== -1) {
          delete cache[key];
          break;
        }
      }
    }
  }

  // ═══════════════════════════════════
  // 3. CACHE-CONTROL HEADER GENERATOR
  // ═══════════════════════════════════
  function getCacheControl(type, revalidate) {
    switch (type) {
      case "immutable":
        return "public, max-age=31536000, immutable";
      case "isr":
        if (revalidate === false) revalidate = 31536000;
        return "s-maxage: " + revalidate + ", stale-while-revalidate";
      case "dynamic":
        return "private, no-cache, no-store, " + "max-age=0, must-revalidate";
      default:
        return "no-cache";
    }
  }

  // ═══════════════════════════════════
  // 4. VERSION SKEW DETECTOR
  // ═══════════════════════════════════
  function checkVersionSkew(clientDeployId) {
    if (!config.deploymentId) return { skew: false };
    var match = clientDeployId === config.deploymentId;
    return {
      clientId: clientDeployId,
      serverId: config.deploymentId,
      skew: !match,
      action: match
        ? "CONTINUE (client-side nav!)"
        : "HARD NAVIGATION (full reload!) ⚠️",
    };
  }

  // ═══════════════════════════════════
  // 5. ENV VARIABLE RESOLVER
  // ═══════════════════════════════════
  function resolveEnvVar(name, isPublic, buildValues) {
    if (isPublic) {
      // NEXT_PUBLIC_* = inlined at build time
      return {
        name: "NEXT_PUBLIC_" + name,
        value: buildValues[name] || "(not set)",
        resolvedAt: "BUILD TIME",
        changeable: false,
        note: "Inlined in JS bundle! Needs rebuild to change!",
      };
    }
    return {
      name: name,
      value: "(read at runtime)",
      resolvedAt: "RUNTIME",
      changeable: true,
      note: "1 Docker image, many environments! ✅",
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  SELF-HOST ENGINE DEMO              ║");
    console.log("╚════════════════════════════════════╝");

    // Configure
    configure({
      buildId: "abc123",
      deploymentId: "deploy-v2",
      encryptionKey: "base64key==",
      cacheMaxMemorySize: 0,
    });

    // Cache-Control headers
    console.log("\n── Cache-Control Headers ──");
    var types = ["immutable", "isr", "dynamic"];
    for (var i = 0; i < types.length; i++) {
      console.log("  " + types[i] + ": " + getCacheControl(types[i], 60));
    }

    // Cache operations
    console.log("\n── Cache Handler ──");
    cacheSet("/products", { items: ["A", "B"] }, ["products"]);
    cacheSet("/blog/1", { title: "Post 1" }, ["blog", "post-1"]);
    console.log("  GET /products:", cacheGet("/products"));
    cacheRevalidateTag("products");
    console.log('  After revalidateTag("products"):', cacheGet("/products"));
    console.log("  /blog/1 still cached:", cacheGet("/blog/1") !== null);

    // Version skew
    console.log("\n── Version Skew ──");
    console.log("  Match:", checkVersionSkew("deploy-v2"));
    console.log("  Skew:", checkVersionSkew("deploy-v1"));

    // Env vars
    console.log("\n── Environment Variables ──");
    console.log(
      "  Public:",
      resolveEnvVar("API_URL", true, { API_URL: "https://api.com" }),
    );
    console.log("  Server:", resolveEnvVar("DB_URL", false, {}));
  }

  return { demo: demo };
})();
// Chạy: SelfHostEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: 3 loại Cache-Control header — khi nào dùng?

<details><summary>Đáp án</summary>

| Type          | Cache-Control Header                                      | Khi nào?                                           |
| ------------- | --------------------------------------------------------- | -------------------------------------------------- |
| **Immutable** | `public, max-age=31536000, immutable`                     | Static assets: JS/CSS/images với SHA-hash filename |
| **ISR**       | `s-maxage: <revalidate>, stale-while-revalidate`          | ISR pages: serve stale, revalidate in background   |
| **Dynamic**   | `private, no-cache, no-store, max-age=0, must-revalidate` | Dynamic pages: user-specific data, Draft Mode      |

</details>

---

**Câu 2**: Multi-server deployment — 4 config items cần đồng bộ?

<details><summary>Đáp án</summary>

| Config             | Env/Config                               | Tại sao?                                                                        |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------- |
| **Build ID**       | `generateBuildId`                        | Same build = same serving!                                                      |
| **Encryption Key** | `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`     | Server Functions encrypted closures! Khác key = "Failed to find Server Action"! |
| **Deployment ID**  | `deploymentId`                           | Version skew protection! Mismatch → hard nav!                                   |
| **Shared Cache**   | `cacheHandler` + `cacheMaxMemorySize: 0` | In-memory cache NOT shared! → Redis/S3!                                         |

</details>

---

**Câu 3**: NEXT*PUBLIC* vs server-only env vars — Docker implications?

<details><summary>Đáp án</summary>

```
NEXT_PUBLIC_*:
→ Inlined vào JS bundle lúc `next build`!
→ 1 build = 1 value! KHÔNG đổi được!
→ Docker: cần rebuild cho mỗi environment! 😱

Server-only (process.env.MY_VAR):
→ Đọc tại RUNTIME (cần dynamic rendering!)
→ 1 Docker image → staging → production!
→ Chỉ đổi env vars khi deploy! ✅

TIP: Dùng `await connection()` hoặc Dynamic APIs
     (cookies, headers) để opt-in dynamic rendering!
```

</details>

---

**Câu 4**: Streaming với nginx — tại sao cần `X-Accel-Buffering: no`?

<details><summary>Đáp án</summary>

**Vấn đề**: Nginx default **BUFFERS** toàn bộ response trước khi gửi cho client!
→ `<Suspense>` streaming KHÔNG work! User chờ toàn bộ page xong mới thấy!

**Fix**: Header `X-Accel-Buffering: no`
→ Nginx forwards chunks **NGAY KHI** server gửi!
→ Static shell (Header, Skeleton) gửi instant!
→ Dynamic content stream sau khi ready!

```javascript
// next.config.js
headers: [
  {
    source: "/:path*{/}?",
    headers: [{ key: "X-Accel-Buffering", value: "no" }],
  },
];
```

</details>
