# Next.js Environment Variables — Deep Dive!

> **Chủ đề**: Biến môi trường (Environment Variables) trong Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/environment-variables
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Env Vars Trong Next.js](#1)
2. [§2. Loading — Cách .env Files Hoạt Động](#2)
3. [§3. @next/env — Dùng Ngoài Runtime](#3)
4. [§4. Referencing — $VARIABLE Expansion](#4)
5. [§5. NEXT*PUBLIC* — Bundle Cho Browser](#5)
6. [§6. Runtime Environment Variables](#6)
7. [§7. Test Environment Variables](#7)
8. [§8. Load Order — Thứ Tự Ưu Tiên](#8)
9. [§9. Tự Viết — EnvEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Env Vars Trong Next.js!

```
  ENVIRONMENT VARIABLES — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ENV VARS = cấu hình NGOÀI code!                          │
  │  → DB passwords, API keys, feature flags...               │
  │  → KHÔNG hardcode! KHÔNG commit lên git!                  │
  │                                                            │
  │  NEXT.JS SUPPORT:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① .env files → auto-load vào process.env!           │  │
  │  │ ② NEXT_PUBLIC_ prefix → expose cho browser!         │  │
  │  │ ③ $VARIABLE → reference biến khác!                  │  │
  │  │ ④ Multiline values → RSA keys, certificates!       │  │
  │  │ ⑤ Multiple environments → dev, prod, test!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SERVER vs CLIENT:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  SERVER (Node.js):                                   │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │ process.env.DB_HOST ✅                         │  │  │
  │  │  │ process.env.API_SECRET ✅                      │  │  │
  │  │  │ process.env.NEXT_PUBLIC_APP_URL ✅             │  │  │
  │  │  │ → TẤT CẢ env vars đều accessible!            │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │                                                      │  │
  │  │  CLIENT (Browser):                                   │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │ process.env.DB_HOST ❌ undefined!              │  │  │
  │  │  │ process.env.API_SECRET ❌ undefined!           │  │  │
  │  │  │ process.env.NEXT_PUBLIC_APP_URL ✅ inlined!    │  │  │
  │  │  │ → CHỈ NEXT_PUBLIC_ vars!                      │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ create-next-app THÊM .env vào .gitignore!            │
  │  → ĐỪNG BAO GIỜ commit .env files lên repo!             │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Loading — Cách .env Files Hoạt Động!

```
  .ENV FILES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  FILE CƠ BẢN: .env                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  DB_HOST=localhost                                   │  │
  │  │  DB_USER=myuser                                      │  │
  │  │  DB_PASS=mypassword                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │  → Auto-load vào process.env.DB_HOST, etc.                │
  │                                                            │
  │  MULTILINE VALUES:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  # Cách 1 — Line breaks thật:                       │  │
  │  │  PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----        │  │
  │  │  ...                                                 │  │
  │  │  Kh9NV...                                            │  │
  │  │  ...                                                 │  │
  │  │  -----END DSA PRIVATE KEY-----"                      │  │
  │  │                                                      │  │
  │  │  # Cách 2 — Escaped \n trong double quotes:          │  │
  │  │  PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh.." │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  VỊ TRÍ FILE:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  project-root/                                       │  │
  │  │  ├── .env           ← .env files Ở ĐÂY!           │  │
  │  │  ├── .env.local                                      │  │
  │  │  ├── .env.development                                │  │
  │  │  ├── .env.production                                 │  │
  │  │  ├── next.config.js                                  │  │
  │  │  ├── package.json                                    │  │
  │  │  └── src/           ← KHÔNG đặt .env trong src/!   │  │
  │  │      └── app/                                        │  │
  │  │                                                      │  │
  │  │  ⚠️ Dùng /src? .env vẫn ở ROOT, KHÔNG trong /src! │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Sử dụng trong Route Handler:**

```typescript
export async function GET() {
  const db = await myDB.connect({
    host: process.env.DB_HOST, // 'localhost'
    username: process.env.DB_USER, // 'myuser'
    password: process.env.DB_PASS, // 'mypassword'
  });
  // ...
}
```

---

## §3. @next/env — Dùng Ngoài Runtime!

```
  @next/env — KHI NÀO CẦN?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ VẤN ĐỀ:                                                 │
  │ → .env auto-load CHỈ trong Next.js runtime!            │
  │ → Nhưng bạn cần env vars NGOÀI runtime:                │
  │   ┌────────────────────────────────────────────────┐     │
  │   │ ① ORM config (drizzle.config.ts, prisma...)    │     │
  │   │ ② Test runner setup (jest.setup.ts)             │     │
  │   │ ③ Database migration scripts                    │     │
  │   │ ④ Seed scripts                                  │     │
  │   └────────────────────────────────────────────────┘     │
  │                                                          │
  │ GIẢI PHÁP: @next/env package!                           │
  │ → CÙNG logic Next.js dùng nội bộ!                     │
  │ → Install + gọi loadEnvConfig()!                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// envConfig.ts
import { loadEnvConfig } from "@next/env";
const projectDir = process.cwd();
loadEnvConfig(projectDir);
```

```typescript
// drizzle.config.ts
import "./envConfig.ts"; // ← Load env TRƯỚC!

export default defineConfig({
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
```

---

## §4. Referencing — $VARIABLE Expansion!

```
  $VARIABLE EXPANSION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ .env:                                                    │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │ TWITTER_USER=nextjs                                │   │
  │ │ TWITTER_URL=https://x.com/$TWITTER_USER            │   │
  │ │                       ↑                            │   │
  │ │           Reference biến TWITTER_USER!             │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  │ KẾT QUẢ:                                                │
  │ process.env.TWITTER_URL = "https://x.com/nextjs"        │
  │                                                          │
  │ ESCAPE $ LITERAL:                                        │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │ PRICE=\$100   ← \$ → literal dollar sign!         │   │
  │ │ → process.env.PRICE = "$100"                       │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  │ HỮU ÍCH CHO:                                           │
  │ → Compose URL: DB_URL=postgres://$USER:$PASS@$HOST     │
  │ → DRY principle: định nghĩa 1 lần, dùng nhiều nơi!   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. NEXT*PUBLIC* — Bundle Cho Browser!

```
  NEXT_PUBLIC_ — CƠ CHẾ INLINING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  .env:                                                     │
  │  NEXT_PUBLIC_ANALYTICS_ID=abcdefghijk                      │
  │                                                            │
  │  Source code:                                              │
  │  setupAnalyticsService(process.env.NEXT_PUBLIC_ANALYTICS_ID)│
  │                                                            │
  │  SAU "next build":                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // Compiled JS bundle (gửi đến browser):           │  │
  │  │  setupAnalyticsService("abcdefghijk")                │  │
  │  │                        ↑                             │  │
  │  │     THAY THẾ trực tiếp bằng giá trị CỨNG!         │  │
  │  │     KHÔNG còn process.env!                          │  │
  │  │     = BUILD-TIME INLINING!                          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ❌ DYNAMIC LOOKUP → KHÔNG INLINE:                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // ❌ Dùng variable → KHÔNG inline!                │  │
  │  │  const varName = 'NEXT_PUBLIC_ANALYTICS_ID'          │  │
  │  │  process.env[varName]  → UNDEFINED trên browser!    │  │
  │  │                                                      │  │
  │  │  // ❌ Destructure process.env → KHÔNG inline!      │  │
  │  │  const env = process.env                              │  │
  │  │  env.NEXT_PUBLIC_ANALYTICS_ID → UNDEFINED!           │  │
  │  │                                                      │  │
  │  │  // ✅ CHỈ direct access → inline!                  │  │
  │  │  process.env.NEXT_PUBLIC_ANALYTICS_ID → "abc..."    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ QUAN TRỌNG — FROZEN SAU BUILD:                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Giá trị ĐÓNG BĂNG sau next build!                │  │
  │  │  → Đổi env var SAU build → KHÔNG effect!            │  │
  │  │  → Heroku pipeline promote → VẪN giá trị cũ!       │  │
  │  │  → Docker multi-env → VẪN giá trị build time!      │  │
  │  │  → Cần runtime? → Dùng API riêng cho client!       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Runtime Environment Variables!

```
  RUNTIME vs BUILD-TIME:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  BUILD-TIME (NEXT_PUBLIC_):                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Giá trị inline vào JS bundle lúc build!         │  │
  │  │  → KHÔNG đổi được sau build!                        │  │
  │  │  → Dùng cho: analytics ID, public API URL...        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  RUNTIME (Server-only, dynamic rendering):                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Đọc process.env TẠI THỜI ĐIỂM REQUEST!          │  │
  │  │  → ĐỔI ĐƯỢC giữa các deploy!                       │  │
  │  │  → 1 Docker image → nhiều environments!             │  │
  │  │  → YÊU CẦU: dynamic rendering!                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```typescript
import { connection } from "next/server";

export default async function Component() {
  await connection();
  // → Opt-in dynamic rendering!
  // → process.env.MY_VALUE đọc TẠI runtime!
  const value = process.env.MY_VALUE;
  // ...
}
```

---

## §7. Test Environment Variables!

```
  TEST ENVIRONMENT:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  3 ENVIRONMENTS:                                           │
  │  ┌────────────┬──────────────┬────────────────────────┐    │
  │  │ development│ production   │ test                   │    │
  │  ├────────────┼──────────────┼────────────────────────┤    │
  │  │ next dev   │ next build/  │ jest / cypress         │    │
  │  │            │ next start   │                        │    │
  │  ├────────────┼──────────────┼────────────────────────┤    │
  │  │.env.dev    │.env.prod     │.env.test               │    │
  │  │.env.dev.   │.env.prod.    │.env.test.local          │    │
  │  │  local     │  local       │                        │    │
  │  │.env.local ✅│.env.local ✅│.env.local ❌ SKIP!     │    │
  │  └────────────┴──────────────┴────────────────────────┘    │
  │                                                            │
  │  ⚠️ Test environment KHÔNG load .env.local!               │
  │  → Tests phải consistent cho EVERYONE!                    │
  │  → .env.local = personal overrides → SKIP!               │
  │                                                            │
  │  ⚠️ Test environment KHÔNG load .env.development /        │
  │     .env.production!                                       │
  │  → Test env CHỈ load .env.test + .env!                   │
  │                                                            │
  │  Git rules:                                                │
  │  ┌────────────────────────────────────────────────────┐    │
  │  │ .env.test        → COMMIT! (shared defaults!)     │    │
  │  │ .env.test.local  → GITIGNORE! (personal!)         │    │
  │  │ .env*.local      → ALL GITIGNORED!                │    │
  │  └────────────────────────────────────────────────────┘    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```typescript
// Jest global setup — load env giống Next.js!
import { loadEnvConfig } from "@next/env";

export default async () => {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
};
```

---

## §8. Load Order — Thứ Tự Ưu Tiên!

```
  ENV VAR LOAD ORDER (ƯU TIÊN CAO → THẤP):
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① process.env (system / shell env)      ← CAO NHẤT!    │
  │     │ Đã set trước khi chạy Next.js                      │
  │     │ VD: DB_HOST=prod-db next build                     │
  │     ▼                                                      │
  │  ② .env.$(NODE_ENV).local                                  │
  │     │ VD: .env.development.local                          │
  │     │ → Personal overrides cho environment cụ thể        │
  │     ▼                                                      │
  │  ③ .env.local                                              │
  │     │ → Personal overrides chung                          │
  │     │ ⚠️ SKIP khi NODE_ENV=test!                         │
  │     ▼                                                      │
  │  ④ .env.$(NODE_ENV)                                        │
  │     │ VD: .env.development, .env.production                │
  │     │ → Shared env-specific defaults                      │
  │     ▼                                                      │
  │  ⑤ .env                                    ← THẤP NHẤT! │
  │     → Shared defaults cho TẤT CẢ environments            │
  │                                                            │
  │  QUY TẮC: TÌM THẤY → DỪNG! KHÔNG override!              │
  │  → Biến đã tồn tại sẽ KHÔNG bị ghi đè!                 │
  │                                                            │
  │  VÍ DỤ: NODE_ENV=development                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  DB_HOST tìm theo thứ tự:                           │  │
  │  │  1. process.env.DB_HOST?          → Có? DÙNG!      │  │
  │  │  2. .env.development.local?       → Có? DÙNG!      │  │
  │  │  3. .env.local?                   → Có? DÙNG!      │  │
  │  │  4. .env.development?             → Có? DÙNG!      │  │
  │  │  5. .env?                         → Có? DÙNG!      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NODE_ENV AUTO-ASSIGN:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  next dev    → NODE_ENV = "development"              │  │
  │  │  next build  → NODE_ENV = "production"               │  │
  │  │  next start  → NODE_ENV = "production"               │  │
  │  │  Cho phép: "production", "development", "test"       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — EnvEngine!

```javascript
var EnvEngine = (function () {
  // ═══════════════════════════════════
  // 1. ENV FILE PARSER
  // ═══════════════════════════════════
  function parseEnvFile(content) {
    var result = {};
    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      // Skip comments and empty lines
      if (!line || line[0] === "#") continue;
      var eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      var key = line.slice(0, eqIdx).trim();
      var value = line.slice(eqIdx + 1).trim();
      // Remove surrounding quotes
      if (
        (value[0] === '"' && value[value.length - 1] === '"') ||
        (value[0] === "'" && value[value.length - 1] === "'")
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  }

  // ═══════════════════════════════════
  // 2. VARIABLE EXPANSION ($VAR)
  // ═══════════════════════════════════
  function expandVariables(vars) {
    var expanded = {};
    for (var key in vars) {
      var val = vars[key];
      // Replace $VAR_NAME with its value
      expanded[key] = val.replace(
        /\$([A-Za-z_][A-Za-z0-9_]*)/g,
        function (_, name) {
          return expanded[name] || vars[name] || "";
        },
      );
    }
    return expanded;
  }

  // ═══════════════════════════════════
  // 3. NEXT_PUBLIC_ INLINING (build-time)
  // ═══════════════════════════════════
  function inlinePublicVars(sourceCode, env) {
    var result = sourceCode;
    for (var key in env) {
      if (key.indexOf("NEXT_PUBLIC_") === 0) {
        var pattern = "process.env." + key;
        // Only direct access — NOT dynamic lookups!
        result = result.split(pattern).join('"' + env[key] + '"');
      }
    }
    return result;
  }

  // ═══════════════════════════════════
  // 4. LOAD ORDER SIMULATOR
  // ═══════════════════════════════════
  function loadEnvConfig(nodeEnv, files, systemEnv) {
    console.log("  📂 Loading env for NODE_ENV=" + nodeEnv);
    var processEnv = {};

    // Source 1: System env (highest priority!)
    for (var key in systemEnv) {
      processEnv[key] = systemEnv[key];
      console.log("  ① system: " + key + "=" + systemEnv[key]);
    }

    // Files in priority order
    var order = [
      ".env." + nodeEnv + ".local",
      nodeEnv !== "test" ? ".env.local" : null,
      ".env." + nodeEnv,
      ".env",
    ];

    for (var i = 0; i < order.length; i++) {
      var fileName = order[i];
      if (!fileName) {
        console.log("  " + (i + 2) + ". .env.local → SKIPPED (test!)");
        continue;
      }
      var fileContent = files[fileName];
      if (!fileContent) {
        console.log("  " + (i + 2) + ". " + fileName + " → not found");
        continue;
      }
      var parsed = parseEnvFile(fileContent);
      var expanded = expandVariables(parsed);
      for (var k in expanded) {
        if (!(k in processEnv)) {
          processEnv[k] = expanded[k];
          console.log(
            "  " + (i + 2) + ". " + fileName + ": " + k + "=" + expanded[k],
          );
        } else {
          console.log(
            "  " +
              (i + 2) +
              ". " +
              fileName +
              ": " +
              k +
              " → SKIPPED (already set)",
          );
        }
      }
    }
    return processEnv;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  ENV ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Parse + expand
    console.log("\n── Scenario 1: Parse & Expand ──");
    var envContent = "HOST=localhost\nPORT=3000\nURL=http://$HOST:$PORT";
    var parsed = parseEnvFile(envContent);
    var expanded = expandVariables(parsed);
    console.log("  Parsed:", JSON.stringify(parsed));
    console.log("  Expanded:", JSON.stringify(expanded));

    // Scenario 2: NEXT_PUBLIC_ inlining
    console.log("\n── Scenario 2: NEXT_PUBLIC_ Inlining ──");
    var code = "setupAnalytics(process.env.NEXT_PUBLIC_ID)";
    var env = { NEXT_PUBLIC_ID: "abc123", SECRET: "hidden" };
    var inlined = inlinePublicVars(code, env);
    console.log("  Before: " + code);
    console.log("  After:  " + inlined);
    console.log(
      "  SECRET not inlined? " +
        (inlined.indexOf("hidden") === -1 ? "YES ✅" : "NO ❌"),
    );

    // Scenario 3: Load order
    console.log("\n── Scenario 3: Load Order (dev) ──");
    loadEnvConfig(
      "development",
      {
        ".env": "DB_HOST=default-db\nAPI_KEY=env-key",
        ".env.development": "DB_HOST=dev-db",
        ".env.local": "API_KEY=local-key",
        ".env.development.local": "DB_HOST=my-local-db",
      },
      {},
    );

    // Scenario 4: System env overrides all
    console.log("\n── Scenario 4: System Override ──");
    loadEnvConfig(
      "production",
      {
        ".env": "DB_HOST=default-db",
        ".env.production": "DB_HOST=prod-db",
      },
      { DB_HOST: "SYSTEM_DB" },
    );

    // Scenario 5: Test skips .env.local
    console.log("\n── Scenario 5: Test (skips .env.local) ──");
    loadEnvConfig(
      "test",
      {
        ".env": "DB_HOST=default-db",
        ".env.local": "DB_HOST=local-override",
        ".env.test": "DB_HOST=test-db",
      },
      {},
    );
  }

  return { demo: demo };
})();
// Chạy: EnvEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: NEXT*PUBLIC* prefix hoạt động thế nào? Tại sao dynamic lookup không hoạt động?

<details><summary>Đáp án</summary>

**Cơ chế**: At **build time**, Next.js tìm tất cả `process.env.NEXT_PUBLIC_XXX` trong source code và **thay thế** bằng giá trị **cứng** (string literal). Đây là **static text replacement**.

Ví dụ: `process.env.NEXT_PUBLIC_ID` → `"abc123"` (trong compiled JS bundle).

**Dynamic lookup KHÔNG hoạt động** vì replacement chỉ match **chuỗi chính xác** `process.env.NEXT_PUBLIC_XXX`:

- `process.env[varName]` → compiler KHÔNG biết `varName` là gì → KHÔNG replace
- `const env = process.env; env.XXX` → compiler KHÔNG track qua variable → KHÔNG replace

**Hệ quả**: Giá trị **đóng băng** sau build. Đổi env var sau build → KHÔNG effect trên client. Cần runtime values? → Dùng API endpoint hoặc dynamic rendering trên server.

</details>

---

**Câu 2**: Load order 5 cấp hoạt động thế nào?

<details><summary>Đáp án</summary>

Thứ tự ưu tiên (cao → thấp):

1. **`process.env`** — System/shell env (e.g., `DB=x next build`)
2. **`.env.$(NODE_ENV).local`** — VD: `.env.development.local` (personal, env-specific)
3. **`.env.local`** — Personal overrides (⚠️ **SKIP khi test!**)
4. **`.env.$(NODE_ENV)`** — VD: `.env.production` (shared, env-specific)
5. **`.env`** — Shared defaults cho tất cả environments

**Quy tắc**: Tìm biến → thấy → **DỪNG**! Không override. Biến ở level cao hơn "thắng".

**Vì sao .env.local skip khi test?** Để tests **consistent** — mọi developer chạy test → cùng kết quả. `.env.local` chứa personal overrides → mỗi người khác → tests khác nhau → BAD!

</details>

---

**Câu 3**: Khi nào dùng @next/env? Tại sao cần?

<details><summary>Đáp án</summary>

**@next/env** cần khi bạn muốn load `.env` files **ngoài Next.js runtime**:

- **ORM config**: `drizzle.config.ts`, `prisma.config.ts` — cần `DATABASE_URL` từ `.env`
- **Test setup**: `jest.globalSetup.ts` — cần env vars khi test
- **Migration scripts**: Database migration cần connection string
- **Seed scripts**: Cần API keys, DB credentials

**Tại sao không tự đọc?** Vì `@next/env` dùng **cùng logic** nội bộ của Next.js:

- Load order 5 cấp
- `$VARIABLE` expansion
- `NEXT_PUBLIC_` handling
- `.env.local` skip khi test

Nếu tự đọc `.env` → có thể miss load order, miss expansion → inconsistent với Next.js app.

</details>

---

**Câu 4**: Runtime env vars hoạt động thế nào trên server?

<details><summary>Đáp án</summary>

Trên **server** (Server Components, Route Handlers, Server Actions):

- `process.env.MY_VAR` luôn accessible
- **Static rendering**: Giá trị đọc tại **build time** → đóng băng!
- **Dynamic rendering**: Giá trị đọc tại **request time** → runtime!

Để đảm bảo runtime: dùng `await connection()` hoặc Dynamic APIs (`cookies()`, `headers()`, `searchParams`) → opt into dynamic rendering.

**Lợi ích**: 1 Docker image → promote qua nhiều environments (staging → production) → mỗi env có env vars khác → app đọc giá trị đúng tại runtime.

**Client-side** KHÔNG có runtime env vars. `NEXT_PUBLIC_` luôn build-time. Cần runtime trên client? → Tạo API endpoint trả về config.

</details>
