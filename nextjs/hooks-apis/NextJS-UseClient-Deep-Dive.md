# Next.js `use client` Directive — Deep Dive!

> **Chủ đề**: `use client` — Client Components & Interactivity!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/directives/use-client
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — use client!](#1)
2. [§2. Usage — Entry Point + Serialization!](#2)
3. [§3. Nesting — Server + Client Composition!](#3)
4. [§4. Server vs Client — Complete Rules!](#4)
5. [§5. Tự Viết — UseClientEngine!](#5)
6. [§6. Câu Hỏi Luyện Tập](#6)

---

## §1. Tổng Quan — use client!

```
  "use client" DIRECTIVE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Declares ENTRY POINT for client-side rendering!     │
  │  → React feature (not Next.js specific!)                  │
  │                                                            │
  │  PURPOSE: Create interactive UI requiring:                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① State management    → useState, useReducer!       │  │
  │  │ ② Event handling      → onClick, onChange, etc.!    │  │
  │  │ ③ Browser APIs        → window, document, etc.!    │  │
  │  │ ④ Effects             → useEffect, useLayoutEffect!│  │
  │  │ ⑤ Custom hooks        → useMyHook() with state!    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SYNTAX:                                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'   // ← MUST be FIRST! Before imports! │  │
  │  │                                                      │  │
  │  │ import { useState } from 'react'                     │  │
  │  │ // ... rest of component                             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ KEY INSIGHT — Boundary, NOT Individual!               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ You do NOT need 'use client' in EVERY file!         │  │
  │  │                                                      │  │
  │  │ 'use client' defines the CLIENT-SERVER BOUNDARY!     │  │
  │  │                                                      │  │
  │  │ Only add to files whose exports are DIRECTLY         │  │
  │  │ imported and rendered by Server Components!           │  │
  │  │                                                      │  │
  │  │ ┌──────────────────────────────────────┐             │  │
  │  │ │ Server Component (page.tsx)           │             │  │
  │  │ │   │                                   │             │  │
  │  │ │   ├── imports Counter.tsx             │             │  │
  │  │ │   │   'use client' ← NEEDED HERE!    │ ← Boundary!│  │
  │  │ │   │   │                               │             │  │
  │  │ │   │   └── imports Button.tsx          │             │  │
  │  │ │   │       NO 'use client' needed!     │ ← Inside  │  │
  │  │ │   │       (already inside boundary!)  │   boundary!│  │
  │  │ │   │                                   │             │  │
  │  │ │   └── imports Header.tsx              │             │  │
  │  │ │       Server Component (no directive!)│             │  │
  │  │ └──────────────────────────────────────┘             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Usage — Entry Point + Serialization!

```
  USAGE RULES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  RULE 1: 'use client' at TOP, before imports!              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                  // ← LINE 1!          │  │
  │  │                                                      │  │
  │  │ import { useState } from 'react'                     │  │
  │  │                                                      │  │
  │  │ export default function Counter() {                  │  │
  │  │   const [count, setCount] = useState(0)              │  │
  │  │   return (                                           │  │
  │  │     <div>                                            │  │
  │  │       <p>Count: {count}</p>                          │  │
  │  │       <button onClick={() => setCount(count + 1)}>   │  │
  │  │         Increment                                    │  │
  │  │       </button>                                      │  │
  │  │     </div>                                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  RULE 2: Props MUST be SERIALIZABLE!                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ When Server passes props to Client:                  │  │
  │  │   Server → serialize → network → deserialize → Client│  │
  │  │                                                      │  │
  │  │ ✅ SERIALIZABLE types:                               │  │
  │  │   • string, number, boolean, null, undefined         │  │
  │  │   • Date, Map, Set, TypedArray                       │  │
  │  │   • Plain objects { key: value }                     │  │
  │  │   • Arrays [1, 2, 3]                                 │  │
  │  │   • JSX elements (React elements!)                   │  │
  │  │   • Server Actions (functions with 'use server'!)    │  │
  │  │                                                      │  │
  │  │ ❌ NOT serializable:                                 │  │
  │  │   • Regular functions! (not Server Actions!)         │  │
  │  │   • Class instances!                                 │  │
  │  │   • Symbols, WeakMap, WeakSet!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ❌ WRONG — Function prop from Server!                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // page.tsx (Server Component)                       │  │
  │  │ function handleClick() { console.log('clicked') }    │  │
  │  │ <Counter onClick={handleClick} />  // ❌ ERROR!     │  │
  │  │                                                      │  │
  │  │ // counter.tsx (Client Component)                    │  │
  │  │ 'use client'                                         │  │
  │  │ export default function Counter({ onClick }) {       │  │
  │  │   return <button onClick={onClick}>...</button>      │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Function is NOT serializable! ❌                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ✅ CORRECT — Server Action or define inside Client!      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // Option A: Server Action (serializable!)           │  │
  │  │ async function handleClick() {                       │  │
  │  │   'use server'               // ← Server Action!   │  │
  │  │   console.log('clicked')                             │  │
  │  │ }                                                    │  │
  │  │ <Counter onClick={handleClick} />  // ✅ OK!        │  │
  │  │                                                      │  │
  │  │ // Option B: Define handler IN Client Component!     │  │
  │  │ 'use client'                                         │  │
  │  │ export default function Counter() {                  │  │
  │  │   function handleClick() { console.log('clicked') }  │  │
  │  │   return <button onClick={handleClick}>...</button>  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Nesting — Server + Client Composition!

```
  COMPOSITION PATTERN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  3 TYPES of Components:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Server Components → static, data, SEO!           │  │
  │  │ ② Client Components → state, effects, browser!     │  │
  │  │ ③ Shared Components → no directive = flexible!      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NESTING EXAMPLE:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // page.tsx — Server Component (default!)            │  │
  │  │ import Header from './header'    // Server!          │  │
  │  │ import Counter from './counter'  // Client!          │  │
  │  │                                                      │  │
  │  │ export default function Page() {                     │  │
  │  │   return (                                           │  │
  │  │     <div>                                            │  │
  │  │       <Header />     // ← Server! Static!           │  │
  │  │       <Counter />    // ← Client! Interactive!      │  │
  │  │     </div>                                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TREE VISUALIZATION:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │    Page (SERVER) ─────────────────────┐               │  │
  │  │      │                               │               │  │
  │  │      ├── Header (SERVER)             │               │  │
  │  │      │     │                         │               │  │
  │  │      │     ├── Logo                  │    SERVER     │  │
  │  │      │     └── Nav                   │    BOUNDARY   │  │
  │  │      │                               │               │  │
  │  │  ════╪═══════════════════════════════╪═══ BOUNDARY ══│  │
  │  │      │                               │               │  │
  │  │      └── Counter (CLIENT) ──┐        │               │  │
  │  │            │               │        │    CLIENT     │  │
  │  │            ├── useState()  │        │    BOUNDARY   │  │
  │  │            ├── onClick     │        │               │  │
  │  │            └── Button      │        │               │  │
  │  │                (no 'use client'     │               │  │
  │  │                 needed! Already     │               │  │
  │  │                 inside boundary!)   │               │  │
  │  │                                      │               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  RULES:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Server = default (no directive needed!)           │  │
  │  │ ② Client = 'use client' at file top!                │  │
  │  │ ③ Modules imported by Client = also Client!         │  │
  │  │   (no separate 'use client' needed!)                │  │
  │  │ ④ Server CAN render Client as child!                │  │
  │  │ ⑤ Client CANNOT import Server directly!             │  │
  │  │   (but CAN receive as children prop!)               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Server vs Client — Complete Rules!

```
  SERVER vs CLIENT — Complete Comparison:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────┬─────────────┬─────────────────────┐ │
  │  │ Feature            │ Server ✅   │ Client ✅           │ │
  │  ├────────────────────┼─────────────┼─────────────────────┤ │
  │  │ Data fetching      │ ✅ async!  │ ⚠️ useEffect/SWR! │ │
  │  │ Database access    │ ✅ direct! │ ❌ via API only!   │ │
  │  │ Secrets/env vars   │ ✅ safe!   │ ❌ NEXT_PUBLIC only│ │
  │  │ useState/useReducer│ ❌ NO!     │ ✅ YES!            │ │
  │  │ useEffect          │ ❌ NO!     │ ✅ YES!            │ │
  │  │ Event handlers     │ ❌ NO!     │ ✅ YES! onClick!   │ │
  │  │ Browser APIs       │ ❌ NO!     │ ✅ window, DOM!    │ │
  │  │ Custom hooks       │ ⚠️ limited│ ✅ with state!     │ │
  │  │ JS bundle size     │ ✅ ZERO!  │ ⚠️ Adds to bundle!│ │
  │  │ SEO/SSR            │ ✅ great! │ ⚠️ hydrated later! │ │
  │  │ Render location    │ Server only│ Server + Client!    │ │
  │  │ Can import         │ Server+    │ Client modules      │ │
  │  │                    │ Client     │ only!               │ │
  │  └────────────────────┴─────────────┴─────────────────────┘ │
  │                                                              │
  │  RENDERING FLOW:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Server:                                              │    │
  │  │   ① Server Components render to HTML! ⚡            │    │
  │  │   ② Client Components render to HTML + send JS!    │    │
  │  │   ③ Send full HTML to browser!                     │    │
  │  │                                                      │    │
  │  │ Client (browser):                                    │    │
  │  │   ④ Show HTML immediately! (fast first paint!)     │    │
  │  │   ⑤ Download Client Component JS bundles!          │    │
  │  │   ⑥ HYDRATE: attach event listeners + state!       │    │
  │  │   ⑦ Client Components now interactive! ✅         │    │
  │  │                                                      │    │
  │  │   Server Components = NO JS sent! ZERO bundle! ✅  │    │
  │  │   Client Components = JS sent + hydrated! ⚠️      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHILDREN PATTERN (Server inside Client!):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // page.tsx (Server)                                 │    │
  │  │ <ClientLayout>                                       │    │
  │  │   <ServerSidebar />  // ← Server INSIDE Client!    │    │
  │  │ </ClientLayout>                                      │    │
  │  │                                                      │    │
  │  │ // ClientLayout.tsx                                  │    │
  │  │ 'use client'                                         │    │
  │  │ export function ClientLayout({ children }) {         │    │
  │  │   const [open, setOpen] = useState(true)             │    │
  │  │   return <div>{open && children}</div>               │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → children = Server Component passed as prop!       │    │
  │  │ → Rendered on server, passed as serialized JSX!     │    │
  │  │ → Client Component doesn't import Server!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — UseClientEngine!

```javascript
var UseClientEngine = (function () {
  // ═══════════════════════════════════
  // 1. COMPONENT REGISTRY
  // ═══════════════════════════════════
  var components = {};
  var clientBoundaryFiles = {};

  function registerComponent(name, config) {
    components[name] = {
      name: name,
      directive: config.directive || null, // 'use client', 'use server', null
      hasState: config.hasState || false,
      hasEffects: config.hasEffects || false,
      hasEventHandlers: config.hasEventHandlers || false,
      usesBrowserAPIs: config.usesBrowserAPIs || false,
      imports: config.imports || [],
      props: config.props || [],
    };
  }

  // ═══════════════════════════════════
  // 2. BOUNDARY RESOLVER
  // ═══════════════════════════════════
  function resolveBoundary(componentName, parentIsClient) {
    var comp = components[componentName];
    if (!comp) return { name: componentName, error: "Not found!" };

    var isClient = false;
    var reason = "";

    if (comp.directive === "use client") {
      isClient = true;
      reason = 'Has "use client" directive!';
      clientBoundaryFiles[componentName] = true;
    } else if (parentIsClient) {
      isClient = true;
      reason = "Parent is Client → inherited! (no directive needed!)";
    } else {
      isClient = false;
      reason = "Default = Server Component!";
    }

    // Resolve children
    var children = [];
    for (var i = 0; i < comp.imports.length; i++) {
      children.push(resolveBoundary(comp.imports[i], isClient));
    }

    return {
      name: componentName,
      isClient: isClient,
      reason: reason,
      directive: comp.directive,
      children: children,
    };
  }

  // ═══════════════════════════════════
  // 3. SERIALIZATION CHECKER
  // ═══════════════════════════════════
  var serializableTypes = [
    "string",
    "number",
    "boolean",
    "null",
    "undefined",
    "Date",
    "Map",
    "Set",
    "TypedArray",
    "ArrayBuffer",
    "plain object",
    "array",
    "React element",
    "Server Action",
  ];
  var notSerializable = [
    "function",
    "class instance",
    "Symbol",
    "WeakMap",
    "WeakSet",
  ];

  function checkPropSerialization(propName, propType) {
    for (var i = 0; i < notSerializable.length; i++) {
      if (propType === notSerializable[i]) {
        return {
          prop: propName,
          type: propType,
          serializable: false,
          error: "❌ " + propType + " is NOT serializable!",
          fix:
            propType === "function"
              ? 'Use Server Action ("use server") or define inside Client!'
              : "Convert to serializable type!",
        };
      }
    }
    return {
      prop: propName,
      type: propType,
      serializable: true,
      status: "✅ Serializable!",
    };
  }

  // ═══════════════════════════════════
  // 4. NEED CHECKER — Does it need 'use client'?
  // ═══════════════════════════════════
  function needsUseClient(componentName) {
    var comp = components[componentName];
    if (!comp) return { error: "Component not found!" };

    var reasons = [];
    if (comp.hasState) reasons.push("Uses useState/useReducer!");
    if (comp.hasEffects) reasons.push("Uses useEffect!");
    if (comp.hasEventHandlers) reasons.push("Has onClick/onChange handlers!");
    if (comp.usesBrowserAPIs) reasons.push("Accesses window/document/DOM!");

    return {
      name: componentName,
      needsClient: reasons.length > 0,
      reasons: reasons,
      recommendation:
        reasons.length > 0
          ? '→ Add "use client" to this file!'
          : "→ Keep as Server Component! (better performance!)",
    };
  }

  // ═══════════════════════════════════
  // 5. RENDERING SIMULATOR
  // ═══════════════════════════════════
  function simulateRendering(tree) {
    var serverHTML = [];
    var clientBundles = [];

    function walk(node) {
      if (node.isClient) {
        serverHTML.push(
          "<" +
            node.name +
            ">" +
            "<!-- hydration marker -->" +
            "</" +
            node.name +
            ">",
        );
        clientBundles.push(node.name + ".js");
      } else {
        serverHTML.push(
          "<" +
            node.name +
            ">" +
            "<!-- fully rendered -->" +
            "</" +
            node.name +
            ">",
        );
        // NO JS bundle for Server Components!
      }
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i]);
      }
    }

    walk(tree);
    return {
      serverHTML: serverHTML,
      clientBundles: clientBundles,
      totalBundles: clientBundles.length,
      serverOnly: serverHTML.length - clientBundles.length,
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  USE CLIENT ENGINE DEMO               ║");
    console.log("╚══════════════════════════════════════╝");

    // Register components
    registerComponent("Page", {
      imports: ["Header", "Counter"],
    });
    registerComponent("Header", {
      imports: ["Logo", "Nav"],
    });
    registerComponent("Logo", {});
    registerComponent("Nav", {});
    registerComponent("Counter", {
      directive: "use client",
      hasState: true,
      hasEventHandlers: true,
      imports: ["Button"],
      props: [{ name: "initialCount", type: "number" }],
    });
    registerComponent("Button", {
      hasEventHandlers: true,
    });

    // Boundary resolution
    console.log("\n── Boundary Resolution ──");
    var tree = resolveBoundary("Page", false);
    function printTree(node, indent) {
      var type = node.isClient ? "CLIENT" : "SERVER";
      console.log(indent + node.name + " [" + type + "] — " + node.reason);
      for (var i = 0; i < node.children.length; i++) {
        printTree(node.children[i], indent + "  ");
      }
    }
    printTree(tree, "  ");

    // Need checker
    console.log('\n── Need "use client"? ──');
    var checks = ["Page", "Header", "Counter", "Button"];
    for (var i = 0; i < checks.length; i++) {
      var need = needsUseClient(checks[i]);
      console.log(
        "  " +
          need.name +
          ": " +
          (need.needsClient ? "✅ YES" : "❌ NO") +
          " " +
          need.recommendation,
      );
      for (var j = 0; j < need.reasons.length; j++) {
        console.log("    → " + need.reasons[j]);
      }
    }

    // Serialization check
    console.log("\n── Prop Serialization ──");
    var propTests = [
      { name: "count", type: "number" },
      { name: "label", type: "string" },
      { name: "onClick", type: "function" },
      { name: "data", type: "plain object" },
      { name: "onSubmit", type: "Server Action" },
      { name: "user", type: "class instance" },
    ];
    for (var k = 0; k < propTests.length; k++) {
      var result = checkPropSerialization(propTests[k].name, propTests[k].type);
      if (result.serializable) {
        console.log(
          "  " + result.prop + " (" + result.type + "): " + result.status,
        );
      } else {
        console.log(
          "  " + result.prop + " (" + result.type + "): " + result.error,
        );
        console.log("    Fix: " + result.fix);
      }
    }

    // Rendering simulation
    console.log("\n── Rendering Simulation ──");
    var render = simulateRendering(tree);
    console.log("  Server HTML pieces:", render.serverHTML.length);
    console.log("  Client JS bundles:", render.totalBundles);
    console.log("  Server-only (ZERO JS):", render.serverOnly);
    console.log("  Bundles:");
    for (var b = 0; b < render.clientBundles.length; b++) {
      console.log("    → " + render.clientBundles[b]);
    }

    // Boundary insight
    console.log("\n── Boundary Files ──");
    console.log(
      '  Files with "use client":',
      Object.keys(clientBoundaryFiles).join(", "),
    );
    console.log(
      "  Components inherited (no directive):",
      "Button (inside Counter boundary!)",
    );
  }

  return { demo: demo };
})();
// Chạy: UseClientEngine.demo();
```

---

## §6. Câu Hỏi Luyện Tập!

**Câu 1**: `use client` đặt ở đâu và tại sao KHÔNG cần ở mọi file?

<details><summary>Đáp án</summary>

```
ĐẶT Ở ĐÂU:
  → Dòng ĐẦU TIÊN của file, TRƯỚC tất cả imports!
  → 'use client'  // line 1!

TẠI SAO không cần ở mọi file:
  'use client' = defines CLIENT-SERVER BOUNDARY!
  NOT = "make this component client"!

  Khi file A có 'use client':
    → A = Client Component (boundary entry point!)
    → TẤT CẢ modules imported by A = ALSO Client!
    → No need for separate 'use client' in those files!

  Example:
    Counter.tsx    → 'use client'    ← Boundary!
      └── Button.tsx → no directive!  ← Already inside!
      └── utils.ts   → no directive!  ← Already inside!

  ONLY add to files that are DIRECTLY imported by
  Server Components! Those are the ENTRY POINTS!
```

</details>

---

**Câu 2**: Tại sao props phải serializable? Function có được không?

<details><summary>Đáp án</summary>

```
TẠI SAO serializable:
  Server Component → renders on SERVER!
  Client Component → hydrates on CLIENT!

  Props travel: Server → Network → Client!
  → Must be convertible to bytes and back!
  → = SERIALIZABLE!

FUNCTION:
  ❌ Regular function = NOT serializable!
  → Cannot convert to bytes!
  → Cannot send over network!

  ✅ Server Action = serializable!
  → Has 'use server' directive!
  → React knows how to serialize reference!
  → Client calls → network request → server executes!

SOLUTIONS:
  ① Use Server Action:
     async function handleSave() {
       'use server'
       await db.save(...)
     }
     <ClientForm onSave={handleSave} />  ✅

  ② Define handler INSIDE Client Component:
     'use client'
     function ClientForm() {
       function handleSave() { ... }  ← defined here!
       return <button onClick={handleSave}>Save</button>
     }
```

</details>

---

**Câu 3**: Server Component có thể render bên trong Client Component không?

<details><summary>Đáp án</summary>

```
TRỰC TIẾP import → ❌ KHÔNG!
  'use client'
  import ServerComp from './ServerComp'  // ❌
  // ServerComp becomes Client by boundary rule!

QUA children prop → ✅ CÓ!
  // page.tsx (Server)
  <ClientLayout>
    <ServerSidebar />   ← Server Component!
  </ClientLayout>

  // ClientLayout.tsx
  'use client'
  function ClientLayout({ children }) {
    return <div>{children}</div>
  }

WHY works:
  → Server renders ServerSidebar to JSX on server!
  → Passes serialized JSX as children prop!
  → ClientLayout receives pre-rendered output!
  → Client does NOT import or re-render ServerSidebar!
  → Just displays the pre-rendered result!

PATTERN: "Composition over Import!"
  → Want Server inside Client? Use children/slots!
  → Want Client inside Server? Direct import OK!
```

</details>

---

**Câu 4**: Bundle size impact — Server vs Client?

<details><summary>Đáp án</summary>

```
SERVER COMPONENTS:
  → Render on server → send HTML only!
  → ZERO JavaScript in client bundle! ✅
  → No matter how complex, no JS cost!
  → Better for: data display, static content, SEO!

CLIENT COMPONENTS:
  → Server renders HTML (SSR) + sends JS bundle!
  → Client downloads JS → hydrates (attach events+state)!
  → ADDS to bundle size! ⚠️
  → More Client Components = larger bundle = slower load!

OPTIMIZATION:
  → Keep 'use client' boundary as NARROW as possible!
  → Only the INTERACTIVE parts need to be Client!
  → Push boundary DOWN the tree!

  ❌ BAD: Entire page as Client!
     'use client'
     function Page() { ... 50 components ... }

  ✅ GOOD: Only interactive leaf as Client!
     function Page() {  // Server!
       return <>
         <StaticContent />     // Server! Zero JS!
         <DataTable />         // Server! Zero JS!
         <InteractiveButton /> // Client! Small JS!
       </>
     }
```

</details>
