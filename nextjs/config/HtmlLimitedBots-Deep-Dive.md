# htmlLimitedBots — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. htmlLimitedBots Là Gì?

```
  htmlLimitedBots — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Danh sách user agents nhận BLOCKING metadata! ★★★       │
  │  → Thay vì streaming metadata! ★                           │
  │  → Value: RegExp pattern! ★                                │
  │                                                              │
  │  STREAMING vs BLOCKING METADATA:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Normal user (browser):                                │    │
  │  │  → STREAMING metadata! ★                              │    │
  │  │  → HTML gửi dần, metadata stream! ★                  │    │
  │  │  → Nhanh cho user! ★★★                                │    │
  │  │                                                       │    │
  │  │  Bot/Crawler (Googlebot...):                           │    │
  │  │  → BLOCKING metadata! ★★★                             │    │
  │  │  → Chờ TOÀN BỘ metadata xong rồi gửi! ★            │    │
  │  │  → Bot đọc metadata đầy đủ! ★★★                    │    │
  │  │  → SEO tốt hơn! ★★★                                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request arrives                                       │    │
  │  │       ↓                                                │    │
  │  │  Check User-Agent header                               │    │
  │  │       ↓                                                │    │
  │  │  ┌── Match htmlLimitedBots? ──┐                        │    │
  │  │  │ YES                       │ NO                       │    │
  │  │  ↓                           ↓                          │    │
  │  │  BLOCKING metadata!       STREAMING metadata! ★       │    │
  │  │  (wait for all meta)      (send chunks as ready)       │    │
  │  │  ★★★ (SEO!)              ★★★ (Fast UX!)              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const config: NextConfig = {                          │    │
  │  │    htmlLimitedBots: /MyBot|AnotherBot|SimpleCrawler/  │    │
  │  │  }                                                     │    │
  │  │  → OVERRIDE default list! ★★★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Default List + Disabling!

```
  DEFAULT + DISABLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  DEFAULT BOTS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  • Mediapartners-Google (Google ads)                   │    │
  │  │  • AdsBot-Google (Google ads bot)                      │    │
  │  │  • Google-PageRenderer                                 │    │
  │  │  • Bingbot (Microsoft)                                 │    │
  │  │  • Twitterbot (X/Twitter)                              │    │
  │  │  • Slackbot (Slack link previews)                      │    │
  │  │  + more... (see GitHub source)                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ Custom config OVERRIDES default list! ★★★                 │
  │  → Default đủ cho hầu hết cases! ★                        │
  │                                                              │
  │  DISABLE streaming metadata HOÀN TOÀN:                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const config: NextConfig = {                          │    │
  │  │    htmlLimitedBots: /.*/    ← match ALL agents! ★★★   │    │
  │  │  }                                                     │    │
  │  │  → TẤT CẢ requests = blocking metadata! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — HtmlLimitedBotsEngine!

```javascript
var HtmlLimitedBotsEngine = (function () {
  // ═══════════════════════════════════
  // 1. DEFAULT BOT LIST
  // ═══════════════════════════════════
  var DEFAULT_BOTS =
    /Mediapartners-Google|AdsBot-Google|Google-PageRenderer|Googlebot|Bingbot|Twitterbot|Slackbot/;

  // ═══════════════════════════════════
  // 2. BOT DETECTOR
  // ═══════════════════════════════════
  function detectBot(userAgent, customPattern) {
    var pattern = customPattern || DEFAULT_BOTS;
    var isBot = pattern.test(userAgent);

    return {
      userAgent: userAgent,
      isLimitedBot: isBot,
      metadataMode: isBot ? "BLOCKING" : "STREAMING",
      note: isBot
        ? "Bot detected! Wait for all metadata! ★★★"
        : "Normal user! Stream metadata! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. METADATA SIMULATOR
  // ═══════════════════════════════════
  function simulateMetadata(isBot, metaTags) {
    if (isBot) {
      // Blocking: wait for ALL meta, then send
      return {
        mode: "BLOCKING",
        behavior:
          "Wait for ALL " + metaTags.length + " tags → send at once! ★★★",
        chunks: 1,
        seoFriendly: true,
      };
    }
    // Streaming: send chunks as ready
    return {
      mode: "STREAMING",
      behavior: "Send " + metaTags.length + " tags in chunks as ready! ★",
      chunks: metaTags.length,
      seoFriendly: false,
      note: "Faster for users! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ HtmlLimitedBots Engine ═══");

    console.log("\n── 1. Bot Detection (default) ──");
    console.log(detectBot("Googlebot/2.1"));
    console.log(detectBot("Twitterbot/1.0"));
    console.log(detectBot("Mozilla/5.0 Chrome/120"));

    console.log("\n── 2. Custom Pattern ──");
    var custom = /MyBot|CustomCrawler/;
    console.log(detectBot("MyBot/1.0", custom));
    console.log(detectBot("Googlebot/2.1", custom));

    console.log("\n── 3. Disable Streaming (match all) ──");
    console.log(detectBot("Any browser", /.*/));

    console.log("\n── 4. Metadata Simulation ──");
    var meta = ["title", "description", "og:image"];
    console.log("Bot:", simulateMetadata(true, meta));
    console.log("User:", simulateMetadata(false, meta));
  }

  return { demo: demo };
})();
// Chạy: HtmlLimitedBotsEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: htmlLimitedBots dùng làm gì?                            │
  │  → Chỉ định bots nhận BLOCKING metadata! ★★★              │
  │  → Thay vì streaming metadata! ★                           │
  │  → Đảm bảo bots đọc metadata đầy đủ → SEO! ★★★         │
  │                                                              │
  │  ❓ 2: Streaming vs Blocking metadata?                         │
  │  → Streaming: gửi từng chunk khi ready → nhanh! ★★★      │
  │  → Blocking: chờ TẤT CẢ xong → gửi 1 lần! ★★★          │
  │  → Bots cần blocking để đọc đủ metadata! ★              │
  │                                                              │
  │  ❓ 3: Custom config có ảnh hưởng default list?                │
  │  → CÓ! OVERRIDE hoàn toàn! ★★★                            │
  │  → Default đủ cho hầu hết (Google, Bing, Twitter...)! ★  │
  │                                                              │
  │  ❓ 4: Tắt streaming metadata hoàn toàn?                      │
  │  → htmlLimitedBots: /.*/ ★★★                               │
  │  → Match ALL user agents! ★                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
