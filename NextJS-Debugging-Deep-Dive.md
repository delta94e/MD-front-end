# Next.js Debugging — Deep Dive!

> **Chủ đề**: Debugging Next.js — VS Code, Chrome, Firefox, WebStorm!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/debugging
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Debug Next.js Ở Đâu?](#1)
2. [§2. VS Code — 4 Launch Configurations](#2)
3. [§3. JetBrains WebStorm](#3)
4. [§4. Browser DevTools — Client-side](#4)
5. [§5. Browser DevTools — Server-side (--inspect)](#5)
6. [§6. React Developer Tools](#6)
7. [§7. Error Overlay & Server Errors](#7)
8. [§8. Debugging on Windows](#8)
9. [§9. Tự Viết — DebugEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Debug Next.js Ở Đâu?

```
  NEXT.JS DEBUGGING — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Next.js có 2 LOẠI code cần debug:                         │
  │                                                            │
  │  ┌─────────────────────┐    ┌─────────────────────┐        │
  │  │ SERVER-SIDE          │    │ CLIENT-SIDE          │        │
  │  │                      │    │                      │        │
  │  │ • Server Components  │    │ • Client Components  │        │
  │  │ • Route Handlers     │    │ • Event handlers     │        │
  │  │ • Server Actions     │    │ • Hooks (useState..) │        │
  │  │ • Middleware/Proxy    │    │ • Browser APIs       │        │
  │  │ • API Routes         │    │ • Styling/animations │        │
  │  │                      │    │                      │        │
  │  │ Debug với:           │    │ Debug với:            │        │
  │  │ → Node.js --inspect  │    │ → Browser DevTools   │        │
  │  │ → VS Code debugger   │    │ → VS Code debugger   │        │
  │  │ → chrome://inspect   │    │ → React DevTools     │        │
  │  └─────────────────────┘    └─────────────────────┘        │
  │                                                            │
  │  TOOLS:                                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Tool         │ Server │ Client │ Full Stack          │  │
  │  ├──────────────┼────────┼────────┼─────────────────────┤  │
  │  │ VS Code      │ ✅     │ ✅     │ ✅ (1 click!)      │  │
  │  │ WebStorm     │ ✅     │ ✅     │ ✅                 │  │
  │  │ Chrome DT    │ ✅     │ ✅     │ ✅                 │  │
  │  │ Firefox DT   │ ✅     │ ✅     │ ✅                 │  │
  │  │ React DT     │ ❌     │ ✅     │ ❌                 │  │
  │  │ Node.js any  │ ✅     │ ❌     │ ❌                 │  │
  │  └──────────────┴────────┴────────┴─────────────────────┘  │
  │                                                            │
  │  SOURCE MAPS: Full support!                                │
  │  → Debug code GỐC (TypeScript, JSX) — không compiled!    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. VS Code — 4 Launch Configurations!

```
  VS CODE LAUNCH.JSON — 4 CONFIGS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① "Next.js: debug server-side"                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ type: "node-terminal"                                │  │
  │  │ command: "npm run dev -- --inspect"                   │  │
  │  │                                                      │  │
  │  │ → Chạy Next.js dev + Node.js inspect mode!          │  │
  │  │ → Debug Server Components, Route Handlers, Actions  │  │
  │  │ → Breakpoints trong server code hoạt động!          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② "Next.js: debug client-side"                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ type: "chrome"                                       │  │
  │  │ url: "http://localhost:3000"                          │  │
  │  │                                                      │  │
  │  │ → Mở Chrome + VS Code connected!                    │  │
  │  │ → Debug Client Components, event handlers            │  │
  │  │ → Breakpoints trong browser code hoạt động!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ "Next.js: debug client-side (Firefox)"                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ type: "firefox"                                      │  │
  │  │ url: "http://localhost:3000"                          │  │
  │  │ reAttach: true                                        │  │
  │  │ pathMappings: webpack://_N_E → workspaceFolder        │  │
  │  │                                                      │  │
  │  │ → Cần Firefox Debugger extension!                    │  │
  │  │ → pathMappings map source files!                     │  │
  │  │ → reAttach: tự kết nối lại khi reload!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ "Next.js: debug full stack" ← BEST!                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ type: "node"                                         │  │
  │  │ program: "node_modules/next/dist/bin/next"            │  │
  │  │ runtimeArgs: ["--inspect"]                            │  │
  │  │ skipFiles: ["<node_internals>/**"]                    │  │
  │  │ serverReadyAction:                                    │  │
  │  │   action: "debugWithEdge" (hoặc "debugWithChrome")   │  │
  │  │   killOnServerStop: true                              │  │
  │  │   pattern: "- Local:.+(https?://.+)"                  │  │
  │  │                                                      │  │
  │  │ → Server + Client debug CÙNG LÚC!                   │  │
  │  │ → 1 config duy nhất — debug MỌI THỨ!               │  │
  │  │ → Tự detect server ready → mở browser!              │  │
  │  │ → Kill browser khi server stop!                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**launch.json đầy đủ:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev -- --inspect"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug client-side (Firefox)",
      "type": "firefox",
      "request": "launch",
      "url": "http://localhost:3000",
      "reAttach": true,
      "pathMappings": [
        {
          "url": "webpack://_N_E",
          "path": "${workspaceFolder}"
        }
      ]
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "runtimeArgs": ["--inspect"],
      "skipFiles": ["<node_internals>/**"],
      "serverReadyAction": {
        "action": "debugWithEdge",
        "killOnServerStop": true,
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "webRoot": "${workspaceFolder}"
      }
    }
  ]
}
```

```
  LƯU Ý:
  ┌──────────────────────────────────────────────────────────┐
  │ → Turborepo? Thêm "cwd": "${workspaceFolder}/apps/web" │
  │ → Port khác? Đổi 3000 → port thực tế                  │
  │ → Chrome thay Edge? "debugWithEdge" → "debugWithChrome"│
  │ → Yarn? "npm run dev" → "yarn dev"                     │
  │ → pnpm? "npm run dev" → "pnpm dev"                    │
  │ → Start: Ctrl+Shift+D → chọn config → F5!             │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. JetBrains WebStorm!

```
  WEBSTORM SETUP:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① Click dropdown "Edit Configurations..."               │
  │ ② Tạo "JavaScript Debug" configuration                  │
  │ ③ URL: http://localhost:3000                             │
  │ ④ Chọn Browser (Chrome/Firefox)                          │
  │ ⑤ Check "Store as project file" (chia sẻ team!)        │
  │ ⑥ Click OK → Run debug configuration!                  │
  │                                                          │
  │ KẾT QUẢ:                                                │
  │ → 2 apps trong debug mode:                              │
  │   ① NextJS Node application (server)                    │
  │   ② Client/Browser application (client)                 │
  │ → Breakpoints hoạt động CẢ HAI!                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Browser DevTools — Client-side!

```
  CLIENT-SIDE DEBUGGING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① Chạy: npm run dev                                      │
  │  ② Mở http://localhost:3000                                │
  │                                                            │
  │  CHROME:                                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Ctrl+Shift+J (Win/Linux) / ⌥+⌘+I (Mac)             │  │
  │  │  → Sources tab                                       │  │
  │  │  → Ctrl+P / ⌘+P → tìm file!                        │  │
  │  │  → Files tại: webpack://_N_E/./                      │  │
  │  │  → Click line number → set breakpoint!               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FIREFOX:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Ctrl+Shift+I (Win/Linux) / ⌥+⌘+I (Mac)             │  │
  │  │  → Debugger tab                                      │  │
  │  │  → Ctrl+P / ⌘+P → tìm file!                        │  │
  │  │  → Hoặc dùng file tree bên trái!                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PROGRAMMATIC BREAKPOINT:                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // Trong code:                                      │  │
  │  │  function handleClick() {                             │  │
  │  │    debugger  // ← Browser DỪNG tại đây!             │  │
  │  │    doSomething()                                      │  │
  │  │  }                                                    │  │
  │  │  → Execution PAUSE!                                  │  │
  │  │  → File tự mở trong debug area!                     │  │
  │  │  → Inspect variables, step through!                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Browser DevTools — Server-side (--inspect)!

```
  SERVER-SIDE DEBUGGING — --inspect:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① Chạy với --inspect flag:                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  $ pnpm dev --inspect                                │  │
  │  │                                                      │  │
  │  │  Output:                                              │  │
  │  │  Debugger listening on                                │  │
  │  │    ws://127.0.0.1:9229/0cf90313-...                  │  │
  │  │  ready - started server on 0.0.0.0:3000               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② Kết nối debugger:                                      │
  │                                                            │
  │  CHROME:                                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Mở tab mới: chrome://inspect                      │  │
  │  │  → Tìm Next.js app trong "Remote Target"             │  │
  │  │  → Click "inspect"                                    │  │
  │  │  → Sources tab → debug server code!                  │  │
  │  │  → Files: webpack://{app-name}/./                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FIREFOX:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  → Mở tab mới: about:debugging                       │  │
  │  │  → Click "This Firefox" (sidebar trái)               │  │
  │  │  → Tìm Next.js app trong "Remote Targets"            │  │
  │  │  → Click "Inspect"                                    │  │
  │  │  → Debugger tab → debug server code!                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ADVANCED FLAGS:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  --inspect          → Debugger listen, app chạy!    │  │
  │  │  --inspect-brk      → PAUSE ngay dòng đầu tiên!    │  │
  │  │  --inspect-wait      → ĐỢI debugger attach rồi chạy│  │
  │  │  --inspect=0.0.0.0  → Remote debug (Docker!)        │  │
  │  │                                                      │  │
  │  │  Dùng inspect-brk/wait:                              │  │
  │  │  NODE_OPTIONS=--inspect-brk next dev                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. React Developer Tools!

```
  REACT DEVTOOLS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ Browser extension (Chrome / Firefox / Edge)              │
  │                                                          │
  │ CHỨC NĂNG:                                               │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │ ✅ Inspect React component tree                    │   │
  │ │ ✅ Edit props + state TRỰC TIẾP!                   │   │
  │ │ ✅ Identify performance problems                    │   │
  │ │ ✅ Xem re-render highlights                        │   │
  │ │ ✅ View hooks (useState, useEffect...)              │   │
  │ │ ✅ Profiler — measure render times                  │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  │ 2 TABS:                                                  │
  │ ┌─────────────────┬──────────────────────────────┐       │
  │ │ ⚛ Components    │ Inspect + edit component tree│       │
  │ │ ⚡ Profiler     │ Record + analyze renders     │       │
  │ └─────────────────┴──────────────────────────────┘       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Error Overlay & Server Errors!

```
  SERVER ERROR DEBUGGING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Khi gặp error trong dev:                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  ┌─────────────────────────────────────┐             │  │
  │  │  │        ERROR OVERLAY                 │             │  │
  │  │  │                                      │             │  │
  │  │  │  TypeError: Cannot read property..   │             │  │
  │  │  │                                      │             │  │
  │  │  │  at Page (app/page.tsx:15:3)         │             │  │
  │  │  │  at renderWithHooks (...)            │             │  │
  │  │  │                                      │             │  │
  │  │  │  Next.js v15.0.0                     │             │  │
  │  │  │  [Node.js icon] ← CLICK ĐÂY!       │             │  │
  │  │  └─────────────────────────────────────┘             │  │
  │  │                                                      │  │
  │  │  Click Node.js icon:                                  │  │
  │  │  → Copy DevTools URL vào clipboard!                  │  │
  │  │  → Mở tab mới → paste URL!                          │  │
  │  │  → Inspect Next.js SERVER process!                   │  │
  │  │  → Debug server-side errors trực tiếp!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §8. Debugging on Windows!

```
  WINDOWS — LƯU Ý QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ⚠️ Windows Defender CHẬM Fast Refresh!                   │
  │                                                          │
  │ VẤN ĐỀ:                                                 │
  │ → Windows Defender scan MỌI FILE được đọc!             │
  │ → Next.js đọc HÀNG NGÀN files mỗi lần HMR!           │
  │ → Scan = CHẬM! Fast Refresh bị lag!                    │
  │                                                          │
  │ FIX:                                                     │
  │ → Disable Windows Defender cho project folder!          │
  │ → Settings → Windows Security → Exclusions             │
  │ → Hoặc dùng WSL2 (Linux subsystem)!                   │
  │                                                          │
  │ ⚠️ Known issue — KHÔNG phải lỗi Next.js!               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — DebugEngine!

```javascript
var DebugEngine = (function () {
  // ═══════════════════════════════════
  // 1. BREAKPOINT MANAGER
  // ═══════════════════════════════════
  var breakpoints = [];

  function addBreakpoint(file, line, condition) {
    var bp = {
      id: breakpoints.length + 1,
      file: file,
      line: line,
      condition: condition || null,
      enabled: true,
      hitCount: 0,
    };
    breakpoints.push(bp);
    console.log(
      "  ⏸️ Breakpoint #" +
        bp.id +
        ": " +
        file +
        ":" +
        line +
        (condition ? " (if " + condition + ")" : ""),
    );
    return bp;
  }

  // ═══════════════════════════════════
  // 2. CALL STACK SIMULATOR
  // ═══════════════════════════════════
  var callStack = [];

  function pushFrame(name, file, line) {
    callStack.push({ name: name, file: file, line: line });
  }

  function popFrame() {
    return callStack.pop();
  }

  function printCallStack() {
    console.log("  📋 Call Stack:");
    for (var i = callStack.length - 1; i >= 0; i--) {
      var f = callStack[i];
      console.log(
        "    " +
          (callStack.length - i) +
          ". " +
          f.name +
          " (" +
          f.file +
          ":" +
          f.line +
          ")",
      );
    }
  }

  // ═══════════════════════════════════
  // 3. VARIABLE INSPECTOR
  // ═══════════════════════════════════
  function inspectVariables(scope) {
    console.log("  🔍 Variables:");
    for (var key in scope) {
      var val = scope[key];
      var type = typeof val;
      var display = type === "object" ? JSON.stringify(val) : String(val);
      console.log("    " + key + " = " + display + " (" + type + ")");
    }
  }

  // ═══════════════════════════════════
  // 4. SOURCE MAP SIMULATOR
  // ═══════════════════════════════════
  function resolveSourceMap(compiledFile, compiledLine) {
    var mappings = {
      ".next/server/page.js:42": "app/page.tsx:15",
      ".next/static/chunks/main.js:1337": "components/Button.tsx:8",
      ".next/server/actions.js:99": "app/actions.ts:23",
    };
    var key = compiledFile + ":" + compiledLine;
    var original = mappings[key] || "unknown";
    console.log("  🗺️ Source map: " + key + " → " + original);
    return original;
  }

  // ═══════════════════════════════════
  // 5. NODE INSPECTOR SIMULATOR
  // ═══════════════════════════════════
  function startInspector(port) {
    port = port || 9229;
    var wsUrl =
      "ws://127.0.0.1:" + port + "/" + Math.random().toString(36).slice(2, 10);
    console.log("  🔌 Debugger listening on " + wsUrl);
    console.log("  🌐 Open chrome://inspect to connect");
    return wsUrl;
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  DEBUG ENGINE DEMO                  ║");
    console.log("╚════════════════════════════════════╝");

    // Start inspector
    console.log("\n── Start Inspector ──");
    startInspector(9229);

    // Set breakpoints
    console.log("\n── Set Breakpoints ──");
    addBreakpoint("app/page.tsx", 15);
    addBreakpoint("app/actions.ts", 23, "user.isAdmin");
    addBreakpoint("components/Button.tsx", 8);

    // Simulate execution hitting breakpoint
    console.log("\n── Execution → Hit Breakpoint! ──");
    pushFrame("renderToHTML", "next/server/render.js", 100);
    pushFrame("Page", "app/page.tsx", 10);
    pushFrame("getUser", "data/user.ts", 5);
    console.log("  ⏸️ PAUSED at app/page.tsx:15");
    printCallStack();

    // Inspect variables
    console.log("\n── Inspect Variables ──");
    inspectVariables({
      user: { name: "Alice", id: 1 },
      slug: "alice",
      isAdmin: false,
    });

    // Source map resolution
    console.log("\n── Source Maps ──");
    resolveSourceMap(".next/server/page.js", 42);
    resolveSourceMap(".next/static/chunks/main.js", 1337);
    resolveSourceMap(".next/server/actions.js", 99);
  }

  return { demo: demo };
})();
// Chạy: DebugEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: 4 VS Code launch configurations khác nhau thế nào?

<details><summary>Đáp án</summary>

| Config                    | Type          | Debug           | Cách hoạt động                                                                                    |
| ------------------------- | ------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| **server-side**           | node-terminal | Server code     | Chạy `npm run dev --inspect`, attach Node.js debugger                                             |
| **client-side**           | chrome        | Browser code    | Mở Chrome, connect VS Code debugger qua Chrome DevTools Protocol                                  |
| **client-side (Firefox)** | firefox       | Browser code    | Mở Firefox, cần extension, `pathMappings` map webpack sources                                     |
| **full stack** ⭐         | node          | Server + Client | Chạy Next.js binary trực tiếp, `serverReadyAction` tự mở browser khi ready, debug CẢ HAI cùng lúc |

**Full stack** là tốt nhất: 1 config, F5 → debug mọi thứ!

</details>

---

**Câu 2**: --inspect, --inspect-brk, --inspect-wait khác nhau?

<details><summary>Đáp án</summary>

| Flag             | Hành vi                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--inspect`      | Debugger listen + app **CHẠY NGAY**. Attach debugger bất cứ lúc nào                                                   |
| `--inspect-brk`  | Debugger listen + **PAUSE NGAY dòng đầu tiên**. Chờ debugger attach rồi mới continue. Dùng khi cần debug startup code |
| `--inspect-wait` | Debugger listen + **ĐỢI debugger attach** rồi mới chạy. Giống inspect-brk nhưng không pause ở dòng đầu                |

Dùng inspect-brk/wait: `NODE_OPTIONS=--inspect-brk next dev` (vì là flags của Node.js, không phải Next.js CLI)

`--inspect=0.0.0.0`: Cho phép remote debug từ ngoài localhost (Docker, remote server)

</details>

---

**Câu 3**: Source files có path gì trong DevTools? Tại sao?

<details><summary>Đáp án</summary>

- **Client-side**: `webpack://_N_E/./` — `_N_E` là namespace mặc định cho Next.js client bundles
- **Server-side**: `webpack://{app-name}/./` — `{app-name}` từ `name` trong `package.json`

Tại sao `webpack://`? Vì Next.js dùng Webpack (hoặc Turbopack) bundler. Source maps map từ compiled output → original source. DevTools hiểu `webpack://` protocol → hiển thị file gốc (TypeScript/JSX) thay vì compiled JS.

Dùng `Ctrl+P` / `⌘+P` để quick-search files thay vì navigate thủ công trong tree!

</details>

---

**Câu 4**: Windows Defender ảnh hưởng Next.js thế nào?

<details><summary>Đáp án</summary>

Windows Defender (real-time protection) scan **MỌI FILE** khi được đọc. Next.js HMR (Hot Module Replacement) đọc **hàng ngàn files** mỗi lần code thay đổi → Defender scan tất cả → **Fast Refresh bị chậm nghiêm trọng**.

Fix:

1. **Exclude project folder** trong Windows Security → Virus & threat protection → Exclusions
2. Hoặc dùng **WSL2** (Windows Subsystem for Linux) — filesystem Linux không bị Defender scan
3. Hoặc **tạm disable** real-time protection (không khuyến khích lâu dài)

Đây là **known issue** — không phải bug của Next.js mà do cách Windows Defender hoạt động.

</details>
