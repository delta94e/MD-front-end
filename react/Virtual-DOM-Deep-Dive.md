# Virtual DOM & Diff Algorithm — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> 5 chủ đề: Virtual DOM là gì & tại sao cần, React diff algorithm
> (3 strategies), key role & best practices, VDOM vs native DOM
> performance, React vs Vue diff (Fiber vs double-ended).
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Virtual DOM & Reconciliation

---

## Mục Lục

0. [Virtual DOM là gì?](#0-virtual-dom-là-gì)
1. [React Diff Algorithm — 3 Strategies](#1-react-diff-algorithm)
2. [Key: Vai trò & Lưu ý](#2-key-vai-trò--lưu-ý)
3. [VDOM vs Native DOM — Performance](#3-vdom-vs-native-dom)
4. [React vs Vue Diff](#4-react-vs-vue-diff)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Virtual DOM là gì?

### Bản chất

> Virtual DOM = **JavaScript object** mô tả cấu trúc DOM.

```javascript
// ── Real DOM ──
<div class="container">
    <h1>Hello</h1>
    <p>World</p>
</div>

// ── Virtual DOM (JS object) ──
{
    type: 'div',
    props: { className: 'container' },
    children: [
        { type: 'h1', props: {}, children: ['Hello'] },
        { type: 'p',  props: {}, children: ['World'] }
    ]
}
```

### Workflow

```
VIRTUAL DOM WORKFLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────┐  1. Map      ┌──────────┐
  │ Real DOM │ ───────────→ │ Old VDOM │
  └──────────┘              └──────────┘
                                 │
                            2. State change
                                 ↓
  ┌──────────┐              ┌──────────┐
  │ New VDOM │  3. Diff     │ Old VDOM │
  │ (changed)│ ←──────────→ │ (cached) │
  └──────────┘              └──────────┘
       │
       │ 4. Generate patch
       ↓
  ┌──────────────────────┐
  │ Patch = { type:      │
  │   "remove", "add",   │
  │   "update"... }      │
  └──────────────────────┘
       │
       │ 5. Apply patch
       ↓
  ┌──────────┐
  │ Real DOM │  ← Chỉ update phần THAY ĐỔI!
  │ (updated)│
  └──────────┘
```

### Tại sao cần Virtual DOM?

```
TẠI SAO CẦN VDOM:
═══════════════════════════════════════════════════════════════

  ① PERFORMANCE FLOOR (đảm bảo hiệu suất tối thiểu)
     ┌──────────────┬───────────────────────────────┐
     │ Real DOM     │ Generate HTML + rebuild ALL    │
     │              │ DOM elements (toàn bộ!)        │
     ├──────────────┼───────────────────────────────┤
     │ Virtual DOM  │ Generate vNode + Diff +        │
     │              │ Update CHỈ phần thay đổi       │
     └──────────────┴───────────────────────────────┘
     JS operations (VDOM diff) RẺ hơn DOM operations!

  ② CROSS-PLATFORM (đa nền tảng)
     VDOM = JS object → hoạt động ở MỌI NƠI:
     → Browser (ReactDOM)
     → Server (SSR: renderToString)
     → Mobile (React Native)
     → Desktop (Electron)
     → Node.js (không có DOM → vẫn render được!)

  ③ DEVELOPER EXPERIENCE (trải nghiệm dev)
     → Declarative UI: mô tả state → VDOM tự diff
     → Không cần thao tác DOM thủ công
     → Tránh DOM operations kém hiệu suất trong team
     → Functional UI programming (data → UI)
```

### Quá trình so sánh DOM

```
DIFF + PATCH FLOW:
  ┌──────────┐             ┌──────────┐
  │ New VDOM │  compare    │ Old VDOM │
  └────┬─────┘  ─────────→ └──────────┘
       │
       ↓
  ┌──────────────────────────────────────┐
  │ Diff result = Patch                  │
  │  { type: "remove", node: <a> }      │
  │  { type: "update", attr: "class",   │
  │    from: "visible", to: "hidden" }  │
  └──────────────────────────────────────┘
       │
       ↓ apply to Real DOM
  ┌──────────┐
  │ Updated  │  ← Minimal DOM operations!
  │ Real DOM │
  └──────────┘
```

---

## 1. React Diff Algorithm

### Overview

> Diff = so sánh **2 VDOM trees** → tìm ra **patches** → apply lên Real DOM.
> Traditional tree diff = **O(n³)** → React optimize → **O(n)** bằng 3 strategies.

### Strategy 1: Tree Diff (tầng theo tầng)

> **Chỉ so sánh nodes CÙNG LEVEL** → bỏ qua cross-level moves.

```
TREE DIFF — SAME LEVEL ONLY:
═══════════════════════════════════════════════════════════════

  Old Tree:           New Tree:
      A                   A
     / \                 / \
    B   C               B   C
   / \                     / \
  D   E                   D   E

  So sánh: A↔A → B↔B → C↔C
  Level 2: D,E ở B vs D,E ở C
  → React KHÔNG move D,E từ B→C
  → React DELETE D,E dưới B, CREATE D,E dưới C
  → O(n) thay vì O(n³)

  ⚠️ Trade-off: Nếu move subtree cross-level → TẠO MỚI
     (nhưng cross-level move RẤT HIẾM trong practice)
```

### Strategy 2: Component Diff (theo loại component)

```
COMPONENT DIFF:
═══════════════════════════════════════════════════════════════

  ① Cùng TYPE component → tiếp tục TREE DIFF bên trong
     <UserCard />  vs  <UserCard />  → diff children

  ② Khác TYPE component → REPLACE TOÀN BỘ (không diff)
     <UserCard />  vs  <AdminPanel />  → destroy + create

  TẠI SAO?
  → Khác type = khác cấu trúc hoàn toàn → diff không có ý nghĩa
  → Nhanh hơn so với deep diff rồi phát hiện khác hết

  OPTIMIZATION:
  → shouldComponentUpdate → skip diff nếu props không đổi
  → PureComponent → shallow compare props tự động
  → React.memo → tương đương PureComponent cho function comp
```

### Strategy 3: Element Diff (cùng level, dùng key)

```
ELEMENT DIFF — VỚI KEY:
═══════════════════════════════════════════════════════════════

  Old:  [A, B, C, D]     key: [1, 2, 3, 4]
  New:  [B, A, D, C]     key: [2, 1, 4, 3]

  KHÔNG CÓ KEY:
  → Xóa A, tạo B | Xóa B, tạo A | Xóa C, tạo D | Xóa D, tạo C
  → 4 delete + 4 create = 8 operations!

  CÓ KEY:
  → React nhận ra: B(key=2) chỉ MOVE, không cần create
  → Move B trước A | Move C sau D
  → 2 move operations = CHỈ 2!

  ┌───────────────────────────────────────────────┐
  │ KEY cho phép React NHẬN DIỆN node giữa renders│
  │ → MOVE thay vì DELETE + CREATE               │
  │ → Giảm DOM operations đáng kể                │
  └───────────────────────────────────────────────┘
```

### 3 Strategies tóm gọn

```
3 DIFF STRATEGIES — SUMMARY:
  ┌──────────────┬──────────────────────────────────────────┐
  │ Strategy     │ Rule                                     │
  ├──────────────┼──────────────────────────────────────────┤
  │ Tree Diff    │ Chỉ compare CÙNG LEVEL (O(n))           │
  │ Component    │ Cùng type → diff | Khác type → replace  │
  │ Element      │ Key → identify + MOVE (thay vì re-create)│
  └──────────────┴──────────────────────────────────────────┘
  → Từ O(n³) → O(n) ✅
```

---

## 2. Key: Vai Trò & Lưu Ý

### Key dùng để làm gì?

> React dùng key để **identify** element giữa các lần render.
> → Xác định element **mới tạo** hay **di chuyển**
> → Giảm **re-render không cần thiết**
> → Giữ **local state** đúng cho đúng element

### Ví dụ không key vs có key

```javascript
// ── KHÔNG KEY → Bug! ──
{
  items.map((item, index) => (
    <input value={item.text} /> // React dùng INDEX mặc định
  ));
}
// Xóa item đầu → state input BỊ LẪN (input 2 nhận state input 1!)

// ── CÓ KEY → Correct! ──
{
  items.map((item) => (
    <input key={item.id} value={item.text} /> // React identify chính xác
  ));
}
// Xóa item đầu → các input giữ đúng state
```

### Lưu ý quan trọng

```
KEY BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  ✅ DO:
    ① Key = UNIQUE + STABLE identifier (id từ data)
    ② Key phải UNIQUE trong SIBLINGS (cùng level)
    ③ Key nên là string hoặc number

  ❌ DON'T:
    ① ❌ index làm key (nếu list ADD/REMOVE/REORDER)
       → Xóa item 0 → item 1 nhận key=0 → React nghĩ CÙNG element
       → State bị lẫn!

    ② ❌ Math.random() làm key
       → Mỗi render → key MỚI → React DESTROY + CREATE lại tất cả
       → Performance TỆ HƠN không có key!

    ③ ❌ Thay đổi key giữa renders
       → Force unmount + remount → mất state
```

```
KHI NÀO DÙNG INDEX LÀM KEY?
  ✅ OK nếu TẤT CẢ 3 điều kiện:
    ① List TĨNH (không add/remove/reorder)
    ② Items KHÔNG có stable id
    ③ Items KHÔNG có local state (uncontrolled inputs...)

  ❌ KHÔNG OK nếu bất kỳ:
    ① List ĐỘNG (sortable, filterable, paginated)
    ② Items có input/checkbox/animation state
```

---

## 3. VDOM vs Native DOM

### So sánh hiệu suất

```
VDOM vs NATIVE DOM — PERFORMANCE:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────┬──────────────────────┐
  │ Scenario           │ VDOM         │ Native DOM           │
  ├────────────────────┼──────────────┼──────────────────────┤
  │ Đổi 1 nút text    │ ❌ Chậm hơn  │ ✅ Nhanh hơn          │
  │                    │ (diff + patch│ (innerText = 'x')    │
  │                    │  overhead)   │                      │
  ├────────────────────┼──────────────┼──────────────────────┤
  │ First render lớn   │ ❌ Chậm hơn  │ ✅ innerHTML nhanh    │
  │                    │ (VDOM + diff │ hơn                  │
  │                    │  computation)│                      │
  ├────────────────────┼──────────────┼──────────────────────┤
  │ Complex update     │ ✅ Tốt hơn   │ ❌ Phải tự optimize   │
  │ (nhiều thay đổi)   │ (batch +     │ (dễ gây reflow/      │
  │                    │  minimal DOM)│  repaint thừa)       │
  ├────────────────────┼──────────────┼──────────────────────┤
  │ Team collaboration │ ✅ Guaranteed │ ❌ Phụ thuộc dev skill│
  │                    │ performance  │ (code review khó)    │
  │                    │ floor        │                      │
  └────────────────────┴──────────────┴──────────────────────┘
```

### Kết luận

```
KEY INSIGHT (Evan You — Vue creator):
  "Framework đảm bảo: KHÔNG CẦN tự optimize,
   vẫn cho performance ĐỦ TỐT."

  VDOM KHÔNG PHẢI để nhanh hơn native DOM!
  VDOM = trade-off:
  ┌──────────────────────────────────────────────────┐
  │ ① Developer Experience ✅ (declarative, no manual│
  │    DOM manipulation)                             │
  │ ② Cross-platform ✅ (SSR, React Native...)       │
  │ ③ Performance FLOOR ✅ (guaranteed minimum perf) │
  │ ④ Raw speed ❌ (native DOM manual > VDOM)        │
  └──────────────────────────────────────────────────┘

  React CHƯA BAO GIỜ bán VDOM như "performance feature"!
  → VDOM = DX feature + cross-platform feature
```

---

## 4. React vs Vue Diff

### Điểm chung

|            | React                   | Vue                     |
| ---------- | ----------------------- | ----------------------- |
| Trigger    | State change / hooks    | Data reactivity         |
| Strategy   | Same-level compare      | Same-level compare      |
| Key        | Dùng key identify       | Dùng key identify       |
| Complexity | O(n)                    | O(n)                    |
| Process    | trigger → patch → apply | trigger → patch → apply |

### Điểm khác

```
REACT vs VUE DIFF:
═══════════════════════════════════════════════════════════════

  REACT DIFF:
  ┌──────────────────────────────────────────────────┐
  │ Traversal: Depth-first (DFS)                     │
  │ 3 levels: Tree → Component → Element             │
  │ Since React 16: FIBER architecture               │
  │                                                  │
  │ FiberNode = double linked list:                  │
  │   ┌──────┐  child  ┌──────┐  sibling ┌──────┐  │
  │   │Parent│ ───────→ │Child1│ ────────→│Child2│  │
  │   └──────┘ ←─────── └──────┘ ←────────└──────┘  │
  │             return            return             │
  │                                                  │
  │ Double buffering:                                │
  │   current tree ←→ workInProgress tree            │
  │   → CÓ THỂ PAUSE/RESUME update!                 │
  │   → Time slicing → không block UI               │
  └──────────────────────────────────────────────────┘

  VUE DIFF:
  ┌──────────────────────────────────────────────────┐
  │ Vue 2: Double-ended comparison                   │
  │   → 4 pointers: oldStart, oldEnd, newStart,     │
  │     newEnd → so sánh 4 cặp mỗi iteration        │
  │   → Hiệu quả hơn cho list reorder               │
  │                                                  │
  │ Vue 3: Longest Increasing Subsequence (LIS)      │
  │   → Tìm subsequence dài nhất KHÔNG CẦN MOVE     │
  │   → Chỉ move các nodes NGOÀI subsequence         │
  │   → Tối ưu hơn double-ended                     │
  │                                                  │
  │ KHÔNG CÓ Time Slicing (từng thử, đã bỏ)         │
  │   → Vue 3 bù bằng: compiler optimization,       │
  │     Static hoisting, Patch flags                 │
  │   → Debounce/throttle cho high-frame animation   │
  └──────────────────────────────────────────────────┘
```

### Chi tiết Fiber Architecture

```
FIBER — INTERRUPTIBLE RENDERING:
═══════════════════════════════════════════════════════════════

  TRƯỚC (React 15 — Stack Reconciler):
  ┌──────────────────────────────────────────────┐
  │ Start diff → ... → ... → ... → Done         │
  │ ────────────────────────────────────→         │
  │ SYNC: KHÔNG THỂ dừng giữa chừng!            │
  │ UI FROZEN nếu tree lớn!                      │
  └──────────────────────────────────────────────┘

  SAU (React 16+ — Fiber Reconciler):
  ┌──────────────────────────────────────────────┐
  │ Work → Pause → User input → Resume → Done   │
  │ ──→ ⏸ ──→ 🖱️ ──→ ──→ ✅                     │
  │ ASYNC: CÓ THỂ dừng + tiếp tục!              │
  │ UI RESPONSIVE ngay cả khi diff tree lớn!     │
  └──────────────────────────────────────────────┘

  HOW:
  ① FiberNode = unit of work (có thể pause/resume)
  ② requestIdleCallback → làm khi browser IDLE
  ③ Priority system: user input > animation > data fetch
  ④ 2 trees: current (hiển thị) + workInProgress (đang diff)
  ⑤ Commit phase: swap trees khi hoàn thành
```

### Vue 3 Compiler Optimizations

```
VUE 3 — BÙ KHÔNG CÓ TIME SLICING:
═══════════════════════════════════════════════════════════════

  ① Static Hoisting
     Template tĩnh → hoist ra ngoài render function
     → Không tạo lại vNode mỗi render

  ② Patch Flags
     Compiler đánh dấu DYNAMIC parts
     → Runtime chỉ diff DYNAMIC → skip static

  ③ Block Tree
     Nhóm dynamic nodes → flat array
     → Không cần traverse toàn bộ tree

  ④ Caching Event Handlers
     v-on handlers tự động cache
     → Không trigger child re-render

  KẾT QUẢ: Vue 3 compile-time optimization
            ≈ React runtime Fiber optimization
```

---

## 5. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
VIRTUAL DOM & DIFF — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  VIRTUAL DOM:
    Bản chất    → JS object mô tả DOM structure
    Mục đích    → Cross-platform + DX + Performance floor
    Workflow    → Real DOM → VDOM → Diff → Patch → Update DOM

  DIFF ALGORITHM (3 strategies → O(n)):
    Tree diff   → Chỉ compare CÙNG LEVEL
    Component   → Cùng type → diff | Khác type → replace
    Element     → Key identify → MOVE (vs re-create)

  KEY:
    Purpose     → Identify element giữa renders
    Best        → Unique stable id từ data
    Avoid       → index (dynamic list), Math.random()

  REACT vs VUE:
    React       → Fiber (pause/resume), double buffering
    Vue 2       → Double-ended pointers
    Vue 3       → LIS + compiler optimization (patch flags)
```

### Câu Hỏi Phỏng Vấn

**1. Virtual DOM là gì? Tại sao cần?**

> VDOM = **JS object** mô tả DOM. Cần vì: ① **Performance floor** — framework tự optimize, dev không cần thao tác DOM thủ công. ② **Cross-platform** — JS object hoạt động ở browser, server (SSR), mobile (React Native). ③ **DX** — declarative UI, data → VDOM → Real DOM tự động. VDOM **KHÔNG** nhanh hơn native DOM ops thuần, nhưng **đảm bảo** performance đủ tốt.

**2. React diff O(n) thế nào?**

> 3 strategies: ① **Tree diff** — chỉ compare cùng level (bỏ cross-level). ② **Component diff** — cùng type → tree diff, khác type → replace toàn bộ. ③ **Element diff** — key identify nodes → move thay vì delete+create. Traditional O(n³) → React O(n).

**3. Key dùng để làm gì? Tại sao không nên dùng index?**

> Key = **identity marker** cho element giữa renders. React dùng key để biết element **moved** hay **new/removed** → giảm DOM ops. Index **không stable** khi add/remove/reorder → React match SAI element → state bị lẫn. `Math.random()` còn tệ hơn: mỗi render key mới → destroy + create ALL.

**4. VDOM có luôn nhanh hơn native DOM không?**

> **KHÔNG.** Đổi 1 nút text → native DOM nhanh hơn (không cần diff overhead). First render lớn → innerHTML nhanh hơn. VDOM win ở **complex updates** (batch + minimal DOM ops) và **team collaboration** (guaranteed performance floor). Evan You: "Framework đảm bảo performance ĐỦ TỐT mà không cần tự optimize."

**5. React vs Vue diff khác gì?**

> **React** (16+): Fiber architecture — double linked list FiberNodes, **interruptible rendering** (pause/resume), priority system, double buffering (current + workInProgress trees). **Vue 2**: double-ended pointers (4 cặp so sánh). **Vue 3**: Longest Increasing Subsequence + **compiler optimizations** (static hoisting, patch flags, block tree). Vue bù không có time slicing bằng compile-time analysis.

---

## Checklist Học Tập

- [ ] VDOM bản chất: JS object mô tả DOM
- [ ] VDOM workflow: Real DOM → VDOM → Diff → Patch → Update
- [ ] 3 lý do cần VDOM: performance floor, cross-platform, DX
- [ ] Diff algorithm: 3 strategies (tree, component, element)
- [ ] Tree diff: cùng level only → O(n)
- [ ] Component diff: cùng type → diff, khác → replace
- [ ] Element diff: key identify → move vs re-create
- [ ] Key best practices: unique stable id, avoid index/random
- [ ] VDOM vs native DOM: trade-off (DX vs raw speed)
- [ ] React Fiber: FiberNode linked list, pause/resume, priorities
- [ ] React double buffering: current + workInProgress trees
- [ ] Vue 2 diff: double-ended pointers (4 comparisons)
- [ ] Vue 3 diff: LIS + compiler optimization
- [ ] Vue 3 bù: static hoisting, patch flags, block tree

---

_Cập nhật lần cuối: Tháng 2, 2026_
