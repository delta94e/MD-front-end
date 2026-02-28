# deploymentId — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.4.10 (experimental) → v14.1.4 (stable)!

---

## §1. deploymentId Là Gì?

```
  deploymentId — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Identifier cho deployment! ★★★                           │
  │  → Bảo vệ VERSION SKEW! ★★★                               │
  │  → Cache busting cho rolling deployments! ★                 │
  │                                                              │
  │  CONFIG (2 cách):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Cách 1: next.config.js                            │    │
  │  │  module.exports = {                                   │    │
  │  │    deploymentId: 'my-deployment-id'  ★                │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Cách 2: ENV variable                               │    │
  │  │  NEXT_DEPLOYMENT_ID=my-deployment-id next build ★     │    │
  │  │                                                       │    │
  │  │  // ⚠️ Config ưu tiên hơn ENV! ★★★                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THỰC TẾ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    deploymentId: process.env.DEPLOYMENT_VERSION       │    │
  │  │                  || process.env.GIT_SHA  ★★★          │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Hoạt Động Thế Nào — 4 Hành Vi!

```
  HOW IT WORKS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Khi deploymentId được set, Next.js làm 4 điều:              │
  │                                                              │
  │  ① ?dpl=<id> trên static asset URLs! ★★★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  TRƯỚC:                                               │    │
  │  │  /_next/static/chunks/main.js                         │    │
  │  │                                                       │    │
  │  │  SAU:                                                  │    │
  │  │  /_next/static/chunks/main.js?dpl=abc123 ★★★          │    │
  │  │  → Cache busting! CDN/browser fetch mới! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② x-deployment-id header trên client navigation! ★         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Client → Server:                                      │    │
  │  │  x-deployment-id: abc123 ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ x-nextjs-deployment-id header trên response! ★           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Server → Client:                                      │    │
  │  │  x-nextjs-deployment-id: abc123 ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ data-dpl-id trên <html> element! ★                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  <html data-dpl-id="abc123"> ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MISMATCH DETECTION:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Client (dpl=v1) → navigate → Server (dpl=v2)        │    │
  │  │                                 ↓                      │    │
  │  │                    x-nextjs-deployment-id: v2          │    │
  │  │                                 ↓                      │    │
  │  │              Client: v1 !== v2 → MISMATCH! ★★★        │    │
  │  │                                 ↓                      │    │
  │  │              HARD NAVIGATION (full page reload)! ★★★  │    │
  │  │              → Fetch fresh assets from v2! ★          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Use Cases!

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Rolling Deployments! ★★★                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  KHÔNG CÓ deploymentId:                                │    │
  │  │  Server A: v2 (new)  → serve main-v2.js               │    │
  │  │  Server B: v1 (old)  → serve main-v1.js               │    │
  │  │  User: load page v2 → navigate → hit Server B         │    │
  │  │  → Request main-v2.js từ Server B → 404! ★★★         │    │
  │  │  → MIX old/new assets → ERRORS! ★★★                  │    │
  │  │                                                       │    │
  │  │  CÓ deploymentId:                                      │    │
  │  │  Server A: v2 (dpl=v2)                                 │    │
  │  │  Server B: v1 (dpl=v1)                                 │    │
  │  │  User: load page v2 → navigate → hit Server B         │    │
  │  │  → Client: dpl=v2, Server: dpl=v1                     │    │
  │  │  → MISMATCH! → Full reload! → Correct assets! ★★★    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Multi-Server Environments! ★                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Load Balancer                                         │    │
  │  │       ├→ Instance A (dpl=v3) ★                        │    │
  │  │       ├→ Instance B (dpl=v3) ★                        │    │
  │  │       └→ Instance C (dpl=v3) ★                        │    │
  │  │                                                       │    │
  │  │  → Tất cả CÙNG deploymentId! ★★★                    │    │
  │  │  → Consistent assets! ★                               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ ?dpl= CHỈ cho cache busting! ★                           │
  │  → Next.js KHÔNG đọc param này từ incoming requests! ★    │
  │  → KHÔNG dùng cho routing! ★                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — DeploymentIdEngine!

```javascript
var DeploymentIdEngine = (function () {
  // ═══════════════════════════════════
  // 1. DEPLOYMENT CONFIG
  // ═══════════════════════════════════
  function resolveDeploymentId(configValue, envValue) {
    // Config takes precedence over env
    var id = configValue || envValue || null;
    return {
      deploymentId: id,
      source: configValue
        ? "next.config.js (precedence)! ★★★"
        : envValue
          ? "NEXT_DEPLOYMENT_ID env! ★"
          : "NOT SET! ★",
    };
  }

  // ═══════════════════════════════════
  // 2. ASSET URL TRANSFORMER
  // ═══════════════════════════════════
  function transformAssetUrl(url, deploymentId) {
    if (!deploymentId) {
      return { original: url, transformed: url, note: "No deploymentId! ★" };
    }
    var separator = url.indexOf("?") >= 0 ? "&" : "?";
    return {
      original: url,
      transformed: url + separator + "dpl=" + deploymentId,
      note: "Cache busting param added! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. HTML ELEMENT GENERATOR
  // ═══════════════════════════════════
  function generateHtmlTag(deploymentId) {
    if (!deploymentId) {
      return { tag: "<html>", note: "No data-dpl-id! ★" };
    }
    return {
      tag: '<html data-dpl-id="' + deploymentId + '">',
      note: "Deployment ID on <html>! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. VERSION SKEW DETECTOR
  // ═══════════════════════════════════
  function detectVersionSkew(clientDplId, serverDplId) {
    if (!clientDplId || !serverDplId) {
      return {
        skew: false,
        action: "No deploymentId! Cannot detect skew! ★",
      };
    }
    if (clientDplId === serverDplId) {
      return {
        skew: false,
        clientVersion: clientDplId,
        serverVersion: serverDplId,
        action: "MATCH! Client-side navigation OK! ★",
      };
    }
    return {
      skew: true,
      clientVersion: clientDplId,
      serverVersion: serverDplId,
      action: "MISMATCH! → HARD NAVIGATION (full reload)! ★★★",
      reason: "Client has old assets! Must fetch new ones! ★",
    };
  }

  // ═══════════════════════════════════
  // 5. HEADERS GENERATOR
  // ═══════════════════════════════════
  function generateHeaders(deploymentId, direction) {
    if (direction === "request") {
      return { "x-deployment-id": deploymentId };
    }
    return { "x-nextjs-deployment-id": deploymentId };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ DeploymentId Engine ═══");

    console.log("\n── 1. Resolve ID ──");
    console.log("Both:", resolveDeploymentId("config-v1", "env-v1"));
    console.log("Only env:", resolveDeploymentId(null, "env-v1"));
    console.log("None:", resolveDeploymentId(null, null));

    console.log("\n── 2. Asset URLs ──");
    var dpl = "abc123";
    console.log(transformAssetUrl("/_next/static/chunks/main.js", dpl));
    console.log(transformAssetUrl("/_next/static/css/style.css", dpl));

    console.log("\n── 3. HTML Tag ──");
    console.log(generateHtmlTag(dpl));

    console.log("\n── 4. Version Skew ──");
    console.log("Match:", detectVersionSkew("v1", "v1"));
    console.log("Mismatch:", detectVersionSkew("v1", "v2"));

    console.log("\n── 5. Headers ──");
    console.log("Request:", generateHeaders(dpl, "request"));
    console.log("Response:", generateHeaders(dpl, "response"));
  }

  return { demo: demo };
})();
// Chạy: DeploymentIdEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: deploymentId giải quyết gì?                             │
  │  → VERSION SKEW trong rolling deployments! ★★★             │
  │  → Client load v1 nhưng server đã v2 → mix assets! ★★★  │
  │  → deploymentId detect mismatch → hard reload! ★★★        │
  │                                                              │
  │  ❓ 2: Next.js làm gì khi có deploymentId?                     │
  │  → 4 điều: ★★★                                             │
  │    ① ?dpl=<id> trên static URLs (cache busting)! ★        │
  │    ② x-deployment-id header trên request! ★                │
  │    ③ x-nextjs-deployment-id header trên response! ★       │
  │    ④ data-dpl-id trên <html>! ★                            │
  │                                                              │
  │  ❓ 3: Config vs ENV?                                          │
  │  → next.config.js ƯU TIÊN hơn ENV! ★★★                   │
  │  → NEXT_DEPLOYMENT_ID env cũng dùng được! ★               │
  │                                                              │
  │  ❓ 4: ?dpl= param dùng cho gì?                                │
  │  → CHỈ cache busting! Browser/CDN fetch mới! ★★★          │
  │  → Next.js KHÔNG đọc param này! ★                          │
  │  → KHÔNG dùng cho routing! ★                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
