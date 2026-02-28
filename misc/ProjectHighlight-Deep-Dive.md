# Outstanding Projects — How to Stand Out in Big Tech Interviews

> 📅 2026-02-12 · ⏱ 18 phút đọc
>
> "Bạn đã làm project gì nổi bật?"
> — Câu hỏi kinh điển từ interviewer Big Tech
> 6 chiều tối ưu: Data Scale, R&D Efficiency, Quality, Performance, UX, Complex Scenarios
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: System Design / Interview Strategy / Architecture

---

## Mục Lục

0. [Tổng Quan — Tư Duy "Nổi Bật"](#tổng-quan)
1. [Large Data — Virtual Scroll](#large-data)
2. [Large Data — File Upload Recap](#file-upload)
3. [R&D Efficiency — Team & Reuse](#rnd-efficiency)
4. [R&D Quality — Testing & Review](#rnd-quality)
5. [Performance — Faster Loading](#perf-loading)
6. [Performance — Faster Execution](#perf-execution)
7. [UX & Complex Scenarios](#complex)
8. [Growth Mindset — Learn Essence, Not API](#growth)
9. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan — Tư Duy "Nổi Bật"

```
PHỎNG VẤN = BLIND DATE:
═══════════════════════════════════════════════════════════════

  Interviewer KHÔNG MUỐN nghe:
  ❌ "Em làm CRUD, login, popup, bảng dữ liệu..."
  ❌ "Em dùng React/Vue, gọi API, hiển thị data..."
  → Ai cũng làm được! Không có gì nổi bật.

  Interviewer MUỐN nghe:
  ✅ "Bảng 10,000 dòng → em implement virtual scroll..."
  ✅ "Upload file 2GB → em slicing + resume + instant upload..."
  ✅ "Component library → em viết unit test coverage 90%..."
  → ĐỘC ĐÁO! Có chiều sâu kỹ thuật!

  TƯ DUY: Cùng 1 requirement → tối ưu thêm → trở nên OUTSTANDING
```

```
6 CHIỀU TỐI ƯU — BIẾN PROJECT THƯỜNG → ENTERPRISE-LEVEL:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                    YOUR PROJECT                         │
  │                                                         │
  │  ① Large Data           → Virtual Scroll, File Upload  │
  │  ② R&D Efficiency       → Scaffolding, Component Lib   │
  │  ③ R&D Quality          → Testing, Code Review         │
  │  ④ Performance          → Loading + Execution speed    │
  │  ⑤ User Experience      → Micro-interactions, A11y     │
  │  ⑥ Complex Scenarios    → Low-code, Editor, 3D, WebGL │
  └─────────────────────────────────────────────────────────┘

  MỖI CHIỀU = 1 highlight có thể nói 10-15 phút trong phỏng vấn
  → Chỉ cần 2-3 chiều → đã rất ấn tượng!
```

---

## §1. Large Data — Virtual Scroll

### Bài Toán

```
SCENARIO: Course page, 10,000 rows
═══════════════════════════════════════════════════════════════

  Thông thường: Pagination → đơn giản, ai cũng biết

  Extreme case: Infinite scroll (mobile product listing)
  → Render 10,000 DOM elements → BROWSER LAG! 💀
  → DOM quá nhiều → Layout, Paint, Composite chậm

  SOLUTION: Virtual Scroll (虚拟滚动)
  → Chỉ render ~20-30 rows VISIBLE trong viewport
  → Scroll → UPDATE nội dung 20-30 DOM elements
  → KHÔNG tạo/xóa DOM → chỉ đổi data + translate offset

  10,000 elements → ~30 DOM nodes → SMOOTH! ⚡
```

### Virtual Scroll Principle

```
VIRTUAL SCROLL — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────┐
  │ Container (overflow: auto)   │
  │ ┌──────────────────────────┐ │
  │ │ Phantom (height: total)  │ │ ← Tạo scrollbar đúng kích thước
  │ │                          │ │
  │ │ ┌──────────────────────┐ │ │
  │ │ │ ░░░ invisible ░░░░░ │ │ │ ← scroll qua rồi
  │ │ ├──────────────────────┤ │ │
  │ │ │ ▓▓ VISIBLE AREA ▓▓▓ │ │ │ ← CHỈ render phần này!
  │ │ │ Item 50              │ │ │    ~20-30 items
  │ │ │ Item 51              │ │ │
  │ │ │ Item 52              │ │ │
  │ │ │ ...                  │ │ │
  │ │ │ Item 70              │ │ │
  │ │ ├──────────────────────┤ │ │
  │ │ │ ░░░ invisible ░░░░░ │ │ │ ← chưa scroll tới
  │ │ └──────────────────────┘ │ │
  │ └──────────────────────────┘ │
  └──────────────────────────────┘

  KEY CALCULATIONS:
  ① viewHeight = container.clientHeight        (viewport height)
  ② visibleCount = Math.ceil(viewHeight / HEIGHT) (items fit in view)
  ③ startIndex = Math.floor(scrollTop / HEIGHT)   (first visible item)
  ④ endIndex = startIndex + visibleCount           (last visible item)
  ⑤ offset = scrollTop - (scrollTop % HEIGHT)      (translate Y)
  ⑥ visibleData = list.slice(startIndex, endIndex) (data to render)
```

### React + TypeScript Implementation

```typescript
const HEIGHT = 40;  // Fixed height per item

function VirtualList({ list }: VirtualProps) {
    const container = useRef<HTMLDivElement>(null);
    const [start, setStart] = useState(0);
    const [visibleData, setVisibleData] = useState<VirtualProps["list"]>([]);
    const [viewTransform, setViewTransform] = useState("translate3d(0,0,0)");

    useEffect(() => {
        const containerDom = container.current;
        const viewHeight = containerDom?.clientHeight || 500;
        const visibleCount = Math.ceil(viewHeight / HEIGHT);
        const end = start + visibleCount;
        setVisibleData(list.slice(start, end));
    }, []);

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
        const scrollTop = e.currentTarget.scrollTop;
        const containerDom = container.current;
        const viewHeight = containerDom?.clientHeight || 500;

        // ① Tính start/end index
        const start = Math.floor(scrollTop / HEIGHT);
        const end = start + Math.ceil(viewHeight / HEIGHT);

        // ② Cắt data visible
        setVisibleData(list.slice(start, end));
        setStart(start);

        // ③ Translate offset: "đẩy" visible items đúng vị trí
        setViewTransform(`translate3d(0, ${start * HEIGHT}px, 0)`);
    }

    return (
        <div ref={container} style={{ height: "500px", overflow: "auto" }}
             onScroll={handleScroll}>
            {/* Phantom: tạo full scrollbar height */}
            <div style={{ height: list.length * HEIGHT + "px" }}>
                {/* Visible items: chỉ render ~20-30 items */}
                <div style={{ transform: viewTransform }}>
                    {visibleData.map((item, i) => (
                        <div key={start + i} style={{ height: HEIGHT }}>
                            {item.content}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
```

### Variable Height — Dynamic Measurement

```
VARIABLE HEIGHT — NÂNG CAO:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Mỗi item chứa text dài ngắn khác nhau → height KHÁC NHAU!
  → Fixed HEIGHT = 40px → KHÔNG CHÍNH XÁC!

  GIẢI PHÁP:
  ① Dự đoán: PREDICT_HEIGHT = 60px (estimate)
  ② Sau render: đo DOM thật → getBoundingClientRect()
  ③ Cache vào positions[] array
  ④ Cập nhật positions cho items phía sau (cascading update)

  positions[]:
  ┌───────┬────────┬───────┐
  │ index │ height │  top  │
  ├───────┼────────┼───────┤
  │   0   │   45   │   0   │  ← actual DOM height
  │   1   │   80   │  45   │  ← top = prev.top + prev.height
  │   2   │   55   │  125  │
  │   3   │   90   │  180  │
  │  ...  │  ...   │  ...  │
  └───────┴────────┴───────┘

  ⚠️ positions[] là PREFIX SUM array
  → Tìm startIndex có thể dùng BINARY SEARCH! O(log n)
  → Thay vì linear scan O(n)
```

```typescript
const PREDICT_HEIGHT = 60;

// Maintain positions array
const [positions, setPosition] = useState<{ top: number; height: number }[]>(
  [],
);

// After render: measure actual DOM heights
useEffect(() => {
  Array.from(listDom?.children).forEach((node, index) => {
    const { height } = node.getBoundingClientRect();

    if (height !== positions[start + index].height) {
      setPosition((prev) => {
        const newPos = [...prev];
        newPos[start + index].height = height;

        // Cascade update: recalculate all tops after this index
        for (let k = index + 1; k < prev.length; k++) {
          newPos[k].top = newPos[k - 1].top + newPos[k - 1].height;
        }
        return newPos;
      });
    }
  });
}, [visibleData]);
```

```
BINARY SEARCH OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  positions[] là sorted by .top → Binary Search!

  // Tìm startIndex: item nào có top >= scrollTop?
  function findStartIndex(positions, scrollTop) {
      let low = 0, high = positions.length - 1;
      while (low <= high) {
          const mid = (low + high) >> 1;
          if (positions[mid].top === scrollTop) return mid;
          if (positions[mid].top < scrollTop) low = mid + 1;
          else high = mid - 1;
      }
      return low;  // First item with top >= scrollTop
  }

  10,000 items: linear scan = 10,000 ops
                binary search = ~14 ops (log₂10000)
  → 700x faster! ⚡
```

---

## §2. Large Data — File Upload Recap

```
FILE UPLOAD HIGHLIGHT — TÓM TẮT (chi tiết xem Part 1 & 2):
═══════════════════════════════════════════════════════════════

  Regular file: axios.post + progress bar → ĐƠN GIẢN, ai cũng biết

  Large file (2GB+): → PHỨC TẠP, NỔI BẬT!
  ┌─────────────────────────────────────────────────────────┐
  │ ① File Splitting      → Blob.slice() → chunks          │
  │ ② Hash Calculation    → 3 strategies:                  │
  │    → Web Worker       → separate thread, non-blocking  │
  │    → Time Slice       → requestIdleCallback (Fiber)    │
  │    → Sampling Hash    → Bloom Filter idea, 20x faster  │
  │ ③ Instant Upload      → hash match → skip upload (秒传)│
  │ ④ Concurrency Control → max N connections, queue-based │
  │ ⑤ Pause + Resume      → xhr.abort() + uploadedList     │
  │ ⑥ Retry + Error       → retryArr[], max 2 retries     │
  │ ⑦ Slow Start          → TCP inspired, dynamic sizing  │
  │ ⑧ Fragment Cleanup    → node-schedule cron job         │
  └─────────────────────────────────────────────────────────┘

  → Nói được 30 PHÚT trong phỏng vấn!
  → Kiến thức liên quan: Web Worker, React Fiber, Bloom Filter,
     TCP Congestion Control, ByteDance concurrency question
```

### Async Concurrency Control — Interview Question

```javascript
// Solution 1: limit() wrapper — elegant API
function limit(maxCount) {
  let queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()(); // Lấy task tiếp từ queue
    }
  };

  const run = async (fn, resolve, args) => {
    activeCount++;
    const result = (async () => fn(...args))();
    resolve(result);
    await result;
    next(); // Task xong → chạy task tiếp
  };

  const push = async (fn, resolve, args) => {
    queue.push(run.bind(null, fn, resolve, args));
    if (activeCount < maxCount && queue.length > 0) {
      // Còn slot VÀ còn task → chạy ngay!
      queue.shift()();
    }
  };

  // Runner: wrap function → Promise (auto-queued)
  let runner = (fn, ...args) => {
    return new Promise((resolve) => {
      push(fn, resolve, args);
    });
  };
  return runner;
}

// Usage:
const limitedFetch = limit(3);
urls.forEach((url) => limitedFetch(fetch, url));
```

```javascript
// Solution 2: asyncPool — simpler, using Promise.race
async function asyncPool({ limit, items, fn }) {
  const promises = [];
  const pool = new Set();

  for (const item of items) {
    const promise = fn(item);
    promises.push(promise);
    pool.add(promise);

    const clean = () => pool.delete(promise);
    promise.then(clean, clean);

    // Pool đầy → đợi 1 task xong (Promise.race)
    if (pool.size >= limit) {
      await Promise.race(pool);
    }
  }
  return Promise.all(promises);
}

// Usage:
await asyncPool({
  limit: 4,
  items: chunks,
  fn: (chunk) => uploadChunk(chunk),
});
```

```
2 SOLUTIONS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────┬─────────────────────┐
  │                │ limit() wrapper  │ asyncPool           │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ API style      │ Wrap function    │ Pass items array    │
  │ Mechanism      │ Queue + shift    │ Set + Promise.race  │
  │ Reusability    │ ✅ Higher (HOF)  │ ⚠️ Per-use          │
  │ Code lines     │ ~25 lines       │ ~15 lines           │
  │ Interview      │ ⭐ More elegant │ ⭐ Simpler          │
  │ Production     │ p-limit (npm)   │ tiny-async-pool     │
  └────────────────┴──────────────────┴─────────────────────┘

  KEY CONCEPT: Queue-based concurrency control
  → activeCount tracks "slots in use"
  → Task complete → next() → dequeue next task
  → Promise.race: race pool → first done → slot freed
```

---

## §3. R&D Efficiency — Team & Reuse

```
R&D EFFICIENCY — 2 PATHS:
═══════════════════════════════════════════════════════════════

  Path 1: TEAM COLLABORATION (团队协作)
  ┌─────────────────────────────────────────────────────────┐
  │ ① STANDARDIZATION — Normalization                      │
  │   → JS Style (ESLint + Prettier)                       │
  │   → Git Branch (GitFlow / Trunk-based)                 │
  │   → Logging format (structured logs)                   │
  │   → Project structure (standard folder layout)         │
  │   → Automated validation (Husky + lint-staged)         │
  │                                                         │
  │ ② NON-CODE COLLABORATION                              │
  │   → Agile Kanban (Jira, Linear)                        │
  │   → Efficient meetings (with agenda & action items)    │
  │   → Code Review culture                                │
  └─────────────────────────────────────────────────────────┘

  Path 2: MULTI-PROJECT REUSE (多项目间复用)
  ┌─────────────────────────────────────────────────────────┐
  │ ① INITIALIZATION — Scaffolding (脚手架)                │
  │   → create-vite, create-react-app style CLI            │
  │   → Built-in: ESLint, Prettier, testing, CI/CD         │
  │   → New project = 1 command → ready to code!           │
  │                                                         │
  │ ② DEVELOPMENT — Component & Utility Libraries          │
  │   → Component Library (组件库): AntDesign, Element-UI  │
  │   → Utility Library (工具库): lodash, vueuse           │
  │   → Shared across ALL projects!                        │
  │                                                         │
  │ ③ INTEGRATION — Type & Mock Tools                      │
  │   → API JSON → TypeScript interfaces (auto-gen)        │
  │   → Mock data tools (MSW, json-server)                 │
  │                                                         │
  │ ④ DEPLOYMENT — CI/CD Automation                        │
  │   → One-click deploy (GitHub Actions, GitLab CI)       │
  │   → Auto-notify chat groups (Slack, DingTalk)          │
  └─────────────────────────────────────────────────────────┘
```

```
MODERN TOOLCHAIN — RUST REVOLUTION:
═══════════════════════════════════════════════════════════════

  Compilation Speed → Developer Experience → Coding Efficiency!

  ┌────────────────┬────────────────┬──────────────────────┐
  │ Category       │ Old (JS-based) │ New (Rust-based)     │
  ├────────────────┼────────────────┼──────────────────────┤
  │ Bundler        │ Webpack        │ Vite (esbuild+Rollup)│
  │ Transpiler     │ Babel          │ SWC                  │
  │ Full solution  │ Webpack + Babel│ RSPack (ByteDance!)  │
  │ Linter         │ ESLint         │ oxlint (Oxc)         │
  │ Formatter      │ Prettier       │ dprint / Biome       │
  └────────────────┴────────────────┴──────────────────────┘

  → 10-100x faster! Cold start: seconds → milliseconds
  → Developer mood ↑ → Productivity ↑
  → "Instant-on" dev experience = KHÔNG ĐỢI build!
```

```
INTERVIEW TIP — CÁCH NÓI VỀ R&D EFFICIENCY:
═══════════════════════════════════════════════════════════════

  ❌ "Em cài ESLint vào project"
  → Quá chung chung, không ấn tượng

  ✅ "Em build CLI tool tự động init project với ESLint,
  Prettier, Husky pre-commit hooks, CI/CD pipeline.
  Team 8 người dùng, giảm 90% setup time cho new project.
  Component library shared 15+ components across 3 projects,
  với Storybook documentation và 85% test coverage."
  → CỤ THỂ, có số liệu, có impact!
```

---

## §4. R&D Quality — Testing & Review

```
R&D QUALITY — TESTING PYRAMID:
═══════════════════════════════════════════════════════════════

  KINH ĐIỂN: Refactoring, Clean Code, Code Complete
  → Frontend: automated testing = đã rất tốt rồi!

                        ╱╲
                       ╱  ╲
                      ╱ E2E╲        ← Playwright, Cypress
                     ╱______╲       (expensive, slow, few)
                    ╱        ╲
                   ╱Integration╲    ← React Testing Library
                  ╱____________╲    (moderate cost/count)
                 ╱              ╲
                ╱   Unit Tests   ╲  ← Jest, Vitest
               ╱__________________╲ (cheap, fast, many!)

  WHERE TO TEST:
  → Business pages: test quá tốn kém → code review thay thế
  → Component Library (组件库): PHẢI test! → shared code
  → Utility Library (工具库): PHẢI test! → core logic
  → Test coverage = quality indicator + maintainability signal
```

```
VITEST — MODERN TESTING:
═══════════════════════════════════════════════════════════════

  Tại sao Vitest > Jest cho Vite projects?
  → Native ESM support (Jest cần transform)
  → Vite config reuse (không cần config riêng)
  → Watch mode siêu nhanh (Vite HMR)
  → Compatible Jest API (migration dễ)

  // utils/leftpad.test.ts
  import { describe, it, expect } from 'vitest';
  import { leftpad } from './leftpad';

  describe('leftpad', () => {
      it('pads string with zeros', () => {
          expect(leftpad('hello', 10, '0')).toBe('00000hello');
      });
      it('returns original if length <= string length', () => {
          expect(leftpad('hello', 3, '0')).toBe('hello');
      });
  });

  CODE REVIEW — Process-level quality:
  → PR template (what, why, how, testing evidence)
  → Required approvals (min 1-2 reviewers)
  → Automated checks (lint, test, build) before merge
```

```
INTERVIEW TIP — CÁCH NÓI VỀ QUALITY:
═══════════════════════════════════════════════════════════════

  ✅ "Em build component library với Vitest + RTL,
  85% coverage, Storybook visual testing.
  Trước khi có test: mỗi lần update component → 3-4 bugs
  Sau khi có test: regression bugs giảm 90%.
  CI pipeline tự chạy test khi PR → block merge nếu fail."

  → Có before/after metrics
  → Có automation (CI/CD integration)
  → Có real impact (90% reduction)
```

---

## §5. Performance — Faster Loading

### Performance Metrics

```
PERFORMANCE METRICS — CẦN BIẾT TRƯỚC KHI TỐI ƯU:
═══════════════════════════════════════════════════════════════

  Giống game RPG: biết chỉ số ATK/DEF → mới biết nâng gì!

  ┌─────────┬───────────────────────────────────────────────┐
  │ Metric  │ Meaning                                       │
  ├─────────┼───────────────────────────────────────────────┤
  │ FCP     │ First Contentful Paint                        │
  │         │ → Thời gian hiển thị NỘI DUNG đầu tiên       │
  │         │ → User thấy "cái gì đó" (text, image, svg)   │
  │         │ → Target: < 1.8s                              │
  ├─────────┼───────────────────────────────────────────────┤
  │ LCP     │ Largest Contentful Paint                      │
  │         │ → Thời gian hiển thị phần tử LỚN NHẤT        │
  │         │ → "Main content" đã load xong chưa?           │
  │         │ → Target: < 2.5s                              │
  ├─────────┼───────────────────────────────────────────────┤
  │ TTI     │ Time to Interactive                           │
  │         │ → Khi nào page TƯƠNG TÁC ĐƯỢC (click, type)  │
  │         │ → Main thread idle, event handlers ready      │
  │         │ → Target: < 3.8s                              │
  ├─────────┼───────────────────────────────────────────────┤
  │ CLS     │ Cumulative Layout Shift                       │
  │         │ → "Nhảy layout" bao nhiêu (visual stability) │
  │         │ → Image/font load → content dịch chuyển       │
  │         │ → Target: < 0.1                               │
  ├─────────┼───────────────────────────────────────────────┤
  │ FID     │ First Input Delay                             │
  │         │ → Delay giữa user click → browser phản hồi   │
  │         │ → Target: < 100ms                             │
  └─────────┴───────────────────────────────────────────────┘

  Core Web Vitals (Google): LCP + FID + CLS
  → 3 chỉ số quan trọng nhất cho SEO & UX
```

### File Loading Optimization

```
FASTER FILE LOADING — 5 STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① REDUCE FILE SIZE (giảm kích thước)
  ┌─────────────────────────────────────────────────────────┐
  │ → Bundling & compression (gzip, brotli)                │
  │ → Image optimization: JPG vs PNG vs WebP               │
  │                                                         │
  │   Format    │ Best for           │ Compression          │
  │   JPG       │ Photos             │ Lossy, good          │
  │   PNG       │ Icons, transparent │ Lossless, larger     │
  │   WebP      │ Everything modern  │ 25-35% < JPG!        │
  │   AVIF      │ Next-gen           │ 50% < JPG!           │
  │                                                         │
  │ → Image compression during build (imagemin plugin)     │
  │ → CSS/JS minification (terser, cssnano)                │
  └─────────────────────────────────────────────────────────┘

  ② CACHING (browser cache)
  ┌─────────────────────────────────────────────────────────┐
  │ → Strong cache: Cache-Control (max-age, immutable)     │
  │ → Conditional cache: ETag, Last-Modified (304)         │
  │ → Hash-based filenames: bundle.[contenthash].js        │
  │ → "File KHÔNG đổi → KHÔNG download lại!"              │
  └─────────────────────────────────────────────────────────┘

  ③ CDN (Content Delivery Network)
  ┌─────────────────────────────────────────────────────────┐
  │ → Static files serve từ edge server GẦN user nhất      │
  │ → Latency: 200ms (origin) → 20ms (CDN edge)           │
  │ → Images, fonts, JS bundles → CDN                      │
  └─────────────────────────────────────────────────────────┘

  ④ LAZY LOADING (load khi cần)
  ┌─────────────────────────────────────────────────────────┐
  │ → Route lazy loading: React.lazy() + Suspense          │
  │ → Image lazy loading: loading="lazy" / IntersObserver  │
  │ → Component lazy loading: dynamic import()             │
  │ → First screen: chỉ load CẦN THIẾT!                   │
  └─────────────────────────────────────────────────────────┘

  ⑤ TREE SHAKING (loại bỏ dead code)
  ┌─────────────────────────────────────────────────────────┐
  │ → Rollup/Webpack: analyze ESM → remove unused exports  │
  │ → "Cắt giảm nhân sự" cho code 😂                      │
  │ → CẦN ESM (import/export) → static analysis possible  │
  │ → Vite: pre-bundling (optimizeDeps) = bonus!           │
  └─────────────────────────────────────────────────────────┘
```

```
PLUGIN CUSTOMIZATION — ARCHITECT SKILL:
═══════════════════════════════════════════════════════════════

  Tất cả optimizations trên đều dùng TOOLS/PLUGINS:
  → Webpack: loader (transform) + plugin (lifecycle hooks)
  → Vite: plugin (Rollup-compatible hooks)

  → "Biết customize webpack/vite plugin = frontend architect"
  → KHÔNG chỉ dùng có sẵn → VIẾT plugin riêng cho project!

  Example: Auto-compress images during build
  → vite-plugin-imagemin
  → HOẶC viết custom plugin scan images → sharp compress
```

---

## §6. Performance — Faster Execution

### leftpad — Algorithm Matters!

```
CODE EXECUTION SPEED — ALGORITHM DIFFERENCE:
═══════════════════════════════════════════════════════════════

  BÀI TOÁN: leftpad('hello', 10, '0') → '00000hello'
  → Pad chuỗi bên trái đến length characters
```

```javascript
// Solution 1: Array.join — O(n)
function leftpad(str, length, ch) {
  let len = length - str.length + 1;
  return Array(len).join(ch) + str;
}

// Solution 2: Binary search + Bitwise — O(log n) ⭐
function leftpad2(str, length, ch) {
  let len = length - str.length;
  let total = "";
  while (true) {
    // len % 2 === 1 → dùng bitwise: len & 1
    if (len & 1) {
      total += ch;
    }
    if (len === 1) {
      return total + str;
    }
    ch += ch; // Double the padding string!
    len = len >> 1; // len = Math.floor(len / 2)
  }
}
```

```
BENCHMARK — 10,000 iterations, length = 1000:
═══════════════════════════════════════════════════════════════

  leftpad  (Array.join): 51.97ms
  leftpad2 (Binary):      2.08ms

  → 25x FASTER! 🚀

  TẠI SAO?
  Solution 1: tạo Array(len) → join → O(n) string concatenation
  Solution 2: double padding string mỗi lần → O(log n) operations

  Example: pad 8 ký tự '0':
  Solution 1: ['0','0','0','0','0','0','0','0'].join('') → 8 ops
  Solution 2:
    len=8, ch='0'
    → len&1=0, ch='00', len=4
    → len&1=0, ch='0000', len=2
    → len&1=0, ch='00000000', len=1
    → return total + str  → 3 ops!

  → Data càng lớn (length=10000) → gap càng KHỦNG!
  → Đây là LÝ DO cần học Algorithm & Data Structure!
```

### Framework-Level Optimization

```
FRAMEWORK OPTIMIZATION TECHNIQUES:
═══════════════════════════════════════════════════════════════

  ① REDUCE UNNECESSARY RE-RENDERS:
  → React: React.memo, useMemo, useCallback
  → Vue: computed, v-once, v-memo
  → "Chỉ render lại khi data THỰC SỰ thay đổi"

  ② MINIMIZE REFLOW & REPAINT:
  → Batch DOM reads/writes (avoid layout thrashing)
  → Use transform/opacity for animations (GPU-accelerated)
  → DocumentFragment for batch DOM inserts

  ③ REDUCE DOM MANIPULATION:
  → Virtual DOM (React, Vue) → diff → minimal DOM updates
  → Virtual Scroll (§1) → fixed DOM count

  ④ ON-DEMAND EXECUTION (按需执行):
  ┌─────────────────────────────────────────────────────────┐
  │ Vue 3 — Static Markup:                                 │
  │ → Template compiler marks STATIC vs DYNAMIC nodes      │
  │ → Diff chỉ tính DYNAMIC nodes → skip static DOM!      │
  │ → PatchFlags: exactly WHAT changed (text? class? style?)│
  │                                                         │
  │ Island Architecture (Astro, Nuxt 3):                   │
  │ → Page phần lớn STATIC (no JS needed)                  │
  │ → Chỉ "islands" (interactive components) load JS       │
  │ → "Partial hydration" → JS payload GiẢM đáng kể!      │
  │                                                         │
  │ → Core idea: KHÔNG chạy code KHÔNG CẦN THIẾT!         │
  └─────────────────────────────────────────────────────────┘
```

---

## §7. UX & Complex Scenarios

### User Experience Optimization

```
UX MICRO-OPTIMIZATIONS — ĐIỂM CỘNG PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  ① Skeleton Screen (placeholder loading):
  → User thấy "layout" ngay → perceived speed ↑
  → Tốt hơn spinner/blank page

  ② Optimistic UI:
  → Like button → UI update NGAY → API call background
  → User không cần đợi server response

  ③ Infinite Scroll + Pull-to-refresh:
  → IntersectionObserver → load more khi scroll đến bottom
  → Touch event → pull down → refresh data

  ④ Smooth Animations:
  → 60fps: requestAnimationFrame, CSS transitions
  → Will-change: hint browser optimize trước

  ⑤ Error Boundaries + Retry:
  → Component crash → graceful fallback, retry button
  → KHÔNG phải blank page!

  ⑥ Offline Support:
  → Service Worker + Cache API → offline-first
  → IndexedDB → local data persistence
```

### Complex & Emerging Scenarios

```
COMPLEX SCENARIOS — FRONTIER TOPICS:
═══════════════════════════════════════════════════════════════

  Interviewer ĐẶC BIỆT thích những lĩnh vực này:

  ① LOW-CODE / NO-CODE (可视化搭建):
  → Drag & drop page builder
  → Component schema + renderer
  → JSON → UI runtime
  → Companies: Retool, Appsmith

  ② DOCUMENT TECHNOLOGY (在线文档):
  → Rich text editor (Slate, ProseMirror, TipTap)
  → Collaborative editing (CRDT, OT algorithm)
  → Companies: Notion, Google Docs, 飞书

  ③ GRAPHICS & DESIGN (图形):
  → Canvas 2D, SVG manipulation
  → Real-time collaboration
  → Companies: Figma, Excalidraw, Miro

  ④ 3D & VISUALIZATION (可视化):
  → WebGL, Three.js, React Three Fiber
  → Data visualization (D3.js, ECharts)
  → Games (Babylon.js, PlayCanvas)

  ⑤ CROSS-PLATFORM:
  → React Native, Flutter, Electron, Tauri
  → "Write once, run anywhere" BUT with trade-offs

  → MỖI lĩnh vực = hàng năm học sâu
  → Chọn 1-2 → become expert → STANDOUT! ⭐
```

---

## §8. Growth Mindset — Learn Essence, Not API

```
GROWTH TRAP — ĐỪNG MẮC BẪY TĂNG TRƯỞNG THẤP:
═══════════════════════════════════════════════════════════════

  ❌ LOW-LEVEL GROWTH (học kỹ năng có thời hạn):

  PAST: IE6/7/8 compatibility tricks
  → Tốn RẤT NHIỀU thời gian nghiên cứu
  → Browser wars kết thúc → tất cả USELESS!
  → Kỹ năng compatibility coding = BURIED by history

  PRESENT: Webpack API details
  → "webpack.config.js có option gì, dùng sao?"
  → Webpack → Vite → RSPack → ??? (next tool)
  → API usage knowledge = WILL BE buried again!

  ✅ HIGH-LEVEL GROWTH (học bản chất, nguyên lý):

  HỌC CÁCH WEBPACK HOẠT ĐỘNG:
  ┌─────────────────────────────────────────────────────────┐
  │ → Cách collect file dependencies (dependency graph)     │
  │ → Cách implement modularization (module system)         │
  │ → Loader/Plugin extension mechanism (design patterns)   │
  │ → HMR implementation (WebSocket + module replacement)   │
  │ → Code splitting strategy (dynamic import, chunks)      │
  │ → Tree shaking mechanism (static analysis, ESM)         │
  └─────────────────────────────────────────────────────────┘

  → DÙ tool thay đổi: Webpack → Vite → RSPack
  → NGUYÊN LÝ vẫn giống nhau!
  → Dependency graph, module system, HMR = UNIVERSAL concepts
```

```
LEARN LESS API, MORE ESSENCE:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────────────────────┐
  │ API Level (❌)     │ Essence Level (✅)               │
  ├────────────────────┼──────────────────────────────────┤
  │ webpack.config.js  │ How dependency graph works       │
  │ options             │                                  │
  │                    │                                  │
  │ React useState API │ Why hooks use linked list        │
  │                    │ How Fiber reconciliation works   │
  │                    │                                  │
  │ Vue v-model syntax │ How reactivity system works      │
  │                    │ Proxy vs defineProperty          │
  │                    │                                  │
  │ CSS flexbox props  │ How browser layout engine works  │
  │                    │ Block vs inline formatting ctx   │
  │                    │                                  │
  │ Git commands       │ How DAG (directed acyclic graph) │
  │                    │ stores commits                   │
  └────────────────────┴──────────────────────────────────┘

  → API thay đổi mỗi 2-3 năm
  → Bản chất KHÔNG đổi trong 10-20 năm!
  → Đầu tư vào bản chất = ROI cao nhất 📈
```

---

## Tóm Tắt

### Architecture Overview

```
PROJECT HIGHLIGHT ARCHITECTURE:
═══════════════════════════════════════════════════════════════

                    ┌──────────────────────┐
                    │   YOUR PROJECT       │
                    │   (Outstanding!)     │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │ SCALE     │       │ SPEED     │       │ QUALITY   │
    │           │       │           │       │           │
    │ Virtual   │       │ Loading   │       │ Testing   │
    │ Scroll    │       │ ↓ size    │       │ Vitest    │
    │           │       │ ↓ count   │       │ RTL       │
    │ File      │       │ ↑ cache   │       │ Coverage  │
    │ Upload    │       │           │       │           │
    │           │       │ Execution │       │ Review    │
    │ Infinite  │       │ Algorithm │       │ PR        │
    │ Data      │       │ Framework │       │ CI/CD     │
    └───────────┘       └───────────┘       └───────────┘

          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │ R&D EFF   │       │ UX        │       │ COMPLEX   │
    │           │       │           │       │           │
    │ Scaffold  │       │ Skeleton  │       │ Low-code  │
    │ CLI       │       │ Loading   │       │ Editor    │
    │           │       │           │       │           │
    │ Component │       │ Optimistic│       │ Graphics  │
    │ Library   │       │ UI        │       │ Canvas    │
    │           │       │           │       │           │
    │ Utils     │       │ Offline   │       │ 3D/WebGL  │
    │ Library   │       │ First     │       │ Three.js  │
    └───────────┘       └───────────┘       └───────────┘
```

### Quick Reference

```
OUTSTANDING PROJECT — QUICK REF:
═══════════════════════════════════════════════════════════════

  LARGE DATA:
  → Virtual Scroll: render ~30 DOM, translate offset, scroll listener
  → Variable height: positions[] + getBoundingClientRect + binary search
  → File Upload: 8 techniques (slice, hash×3, concurrency, retry, etc.)

  R&D EFFICIENCY:
  → Scaffolding: CLI init project with standards built-in
  → Component/Utility Libraries: shared across projects
  → CI/CD: auto build, test, deploy, notify
  → Rust tools: Vite > Webpack, SWC > Babel, RSPack

  R&D QUALITY:
  → Testing: Vitest/Jest for utils, RTL for components
  → Coverage: meaningful indicator of maintainability
  → Code Review: PR template, required approvals, auto-checks

  PERFORMANCE — LOADING:
  → Size: compression, image format, minification
  → Cache: contenthash filenames, Cache-Control, ETag
  → CDN: edge servers, latency reduction
  → Lazy loading: routes, images, components (dynamic import)
  → Tree shaking: ESM → static analysis → remove dead code

  PERFORMANCE — EXECUTION:
  → Algorithm: O(log n) vs O(n) = 25x difference!
  → Framework: memo, computed, virtual DOM diff optimization
  → On-demand: Vue3 static markup, Island architecture

  COMPLEX SCENARIOS:
  → Low-code, Document, Graphics, 3D, Cross-platform
  → Pick 1-2 → deep expertise → standout!

  GROWTH MINDSET:
  → API changes every 2-3 years → DON'T over-invest
  → Principles last 10-20 years → INVEST HERE
  → Learn HOW tools work, not just how to USE them
```

### Checklist

- [ ] Virtual Scroll: chỉ render visible items (~30 DOM), translate offset
- [ ] Calculations: startIndex (scrollTop/HEIGHT), visibleCount, offset
- [ ] Variable height: positions[] array, getBoundingClientRect post-render
- [ ] Binary search: positions sorted by .top → O(log n) find startIndex
- [ ] File Upload: 8 kỹ thuật nổi bật (xem Part 1 & 2 documents)
- [ ] Concurrency control: limit() wrapper HOẶC asyncPool (Promise.race)
- [ ] Queue pattern: activeCount track slots, shift() next task on complete
- [ ] Scaffolding: CLI tool init project with ESLint, Prettier, CI/CD
- [ ] Component Library: shared components + Storybook + test coverage
- [ ] Utility Library: shared utils + Vitest unit tests
- [ ] Performance Metrics: FCP, LCP, TTI, CLS, FID (Core Web Vitals)
- [ ] Loading optimization: compress, cache, CDN, lazy load, tree shake
- [ ] Image formats: WebP (25-35% < JPG), AVIF (50% < JPG)
- [ ] Algorithm matters: leftpad O(n) vs O(log n) = 25x difference
- [ ] Framework optimization: memo, static markup skip, island architecture
- [ ] UX: skeleton screen, optimistic UI, offline support
- [ ] Complex scenarios: low-code, editor, graphics, 3D — chọn 1-2 chuyên sâu
- [ ] Growth mindset: learn essence (dependency graph, module system, HMR principle) NOT API details

---

_Nguồn: 花果山技术团队 — "Big company interviewer: What outstanding projects have you done?"_
_Cập nhật lần cuối: Tháng 2, 2026_
