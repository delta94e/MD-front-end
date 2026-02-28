# Next.js Sass — Deep Dive!

> **Chủ đề**: Sass — CSS Preprocessor Trong Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/sass
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Sass Là Gì?](#1)
2. [§2. SCSS vs Indented Syntax](#2)
3. [§3. CSS Modules Với Sass](#3)
4. [§4. sassOptions — Cấu Hình Next.js](#4)
5. [§5. Sass Variables — Export Sang JS!](#5)
6. [§6. Tự Viết — SassEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — Sass Là Gì?

```
  SASS TRONG NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CSS THUẦN:               SASS/SCSS:                       │
  │  ┌──────────────┐         ┌──────────────┐                 │
  │  │ Flat styles  │         │ Variables    │                 │
  │  │ No variables │         │ Nesting      │                 │
  │  │ No nesting   │         │ Mixins       │                 │
  │  │ Repetitive!  │         │ Functions    │                 │
  │  │ Hard to      │         │ Imports      │                 │
  │  │ maintain!    │         │ Inheritance  │                 │
  │  └──────────────┘         └──────┬───────┘                 │
  │                                  │                          │
  │                                  ▼                          │
  │                           ┌──────────────┐                 │
  │                           │ COMPILES TO  │                 │
  │                           │ STANDARD CSS!│                 │
  │                           └──────────────┘                 │
  │                                                            │
  │  NEXT.JS BUILT-IN SUPPORT:                                 │
  │  ① Install sass package → xong!                          │
  │  ② Support .scss + .sass extensions!                      │
  │  ③ CSS Modules: .module.scss / .module.sass!              │
  │  ④ sassOptions trong next.config! (cấu hình)            │
  │  ⑤ :export variables từ Sass sang JavaScript!           │
  │                                                            │
  │  INSTALL:                                                   │
  │  ┌──────────────┬──────────────────────────────────────┐   │
  │  │ Package Mgr  │ Command                              │   │
  │  ├──────────────┼──────────────────────────────────────┤   │
  │  │ pnpm         │ pnpm add -D sass                     │   │
  │  │ npm          │ npm install --save-dev sass           │   │
  │  │ yarn         │ yarn add -D sass                     │   │
  │  │ bun          │ bun add -d sass                      │   │
  │  └──────────────┴──────────────────────────────────────┘   │
  │  → DevDependency! Chỉ cần lúc build!                    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. SCSS vs Indented Syntax

```
  2 CÚ PHÁP SASS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SCSS (.scss) — RECOMMENDED! 👍                        │
  │  ┌──────────────────────────────────┐                      │
  │  │ // file: styles.scss             │                      │
  │  │ $primary: #64ff00;               │                      │
  │  │                                  │                      │
  │  │ .card {                          │                      │
  │  │   background: white;             │                      │
  │  │   padding: 1rem;                 │                      │
  │  │                                  │                      │
  │  │   .title {                       │  ← Nesting!         │
  │  │     color: $primary;             │  ← Variable!        │
  │  │     font-size: 1.5rem;           │                      │
  │  │   }                              │                      │
  │  │                                  │                      │
  │  │   &:hover {                      │  ← Parent selector! │
  │  │     box-shadow: 0 2px 8px rgba(  │                      │
  │  │       0,0,0,0.1);               │                      │
  │  │   }                              │                      │
  │  │ }                                │                      │
  │  └──────────────────────────────────┘                      │
  │  → CSS superset! CSS hợp lệ = SCSS hợp lệ!            │
  │  → Dùng {} và ; như CSS!                                │
  │                                                            │
  │  ② Indented Syntax (.sass)                                │
  │  ┌──────────────────────────────────┐                      │
  │  │ // file: styles.sass             │                      │
  │  │ $primary: #64ff00                │  ← Không ; !       │
  │  │                                  │                      │
  │  │ .card                            │  ← Không {} !      │
  │  │   background: white              │                      │
  │  │   padding: 1rem                  │                      │
  │  │                                  │                      │
  │  │   .title                         │  ← Indent = nesting │
  │  │     color: $primary              │                      │
  │  │     font-size: 1.5rem            │                      │
  │  │                                  │                      │
  │  │   &:hover                        │                      │
  │  │     box-shadow: 0 2px 8px rgba(  │                      │
  │  │       0,0,0,0.1)                │                      │
  │  └──────────────────────────────────┘                      │
  │  → KHÔNG dùng {} và ; !                                  │
  │  → Dùng INDENTATION (thụt đầu dòng)!                   │
  │                                                            │
  │  SO SÁNH:                                                   │
  │  ┌──────────────┬──────────────────┬─────────────────┐     │
  │  │              │ SCSS (.scss)     │ Sass (.sass)    │     │
  │  ├──────────────┼──────────────────┼─────────────────┤     │
  │  │ Syntax       │ CSS superset     │ Indent-based    │     │
  │  │ {} braces    │ CÓ              │ KHÔNG           │     │
  │  │ ; semicolons │ CÓ              │ KHÔNG           │     │
  │  │ Learning     │ Easy (biết CSS  │ Harder (cú pháp│     │
  │  │              │ = biết SCSS!)  │ riêng!)          │     │
  │  │ Popularity   │ ⭐ PHỔ BIẾN!  │ Ít phổ biến    │     │
  │  │ Next.js rec  │ ✅ Recommended!│ Supported        │     │
  │  └──────────────┴──────────────────┴─────────────────┘     │
  │                                                            │
  │  TIP: Mới bắt đầu? Dùng .scss! 👍                      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. CSS Modules Với Sass

```
  CSS MODULES + SASS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  FILE NAMING:                                             │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Regular CSS:     styles.css                      │    │
  │  │ CSS Module:      styles.module.css               │    │
  │  │ Sass:            styles.scss                     │    │
  │  │ Sass Module:     styles.module.scss  ← ĐÂY!    │    │
  │  │ Indented Module: styles.module.sass              │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  HOW IT WORKS:                                            │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // card.module.scss                              │    │
  │  │ $primary: #64ff00;                               │    │
  │  │                                                  │    │
  │  │ .card {                                          │    │
  │  │   border-radius: 8px;                            │    │
  │  │   .title { color: $primary; }                    │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │              ▼                                           │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // page.tsx                                      │    │
  │  │ import styles from './card.module.scss'           │    │
  │  │                                                  │    │
  │  │ export default function Page() {                 │    │
  │  │   return (                                       │    │
  │  │     <div className={styles.card}>                │    │
  │  │       <h2 className={styles.title}>Hi!</h2>     │    │
  │  │     </div>                                       │    │
  │  │   )                                              │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │              ▼                                           │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ OUTPUT HTML:                                     │    │
  │  │ <div class="card_x7k2p">                        │    │
  │  │   <h2 class="title_a3m9q">Hi!</h2>              │    │
  │  │ </div>                                           │    │
  │  │                                                  │    │
  │  │ → Class names AUTO-HASHED! No conflicts! 🎉     │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  BENEFITS:                                                │
  │  ① Scoped styles: class names unique per component!      │
  │  ② Sass features: variables, nesting, mixins!            │
  │  ③ No conflicts: 2 components cùng .title → OK!        │
  │  ④ Tree-shaking: unused styles removed at build!         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. sassOptions — Cấu Hình Next.js

```
  sassOptions TRONG next.config:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // next.config.ts                                       │
  │  import type { NextConfig } from 'next'                  │
  │                                                          │
  │  const nextConfig: NextConfig = {                        │
  │    sassOptions: {                                        │
  │      // ① additionalData: inject vào MỌI file Sass!   │
  │      additionalData: `$var: red;`,                       │
  │                                                          │
  │      // ② implementation: Sass compiler!                │
  │      implementation: 'sass-embedded',                    │
  │    },                                                    │
  │  }                                                       │
  │                                                          │
  │  export default nextConfig                               │
  │                                                          │
  │  2 OPTION CHÍNH:                                          │
  │  ┌───────────────────┬──────────────────────────────┐    │
  │  │ Option            │ Purpose                      │    │
  │  ├───────────────────┼──────────────────────────────┤    │
  │  │ additionalData    │ Inject code vào ĐẦU mọi   │    │
  │  │                   │ file Sass! (global vars,     │    │
  │  │                   │ mixins, imports!)             │    │
  │  │ implementation    │ Chọn Sass compiler!         │    │
  │  │                   │ Default: 'sass'              │    │
  │  │                   │ Alt: 'sass-embedded' (fast!) │    │
  │  └───────────────────┴──────────────────────────────┘    │
  │                                                          │
  │  additionalData FLOW:                                     │
  │  ┌───────────────┐                                       │
  │  │ additionalData│                                       │
  │  │ $var: red;    │                                       │
  │  └───────┬───────┘                                       │
  │          │ inject vào ĐẦU                               │
  │    ┌─────┼─────────────────────┐                         │
  │    ▼     ▼                     ▼                         │
  │  ┌─────┐ ┌─────────┐ ┌────────────┐                     │
  │  │a.scss│ │b.module │ │c.module    │                     │
  │  │     │ │.scss    │ │.scss       │                     │
  │  │$var │ │$var     │ │$var        │                     │
  │  │avail!│ │avail!   │ │avail!      │                     │
  │  └─────┘ └─────────┘ └────────────┘                     │
  │  → KHÔNG cần @import! Tự động có $var!                 │
  │                                                          │
  │  implementation SO SÁNH:                                   │
  │  ┌────────────────┬──────────────────────────────────┐   │
  │  │ Implementation │ Details                          │   │
  │  ├────────────────┼──────────────────────────────────┤   │
  │  │ 'sass'         │ Default! Pure JS implementation. │   │
  │  │ (default)      │ Works everywhere. Slower.        │   │
  │  │ 'sass-embedded'│ Native Dart Sass binary!         │   │
  │  │                │ FASTER compilation! 🚀          │   │
  │  │                │ Good for large projects!          │   │
  │  └────────────────┴──────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Sass Variables — Export Sang JS!

```
  :export — SASS VARIABLES → JAVASCRIPT!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // app/variables.module.scss                            │
  │  $primary-color: #64ff00;                                │
  │  $secondary-color: #0099ff;                              │
  │  $font-size-lg: 1.5rem;                                  │
  │                                                          │
  │  :export {                                               │
  │    primaryColor: $primary-color;                          │
  │    secondaryColor: $secondary-color;                     │
  │    fontSizeLg: $font-size-lg;                             │
  │  }                                                       │
  │                                                          │
  │  // app/page.tsx                                         │
  │  import variables from './variables.module.scss'          │
  │                                                          │
  │  export default function Page() {                        │
  │    return (                                              │
  │      <h1 style={{ color: variables.primaryColor }}>      │
  │        Hello, Next.js!                                   │
  │      </h1>                                               │
  │    )                                                     │
  │  }                                                       │
  │  // variables.primaryColor === '#64ff00'                  │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌──────────┐  :export  ┌──────────┐  import  ┌──────┐  │
  │  │ SCSS     │ ════════►│ CSS      │ ═══════►│ JS   │  │
  │  │ $var     │          │ Module   │         │ obj  │  │
  │  │ defined! │          │ :export  │         │ use! │  │
  │  └──────────┘          │ block    │         └──────┘  │
  │                        └──────────┘                     │
  │                                                          │
  │  USE CASES:                                               │
  │  ① Design tokens: colors, spacing, fonts!                │
  │  ② Dynamic inline styles: style={{ color: var }}!        │
  │  ③ Chart/canvas colors: consistent with CSS!             │
  │  ④ Single source of truth: Sass + JS share values!      │
  │                                                          │
  │  ⚠️ RULES:                                               │
  │  → File PHẢI là .module.scss (CSS Module)!              │
  │  → :export block dùng camelCase cho JS access!          │
  │  → Values luôn là string trong JS!                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — SassEngine!

```javascript
var SassEngine = (function () {
  // ═══════════════════════════════════
  // 1. VARIABLE STORE
  // ═══════════════════════════════════
  var variables = {};

  function setVar(name, value) {
    // Sass variable format: $name: value;
    if (name.charAt(0) !== "$") name = "$" + name;
    variables[name] = value;
  }

  function getVar(name) {
    if (name.charAt(0) !== "$") name = "$" + name;
    return variables[name] || null;
  }

  // ═══════════════════════════════════
  // 2. SCSS PARSER (simplified)
  // ═══════════════════════════════════
  function parseVariables(scss) {
    var lines = scss.split("\n");
    var found = {};
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      // Match: $var-name: value;
      var match = line.match(/^\$([a-zA-Z0-9_-]+)\s*:\s*(.+?)\s*;?\s*$/);
      if (match) {
        found["$" + match[1]] = match[2];
        setVar(match[1], match[2]);
      }
    }
    return found;
  }

  // ═══════════════════════════════════
  // 3. NESTING COMPILER
  // ═══════════════════════════════════
  function compileNesting(selector, block) {
    var output = [];
    var rules = {};
    var nested = {};

    for (var prop in block) {
      if (typeof block[prop] === "string") {
        // Regular property
        var val = block[prop];
        // Replace variables
        if (val.charAt(0) === "$") {
          val = getVar(val) || val;
        }
        rules[prop] = val;
      } else if (typeof block[prop] === "object") {
        // Nested selector
        var nestedSel;
        if (prop.charAt(0) === "&") {
          nestedSel = selector + prop.slice(1);
        } else {
          nestedSel = selector + " " + prop;
        }
        nested[nestedSel] = block[prop];
      }
    }

    // Output current selector
    if (Object.keys(rules).length > 0) {
      var css = selector + " {\n";
      for (var r in rules) {
        css += "  " + r + ": " + rules[r] + ";\n";
      }
      css += "}";
      output.push(css);
    }

    // Output nested selectors
    for (var ns in nested) {
      output = output.concat(compileNesting(ns, nested[ns]));
    }

    return output;
  }

  // ═══════════════════════════════════
  // 4. :export SIMULATOR
  // ═══════════════════════════════════
  function parseExport(scss) {
    var exported = {};
    var exportMatch = scss.match(/:export\s*\{([^}]+)\}/);
    if (exportMatch) {
      var pairs = exportMatch[1].split(";");
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].trim();
        if (!pair) continue;
        var parts = pair.split(":");
        if (parts.length === 2) {
          var key = parts[0].trim();
          var val = parts[1].trim();
          // Resolve variable
          if (val.charAt(0) === "$") {
            val = getVar(val) || val;
          }
          exported[key] = val;
        }
      }
    }
    return exported;
  }

  // ═══════════════════════════════════
  // 5. CSS MODULE SIMULATOR
  // ═══════════════════════════════════
  function hashClassName(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return name + "_" + Math.abs(hash).toString(36).slice(0, 5);
  }

  function generateCSSModule(classes) {
    var mapping = {};
    for (var i = 0; i < classes.length; i++) {
      mapping[classes[i]] = hashClassName(classes[i]);
    }
    return mapping;
  }

  // ═══════════════════════════════════
  // 6. additionalData SIMULATOR
  // ═══════════════════════════════════
  function injectAdditionalData(additionalData, files) {
    var results = [];
    for (var i = 0; i < files.length; i++) {
      results.push({
        file: files[i].name,
        content: additionalData + "\n" + files[i].content,
      });
    }
    // Parse variables from injected data
    parseVariables(additionalData);
    return results;
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  SASS ENGINE DEMO                   ║");
    console.log("╚════════════════════════════════════╝");

    // Parse variables
    console.log("\n── Variable Parsing ──");
    var vars = parseVariables(
      "$primary: #64ff00;\n" + "$secondary: #0099ff;\n" + "$font-size: 1.5rem;",
    );
    for (var v in vars) {
      console.log("  " + v + " = " + vars[v]);
    }

    // Compile nesting
    console.log("\n── Nesting Compilation ──");
    var compiled = compileNesting(".card", {
      background: "white",
      padding: "1rem",
      ".title": {
        color: "$primary",
        "font-size": "$font-size",
      },
      "&:hover": {
        "box-shadow": "0 2px 8px rgba(0,0,0,0.1)",
      },
    });
    for (var c = 0; c < compiled.length; c++) {
      console.log("  " + compiled[c]);
    }

    // :export simulation
    console.log("\n── :export to JS ──");
    var exported = parseExport(
      "$primary: #64ff00;\n" +
        ":export {\n" +
        "  primaryColor: $primary;\n" +
        "  secondaryColor: $secondary;\n" +
        "}",
    );
    console.log("  JS object:", exported);

    // CSS Module hashing
    console.log("\n── CSS Module Hashing ──");
    var moduleMap = generateCSSModule(["card", "title", "btn"]);
    for (var m in moduleMap) {
      console.log("  ." + m + " → ." + moduleMap[m]);
    }

    // additionalData injection
    console.log("\n── additionalData Injection ──");
    var injected = injectAdditionalData("$global: blue;", [
      { name: "header.scss", content: ".h { color: $global; }" },
      { name: "footer.scss", content: ".f { color: $global; }" },
    ]);
    for (var j = 0; j < injected.length; j++) {
      console.log("  " + injected[j].file + ":");
      console.log("    " + injected[j].content.replace(/\n/g, "\n    "));
    }
  }

  return { demo: demo };
})();
// Chạy: SassEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: SCSS vs Indented Syntax — khác gì? Next.js recommend cái nào?

<details><summary>Đáp án</summary>

|                     | SCSS (.scss)                 | Indented Syntax (.sass) |
| ------------------- | ---------------------------- | ----------------------- |
| **Braces `{}`**     | CÓ                           | KHÔNG (dùng indent)     |
| **Semicolons `;`**  | CÓ                           | KHÔNG                   |
| **CSS compatible?** | CÓ (superset!)               | KHÔNG (cú pháp riêng)   |
| **Learning curve**  | Easy (biết CSS = biết SCSS!) | Harder                  |
| **Popularity**      | ⭐ Phổ biến                  | Ít hơn                  |

**Next.js recommends**: `.scss` — vì là CSS superset, không cần học cú pháp mới!

</details>

---

**Câu 2**: CSS Modules + Sass — cách hoạt động?

<details><summary>Đáp án</summary>

```
1. Tạo file: component.module.scss
2. Viết Sass bình thường (variables, nesting, mixins...)
3. Import trong component: import styles from './component.module.scss'
4. Dùng: className={styles.card}
5. BUILD: Next.js auto-hash class names!
   .card → .card_x7k2p (unique!)

Benefits:
→ Scoped styles (no conflicts!)
→ Full Sass features (variables, nesting!)
→ Tree-shaking (unused styles removed!)
→ 2 components cùng .title → KHÔNG conflict!
```

</details>

---

**Câu 3**: additionalData — dùng khi nào và cách hoạt động?

<details><summary>Đáp án</summary>

**Khi nào**: Muốn inject global variables, mixins, imports vào TẤT CẢ file Sass mà KHÔNG cần `@import` thủ công!

**Cách hoạt động**:

```typescript
// next.config.ts
sassOptions: {
  additionalData: `$primary: #64ff00; $spacing: 1rem;`,
}
```

Sass compiler tự động **prepend** `additionalData` vào **ĐẦU MỌI file Sass** trước khi compile:

```
File gốc: .card { color: $primary; }
Sau inject: $primary: #64ff00; $spacing: 1rem;
            .card { color: $primary; }
```

→ **MỌI file** đều access được `$primary` và `$spacing` mà KHÔNG cần `@import`!

</details>

---

**Câu 4**: :export — chia sẻ Sass variables sang JavaScript thế nào?

<details><summary>Đáp án</summary>

```scss
// variables.module.scss
$primary: #64ff00;
$gap: 16px;

:export {
  primaryColor: $primary; // camelCase cho JS!
  gap: $gap;
}
```

```tsx
// page.tsx
import vars from "./variables.module.scss";

// vars = { primaryColor: '#64ff00', gap: '16px' }
// Values luôn là STRING trong JS!
<div style={{ color: vars.primaryColor }}>...</div>;
```

**Rules**:

1. File **PHẢI** là `.module.scss` (CSS Module)!
2. `:export` block dùng **camelCase** keys cho JS access
3. Values trong JS luôn là **string** (kể cả numbers!)
4. **Single source of truth**: design tokens defined 1 lần trong Sass, dùng cả CSS + JS!

</details>
