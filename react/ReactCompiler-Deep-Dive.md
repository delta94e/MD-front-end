# reactCompiler — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. reactCompiler Là Gì?

```
  reactCompiler — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → React Compiler tự động optimize rendering! ★★★         │
  │  → KHÔNG cần manual useMemo / useCallback! ★★★            │
  │  → Compiler tự phân tích + memoize! ★★★                   │
  │                                                              │
  │  TRƯỚC (manual memoization):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Developer phải tự viết:                            │    │
  │  │  const value = useMemo(() => compute(a, b), [a, b])   │    │
  │  │  const fn = useCallback(() => handle(x), [x])         │    │
  │  │  → Dễ quên! Dễ sai deps! ★★★                        │    │
  │  │  → Boilerplate nhiều! ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU (React Compiler):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Developer viết BÌNH THƯỜNG:                        │    │
  │  │  const value = compute(a, b)                           │    │
  │  │  const fn = () => handle(x)                            │    │
  │  │  → Compiler TỰ ĐỘNG memoize! ★★★                    │    │
  │  │  → Không cần useMemo/useCallback! ★★★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NEXT.JS OPTIMIZATION:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Standard (Babel plugin only):                         │    │
  │  │  → Chạy trên MỌI file! ★ (chậm!)                    │    │
  │  │                                                       │    │
  │  │  Next.js (SWC + Babel):                                │    │
  │  │  → SWC phân tích project trước! ★★★                 │    │
  │  │  → Chỉ chạy Compiler trên RELEVANT files! ★★★       │    │
  │  │  → Files có JSX hoặc React Hooks! ★                  │    │
  │  │  → Nhanh hơn nhiều! ★★★                              │    │
  │  │                                                       │    │
  │  │  Source files                                          │    │
  │  │       ↓ SWC analyze                                    │    │
  │  │  ┌────────┐  ┌────────┐  ┌────────┐                   │    │
  │  │  │ JSX ✅  │  │ utils  │  │ Hooks ✅│                   │    │
  │  │  │ COMPILE │  │ SKIP!  │  │ COMPILE│                   │    │
  │  │  └────────┘  └────────┘  └────────┘                   │    │
  │  │    ↓ Babel plugin         ↓ Babel plugin               │    │
  │  │  Auto-memoized! ★★★    Auto-memoized! ★★★            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SETUP:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // 1. Install:                                        │    │
  │  │  pnpm add -D babel-plugin-react-compiler              │    │
  │  │                                                       │    │
  │  │  // 2. Config (next.config.js):                        │    │
  │  │  const nextConfig = {                                  │    │
  │  │    reactCompiler: true  ★★★                            │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Annotations — Opt-in / Opt-out!

```
  ANNOTATIONS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  OPT-IN MODE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Config:                                            │    │
  │  │  const nextConfig = {                                  │    │
  │  │    reactCompiler: {                                    │    │
  │  │      compilationMode: 'annotation'  ★★★                │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Opt-in specific component:                         │    │
  │  │  export default function Page() {                      │    │
  │  │    'use memo'  ★★★ ← opt IN!                          │    │
  │  │    // ... component code                               │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OPT-OUT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Opt-out specific component:                        │    │
  │  │  export default function LegacyComponent() {           │    │
  │  │    'use no memo'  ★★★ ← opt OUT!                      │    │
  │  │    // ... component NOT compiled                       │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MODES:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  reactCompiler: true                                   │    │
  │  │  → ALL relevant files compiled! ★★★                  │    │
  │  │  → 'use no memo' to opt-out! ★                       │    │
  │  │                                                       │    │
  │  │  compilationMode: 'annotation'                         │    │
  │  │  → NOTHING compiled by default! ★                     │    │
  │  │  → 'use memo' to opt-in! ★★★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ReactCompilerEngine!

```javascript
var ReactCompilerEngine = (function () {
  // ═══════════════════════════════════
  // 1. FILE ANALYZER (simulate SWC pre-filter)
  // ═══════════════════════════════════
  function analyzeFile(source) {
    var hasJSX = source.indexOf("<") >= 0 && source.indexOf("/>") >= 0;
    var hasHooks = /use[A-Z]\w*\(/.test(source);
    var hasUseMemo = source.indexOf("'use memo'") >= 0;
    var hasUseNoMemo = source.indexOf("'use no memo'") >= 0;

    return {
      hasJSX: hasJSX,
      hasHooks: hasHooks,
      hasUseMemo: hasUseMemo,
      hasUseNoMemo: hasUseNoMemo,
      relevant: hasJSX || hasHooks,
    };
  }

  // ═══════════════════════════════════
  // 2. COMPILATION DECISION
  // ═══════════════════════════════════
  function shouldCompile(source, config) {
    var analysis = analyzeFile(source);

    // reactCompiler: false → skip all
    if (!config) return { compile: false, reason: "Compiler disabled ★" };

    // Annotation mode
    if (config.compilationMode === "annotation") {
      if (analysis.hasUseMemo) {
        return { compile: true, reason: "Opt-in via 'use memo' ★★★" };
      }
      return { compile: false, reason: "Annotation mode: no 'use memo' ★" };
    }

    // Default mode (all relevant files)
    if (analysis.hasUseNoMemo) {
      return { compile: false, reason: "Opt-out via 'use no memo' ★★★" };
    }
    if (!analysis.relevant) {
      return { compile: false, reason: "No JSX or Hooks → skip ★" };
    }
    return { compile: true, reason: "JSX/Hooks detected → compile! ★★★" };
  }

  // ═══════════════════════════════════
  // 3. AUTO-MEMOIZE SIMULATOR
  // ═══════════════════════════════════
  function autoMemoize(component) {
    // Simulate what the compiler does
    var memoized = [];
    if (component.computations) {
      for (var i = 0; i < component.computations.length; i++) {
        memoized.push({
          original: component.computations[i],
          memoized: "useMemo(() => " + component.computations[i] + ")",
        });
      }
    }
    if (component.callbacks) {
      for (var j = 0; j < component.callbacks.length; j++) {
        memoized.push({
          original: component.callbacks[j],
          memoized: "useCallback(" + component.callbacks[j] + ")",
        });
      }
    }
    return {
      component: component.name,
      autoMemoized: memoized.length,
      transforms: memoized,
      note: "Developer writes plain code → Compiler memoizes! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ReactCompiler Engine ═══");

    console.log("\n── 1. File Analysis ──");
    console.log(analyzeFile("function App() { return <div /> }"));
    console.log(analyzeFile("const x = useState(0)"));
    console.log(analyzeFile("const add = (a, b) => a + b"));

    console.log("\n── 2. Compile Decision ──");
    console.log(shouldCompile("<App />; useState()", true));
    console.log(shouldCompile("'use no memo'; <App />", true));
    console.log(
      shouldCompile("'use memo'; <App />", { compilationMode: "annotation" }),
    );
    console.log(shouldCompile("<App />", { compilationMode: "annotation" }));

    console.log("\n── 3. Auto-Memoize ──");
    console.log(
      autoMemoize({
        name: "ProductList",
        computations: ["filter(items)", "sort(filtered)"],
        callbacks: ["() => handleClick(id)"],
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: ReactCompilerEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: React Compiler dùng làm gì?                             │
  │  → Tự động optimize rendering! ★★★                        │
  │  → Auto memoize → không cần useMemo/useCallback! ★★★     │
  │                                                              │
  │  ❓ 2: Next.js optimize thế nào?                               │
  │  → SWC pre-filter: chỉ files có JSX/Hooks! ★★★           │
  │  → Không compile ALL files! ★                             │
  │  → Nhanh hơn standalone Babel plugin! ★★★                │
  │                                                              │
  │  ❓ 3: Annotation mode?                                        │
  │  → compilationMode: 'annotation' ★                        │
  │  → 'use memo' → opt-in! ★★★                              │
  │  → 'use no memo' → opt-out! ★★★                          │
  │                                                              │
  │  ❓ 4: Setup?                                                  │
  │  → pnpm add -D babel-plugin-react-compiler! ★             │
  │  → reactCompiler: true trong next.config.js! ★★★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
