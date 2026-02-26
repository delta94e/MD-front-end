# robots.txt — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
> **Spec**: https://en.wikipedia.org/wiki/Robots.txt#Standard
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.3.0!

---

## §1. robots.txt Là Gì?

```
  ROBOTS.TXT — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → File cho SEARCH ENGINE CRAWLERS biết URLs nào              │
  │    được phép hoặc KHÔNG được phép truy cập! ★                │
  │  → Theo chuẩn Robots Exclusion Standard! ★                   │
  │  → Đặt ở ROOT của app/ directory! ★                          │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Googlebot ──→ GET /robots.txt ──→ Đọc quy tắc!     │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  "Allow: /" → OK! Crawl tất cả! ✅                   │    │
  │  │  "Disallow: /private/" → KHÔNG crawl! ❌              │    │
  │  │  "Sitemap: ..." → Biết cấu trúc site! 📋            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 CÁCH TẠO:                                                  │
  │  → Cách 1: Static robots.txt file! ★                         │
  │  → Cách 2: Code generation (robots.ts)! ★                   │
  │                                                              │
  │  AI CRAWLER BLOCKING (thực tế!):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  User-Agent: GPTBot        → Block OpenAI!           │    │
  │  │  User-Agent: ChatGPT-User  → Block ChatGPT Browse!   │    │
  │  │  User-Agent: CCBot         → Block Common Crawl!     │    │
  │  │  User-Agent: anthropic-ai  → Block Claude!           │    │
  │  │  Disallow: /                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Static robots.txt!

```
  STATIC FILE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE: app/robots.txt                                         │
  │                                                              │
  │  User-Agent: *                                                │
  │  Allow: /                                                    │
  │  Disallow: /private/                                         │
  │                                                              │
  │  Sitemap: https://acme.com/sitemap.xml                       │
  │                                                              │
  │  GIẢI THÍCH TỪNG DÒNG:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ User-Agent: *                                          │    │
  │  │ → Áp dụng cho TẤT CẢ crawlers! ★                      │    │
  │  │ → Google, Bing, Yahoo, Baidu...                        │    │
  │  │                                                       │    │
  │  │ Allow: /                                               │    │
  │  │ → Cho phép crawl TẤT CẢ! ★                            │    │
  │  │                                                       │    │
  │  │ Disallow: /private/                                    │    │
  │  │ → CẤM crawl /private/ và sub-paths! ★                 │    │
  │  │ → /private/secret ❌                                   │    │
  │  │ → /private/admin ❌                                    │    │
  │  │ → /public/ ✅ (KHÔNG bị ảnh hưởng!)                   │    │
  │  │                                                       │    │
  │  │ Sitemap: https://acme.com/sitemap.xml                  │    │
  │  │ → Chỉ cho crawler biết sitemap ở đâu! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cách 2: Generate Bằng Code!

```
  CODE GENERATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE: app/robots.ts                                          │
  │                                                              │
  │  import type { MetadataRoute } from 'next'                   │
  │                                                              │
  │  export default function robots(): MetadataRoute.Robots {    │
  │    return {                                                   │
  │      rules: {                                                │
  │        userAgent: '*',                                       │
  │        allow: '/',                                           │
  │        disallow: '/private/',                                │
  │      },                                                      │
  │      sitemap: 'https://acme.com/sitemap.xml',                │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  │  OUTPUT:                                                      │
  │  User-Agent: *                                                │
  │  Allow: /                                                    │
  │  Disallow: /private/                                         │
  │  Sitemap: https://acme.com/sitemap.xml                       │
  │                                                              │
  │  ★ "Good to know" từ docs:                                    │
  │  → robots.js = Special Route Handler! ★                      │
  │  → CACHED by default! ★                                      │
  │  → Trừ khi dùng Dynamic API hoặc dynamic config! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  MULTIPLE USER AGENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export default function robots(): MetadataRoute.Robots {    │
  │    return {                                                   │
  │      rules: [                        ← ARRAY of rules! ★    │
  │        {                                                     │
  │          userAgent: 'Googlebot',                             │
  │          allow: ['/'],                                       │
  │          disallow: '/private/',                              │
  │        },                                                    │
  │        {                                                     │
  │          userAgent: ['Applebot', 'Bingbot'],                 │
  │          disallow: ['/'],            ← Block ALL! ★          │
  │        },                                                    │
  │      ],                                                      │
  │      sitemap: 'https://acme.com/sitemap.xml',                │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  │  OUTPUT:                                                      │
  │  User-Agent: Googlebot                                        │
  │  Allow: /                                                    │
  │  Disallow: /private/                                         │
  │                                                              │
  │  User-Agent: Applebot                                         │
  │  Disallow: /                                                 │
  │                                                              │
  │  User-Agent: Bingbot                                          │
  │  Disallow: /                                                 │
  │                                                              │
  │  Sitemap: https://acme.com/sitemap.xml                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Robots Object — TypeScript Type!

```
  ROBOTS TYPE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  type Robots = {                                              │
  │    rules:                                                    │
  │      | {                           ← Một rule! ★             │
  │          userAgent?: string | string[]                       │
  │          allow?: string | string[]                           │
  │          disallow?: string | string[]                        │
  │          crawlDelay?: number       ← Giây giữa requests! ★  │
  │        }                                                     │
  │      | Array<{                     ← NHIỀU rules! ★          │
  │          userAgent: string | string[]                        │
  │          allow?: string | string[]                           │
  │          disallow?: string | string[]                        │
  │          crawlDelay?: number                                 │
  │        }>                                                    │
  │    sitemap?: string | string[]     ← 1 hoặc NHIỀU! ★        │
  │    host?: string                   ← Domain chính! ★         │
  │  }                                                           │
  │                                                              │
  │  FIELDS GIẢI THÍCH:                                           │
  │  ┌──────────────┬──────────────────────────────────────┐     │
  │  │ Field        │ Mô tả                                │     │
  │  ├──────────────┼──────────────────────────────────────┤     │
  │  │ userAgent    │ Bot nào? "*" = tất cả! ★              │     │
  │  │ allow        │ Đường dẫn ĐƯỢC crawl! ★               │     │
  │  │ disallow     │ Đường dẫn BỊ CẤM! ★                  │     │
  │  │ crawlDelay   │ Delay (giây) giữa requests! ★        │     │
  │  │ sitemap      │ URL sitemap! ★                        │     │
  │  │ host         │ Domain chính (mirror sites!) ★        │     │
  │  └──────────────┴──────────────────────────────────────┘     │
  │                                                              │
  │  ALLOW vs DISALLOW PRIORITY:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Disallow: /admin/                                    │    │
  │  │  Allow: /admin/public/                                │    │
  │  │                                                       │    │
  │  │  /admin/secret → ❌ Bị block!                         │    │
  │  │  /admin/public/page → ✅ Được crawl!                  │    │
  │  │  /admin/public/page/deep → ✅ Cũng được! ★            │    │
  │  │                                                       │    │
  │  │  QUY TẮC: Longest match wins! ★                       │    │
  │  │  → Path dài hơn = ưu tiên cao hơn! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — RobotsEngine!

```javascript
var RobotsEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROBOTS.TXT GENERATOR
  // ═══════════════════════════════════
  function generateRobotsTxt(config) {
    var lines = [];
    var rules = Array.isArray(config.rules) ? config.rules : [config.rules];

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var agents = Array.isArray(rule.userAgent)
        ? rule.userAgent
        : [rule.userAgent || "*"];

      for (var a = 0; a < agents.length; a++) {
        lines.push("User-Agent: " + agents[a]);

        // Allow
        if (rule.allow) {
          var allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
          for (var j = 0; j < allows.length; j++) {
            lines.push("Allow: " + allows[j]);
          }
        }

        // Disallow
        if (rule.disallow) {
          var disallows = Array.isArray(rule.disallow)
            ? rule.disallow
            : [rule.disallow];
          for (var k = 0; k < disallows.length; k++) {
            lines.push("Disallow: " + disallows[k]);
          }
        }

        // Crawl-delay
        if (rule.crawlDelay) {
          lines.push("Crawl-delay: " + rule.crawlDelay);
        }

        lines.push(""); // blank line between agents
      }
    }

    // Sitemap(s)
    if (config.sitemap) {
      var sitemaps = Array.isArray(config.sitemap)
        ? config.sitemap
        : [config.sitemap];
      for (var s = 0; s < sitemaps.length; s++) {
        lines.push("Sitemap: " + sitemaps[s]);
      }
    }

    // Host
    if (config.host) {
      lines.push("Host: " + config.host);
    }

    return lines.join("\n");
  }

  // ═══════════════════════════════════
  // 2. CRAWL CHECKER
  // ═══════════════════════════════════
  function canCrawl(rules, userAgent, path) {
    var rulesList = Array.isArray(rules) ? rules : [rules];
    var matched = null;

    // Find matching rule for userAgent
    for (var i = 0; i < rulesList.length; i++) {
      var r = rulesList[i];
      var agents = Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent];
      for (var a = 0; a < agents.length; a++) {
        if (agents[a] === "*" || agents[a] === userAgent) {
          matched = r;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched)
      return { allowed: true, reason: "Không có rule → mặc định ALLOW! ★" };

    // Longest match wins!
    var bestAllow = "",
      bestDisallow = "";
    if (matched.allow) {
      var allows = Array.isArray(matched.allow)
        ? matched.allow
        : [matched.allow];
      for (var j = 0; j < allows.length; j++) {
        if (
          path.indexOf(allows[j]) === 0 &&
          allows[j].length > bestAllow.length
        ) {
          bestAllow = allows[j];
        }
      }
    }
    if (matched.disallow) {
      var disallows = Array.isArray(matched.disallow)
        ? matched.disallow
        : [matched.disallow];
      for (var k = 0; k < disallows.length; k++) {
        if (
          path.indexOf(disallows[k]) === 0 &&
          disallows[k].length > bestDisallow.length
        ) {
          bestDisallow = disallows[k];
        }
      }
    }

    if (bestAllow.length > bestDisallow.length) {
      return {
        allowed: true,
        reason: "Allow '" + bestAllow + "' dài hơn → ALLOW! ★",
      };
    }
    if (bestDisallow.length > 0) {
      return {
        allowed: false,
        reason: "Disallow '" + bestDisallow + "' match → BLOCK! ❌",
      };
    }
    return { allowed: true, reason: "Không match disallow → ALLOW! ★" };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Robots Engine ═══");

    console.log("\n── Generate ──");
    var txt = generateRobotsTxt({
      rules: [
        { userAgent: "Googlebot", allow: ["/"], disallow: "/private/" },
        { userAgent: ["Applebot", "Bingbot"], disallow: ["/"] },
        { userAgent: "GPTBot", disallow: ["/"], crawlDelay: 10 },
      ],
      sitemap: [
        "https://acme.com/sitemap.xml",
        "https://acme.com/sitemap-blog.xml",
      ],
      host: "https://acme.com",
    });
    console.log(txt);

    console.log("\n── Crawl Check ──");
    var rules = [
      {
        userAgent: "Googlebot",
        allow: ["/", "/admin/public/"],
        disallow: "/admin/",
      },
      { userAgent: "GPTBot", disallow: ["/"] },
    ];
    console.log("/blog Googlebot:", canCrawl(rules, "Googlebot", "/blog"));
    console.log(
      "/admin/secret Googlebot:",
      canCrawl(rules, "Googlebot", "/admin/secret"),
    );
    console.log(
      "/admin/public/page:",
      canCrawl(rules, "Googlebot", "/admin/public/page"),
    );
    console.log("/ GPTBot:", canCrawl(rules, "GPTBot", "/"));
    console.log("/ YandexBot:", canCrawl(rules, "YandexBot", "/"));
  }

  return { demo: demo };
})();
// Chạy: RobotsEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: robots.txt dùng để làm gì?                              │
  │  → Cho search engine crawlers biết URLs nào được crawl! ★   │
  │  → Theo Robots Exclusion Standard! ★                         │
  │  → KHÔNG bảo mật! Chỉ là "yêu cầu lịch sự"! ★              │
  │  → Bad bots có thể IGNORE! → Cần auth/middleware thực sự!   │
  │                                                              │
  │  ❓ 2: Static (.txt) vs Code (.ts) — khác gì?                  │
  │  → Static: cố định, đơn giản, không logic!                  │
  │  → Code: dynamic values, env-based, TYPE SAFE! ★            │
  │  → Code: MetadataRoute.Robots type! ★                       │
  │  → Code: Special Route Handler, CACHED by default! ★        │
  │                                                              │
  │  ❓ 3: crawlDelay là gì?                                       │
  │  → Yêu cầu bot đợi N giây giữa mỗi request! ★              │
  │  → Giảm tải server! ★                                       │
  │  → Google KHÔNG tôn trọng crawlDelay! ★                     │
  │  → Bing, Yahoo, Yandex CÓ tôn trọng! ★                     │
  │                                                              │
  │  ❓ 4: Allow vs Disallow — cái nào ưu tiên?                    │
  │  → Longest match wins! ★★★                                   │
  │  → Disallow: /admin/ + Allow: /admin/public/                 │
  │  → /admin/secret → ❌ (match /admin/ ngắn hơn!)             │
  │  → /admin/public/x → ✅ (match /admin/public/ dài hơn!)     │
  │                                                              │
  │  ❓ 5: robots.txt có chặn được AI crawlers không?              │
  │  → CÓ, nếu AI bot TÔN TRỌNG quy tắc! ★                    │
  │  → GPTBot (OpenAI), CCBot, anthropic-ai! ★                  │
  │  → Nhưng KHÔNG bảo đảm! Cần thêm biện pháp khác! ★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
