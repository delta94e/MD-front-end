# Next.js MCP Server — Deep Dive!

> **Chủ đề**: Model Context Protocol (MCP) — AI Agents Truy Cập App!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/mcp
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. MCP Là Gì? — Tổng Quan](#1)
2. [§2. Getting Started — .mcp.json](#2)
3. [§3. Capabilities — Runtime Access + Dev Tools](#3)
4. [§4. Available Tools — 5 Tools Chi Tiết](#4)
5. [§5. Development Workflow + Agent Benefits](#5)
6. [§6. Examples — Error Detection + Upgrading](#6)
7. [§7. How It Works — /\_next/mcp Architecture](#7)
8. [§8. Troubleshooting](#8)
9. [§9. Tự Viết — McpServerEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. MCP Là Gì? — Tổng Quan!

```
  MCP — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  MCP = Model Context Protocol                              │
  │  = Giao thức CHUẨN MỞ cho AI agents giao tiếp với app!  │
  │                                                            │
  │  VẤN ĐỀ TRƯỚC MCP:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  AI Agent (Claude, Cursor, Copilot...)               │  │
  │  │    → Chỉ đọc source code (text files!)              │  │
  │  │    → KHÔNG biết app đang chạy thế nào!             │  │
  │  │    → KHÔNG thấy runtime errors!                     │  │
  │  │    → KHÔNG biết routes, metadata, config!           │  │
  │  │    → Fix lỗi = đoán mò! 😞                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SAU MCP:                                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  AI Agent                                            │  │
  │  │    ↕ MCP Protocol (standardized!)                   │  │
  │  │  Next.js Dev Server                                  │  │
  │  │    → Agent THẤY runtime errors REAL-TIME!          │  │
  │  │    → Agent BIẾT routes, layouts, components!       │  │
  │  │    → Agent ĐỌC logs, metadata, config!             │  │
  │  │    → Agent HIỂU cấu trúc app!                     │  │
  │  │    → Fix lỗi = chính xác! 🎯                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  KIẾN TRÚC TỔNG THỂ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌─────────────┐     ┌──────────────────┐               │
  │  │ AI Agent    │     │ next-devtools-mcp │               │
  │  │ (Claude,    │◄───►│ (MCP Client)      │               │
  │  │  Cursor...) │     │                    │               │
  │  └─────────────┘     └────────┬───────────┘               │
  │                               │                           │
  │                    MCP Protocol (stdio)                    │
  │                               │                           │
  │                     ┌─────────▼──────────┐                │
  │                     │ Next.js Dev Server  │                │
  │                     │ /_next/mcp endpoint │                │
  │                     │                     │                │
  │                     │ ┌─────────────────┐ │                │
  │                     │ │ get_errors      │ │                │
  │                     │ │ get_logs        │ │                │
  │                     │ │ get_page_meta   │ │                │
  │                     │ │ get_project_meta│ │                │
  │                     │ │ get_server_act  │ │                │
  │                     │ └─────────────────┘ │                │
  │                     └─────────────────────┘                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Getting Started — .mcp.json!

```
  SETUP — 1 FILE DUY NHẤT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Yêu cầu: Next.js 16+                                   │
  │                                                          │
  │  Tạo .mcp.json ở ROOT project:                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  {                                                 │  │
  │  │    "mcpServers": {                                 │  │
  │  │      "next-devtools": {                            │  │
  │  │        "command": "npx",                           │  │
  │  │        "args": ["-y", "next-devtools-mcp@latest"]  │  │
  │  │      }                                             │  │
  │  │    }                                               │  │
  │  │  }                                                 │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ĐÓ LÀ TẤT CẢ! 🎉                                    │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ 1. pnpm dev → Start dev server                   │  │
  │  │ 2. next-devtools-mcp TỰ ĐỘNG discover             │  │
  │  │ 3. Tìm Next.js instance đang chạy                │  │
  │  │ 4. Connect qua /_next/mcp endpoint                │  │
  │  │ 5. Agent sẵn sàng! 🤖                            │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  npx -y = auto-install nếu chưa có!                    │
  │  @latest = luôn dùng phiên bản mới nhất!               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Capabilities — Runtime Access + Dev Tools!

```
  APPLICATION RUNTIME ACCESS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Capability       │ Chi tiết                         │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Error Detection  │ Build errors, runtime errors,    │   │
  │  │                  │ type errors từ dev server!       │   │
  │  │                  │                                  │   │
  │  │ Live State       │ Real-time app state,             │   │
  │  │                  │ runtime information!              │   │
  │  │                  │                                  │   │
  │  │ Page Metadata    │ Routes, components,              │   │
  │  │                  │ rendering details!                │   │
  │  │                  │                                  │   │
  │  │ Server Actions   │ Inspect Server Actions,          │   │
  │  │                  │ component hierarchies!           │   │
  │  │                  │                                  │   │
  │  │ Dev Logs         │ Console output,                  │   │
  │  │                  │ server logs!                     │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  DEVELOPMENT TOOLS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌───────────────────┬─────────────────────────────────┐   │
  │  │ Tool              │ Chi tiết                        │   │
  │  ├───────────────────┼─────────────────────────────────┤   │
  │  │ Knowledge Base    │ Query Next.js docs + best       │   │
  │  │                   │ practices!                      │   │
  │  │                   │                                 │   │
  │  │ Migration Tools   │ Auto upgrade to Next.js 16!    │   │
  │  │                   │ Codemods + breaking changes!    │   │
  │  │                   │                                 │   │
  │  │ Cache Components  │ Setup + config assistance!      │   │
  │  │                   │                                 │   │
  │  │ Browser Testing   │ Playwright MCP integration!     │   │
  │  │                   │ Verify pages in browser!        │   │
  │  └───────────────────┴─────────────────────────────────┘   │
  │                                                            │
  │  ⚠️ Capabilities đang TIẾP TỤC mở rộng!                 │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Available Tools — 5 Tools Chi Tiết!

```
  5 MCP TOOLS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① get_errors                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Lấy build errors + runtime errors + type errors  │  │
  │  │  → Từ dev server ĐANG CHẠY!                        │  │
  │  │  → Agent biết LỖI GÌ + Ở ĐÂU → fix chính xác!  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② get_logs                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Path đến log file (browser + server output!)    │  │
  │  │  → Agent đọc console.log, warnings!                │  │
  │  │  → Debug behavioral issues!                         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ get_page_metadata                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Metadata về SPECIFIC page!                       │  │
  │  │  → Routes, components, rendering info!              │  │
  │  │  → Agent biết page dùng Server/Client Components!  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ get_project_metadata                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Project structure, config!                       │  │
  │  │  → Dev server URL (port)!                           │  │
  │  │  → Agent hiểu toàn bộ project!                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⑤ get_server_action_by_id                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Tìm Server Action bằng ID!                      │  │
  │  │  → Trả về source file + function name!             │  │
  │  │  → Debug Server Actions dễ dàng!                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Development Workflow + Agent Benefits!

```
  WORKFLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ①  pnpm dev                                             │
  │  ②  Agent tự connect via next-devtools-mcp              │
  │  ③  Mở app trong browser                                │
  │  ④  Hỏi agent → insights + diagnostics!               │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ Developer          Agent           Dev Server      │  │
  │  │     │                 │                │            │  │
  │  │     │─ pnpm dev ─────►│                │            │  │
  │  │     │                 │                │            │  │
  │  │     │                 │── discover ───►│            │  │
  │  │     │                 │◄─ connected ──│            │  │
  │  │     │                 │                │            │  │
  │  │     │─ "Fix errors"──►│                │            │  │
  │  │     │                 │── get_errors──►│            │  │
  │  │     │                 │◄── errors ────│            │  │
  │  │     │◄─ "Found issue" │                │            │  │
  │  │     │                 │                │            │  │
  │  │     │─ "What routes?"►│                │            │  │
  │  │     │                 │── get_meta ───►│            │  │
  │  │     │                 │◄── metadata ──│            │  │
  │  │     │◄─ "Routes: /" ─│                │            │  │
  │  │     │                 │                │            │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  AGENT BENEFITS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Context-Aware Suggestions:                            │
  │     → Đề xuất ĐÚNG CHỖ thêm feature dựa trên         │
  │       cấu trúc HIỆN TẠI!                               │
  │                                                          │
  │  ② Live Application State:                               │
  │     → Check config, routes, middleware REAL-TIME!       │
  │                                                          │
  │  ③ App Router Layout Understanding:                      │
  │     → Biết CHÍNH XÁC page + layout nào đang render!   │
  │                                                          │
  │  ④ Accurate Implementations:                             │
  │     → Generate code THEO patterns + conventions         │
  │       của PROJECT CỦA BẠN!                             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Examples — Error Detection + Upgrading!

```
  EXAMPLE 1: ERROR DETECTION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  User: "What errors are currently in my application?"    │
  │                                                          │
  │  Agent workflow:                                         │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ 1. discover_servers                                │  │
  │  │    → Tìm Next.js instances!                       │  │
  │  │                                                    │  │
  │  │ 2. call_tool: get_errors                           │  │
  │  │    → Query dev server cho errors!                 │  │
  │  │                                                    │  │
  │  │ 3. Response:                                       │  │
  │  │    {                                               │  │
  │  │      "success": true,                              │  │
  │  │      "port": 3000,                                 │  │
  │  │      "result": {                                   │  │
  │  │        "text": "Found errors in 1 session"         │  │
  │  │        "Session: /about"                           │  │
  │  │        "Error: Hydration failed"                   │  │
  │  │      }                                             │  │
  │  │    }                                               │  │
  │  │                                                    │  │
  │  │ 4. Agent phân tích:                                │  │
  │  │    "Hydration error trên /about —                  │  │
  │  │     server render 'server' nhưng client            │  │
  │  │     render 'client' → mismatch!"                  │  │
  │  │                                                    │  │
  │  │ 5. Agent fix → verify qua get_errors lần nữa!   │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  EXAMPLE 2: UPGRADING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  User: "Help me upgrade to Next.js 16"                   │
  │  → Agent phân tích version hiện tại                    │
  │  → Chạy codemods tự động                              │
  │  → Hướng dẫn breaking changes!                        │
  │                                                          │
  │  User: "When should I use 'use client'?"                 │
  │  → Agent query Knowledge Base                          │
  │  → Trả lời DỰA TRÊN docs + ví dụ từ codebase!      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. How It Works — /\_next/mcp Architecture!

```
  ARCHITECTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Next.js 16+ có BUILT-IN endpoint: /_next/mcp            │
  │  → Chạy TRONG dev server!                                │
  │  → KHÔNG cần setup thêm gì trong Next.js!               │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  Coding Agent (Claude/Cursor/Copilot...)             │  │
  │  │       │                                              │  │
  │  │       ▼                                              │  │
  │  │  ┌──────────────────────┐                            │  │
  │  │  │  next-devtools-mcp   │ ← BRIDGE!                 │  │
  │  │  │  (MCP Client/Proxy)  │                            │  │
  │  │  │                      │                            │  │
  │  │  │  ① Discover instances│                            │  │
  │  │  │  ② Forward tool calls│                            │  │
  │  │  │  ③ Unified interface │                            │  │
  │  │  └──────┬───────┬───────┘                            │  │
  │  │         │       │                                    │  │
  │  │    ┌────▼──┐ ┌──▼─────┐                              │  │
  │  │    │:3000  │ │:3001   │ ← Multiple instances!       │  │
  │  │    │/_next/│ │/_next/ │                              │  │
  │  │    │mcp   │ │mcp    │                              │  │
  │  │    │      │ │       │                              │  │
  │  │    │App A │ │App B  │                              │  │
  │  │    └──────┘ └───────┘                              │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY INSIGHT: DECOUPLED!                                   │
  │  → Agent interface ≠ Internal implementation             │
  │  → next-devtools-mcp có thể update RIÊNG!              │
  │  → Next.js endpoint có thể update RIÊNG!                │
  │  → Seamless across different projects!                   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §8. Troubleshooting!

```
  MCP NOT CONNECTING?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Checklist:                                               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  ☐ Next.js v16+? (v15 trở xuống KHÔNG có!)      │  │
  │  │  ☐ .mcp.json ở root project?                     │  │
  │  │  ☐ Config đúng format? (mcpServers → command)    │  │
  │  │  ☐ Dev server đang chạy? (npm run dev)           │  │
  │  │  ☐ Đã restart dev server sau khi thêm .mcp.json?│  │
  │  │  ☐ Agent đã load MCP server config?              │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — McpServerEngine!

```javascript
var McpServerEngine = (function () {
  // ═══════════════════════════════════
  // 1. MCP ENDPOINT (simulates /_next/mcp)
  // ═══════════════════════════════════
  var appState = {
    port: 3000,
    errors: [],
    logs: [],
    pages: {},
    serverActions: {},
    config: {},
  };

  function setupApp(config) {
    appState.port = config.port || 3000;
    appState.config = config;
    appState.pages = config.pages || {};
    appState.serverActions = config.serverActions || {};
    console.log("  🚀 Dev server on port " + appState.port);
  }

  function addError(session, type, message) {
    appState.errors.push({
      session: session,
      type: type,
      message: message,
      timestamp: Date.now(),
    });
  }

  function addLog(level, message) {
    appState.logs.push({
      level: level,
      message: message,
      timestamp: Date.now(),
    });
  }

  // ═══════════════════════════════════
  // 2. MCP TOOLS (5 tools)
  // ═══════════════════════════════════
  var tools = {
    get_errors: function () {
      if (appState.errors.length === 0) {
        return {
          success: true,
          port: appState.port,
          result: "No errors found! ✅",
        };
      }
      var sessions = {};
      for (var i = 0; i < appState.errors.length; i++) {
        var e = appState.errors[i];
        if (!sessions[e.session]) sessions[e.session] = [];
        sessions[e.session].push(e);
      }
      var text =
        "Found errors in " + Object.keys(sessions).length + " session(s):\n";
      for (var s in sessions) {
        text += "  Session: " + s + " (" + sessions[s].length + " errors)\n";
        for (var j = 0; j < sessions[s].length; j++) {
          text +=
            "    [" +
            sessions[s][j].type +
            "] " +
            sessions[s][j].message +
            "\n";
        }
      }
      return { success: true, port: appState.port, result: text };
    },

    get_logs: function () {
      var output = "Logs (" + appState.logs.length + " entries):\n";
      for (var i = 0; i < appState.logs.length; i++) {
        output +=
          "  [" +
          appState.logs[i].level +
          "] " +
          appState.logs[i].message +
          "\n";
      }
      return { success: true, port: appState.port, result: output };
    },

    get_page_metadata: function (pagePath) {
      var page = appState.pages[pagePath];
      if (!page)
        return { success: false, result: "Page not found: " + pagePath };
      return { success: true, port: appState.port, result: page };
    },

    get_project_metadata: function () {
      return {
        success: true,
        port: appState.port,
        result: {
          devUrl: "http://localhost:" + appState.port,
          pages: Object.keys(appState.pages),
          serverActions: Object.keys(appState.serverActions),
          config: appState.config.nextConfig || {},
        },
      };
    },

    get_server_action_by_id: function (actionId) {
      var action = appState.serverActions[actionId];
      if (!action)
        return { success: false, result: "Action not found: " + actionId };
      return { success: true, port: appState.port, result: action };
    },
  };

  // ═══════════════════════════════════
  // 3. MCP CLIENT (next-devtools-mcp sim)
  // ═══════════════════════════════════
  var discoveredServers = [];

  function discoverServers(ports) {
    discoveredServers = [];
    for (var i = 0; i < ports.length; i++) {
      console.log("  🔍 Scanning port " + ports[i] + "...");
      if (ports[i] === appState.port) {
        discoveredServers.push(ports[i]);
        console.log("  ✅ Found Next.js on :" + ports[i]);
      } else {
        console.log("  ❌ No Next.js on :" + ports[i]);
      }
    }
    return discoveredServers;
  }

  function callTool(toolName, args) {
    console.log("  🔧 call_tool: " + toolName);
    if (!tools[toolName]) {
      console.log("  ❌ Unknown tool: " + toolName);
      return null;
    }
    var result = tools[toolName](args);
    console.log("  📋 Result:", JSON.stringify(result).slice(0, 150));
    return result;
  }

  // ═══════════════════════════════════
  // 4. AGENT SIMULATION
  // ═══════════════════════════════════
  function agentQuery(question) {
    console.log('\n  👤 User: "' + question + '"');
    console.log("  🤖 Agent thinking...");

    // Pattern: error-related
    if (question.indexOf("error") >= 0 || question.indexOf("fix") >= 0) {
      discoverServers([3000, 3001]);
      return callTool("get_errors");
    }

    // Pattern: routes/pages
    if (question.indexOf("route") >= 0 || question.indexOf("page") >= 0) {
      return callTool("get_project_metadata");
    }

    // Pattern: logs
    if (question.indexOf("log") >= 0) {
      return callTool("get_logs");
    }

    // Pattern: server action
    if (question.indexOf("action") >= 0) {
      return callTool(
        "get_server_action_by_id",
        question.match(/[a-f0-9]{6}/)?.[0],
      );
    }

    console.log("  📚 Querying Knowledge Base...");
    return { result: "Documentation-backed answer!" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  MCP SERVER ENGINE DEMO             ║");
    console.log("╚════════════════════════════════════╝");

    // Setup app
    console.log("\n── Setup ──");
    setupApp({
      port: 3000,
      pages: {
        "/": {
          route: "/",
          layout: "RootLayout",
          components: ["Hero", "Features"],
          rendering: "static",
        },
        "/about": {
          route: "/about",
          layout: "RootLayout",
          components: ["AboutContent"],
          rendering: "dynamic",
        },
        "/products/[id]": {
          route: "/products/[id]",
          layout: "RootLayout",
          rendering: "dynamic",
        },
      },
      serverActions: {
        abc123: {
          file: "app/actions.ts",
          function: "createProduct",
          method: "POST",
        },
      },
      nextConfig: { turbopack: true, version: "16.0.0" },
    });

    // Add some errors + logs
    addError("/about", "runtime", "Hydration failed");
    addError("/about", "recoverable", 'Server: "server" vs Client: "client"');
    addLog("info", "Server started on :3000");
    addLog("warn", "Large page bundle: /products");

    // Scenario 1: Error detection
    console.log("\n── Scenario 1: Error Detection ──");
    agentQuery("What errors are in my application?");

    // Scenario 2: Routes
    console.log("\n── Scenario 2: Routes ──");
    agentQuery("What routes does my app have?");

    // Scenario 3: Logs
    console.log("\n── Scenario 3: Logs ──");
    agentQuery("Show me the logs");

    // Scenario 4: Page metadata
    console.log("\n── Scenario 4: Page Metadata ──");
    callTool("get_page_metadata", "/about");

    // Scenario 5: Server Action
    console.log("\n── Scenario 5: Server Action ──");
    callTool("get_server_action_by_id", "abc123");
  }

  return { demo: demo };
})();
// Chạy: McpServerEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: MCP là gì? Tại sao AI agents cần nó?

<details><summary>Đáp án</summary>

**MCP** (Model Context Protocol) = giao thức **chuẩn mở** cho phép AI agents giao tiếp với ứng dụng qua **standardized interface**.

**Tại sao cần**:

- Trước MCP: Agent chỉ đọc source code (text files) → **KHÔNG biết** app đang chạy thế nào, có lỗi gì, routes nào active
- Sau MCP: Agent **truy cập real-time** vào dev server → thấy runtime errors, page metadata, logs, Server Actions, config → fix lỗi **chính xác**, generate code **phù hợp** với project patterns

**Standardized** = bất kỳ MCP-compatible agent nào (Claude, Cursor, Copilot...) đều dùng được, không cần custom integration cho từng tool!

</details>

---

**Câu 2**: 5 tools trong next-devtools-mcp làm gì?

<details><summary>Đáp án</summary>

| Tool                      | Chức năng                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| `get_errors`              | Lấy build errors + runtime errors + type errors từ dev server đang chạy |
| `get_logs`                | Path đến log file (browser console + server output)                     |
| `get_page_metadata`       | Metadata của specific page: routes, components, rendering mode          |
| `get_project_metadata`    | Structure, config, dev server URL (port) của toàn project               |
| `get_server_action_by_id` | Tìm Server Action bằng ID → trả về source file + function name          |

Agent kết hợp các tools này: phát hiện lỗi (`get_errors`) → tìm page bị lỗi (`get_page_metadata`) → check logs (`get_logs`) → fix chính xác!

</details>

---

**Câu 3**: `/_next/mcp` endpoint hoạt động thế nào?

<details><summary>Đáp án</summary>

**Architecture 3 layers**:

1. **Next.js dev server** (built-in): Expose `/_next/mcp` endpoint — chạy TRONG dev server, không cần config
2. **next-devtools-mcp** (bridge): Auto-discover Next.js instances trên các ports → forward tool calls từ agent → đến đúng dev server
3. **AI Agent**: Gọi tools qua MCP protocol (stdio) → gửi đến next-devtools-mcp

**Key design**: **Decoupled** — agent interface và internal implementation tách biệt:

- next-devtools-mcp có thể update riêng (npm package)
- Next.js endpoint có thể update riêng (framework)
- Hỗ trợ **multiple instances** (port 3000, 3001...) cùng lúc!

</details>

---

**Câu 4**: Chỉ cần setup gì để dùng MCP? Tại sao đơn giản vậy?

<details><summary>Đáp án</summary>

**Chỉ cần**: Tạo `.mcp.json` ở root project với config cho `next-devtools-mcp`. **Done!**

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Đơn giản vì**:

1. **Next.js 16+ built-in**: `/_next/mcp` endpoint đã có sẵn trong framework — không cần install, không cần config trong `next.config.js`
2. **Auto-discovery**: `next-devtools-mcp` tự tìm Next.js instances đang chạy
3. **npx -y**: Auto-install package nếu chưa có
4. **@latest**: Luôn dùng phiên bản mới nhất

Developer chỉ quan tâm: `.mcp.json` → `pnpm dev` → agent sẵn sàng!

</details>
