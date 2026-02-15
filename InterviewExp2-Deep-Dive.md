# Interview Experience — Meituan & ByteDance — Deep Dive

> 📅 2026-02-12 · ⏱ 22 phút đọc
>
> Kinh nghiệm phỏng vấn thực tế tại Meituan (4 vòng) và ByteDance
> (Platform 1 vòng + Lark 3 vòng). Bao gồm câu hỏi chi tiết,
> code solutions, và chiến lược trả lời.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Interview / JS / Vue / Webpack / Algorithm

---

## Mục Lục

0. [Tổng Quan](#tổng-quan)
1. [Meituan — Round 1](#meituan-1)
2. [Meituan — Round 2](#meituan-2)
3. [Meituan — Round 3](#meituan-3)
4. [ByteDance Platform — Round 1](#byte-platform)
5. [ByteDance Lark — Round 1](#lark-1)
6. [ByteDance Lark — Round 2](#lark-2)
7. [ByteDance Lark — Round 3](#lark-3)
8. [Code Solutions](#code-solutions)
9. [Kinh Nghiệm & Chiến Lược](#chiến-lược)
10. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan

```
INTERVIEW MAP:
═══════════════════════════════════════════════════════════════

  MEITUAN (4 rounds, OFFER ✅):
  ┌─────────┬────────────────────────────────────────────────┐
  │ Round 1 │ JS core + performance + Vue source + algo     │
  │ Round 2 │ Project details + handwritten code (2 bài)    │
  │ Round 3 │ Project deep-dive + architecture + soft skills│
  │ HRBP    │ Culture fit                                    │
  └─────────┴────────────────────────────────────────────────┘

  BYTEDANCE PLATFORM (1 round):
  ┌─────────┬────────────────────────────────────────────────┐
  │ Round 1 │ Vue reactive + code reuse + Promise concurrency│
  └─────────┴────────────────────────────────────────────────┘

  BYTEDANCE LARK (3 rounds, FAIL ❌):
  ┌─────────┬────────────────────────────────────────────────┐
  │ Round 1 │ Webpack + HTTP cache + performance + coding   │
  │ Round 2 │ Vue2 vs Vue3 + project + release flow + algo  │
  │ Round 3 │ Project pain points + drag-and-drop + WASM    │
  └─────────┴────────────────────────────────────────────────┘

  TOP TẦN SUẤT CÂU HỎI:
  ┌──────────────────────────────┬────────────────┐
  │ Topic                        │ Xuất hiện      │
  ├──────────────────────────────┼────────────────┤
  │ Project details/review       │ 6/7 rounds     │
  │ Vue reactive/source          │ 4/7 rounds     │
  │ Handwritten code             │ 5/7 rounds     │
  │ Performance optimization     │ 3/7 rounds     │
  │ Webpack (loader/plugin)      │ 2/7 rounds     │
  │ Design patterns              │ 2/7 rounds     │
  │ Algorithm                    │ 3/7 rounds     │
  └──────────────────────────────┴────────────────┘
```

---

## Meituan — Round 1

```
MEITUAN ROUND 1 — JS Core + Vue + Algorithm:
═══════════════════════════════════════════════════════════════

  ① Performance optimization metrics
     → Core Web Vitals: LCP, FID, CLS
     → TTFB, FCP, TTI, TBT
     → Lighthouse score categories

  ② Project challenges & solutions
     → CRITICAL: Tự tổng kết TRƯỚC phỏng vấn!
     → Framework: Problem → Analysis → Solution → Result

  ③ Prototype Chain
     → __proto__ → prototype → Object.prototype → null
     → (Câu hỏi XUẤT HIỆN KHẮP NƠI!)

  ④ Debounce & Throttle (handwritten)
     → Debounce: chú ý this binding + immediate option!
     → KEY: Tự viết đầy đủ, ĐỪNG đợi interviewer nhắc

  ⑤ URL Input → Page Rendering
     → URL parse → DNS → TCP → HTTP → Response → Render

  ⑥ Event Loop + Practice Exercise
     → sync → microtask (Promise.then) → macrotask (setTimeout)

  ⑦ Vue Source Code
     → Reactive: defineProperty (Vue2) / Proxy (Vue3)
     → Virtual DOM, diff algorithm, template compilation

  ⑧ Design Patterns
     → Observer, Strategy, Factory, Singleton, Proxy

  ⑨ Algorithm: LCR016 — Longest Substring Without Repeating
     → Sliding Window technique (xem Code Solutions)
```

### Debounce — Bản HOÀN CHỈNH (điểm nhấn phỏng vấn)

```javascript
// Meituan yêu cầu: this binding + immediate execution option
function debounce(fn, wait, immediate = false) {
  let timer = null;

  return function (...args) {
    const context = this; // ① this binding — QUAN TRỌNG!

    if (timer) clearTimeout(timer);

    if (immediate) {
      // ② Immediate: chạy NGAY lần đầu, sau đó đợi
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null; // Reset cho lần gọi tiếp
      }, wait);
      if (callNow) fn.apply(context, args);
    } else {
      // Normal: đợi wait ms SAU trigger cuối
      timer = setTimeout(() => {
        fn.apply(context, args); // ③ apply giữ this
      }, wait);
    }
  };
}

// ⚠️ KEY: Interviewer đánh giá CAO khi bạn TỰ THÊM:
// → this binding (apply/call)
// → immediate option
// → cancel method: returned.cancel = () => clearTimeout(timer)
```

---

## Meituan — Round 2

```
MEITUAN ROUND 2 — Project + Handwritten Code:
═══════════════════════════════════════════════════════════════

  ① Low-code project details
     → Implementation specifics
     → Architecture decisions

  ② Why resign?
     → Chuẩn bị trước: positive reason (growth, challenge)

  ③ Handwritten: Max depth of a tree
     → Giống max depth of binary tree, DFS recursive

  ④ Handwritten: ES6 Template String Parser
     → Parse ${expression} trong template literal
```

### Max Depth of Tree (DFS)

```javascript
// Tính max depth — works cho N-ary tree
function maxDepth(root) {
  if (!root) return 0;

  if (!root.children || root.children.length === 0) {
    return 1;
  }

  let max = 0;
  for (const child of root.children) {
    max = Math.max(max, maxDepth(child));
  }
  return max + 1;
}

// Binary tree version:
function maxDepthBinary(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepthBinary(root.left), maxDepthBinary(root.right));
}
```

### ES6 Template String Parser

```javascript
// Parse "Hello ${name}, age is ${age + 1}"
function templateParse(template, data) {
  return template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    // expr = "name" hoặc "age + 1"
    // Dùng Function constructor để evaluate expression
    const keys = Object.keys(data);
    const values = Object.values(data);
    const fn = new Function(...keys, `return ${expr}`);
    return fn(...values);
  });
}

// Sử dụng:
const result = templateParse("Hello ${name}, you are ${age + 1} years old", {
  name: "Lvzl",
  age: 25,
});
// → "Hello Lvzl, you are 26 years old"

// Cách 2 — Đơn giản hơn (chỉ variable, không expression):
function simpleTemplate(str, data) {
  return str.replace(/\$\{(\w+)\}/g, (_, key) => {
    return data[key] !== undefined ? data[key] : "";
  });
}
```

---

## Meituan — Round 3

```
MEITUAN ROUND 3 — Architecture + Soft Skills:
═══════════════════════════════════════════════════════════════

  ① Project deep-dive (TẤT CẢ projects)
     → Low-code: VẼ TAY architecture diagram!
     → KEY: review kỹ, extract key points, nắm vững core tech

  ② Project ROI (Return on Investment)
     → Metrics: dev time, user productivity, error rate
     → Before/after comparison
     → Business impact (revenue, efficiency)

  ③ Design documents
     → Background & goals
     → Technical architecture
     → API design
     → Data model
     → Timeline & milestones
     → Risk assessment

  ④ Views on overtime
     → Balanced answer: willing when needed, prefer efficiency
     → Focus on output quality, not hours

  ⑤ Code quality
     → Code review, linting, testing, CI/CD
     → Naming conventions, documentation

  ⑥ Analytics & tracking (埋点)
     → Event tracking, user behavior, performance monitoring
     → SDK integration, data pipeline

  ⑦ Design Patterns (again!)

  ⑧ Tech stack adaptation (Vue → React + Mini Programs)
     → Framework-agnostic concepts (state, lifecycle, components)
     → Transferable skills, quick learning plan
     → Side projects, documentation reading

  💡 INSIGHT: Round 3 = project review + soft skills
     → Technical depth QUAN TRỌNG
     → Nhưng communication + thinking process CŨNG quan trọng!
```

---

## ByteDance Platform — Round 1

```
BYTEDANCE PLATFORM — Vue Deep Dive:
═══════════════════════════════════════════════════════════════

  ① Vue two-way data binding principle
     → v-model = :value + @input (syntax sugar)
     → KHÁC với Reactivity! (hay bị nhầm lẫn)

  ② Reactive system principle
     → Vue2: Object.defineProperty (getter/setter per key)
     → Vue3: Proxy (intercept entire object)

  ③ Vue3 performance improvements vs Vue2
     → Static hoisting (tách node tĩnh khỏi render)
     → Patch flags (chỉ diff dynamic nodes)
     → Block tree optimization
     → Tree-shaking (unused APIs removed)
     → Proxy vs defineProperty (lazy, better for arrays)

  ④ Code reuse in Vue (4 solutions + ưu/nhược)

  ⑤ Handwritten: Promise concurrency control
```

### Vue Two-way Binding vs Reactivity

```
⚠️ HAY BỊ NHẦM — PHÂN BIỆT RÕ:
═══════════════════════════════════════════════════════════════

  TWO-WAY BINDING (双向绑定):
  → v-model trên form elements (input, select, textarea)
  → User input → update data → update view

  REACTIVITY (响应式):
  → Data change → auto update DOM
  → defineProperty(Vue2) / Proxy(Vue3)
  → Dep + Watcher pattern
  → KHÔNG phải two-way! Là ONE-WAY reactive!

  v-model là SYNTAX SUGAR:
  <input v-model="msg">
  ≡
  <input :value="msg" @input="msg = $event.target.value">
```

### Vue Code Reuse — 4 Solutions

```
VUE CODE REUSE:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────┬──────────────────────────┐
  │ Method       │ Vue Version     │ ưu/nhược                 │
  ├──────────────┼─────────────────┼──────────────────────────┤
  │ Mixins       │ Vue2            │ ❌ Name conflict         │
  │              │                 │ ❌ Unclear data source   │
  │              │                 │ ❌ Implicit dependencies │
  ├──────────────┼─────────────────┼──────────────────────────┤
  │ HOC          │ Vue2/3          │ ❌ Wrapper hell          │
  │ (Higher-Order│                 │ ❌ Props conflict        │
  │  Component)  │                 │ ✅ Pure function         │
  ├──────────────┼─────────────────┼──────────────────────────┤
  │ Renderless   │ Vue2/3          │ ✅ Explicit slot scope   │
  │ Components   │ (scoped slots)  │ ❌ Extra component level │
  │              │                 │ ❌ Template verbose      │
  ├──────────────┼─────────────────┼──────────────────────────┤
  │ Composition  │ Vue3 ⭐          │ ✅ Explicit, typed       │
  │ API (hooks)  │                 │ ✅ Tree-shakable         │
  │ composables  │                 │ ✅ No conflict           │
  │              │                 │ ✅ Flexible              │
  └──────────────┴─────────────────┴──────────────────────────┘
```

### Promise Concurrency Control

```javascript
// Giới hạn tối đa N promises chạy đồng thời
function promisePool(tasks, limit) {
  return new Promise((resolve) => {
    let activeCount = 0;
    let taskIndex = 0;
    const results = [];
    const total = tasks.length;

    function runNext() {
      // Tất cả task xong → resolve
      if (taskIndex >= total && activeCount === 0) {
        return resolve(results);
      }

      // Chạy task tiếp theo nếu chưa đạt limit
      while (activeCount < limit && taskIndex < total) {
        const currentIndex = taskIndex++;
        activeCount++;

        Promise.resolve(tasks[currentIndex]())
          .then((result) => {
            results[currentIndex] = result;
          })
          .catch((err) => {
            results[currentIndex] = err;
          })
          .finally(() => {
            activeCount--;
            runNext(); // Slot trống → chạy task tiếp
          });
      }
    }

    runNext();
  });
}

// Sử dụng:
const tasks = urls.map((url) => () => fetch(url));
promisePool(tasks, 3); // Max 3 concurrent requests
```

---

## ByteDance Lark — Round 1

```
LARK ROUND 1 — Webpack + Cache + Performance:
═══════════════════════════════════════════════════════════════

  ① Performance optimization methods
     → Loading: lazy load, code split, CDN, compress, cache
     → Rendering: virtual list, debounce/throttle, rAF
     → Runtime: Web Worker, memoization, tree-shaking

  ② Webpack loaders vs plugins
     → Loader: file transform (R→L chain)
     → Plugin: lifecycle hooks (apply + compiler.hooks.tap)
     → "Bạn đã tự viết loader/plugin chưa?"

  ③ Can a loader change the output?
     → YES! Loader transform source → return modified content
     → Chain: output of loader N = input of loader N-1

  ④ PostCSS — preprocessing vs post-processing
     → Pre-processor: Sass/Less → CSS (TRƯỚC viết CSS)
     → Post-processor: PostCSS (SAU viết CSS → autoprefixer, etc)
     → PostCSS = "Babel for CSS" (plugin-based transform)

  ⑤ Webpack lazy loading (import())
     → Dynamic import → separate chunk → load on demand
     → Route-based: React.lazy() / Vue async component

  ⑥ Scroll lazy loading (images, components)

  ⑦ HTTP caching — Project cache strategy

  ⑧ babel-loader input/output
     → Input: source code string (ES6+/JSX/TS)
     → Output: transformed source string (ES5)
     → + optional: sourceMap, AST

  ⑨ Coding: Output Promises in order
```

### Output Promises in Order

```javascript
// Chạy async tasks, nhưng OUTPUT theo THỨ TỰ
async function sequentialOutput(promises) {
  const results = [];

  // Chạy TẤT CẢ cùng lúc (parallel)
  for (let i = 0; i < promises.length; i++) {
    results.push(promises[i]); // Không await ở đây!
  }

  // Await theo THỨ TỰ
  for (let i = 0; i < results.length; i++) {
    const value = await results[i]; // Await lần lượt
    console.log(value);
  }
}

// Cách 2 — reduce chain:
function orderedOutput(promiseFns) {
  return promiseFns.reduce((chain, fn) => {
    return chain.then(() => fn().then(console.log));
  }, Promise.resolve());
}
```

---

## ByteDance Lark — Round 2

```
LARK ROUND 2 — Vue2 vs Vue3 + Release Flow:
═══════════════════════════════════════════════════════════════

  ① Low-code project details (again!)

  ② Vue2 vs Vue3 differences (TOÀN DIỆN):
```

```
VUE2 vs VUE3 — COMPREHENSIVE:
═══════════════════════════════════════════════════════════════

  REACTIVITY:
  → Vue2: Object.defineProperty (per property, no array index)
  → Vue3: Proxy (whole object, lazy, array support) ⭐

  PERFORMANCE:
  → Static hoisting: tách static nodes khỏi render
  → Patch flags: đánh dấu dynamic bindings → skip static diff
  → Block tree: flatten dynamic nodes → fast diff ⭐
  → Tree-shaking: unused APIs not bundled

  COMPOSITION API:
  → setup() thay data/methods/computed/watch
  → Composables (useXxx) thay mixins
  → Better TypeScript support
  → Better code organization (by feature, not option)

  RENDER FUNCTION:
  → Vue2: h('div', { attrs: {} }, children)
  → Vue3: h('div', { class: 'x' }, children) — flat props

  SLOTS:
  → Vue2: this.$scopedSlots
  → Vue3: unified slots (v-slot directive)

  WATCHEFFECT:
  → Auto-track dependencies (no explicit watch target)
  → watchEffect(() => console.log(count.value))

  OTHER:
  → Teleport, Suspense, multiple v-models
  → Fragment (multiple root nodes)
  → createApp() thay new Vue()
```

```
  ③ Vue2 → Vue3 upgrade strategy
     → Gradual migration (Vue 2.7 bridge)
     → @vue/compat mode
     → Rewrite composables thay mixins
     → Update build tools (Vite thay Webpack)

  ④ Project release process
     → dev → staging → pre-prod → production
     → CI/CD pipeline (lint → test → build → deploy)
     → Approval flow, rollback strategy

  ⑤ Algorithm: Longest Common Prefix (LeetCode 14)
```

### Longest Common Prefix

```javascript
// Solution 1: Vertical scanning (dễ hiểu nhất)
function longestCommonPrefix(strs) {
  if (!strs.length) return "";

  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      if (i >= strs[j].length || strs[j][i] !== char) {
        return strs[0].substring(0, i);
      }
    }
  }
  return strs[0];
}

// Solution 2: Sort + compare first & last (elegant)
function longestCommonPrefix2(strs) {
  if (!strs.length) return "";
  strs.sort();
  const first = strs[0];
  const last = strs[strs.length - 1];
  let i = 0;
  while (i < first.length && first[i] === last[i]) i++;
  return first.substring(0, i);
}
// Sort → first & last have MAX difference → chỉ cần compare 2 cái!
```

---

## ByteDance Lark — Round 3

```
LARK ROUND 3 — Depth + Breadth:
═══════════════════════════════════════════════════════════════

  ① Project pain points + optimization ideas
     → Interviewer muốn nghe CÁCH NGHĨ, không chỉ kết quả!

  ② Drag-and-drop solutions (hỏi RẤT SÂU):
     → Library: react-dnd, dnd-kit, SortableJS, Vue.Draggable
     → Native HTML5 Drag API:
       • dragstart, drag, dragenter, dragover, dragleave, drop, dragend
       • dataTransfer.setData / getData
       • Nhược: styling limited, mobile issues

     → Alternatives WITHOUT drag:
       • Click + click (select → place)
       • Arrow keys / keyboard controls
       • Touch events (touchstart/move/end) manual
       • Sortable via move up/down buttons
       → Interviewer đánh giá BREADTH of thinking!

  ③ WebAssembly
     → Binary format, near-native speed in browser
     → Use cases: video/image processing, games, scientific computing
     → Languages: Rust, C/C++, AssemblyScript → compile → .wasm
     → JS interop: WebAssembly.instantiate()

  ④ Code quality assessment
     → Không khó nhưng đánh giá:
       • Exception handling
       • Boundary management
       • Code cleanliness
       • Edge cases
```

---

## Code Solutions

### LCR016 — Longest Substring Without Repeating Characters

```javascript
// Sliding Window — O(n) time, O(min(n,m)) space
function lengthOfLongestSubstring(s) {
  const map = new Map(); // char → last index
  let maxLen = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // Nếu char đã thấy VÀ vị trí >= left → move left
    if (map.has(char) && map.get(char) >= left) {
      left = map.get(char) + 1; // Skip past duplicate
    }

    map.set(char, right); // Update last seen position
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// Ví dụ:
lengthOfLongestSubstring("abcabcbb"); // 3 ("abc")
lengthOfLongestSubstring("bbbbb"); // 1 ("b")
lengthOfLongestSubstring("pwwkew"); // 3 ("wke")
```

```
SLIDING WINDOW — CÁCH NGHĨ:
═══════════════════════════════════════════════════════════════

  "a b c a b c b b"
   L     R              → window "abc" = 3

  Gặp 'a' lặp (index 0):
   "a b c a b c b b"
         L R             → left = 1 (skip past old 'a')
                         → window "bca" = 3

  Gặp 'b' lặp (index 1):
   "a b c a b c b b"
           L   R         → left = 2 → window "cab" = 3

  → Max = 3

  KEY: Map lưu last index → khi gặp duplicate → left jump!
```

---

## Kinh Nghiệm & Chiến Lược

```
CHIẾN LƯỢC PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  📋 PROJECT REVIEW — QUAN TRỌNG NHẤT:
  → 6/7 vòng hỏi về project
  → Chuẩn bị: architecture diagram, key decisions, challenges
  → Framework: Problem → Why → Solution → Metrics
  → ROI: before/after numbers (speed ×7, size -60%, etc.)

  ✍️ HANDWRITTEN CODE — CƠ HỘI GHI ĐIỂM:
  → Tự thêm this binding, edge cases, options
  → ĐỪNG đợi interviewer nhắc → chủ động!
  → Clean code: naming, error handling, boundary checks

  🧠 VUE — PHÂN BIỆT RÕ:
  → Two-way binding ≠ Reactivity (hay bị nhầm!)
  → Vue2 vs Vue3: Proxy, Composition API, performance
  → Code reuse: Mixins → HOC → Slots → Composables ⭐

  🎯 ALGORITHM — MỨC ĐỘ:
  → Meituan/Byte: Easy-Medium LeetCode
  → Key patterns: Sliding Window, DFS, BFS, Two Pointers
  → Focus: clean implementation + explain approach

  💡 BREADTH THINKING:
  → Lark Round 3: hỏi drag-and-drop → alternatives?
  → Interviewer đánh giá khả năng TƯ DUY, không chỉ biết
  → Đưa ra NHIỀU solutions, so sánh trade-offs

  ⚠️ BÀI HỌC TỪ FAIL:
  → Lark Round 3 fail: breadth + depth cần BALANCE
  → Code quality: exception handling + boundary checks
  → Đừng chỉ biết "what", phải biết "why" + "alternatives"
```

```
WORK REVIEW — MẪU CHUẨN BỊ PROJECT:
═══════════════════════════════════════════════════════════════

  Mỗi project cần chuẩn bị:

  ① WHAT: Project làm gì, cho ai, quy mô?
  ② WHY: Tại sao cần? Business problem?
  ③ HOW: Architecture, tech stack, key decisions?
  ④ CHALLENGE: Khó khăn gì? (chuẩn bị 2-3 câu chuyện)
  ⑤ SOLUTION: Giải quyết như thế nào?
  ⑥ RESULT: Metrics (performance, user, business)
  ⑦ RETROSPECTIVE: Nếu làm lại, sẽ làm khác gì?

  LOW-CODE PROJECT (hay hỏi):
  → Code transformation (API, keyword, Vue methods gen)
  → Online editor architecture
  → Component system (extensible, configurable)
  → Design specification implementation
  → Webpack plugins (address → inline script)
  → Error monitoring, performance monitoring SDK
  → Web Worker for component properties
  → Request interceptor (axios config, token refresh)
  → Router guards (whitelist, token check)
  → Dictionary encapsulation (key-value transforms)
  → localStorage/sessionStorage type serialization
```

---

## Tóm Tắt

### Quick Reference

```
INTERVIEW QUICK REF:
═══════════════════════════════════════════════════════════════

  MEITUAN:
  → R1: All common skills (prototype, debounce, event loop, Vue)
  → R2: Project details + medium handwritten code
  → R3: Architecture + soft skills (ROI, design docs, overtime)
  → Verdict: Fair, practical questions ✅

  BYTEDANCE PLATFORM:
  → Vue deep dive (binding vs reactivity, reuse methods)
  → Promise concurrency control

  BYTEDANCE LARK:
  → R1: Webpack (loader/plugin, PostCSS, lazy load) + HTTP cache
  → R2: Vue2vsVue3 (comprehensive) + release flow + LeetCode easy
  → R3: Breadth+depth (drag alternatives, WebAssembly, code quality)
  → Verdict: R3 hard, needs broad knowledge ❌

  KEY CODE SOLUTIONS:
  → Debounce with this+immediate: apply(context, args) + !timer flag
  → Tree max depth: 1 + Math.max(children recursive)
  → Template parser: replace(/\$\{([^}]+)\}/g, ...) + new Function
  → Sliding window: Map + left pointer jump
  → Promise pool: activeCount < limit → run, finally → runNext
  → Longest prefix: sort → compare first & last
  → Promise order output: collect parallel → await sequential
```

### Checklist

- [ ] Chuẩn bị project review: WHAT/WHY/HOW/CHALLENGE/SOLUTION/RESULT
- [ ] Vẽ tay architecture diagram cho project chính
- [ ] Phân biệt Vue two-way binding vs reactivity
- [ ] Vue2 vs Vue3: Proxy, Composition API, static hoisting, patch flags
- [ ] Vue code reuse: Mixins → HOC → Slots → Composables (ưu nhược)
- [ ] Debounce: this binding (apply) + immediate option + cancel method
- [ ] Prototype chain: **proto** → prototype → Object.prototype → null
- [ ] Event Loop: sync → ALL microtasks → 1 macrotask → render
- [ ] Webpack: loader (file transform) vs plugin (lifecycle hooks)
- [ ] PostCSS = post-processor (SAU CSS), Sass/Less = pre-processor (TRƯỚC)
- [ ] HTTP cache: Strong (Cache-Control) → Conditional (ETag/Last-Modified)
- [ ] Promise concurrency: activeCount + limit + finally → runNext
- [ ] Sliding Window pattern: Map + left pointer
- [ ] Design Patterns: Observer, Strategy, Factory, Singleton, Proxy
- [ ] Handwritten code: clean naming + error handling + boundary checks
- [ ] Drag-and-drop: library / HTML5 Drag API / alternatives (click, keyboard)
- [ ] WebAssembly: binary format, near-native, Rust/C++ → .wasm
- [ ] Soft skills: ROI, design docs, overtime view, tech stack adaptation

---

_Cập nhật lần cuối: Tháng 2, 2026_
