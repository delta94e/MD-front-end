# Next.js MDX — Deep Dive!

> **Chủ đề**: MDX — Markdown + JSX = Nội Dung Tương Tác!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/mdx
> **Hình ảnh**: Trang gốc có 1 diagram (dynamic route structure) — phân tích chi tiết bên dưới!

---

## Mục Lục

1. [§1. Tổng Quan — Markdown vs MDX](#1)
2. [§2. Install + Config — @next/mdx](#2)
3. [§3. mdx-components.tsx — File Bắt Buộc](#3)
4. [§4. 3 Cách Render MDX (có hình!)](#4)
5. [§5. Custom Styles — Global, Local, Shared, Tailwind](#5)
6. [§6. Frontmatter + remark/rehype Plugins](#6)
7. [§7. Deep Dive — Markdown → HTML Pipeline](#7)
8. [§8. Rust MDX Compiler (Experimental)](#8)
9. [§9. Tự Viết — MdxEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Markdown vs MDX!

```
  MARKDOWN vs MDX:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  MARKDOWN (.md):                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  # Hello World                                       │  │
  │  │  I **love** using [Next.js](https://nextjs.org/)     │  │
  │  │                                                      │  │
  │  │  → Output: <p>I <strong>love</strong>               │  │
  │  │    using <a href="...">Next.js</a></p>               │  │
  │  │                                                      │  │
  │  │  = Plain text → HTML!                               │  │
  │  │  = KHÔNG có interactive components!                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  MDX (.mdx) = Markdown + JSX:                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  import { Chart } from './Chart'                     │  │
  │  │                                                      │  │
  │  │  # Sales Report                                       │  │
  │  │  Here's our **quarterly** data:                       │  │
  │  │  <Chart data={salesData} />                           │  │
  │  │                                                      │  │
  │  │  → Markdown text + React Components!                │  │
  │  │  → INTERACTIVE content!                             │  │
  │  │  → Import bất kỳ React component nào!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Next.js hỗ trợ:                                          │
  │  → Local MDX (files trong project)                       │
  │  → Remote MDX (fetch từ server)                         │
  │  → Server Components (default trong App Router!)        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Install + Config — @next/mdx!

```
  INSTALL:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  pnpm add @next/mdx @mdx-js/loader @mdx-js/react        │
  │           @types/mdx                                     │
  │                                                          │
  │  4 packages:                                              │
  │  ┌──────────────────┬────────────────────────────────┐   │
  │  │ Package          │ Vai trò                        │   │
  │  ├──────────────────┼────────────────────────────────┤   │
  │  │ @next/mdx        │ Plugin chính — config Next.js  │   │
  │  │ @mdx-js/loader   │ Webpack/Turbo loader cho .mdx  │   │
  │  │ @mdx-js/react    │ React provider cho MDX         │   │
  │  │ @types/mdx       │ TypeScript types               │   │
  │  └──────────────────┴────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// next.config.mjs
import createMDX from "@next/mdx";

const nextConfig = {
  // QUAN TRỌNG: Thêm md + mdx vào pageExtensions!
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  // Plugins sẽ thêm ở đây!
});

export default withMDX(nextConfig);
```

```
  pageExtensions GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Mặc định Next.js chỉ hiểu: .js .jsx .ts .tsx          │
  │                                                          │
  │  Thêm 'md' và 'mdx' → Next.js BIẾT:                   │
  │  page.mdx = page! (file-based routing!)                 │
  │  page.md  = page! (nếu config extension!)              │
  │                                                          │
  │  Handle .md files (default chỉ .mdx):                   │
  │  const withMDX = createMDX({                             │
  │    extension: /\.(md|mdx)$/   ← Thêm dòng này!       │
  │  })                                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. mdx-components.tsx — File Bắt Buộc!

```
  mdx-components.tsx:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ⚠️ BẮT BUỘC cho App Router!                            │
  │  → KHÔNG có file này → @next/mdx KHÔNG HOẠT ĐỘNG!    │
  │                                                          │
  │  Vị trí: ROOT project (cùng level với app/ hoặc src/)  │
  │                                                          │
  │  my-project/                                              │
  │  ├── app/                                                │
  │  ├── mdx-components.tsx  ← ĐÂY!                       │
  │  ├── next.config.mjs                                     │
  │  └── package.json                                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// mdx-components.tsx
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

---

## §4. 3 Cách Render MDX!

### Cách 1: File-based Routing

```
  CÁCH 1: page.mdx = PAGE!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  my-project/                                              │
  │  ├── app/                                                │
  │  │   └── mdx-page/                                      │
  │  │       └── page.mdx  ← MDX file IS the page!        │
  │  ├── mdx-components.tsx                                  │
  │  └── package.json                                        │
  │                                                          │
  │  // page.mdx                                              │
  │  import { MyComponent } from 'my-component'              │
  │                                                          │
  │  # Welcome to my MDX page!                                │
  │  This is some **bold** and _italics_ text.               │
  │  - One                                                    │
  │  - Two                                                    │
  │  <MyComponent />                                         │
  │                                                          │
  │  → Navigate /mdx-page → rendered!                      │
  │  → Supports metadata (export const metadata = {...})    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Cách 2: Import MDX

```
  CÁCH 2: import MDX vào page.tsx!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  my-project/                                              │
  │  ├── app/                                                │
  │  │   └── mdx-page/                                      │
  │  │       └── page.tsx   ← Regular page!                │
  │  ├── markdown/                                           │
  │  │   └── welcome.mdx   ← MDX content RIÊNG!           │
  │  ├── mdx-components.tsx                                  │
  │  └── package.json                                        │
  │                                                          │
  │  // page.tsx                                              │
  │  import Welcome from '@/markdown/welcome.mdx'            │
  │  export default function Page() {                        │
  │    return <Welcome />  // Render MDX as component!      │
  │  }                                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Cách 3: Dynamic Imports (có Hình gốc!)

Trang documentation có **1 diagram** minh hoạ cấu trúc thư mục cho dynamic MDX:

```
  HÌNH GỐC: "Route segments for dynamic MDX components"
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Mô tả hình: Cấu trúc file tree cho dynamic MDX        │
  │  với app/blog/[slug]/page.js route và                   │
  │  content/ folder chứa các .mdx files riêng biệt       │
  │                                                          │
  │  my-project/                                              │
  │  ├── app/                                                │
  │  │   └── blog/                                          │
  │  │       └── [slug]/         ← Dynamic segment!         │
  │  │           └── page.js     ← Loads MDX by slug!      │
  │  ├── content/                ← MDX files RIÊNG!        │
  │  │   ├── welcome.mdx                                    │
  │  │   └── about.mdx                                      │
  │  ├── mdx-components.js                                   │
  │  └── package.json                                        │
  │                                                          │
  │  KEY INSIGHT:                                             │
  │  → app/blog/[slug] = dynamic route                     │
  │  → content/*.mdx = nội dung tách biệt                │
  │  → page.js dùng import(`@/content/${slug}.mdx`)       │
  │  → generateStaticParams pre-render tất cả slugs!      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// app/blog/[slug]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Dynamic import MDX by slug!
  const { default: Post } = await import(`@/content/${slug}.mdx`)
  return <Post />
}

export function generateStaticParams() {
  return [{ slug: 'welcome' }, { slug: 'about' }]
}

export const dynamicParams = false // 404 nếu slug không có!
```

---

## §5. Custom Styles — Global, Local, Shared, Tailwind!

```
  MARKDOWN → HTML MAPPING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ## Heading    →  <h2>Heading</h2>                      │
  │  **bold**      →  <strong>bold</strong>                  │
  │  - item        →  <ul><li>item</li></ul>                │
  │  ![img](url)   →  <img src="url" />                     │
  │                                                          │
  │  → Có thể THAY THẾ mỗi HTML element bằng              │
  │    custom React component!                               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  3 LEVELS OF CUSTOMIZATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① GLOBAL (mdx-components.tsx):                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const components = {                                │  │
  │  │    h1: ({ children }) =>                             │  │
  │  │      <h1 style={{ color: 'red' }}>{children}</h1>,   │  │
  │  │    img: (props) =>                                   │  │
  │  │      <Image sizes="100vw" {...props} />,             │  │
  │  │  }                                                   │  │
  │  │                                                      │  │
  │  │  → Áp dụng TẤT CẢ MDX files trong app!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② LOCAL (components prop):                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <Welcome components={{ h1: CustomH1 }} />           │  │
  │  │                                                      │  │
  │  │  → Override global chỉ cho PAGE NÀY!               │  │
  │  │  → Merge + override global components!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ SHARED LAYOUT (layout.tsx):                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  export default function MdxLayout({ children }) {   │  │
  │  │    return <div style={{ color: 'blue' }}>            │  │
  │  │      {children}                                      │  │
  │  │    </div>                                             │  │
  │  │  }                                                   │  │
  │  │                                                      │  │
  │  │  → Wrap TẤT CẢ MDX pages trong cùng folder!       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ TAILWIND @tailwindcss/typography:                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <div className="prose prose-h1:text-5xl             │  │
  │  │    prose-headings:text-black dark:prose-headings:     │  │
  │  │    text-white">                                       │  │
  │  │    {children}                                        │  │
  │  │  </div>                                               │  │
  │  │                                                      │  │
  │  │  → prose class = beautiful typography tự động!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Frontmatter + remark/rehype Plugins!

```
  FRONTMATTER:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  @next/mdx KHÔNG hỗ trợ frontmatter mặc định!         │
  │                                                          │
  │  YAML frontmatter:                                       │
  │  ---                                                      │
  │  title: "My Blog Post"                                   │
  │  author: "John"                                          │
  │  ---                                                      │
  │                                                          │
  │  GIẢI PHÁP: Dùng EXPORT thay vì frontmatter!            │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  // blog-post.mdx                                  │  │
  │  │  export const metadata = { author: 'John Doe' }    │  │
  │  │                                                    │  │
  │  │  # My Blog Post                                    │  │
  │  │  Content here...                                    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  // page.tsx — import metadata!                          │
  │  import BlogPost, { metadata } from '@/content/post.mdx'│
  │  console.log(metadata) // { author: 'John Doe' }        │
  │  return <BlogPost />                                     │
  │                                                          │
  │  Nếu CẦN YAML frontmatter:                              │
  │  → remark-frontmatter                                   │
  │  → remark-mdx-frontmatter                               │
  │  → gray-matter                                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  REMARK + REHYPE PLUGINS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  remark = markdown ecosystem                             │
  │  rehype = HTML ecosystem                                 │
  │                                                          │
  │  const withMDX = createMDX({                             │
  │    options: {                                            │
  │      remarkPlugins: [remarkGfm],                        │
  │      rehypePlugins: [],                                  │
  │    },                                                    │
  │  })                                                      │
  │                                                          │
  │  Plugins phổ biến:                                       │
  │  ┌───────────────────┬──────────────────────────────┐    │
  │  │ Plugin            │ Chức năng                    │    │
  │  ├───────────────────┼──────────────────────────────┤    │
  │  │ remark-gfm        │ GitHub Flavored Markdown     │    │
  │  │ remark-toc         │ Table of Contents           │    │
  │  │ rehype-slug        │ Add IDs to headings         │    │
  │  │ rehype-pretty-code │ Syntax highlighting         │    │
  │  │ rehype-autolink    │ Link headings               │    │
  │  │ rehype-katex       │ Math rendering              │    │
  │  └───────────────────┴──────────────────────────────┘    │
  │                                                          │
  │  ⚠️ TURBOPACK: Plugin names phải là STRING!            │
  │  remarkPlugins: ['remark-gfm']  ← OK!                  │
  │  remarkPlugins: [remarkGfm]     ← ❌ với Turbopack!   │
  │  (JS functions không pass được qua Rust!)              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Deep Dive — Markdown → HTML Pipeline!

```
  UNIFIED PIPELINE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  "Hello, **Next.js**!"                                     │
  │       │                                                    │
  │       ▼                                                    │
  │  ┌──────────────┐                                          │
  │  │ remarkParse  │  → Parse markdown text                  │
  │  │              │  → Thành Markdown AST (mdast)           │
  │  └──────┬───────┘                                          │
  │         │  { type: 'paragraph',                            │
  │         │    children: [                                    │
  │         │      { type: 'text', value: 'Hello, ' },         │
  │         │      { type: 'strong', children: [               │
  │         │        { type: 'text', value: 'Next.js' }        │
  │         │      ]},                                         │
  │         │      { type: 'text', value: '!' }                │
  │         │    ]}                                            │
  │         ▼                                                  │
  │  ┌──────────────┐                                          │
  │  │ remarkRehype │  → Transform Markdown AST               │
  │  │              │  → Thành HTML AST (hast)                │
  │  └──────┬───────┘                                          │
  │         │  { type: 'element', tagName: 'p',                │
  │         │    children: [                                    │
  │         │      { type: 'text', value: 'Hello, ' },         │
  │         │      { type: 'element', tagName: 'strong',       │
  │         │        children: [                                │
  │         │          { type: 'text', value: 'Next.js' }      │
  │         │        ]},                                       │
  │         │      { type: 'text', value: '!' }                │
  │         │    ]}                                            │
  │         ▼                                                  │
  │  ┌──────────────┐                                          │
  │  │ rehypeSanitize│ → Sanitize HTML (prevent XSS!)        │
  │  └──────┬───────┘                                          │
  │         ▼                                                  │
  │  ┌────────────────┐                                        │
  │  │ rehypeStringify│ → Serialize AST → HTML string!       │
  │  └──────┬─────────┘                                        │
  │         ▼                                                  │
  │  <p>Hello, <strong>Next.js</strong>!</p>                   │
  │                                                            │
  │  ⚠️ @next/mdx xử lý pipeline này TỰ ĐỘNG!              │
  │  → Bạn KHÔNG cần gọi unified() trực tiếp!              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §8. Rust MDX Compiler (Experimental)!

```
  RUST-BASED MDX COMPILER:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  module.exports = withMDX({                               │
  │    experimental: {                                        │
  │      mdxRs: true    ← Enable Rust compiler!             │
  │    },                                                    │
  │  })                                                      │
  │                                                          │
  │  Options:                                                 │
  │  mdxRs: {                                                │
  │    jsxRuntime: 'react',   // Custom JSX runtime          │
  │    jsxImportSource: '',   // Custom import source        │
  │    mdxType: 'gfm',       // 'gfm' | 'commonmark'        │
  │  }                                                       │
  │                                                          │
  │  → NHANH hơn JS-based compiler!                        │
  │  → Experimental → chưa khuyên cho production!         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — MdxEngine!

```javascript
var MdxEngine = (function () {
  // ═══════════════════════════════════
  // 1. MARKDOWN PARSER (mini remarkParse)
  // ═══════════════════════════════════
  function parseMarkdown(text) {
    var ast = { type: "root", children: [] };
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      // Headings
      var hMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        ast.children.push({
          type: "heading",
          depth: hMatch[1].length,
          value: hMatch[2],
        });
        continue;
      }

      // Lists
      if (line.match(/^[-*]\s+/)) {
        ast.children.push({
          type: "listItem",
          value: line.replace(/^[-*]\s+/, ""),
        });
        continue;
      }

      // JSX (MDX!)
      if (line.match(/^<[A-Z]/)) {
        ast.children.push({
          type: "jsx",
          value: line,
        });
        continue;
      }

      // Import
      if (line.match(/^import\s/)) {
        ast.children.push({
          type: "import",
          value: line,
        });
        continue;
      }

      // Export
      if (line.match(/^export\s/)) {
        ast.children.push({
          type: "export",
          value: line,
        });
        continue;
      }

      // Paragraph (inline formatting)
      ast.children.push({
        type: "paragraph",
        value: line,
      });
    }
    return ast;
  }

  // ═══════════════════════════════════
  // 2. MARKDOWN → HTML (mini remarkRehype + stringify)
  // ═══════════════════════════════════
  function toHTML(ast, components) {
    var comps = components || {};
    var html = "";

    for (var i = 0; i < ast.children.length; i++) {
      var node = ast.children[i];

      switch (node.type) {
        case "heading":
          var tag = "h" + node.depth;
          if (comps[tag]) {
            html += "  [Custom " + tag + "] " + node.value + "\n";
          } else {
            html += "  <" + tag + ">" + node.value + "</" + tag + ">\n";
          }
          break;

        case "paragraph":
          var text = node.value
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/_(.+?)_/g, "<em>$1</em>");
          html += "  <p>" + text + "</p>\n";
          break;

        case "listItem":
          html += "  <li>" + node.value + "</li>\n";
          break;

        case "jsx":
          html += "  [JSX Component] " + node.value + "\n";
          break;

        case "import":
          html += "  [Import] " + node.value + "\n";
          break;

        case "export":
          html += "  [Export] " + node.value + "\n";
          break;
      }
    }
    return html;
  }

  // ═══════════════════════════════════
  // 3. MDX-COMPONENTS REGISTRY
  // ═══════════════════════════════════
  var globalComponents = {};
  var localComponents = {};

  function setGlobalComponents(comps) {
    globalComponents = comps;
    console.log("  📦 Global components: " + Object.keys(comps).join(", "));
  }

  function mergeComponents(local) {
    var merged = {};
    for (var k in globalComponents) merged[k] = globalComponents[k];
    for (var j in local) merged[j] = local[j]; // override!
    return merged;
  }

  // ═══════════════════════════════════
  // 4. FILE-BASED ROUTING
  // ═══════════════════════════════════
  var pages = {};

  function registerPage(route, mdxContent) {
    pages[route] = mdxContent;
    console.log("  📄 Registered: " + route);
  }

  function renderPage(route, localComps) {
    var content = pages[route];
    if (!content) {
      console.log("  ❌ 404: " + route);
      return null;
    }
    var comps = mergeComponents(localComps || {});
    var ast = parseMarkdown(content);
    var html = toHTML(ast, comps);
    console.log("  🖥️ Rendered: " + route);
    return html;
  }

  // ═══════════════════════════════════
  // 5. DYNAMIC IMPORT + generateStaticParams
  // ═══════════════════════════════════
  var contentDir = {};

  function registerContent(slug, mdxContent) {
    contentDir[slug] = mdxContent;
  }

  function dynamicImport(slug) {
    if (!contentDir[slug]) {
      console.log("  ❌ Content not found: " + slug);
      return null;
    }
    console.log("  📦 Dynamic import: @/content/" + slug + ".mdx");
    return contentDir[slug];
  }

  function generateStaticParams() {
    return Object.keys(contentDir).map(function (slug) {
      return { slug: slug };
    });
  }

  // ═══════════════════════════════════
  // 6. FRONTMATTER EXTRACTION
  // ═══════════════════════════════════
  function extractExports(mdxContent) {
    var exports = {};
    var lines = mdxContent.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/export\s+const\s+(\w+)\s*=\s*(.+)/);
      if (m) {
        try {
          exports[m[1]] = JSON.parse(m[2].replace(/'/g, '"'));
        } catch (e) {
          exports[m[1]] = m[2];
        }
      }
    }
    return exports;
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  MDX ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Parse Markdown
    console.log("\n── Scenario 1: Markdown Parse ──");
    var ast = parseMarkdown(
      "# Hello World\nThis is **bold** text.\n- One\n- Two",
    );
    console.log("  AST nodes: " + ast.children.length);
    console.log(toHTML(ast));

    // Scenario 2: MDX with JSX
    console.log("\n── Scenario 2: MDX + JSX ──");
    var mdxAst = parseMarkdown(
      'import { Chart } from "./Chart"\n' +
        "# Sales Report\n" +
        "Here is the data:\n" +
        "<Chart data={sales} />",
    );
    console.log(toHTML(mdxAst));

    // Scenario 3: Global + Local components
    console.log("\n── Scenario 3: Components ──");
    setGlobalComponents({ h1: "RedH1", img: "NextImage" });
    registerPage("/blog", "# My Blog\nWelcome to my blog.");
    console.log(renderPage("/blog"));
    console.log(renderPage("/blog", { h1: "BlueH1" }));

    // Scenario 4: Dynamic imports
    console.log("\n── Scenario 4: Dynamic Import ──");
    registerContent("welcome", "# Welcome\nHello!");
    registerContent("about", "# About\nAbout us.");
    var params = generateStaticParams();
    console.log("  Static params: " + JSON.stringify(params));
    for (var i = 0; i < params.length; i++) {
      var content = dynamicImport(params[i].slug);
      console.log(toHTML(parseMarkdown(content)));
    }

    // Scenario 5: Frontmatter
    console.log("\n── Scenario 5: Exports ──");
    var exports = extractExports(
      'export const metadata = {"author":"John"}\n# Post',
    );
    console.log("  metadata:", JSON.stringify(exports));
  }

  return { demo: demo };
})();
// Chạy: MdxEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: MDX khác Markdown thế nào? Tại sao dùng MDX?

<details><summary>Đáp án</summary>

**Markdown** (.md) = plain text → HTML. Chỉ format text (bold, italic, links, headings). **KHÔNG** có interactive components.

**MDX** (.mdx) = Markdown + **JSX**:

- Import React components: `import { Chart } from './Chart'`
- Sử dụng JSX trong content: `<Chart data={data} />`
- Export metadata: `export const meta = { author: 'John' }`

**Tại sao dùng MDX**:

1. Blog posts với interactive demos (charts, code playgrounds)
2. Documentation với live examples
3. Content writers viết Markdown + devs thêm components
4. Server Components rendering (0KB client JS cho content!)

</details>

---

**Câu 2**: mdx-components.tsx làm gì? Tại sao bắt buộc?

<details><summary>Đáp án</summary>

`mdx-components.tsx` = file **BẮT BUỘC** cho @next/mdx với App Router. Nó define **global component mapping**: markdown elements → React components.

**Ví dụ**: `## Heading` → `<h2>` → `<CustomH2 style={{ color: 'red' }}>` — thay thế **MỌI** `<h2>` trong tất cả MDX files!

**Bắt buộc vì**: @next/mdx cần biết cách render markdown elements. Dù `components` object rỗng (`{}`), file VẪN phải tồn tại. Không có → build error!

**Vị trí**: Root project (cùng level `app/` hoặc `src/`) — **KHÔNG** đặt trong `app/`.

</details>

---

**Câu 3**: 3 cách render MDX — khi nào dùng cách nào?

<details><summary>Đáp án</summary>

| Cách                   | Khi nào                                       | File structure                                 |
| ---------------------- | --------------------------------------------- | ---------------------------------------------- |
| **File-based routing** | MDX file chính là page! Simple blog, docs     | `app/blog/page.mdx`                            |
| **Import**             | MDX content tách riêng khỏi page logic        | `markdown/post.mdx` imported by `app/page.tsx` |
| **Dynamic import**     | Blog index, CMS-like content, nhiều MDX files | `content/*.mdx` + `app/blog/[slug]/page.tsx`   |

**File-based**: Đơn giản nhất — MDX = page. Hỗ trợ metadata export.
**Import**: Linh hoạt — page.tsx có thể thêm layout, data fetching quanh MDX content.
**Dynamic**: Mạnh nhất — `import(\`@/content/${slug}.mdx\`)`+`generateStaticParams` pre-render tất cả. Diagram trong trang gốc minh hoạ pattern này.

</details>

---

**Câu 4**: Unified pipeline (remark → rehype) hoạt động thế nào?

<details><summary>Đáp án</summary>

4 bước biến markdown thành HTML:

1. **remarkParse**: Text → Markdown AST (mdast) — cây cấu trúc với nodes (heading, paragraph, strong, emphasis...)
2. **remarkRehype**: Markdown AST → HTML AST (hast) — heading → `<h2>`, strong → `<strong>`
3. **rehypeSanitize**: Remove dangerous HTML (prevent XSS from user content)
4. **rehypeStringify**: HTML AST → HTML string — `<p>Hello, <strong>Next.js</strong>!</p>`

**remark plugins** chạy ở bước 1-2 (thao tác markdown AST): thêm TOC, GFM tables...
**rehype plugins** chạy ở bước 2-4 (thao tác HTML AST): syntax highlight, add IDs to headings...

`@next/mdx` xử lý pipeline này **tự động** — developer KHÔNG cần gọi `unified()` trực tiếp!

</details>
