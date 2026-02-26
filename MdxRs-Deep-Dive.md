# mdxRs — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/mdxRs
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **⚠️ EXPERIMENTAL feature!**

---

## §1. mdxRs Là Gì?

```
  mdxRs — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Dùng Rust compiler để compile MDX files! ★★★            │
  │  → Thay thế JavaScript-based MDX compiler! ★               │
  │  → Dùng với @next/mdx! ★                                   │
  │  → NHANH hơn nhiều nhờ Rust (SWC)! ★★★                    │
  │                                                              │
  │  MDX LÀ GÌ?                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  MDX = Markdown + JSX! ★★★                            │    │
  │  │  → Viết content bằng Markdown! ★                      │    │
  │  │  → Embed React components! ★★★                       │    │
  │  │  → File .mdx → React component! ★                    │    │
  │  │                                                       │    │
  │  │  # Hello World        ← Markdown                      │    │
  │  │  <MyComponent />      ← JSX in Markdown! ★★★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  JS COMPILER vs RUST COMPILER:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  JS (default):                                         │    │
  │  │  .mdx → JS parser → AST → transform → JSX ★         │    │
  │  │  → Chậm (single-threaded JS)! ★                      │    │
  │  │                                                       │    │
  │  │  Rust (mdxRs: true):                                   │    │
  │  │  .mdx → Rust/SWC parser → AST → transform → JSX ★★★│    │
  │  │  → NHANH (native, multi-threaded)! ★★★               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const withMDX = require('@next/mdx')()                │    │
  │  │  const nextConfig = {                                  │    │
  │  │    pageExtensions: ['ts', 'tsx', 'mdx'], ★            │    │
  │  │    experimental: {                                     │    │
  │  │      mdxRs: true  ★★★                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │  module.exports = withMDX(nextConfig)                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — MdxRsEngine!

```javascript
var MdxRsEngine = (function () {
  // ═══════════════════════════════════
  // 1. SIMPLE MDX PARSER (Markdown → HTML + JSX detect)
  // ═══════════════════════════════════
  function parseMdx(source) {
    var lines = source.split("\n");
    var output = [];
    var jsxComponents = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      // Heading
      if (line.indexOf("# ") === 0) {
        output.push({ type: "heading", level: 1, text: line.substring(2) });
      } else if (line.indexOf("## ") === 0) {
        output.push({ type: "heading", level: 2, text: line.substring(3) });
      }
      // JSX component
      else if (line.indexOf("<") === 0 && line.indexOf("/>") > 0) {
        var name = line.match(/<(\w+)/);
        if (name) jsxComponents.push(name[1]);
        output.push({ type: "jsx", raw: line });
      }
      // Paragraph
      else if (line.length > 0) {
        output.push({ type: "paragraph", text: line });
      }
    }

    return {
      nodes: output,
      jsxComponents: jsxComponents,
      isMdx: jsxComponents.length > 0,
    };
  }

  // ═══════════════════════════════════
  // 2. MDX → JSX COMPILER
  // ═══════════════════════════════════
  function compileToJsx(parsed) {
    var jsx = "export default function MDXContent() {\n  return (\n    <>\n";

    for (var i = 0; i < parsed.nodes.length; i++) {
      var node = parsed.nodes[i];
      if (node.type === "heading") {
        jsx +=
          "      <h" +
          node.level +
          ">" +
          node.text +
          "</h" +
          node.level +
          ">\n";
      } else if (node.type === "paragraph") {
        jsx += "      <p>" + node.text + "</p>\n";
      } else if (node.type === "jsx") {
        jsx += "      " + node.raw + "\n";
      }
    }

    jsx += "    </>\n  );\n}";
    return jsx;
  }

  // ═══════════════════════════════════
  // 3. BUILD TIME COMPARISON
  // ═══════════════════════════════════
  function compareSpeed(fileCount) {
    var jsTime = fileCount * 120; // ms per file (JS)
    var rustTime = fileCount * 15; // ms per file (Rust)

    return {
      files: fileCount,
      jsCompiler: jsTime + "ms",
      rustCompiler: rustTime + "ms",
      speedup: (jsTime / rustTime).toFixed(1) + "x faster! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ MdxRs Engine ═══");

    var mdxSource =
      '# Hello World\nThis is content.\n<MyChart />\n## Section\n<Alert type="info" />';

    console.log("\n── 1. Parse MDX ──");
    var parsed = parseMdx(mdxSource);
    console.log(parsed);

    console.log("\n── 2. Compile → JSX ──");
    console.log(compileToJsx(parsed));

    console.log("\n── 3. Speed Comparison ──");
    console.log(compareSpeed(10));
    console.log(compareSpeed(100));
  }

  return { demo: demo };
})();
// Chạy: MdxRsEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: mdxRs dùng làm gì?                                      │
  │  → Compile MDX bằng Rust compiler (SWC)! ★★★              │
  │  → Thay JS-based MDX compiler! ★                          │
  │  → Nhanh hơn nhiều (native + multi-threaded)! ★★★        │
  │                                                              │
  │  ❓ 2: MDX là gì?                                              │
  │  → Markdown + JSX! ★★★                                     │
  │  → Viết content + embed React components! ★                │
  │  → Compile thành React component! ★                        │
  │                                                              │
  │  ❓ 3: Cần gì để dùng?                                        │
  │  → @next/mdx package! ★                                    │
  │  → pageExtensions: ['ts','tsx','mdx']! ★                  │
  │  → experimental: { mdxRs: true }! ★★★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
