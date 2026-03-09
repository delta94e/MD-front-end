# The Hard Parts of UI Development — Phần 23: Virtual DOM Introduction — "Most Misunderstood Concept!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Virtual DOM Introduction — "Declarative UI, Intermediary Map, Diffing & Reconciliation!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — virtual DOM motivation, declarative vs imperative pixels, diffing preview!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | "Most Misunderstood Concept!" — Tại Sao?                |
| 2   | Declarative UI — "Code Trông Như Output!"               |
| 3   | HTML = Declarative, JS = Imperative — "Vấn Đề!"         |
| 4   | Virtual DOM = Intermediary Map — "JS Phiên Bản Visual!" |
| 5   | Diffing & Reconciliation — "Pinpoint Changes!"          |
| 6   | Two Benefits — "Visual + Performance!"                  |
| 7   | Tự Implement: Virtual DOM Prototype                     |
| 8   | 🔬 Deep Analysis Patterns — Declarative Architecture    |

---

## §1. "Most Misunderstood Concept!" — Tại Sao?

> Will: _"The most MISUNDERSTOOD concept in UI development because — I don't know, it sounds kinda good, doesn't it?"_

### Bối cảnh — Virtual DOM ≠ "DOM nhanh hơn"

Will mở đầu: Virtual DOM là concept **bị hiểu sai nhiều nhất** trong UI development! Mọi người nghe "Virtual DOM" và nghĩ: "à, nó nhanh hơn real DOM." Sai!

Virtual DOM **KHÔNG phải** để nhanh hơn direct DOM manipulation. Nó là:

1. **Declarative layer** — viết code trông giống output
2. **Intermediary map** — bản đồ trung gian trong JS
3. **Diffing opportunity** — so sánh old vs new → chỉ update changed elements

Will: _"I don't know what it is, but it sounds kinda good."_ — Nhiều developer dùng nhưng không hiểu WHY nó tồn tại. Bài này sẽ xây dựng REASONING từ gốc!

```
VIRTUAL DOM — HIỂU LẦM PHỔ BIẾN:
═══════════════════════════════════════════════════════════════

  ❌ HIỂU SAI:
  ┌──────────────────────────────────────────────────────────┐
  │ "Virtual DOM nhanh hơn real DOM!"                       │
  │ "Virtual DOM là copy nhẹ hơn của DOM!"                 │
  │ "React nhanh vì Virtual DOM!"                           │
  └──────────────────────────────────────────────────────────┘

  ✅ HIỂU ĐÚNG (Will):
  ┌──────────────────────────────────────────────────────────┐
  │ Virtual DOM = DECLARATIVE LAYER trong JavaScript!      │
  │ → Cho phép viết code TRÔNG GIỐNG output!              │
  │ → Cho phép DIFF old vs new → pinpoint changes!        │
  │ → Cho phép "semi-visual coding"!                       │
  │                                                          │
  │ "The most MISUNDERSTOOD concept in UI development."    │
  │ — Will                                                   │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Declarative UI — "Code Trông Như Output!"

> Will: _"The declarative style of UI engineering would be a visual, somewhat, representation in our code of what's to show up on the page."_

### Declarative = code mô tả KẾT QUẢ, không phải BƯỚC

Will giải thích: output của UI code là **pixels** — thứ **visual** (nhìn thấy). Vậy code lý tưởng để tạo pixels nên... **trông giống** pixels!

_"If you're adding an element here, here, and here, the display will display them in that order. If you're thinking about declaring 'I want these elements in this order', what's the most intuitive way?"_

Trả lời: **HTML**! HTML **listing them down the page** = declaring visual structure!

```html
<!-- HTML: khai báo = nhìn giống output! -->
<div>
  <input /> ← input ở trên
  <div></div>
  ← div ở dưới
</div>
```

Output: `[input]` rồi `[div]` — GIỐNG thứ tự trong code! Đó là **declarative**!

```
DECLARATIVE = CODE GIỐNG OUTPUT:
═══════════════════════════════════════════════════════════════

  HTML (declarative! ✅):
  ┌──────────────────────────────────────────────────────────┐
  │ <div>                              OUTPUT:              │
  │   <h1>Title</h1>         →       [Title]               │
  │   <p>Content</p>         →       [Content]             │
  │   <button>Click</button> →       [Click]               │
  │ </div>                                                   │
  │                                                          │
  │ → Code NHÌN GIỐNG output!                             │
  │ → "Listing them down in that order" — Will             │
  └──────────────────────────────────────────────────────────┘

  JavaScript (imperative! ❌):
  ┌──────────────────────────────────────────────────────────┐
  │ const h1 = document.createElement("h1");                │
  │ h1.textContent = "Title";                               │
  │ const p = document.createElement("p");                  │
  │ p.textContent = "Content";                               │
  │ const btn = document.createElement("button");           │
  │ btn.textContent = "Click";                               │
  │ div.append(h1, p, btn);                                  │
  │                                                          │
  │ → Code KHÔNG giống output!                             │
  │ → Phải ĐỌC rồi TƯỞNG TƯỢNG kết quả! 🤔             │
  └──────────────────────────────────────────────────────────┘

  "Pixels are a VISUAL structure. Therefore, the declarative
   style would be a VISUAL representation in our code." — Will
```

---

## §3. HTML = Declarative, JS = Imperative — "Vấn Đề!"

> Will: _"JavaScript does NOT give us that — by default. We're going to GIVE OURSELVES that."_

### JavaScript không declarative — phải tự xây!

Vấn đề: chúng ta chọn JavaScript làm **single source of truth** (one-way data binding). Nhưng JavaScript viết UI = **imperative** (từng bước, từng lệnh)!

HTML declarative NHƯNG:

- Không dynamic (chỉ initial render!)
- Không reactive (không auto-update khi data thay đổi!)
- Không có conditional logic!

JavaScript dynamic NHƯNG:

- Imperative (createElement, appendChild, textContent = ...)
- Không visual (code KHÔNG giống output!)
- Khó compose (di chuyển UI pieces = sửa nhiều dòng code!)

Will: _"We're going to GIVE OURSELVES that."_ — Tự xây declarative layer TRÊN JavaScript = **Virtual DOM**!

```
VẤN ĐỀ — HTML vs JS:
═══════════════════════════════════════════════════════════════

  HTML:
  ┌────────────────────────────┐
  │ ✅ Declarative (visual!)  │
  │ ❌ Static (not dynamic!)  │
  │ ❌ No conditionals!       │
  │ ❌ No data binding!       │
  └────────────────────────────┘

  JavaScript:
  ┌────────────────────────────┐
  │ ❌ Imperative (not visual!)│
  │ ✅ Dynamic!               │
  │ ✅ Conditionals!          │
  │ ✅ Data binding!          │
  └────────────────────────────┘

  CẦN: JavaScript + Declarative!
  → Virtual DOM = JavaScript MÀ visual! 🎉

  "JavaScript does NOT give us that by default.
   We're going to GIVE OURSELVES that." — Will
```

---

## §4. Virtual DOM = Intermediary Map — "JS Phiên Bản Visual!"

> Will: _"Having an intermediary version of our page will allow us to archive the last version and maybe COMPARE those two."_

### Virtual DOM = bản đồ trung gian

Will mô tả Virtual DOM: một **phiên bản trung gian** (intermediary/intermediate) của page, nằm TRONG JavaScript.

Thay vì: data → trực tiếp C++ DOM
Virtual DOM: data → **JS map** (virtual DOM) → C++ DOM

JS map này cho phép:

1. **Visual representation** — "nhìn" page trong JS code
2. **Archive** — lưu version trước
3. **Compare** — so sánh old vs new
4. **Pinpoint** — chỉ update elements thay đổi

_"An intermediary version of our page will allow us to maybe archive the last version based on the previous data from the user and maybe compare those two."_

```
VIRTUAL DOM = INTERMEDIARY MAP:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ Virtual DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ data → dataToView() → TRỰC TIẾP C++ DOM              │
  │                                                          │
  │ → Không thể compare!                                   │
  │ → Không thể diff!                                      │
  │ → Wipe + reload mỗi lần!                              │
  └──────────────────────────────────────────────────────────┘

  CÓ Virtual DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ data → dataToView() → VIRTUAL DOM (JS object!)        │
  │                             │                            │
  │                        ┌────┴────┐                       │
  │                        │  DIFF!  │                       │
  │                        │ old vs  │                       │
  │                        │   new   │                       │
  │                        └────┬────┘                       │
  │                             │                            │
  │                      only changes!                       │
  │                             ▼                            │
  │                        C++ DOM                           │
  │                             │                            │
  │                        PIXELS! 🖥️                       │
  └──────────────────────────────────────────────────────────┘

  "An INTERMEDIARY version of our page." — Will
```

---

## §5. Diffing & Reconciliation — "Pinpoint Changes!"

> Will: _"Work out the actual differences, and then PINPOINT change the real list of elements."_

### Diff algorithm = so sánh + chỉ update thay đổi!

Will mô tả hai bước:

**Diffing**: So sánh Virtual DOM cũ vs mới → tìm **sự khác biệt**:
_"In JavaScript, work out the actual differences."_

**Reconciliation**: Apply chỉ **những thay đổi** lên real DOM:
_"Pinpoint change the real list of elements in C++ that will actually change what the user sees."_

Will cảnh báo: declarative code cần **"significant optimizations"** để performant:
_"It's gonna require some significant optimizations — diffing, reconciliation — to even be performative."_

Nghĩa là: Virtual DOM **bản thân** nó CHẬM hơn direct DOM! Nhưng diffing + reconciliation giúp **tránh unnecessary updates** → net performance gain khi có nhiều elements!

```
DIFFING & RECONCILIATION:
═══════════════════════════════════════════════════════════════

  DATA THAY ĐỔI: post = "" → post = "Y"

  STEP 1 — DIFFING (trong JavaScript):
  ┌──────────────────────────────────────────────────────────┐
  │ OLD Virtual DOM:          NEW Virtual DOM:               │
  │ { input: "",              { input: "Y",    ← DIFF! ✅ │
  │   div: "" }                 div: "Y" }     ← DIFF! ✅ │
  │                                                          │
  │ Algorithm: compare property by property!                │
  │ → input: "" ≠ "Y" → CHANGED!                          │
  │ → div: "" ≠ "Y" → CHANGED!                            │
  │ → Changes: [input.value, div.text]                     │
  └──────────────────────────────────────────────────────────┘

  STEP 2 — RECONCILIATION (JS → C++ DOM):
  ┌──────────────────────────────────────────────────────────┐
  │ CHỈ update 2 elements (không phải toàn bộ page!)      │
  │ → C++ input.value = "Y"                                │
  │ → C++ div.text = "Y"                                   │
  │                                                          │
  │ "PINPOINT change the real list of elements." — Will    │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Two Benefits — "Visual + Performance!"

> Will: _"We BOTH get the benefit of a visual representation in JavaScript... AND optimize our performance."_

### Hai lợi ích từ Virtual DOM

Will tổng kết 2 lợi ích chính:

**① Visual/Declarative Coding:**
_"A visual representation in JavaScript of what's gonna show up — just for our ability as engineers to be able to COMPOSE our UI."_

"Compose" = **di chuyển pieces** của UI trong code giống như di chuyển visual blocks! Thay vì sửa 10 dòng imperative code để move 1 element, chỉ cần move 1 block trong Virtual DOM!

**② Performance Optimization:**
_"Optimize our performance to save ourselves making unnecessary changes to the real page."_

Diff → chỉ update elements thay đổi → không wipe + reload toàn bộ!

```
TWO BENEFITS:
═══════════════════════════════════════════════════════════════

  BENEFIT ①: VISUAL/DECLARATIVE
  ┌──────────────────────────────────────────────────────────┐
  │ Engineer COMPOSE UI trong JavaScript:                    │
  │                                                          │
  │ Virtual DOM = "Lego blocks" 🧱                          │
  │ → Move block A from position 1 → position 3           │
  │ → Add new block B between C and D                      │
  │ → Remove block E                                        │
  │                                                          │
  │ Code TRÔNG GIỐNG thao tác visual!                      │
  │ "Move pieces around, move little UNITS of view." — Will │
  └──────────────────────────────────────────────────────────┘

  BENEFIT ②: PERFORMANCE
  ┌──────────────────────────────────────────────────────────┐
  │ KHÔNG CẦN update TOÀN BỘ real DOM!                    │
  │                                                          │
  │ Old VDOM vs New VDOM → DIFF → changes only!           │
  │ → 1000 elements, 2 changed → 2 DOM updates!           │
  │ → Thay vì 1000 DOM updates! 🚀                        │
  │                                                          │
  │ "Save ourselves making UNNECESSARY CHANGES              │
  │  to the real page." — Will                               │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Virtual DOM Prototype

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Virtual DOM từ đầu!
// Intermediary map + Diffing + Reconciliation!
// ═══════════════════════════════════════════════════

// ── Real DOM (C++) ──

class RealDOM {
  constructor() {
    this.elements = {};
    this.updateCount = 0;
  }

  update(id, prop, value) {
    if (!this.elements[id]) this.elements[id] = {};
    this.elements[id][prop] = value;
    this.updateCount++;
    console.log(`    🖥️ Real DOM: ${id}.${prop} = "${value}"`);
  }

  getState() {
    return JSON.parse(JSON.stringify(this.elements));
  }
}

// ── Virtual DOM ──

class VirtualDOM {
  constructor(realDOM) {
    this.realDOM = realDOM;
    this.previousVDOM = null;
    this.diffCount = 0;
    this.reconcileCount = 0;
  }

  // Render: data → virtual DOM object
  render(data) {
    // "Description function" — declarative!
    return {
      input: {
        value: data.post !== undefined ? data.post : "What's up?",
      },
      div: {
        textContent: data.post === undefined ? "" : String(data.post),
      },
    };
  }

  // Diff: compare old vs new VDOM
  diff(oldVDOM, newVDOM) {
    const changes = [];

    for (const el of Object.keys(newVDOM)) {
      if (!oldVDOM || !oldVDOM[el]) {
        // New element!
        for (const prop of Object.keys(newVDOM[el])) {
          changes.push({
            el,
            prop,
            value: newVDOM[el][prop],
          });
        }
      } else {
        // Existing — check each property
        for (const prop of Object.keys(newVDOM[el])) {
          if (oldVDOM[el][prop] !== newVDOM[el][prop]) {
            changes.push({
              el,
              prop,
              oldValue: oldVDOM[el][prop],
              value: newVDOM[el][prop],
            });
          }
        }
      }
    }

    this.diffCount++;
    return changes;
  }

  // Reconcile: apply only changes to real DOM
  reconcile(changes) {
    if (changes.length === 0) {
      console.log("    ✅ No changes — skip real DOM update!");
      return;
    }

    console.log(`    🔄 Reconciling ${changes.length} change(s):`);
    for (const c of changes) {
      const old = c.oldValue !== undefined ? `"${c.oldValue}"` : "(new)";
      console.log(`      ${c.el}.${c.prop}: ${old} → "${c.value}"`);
      this.realDOM.update(c.el, c.prop, c.value);
    }
    this.reconcileCount++;
  }

  // Full cycle: render → diff → reconcile
  update(data) {
    const newVDOM = this.render(data);
    const changes = this.diff(this.previousVDOM, newVDOM);
    this.reconcile(changes);
    this.previousVDOM = newVDOM;
    return changes.length;
  }
}

// ═══ DEMO ═══

console.log("═══ VIRTUAL DOM — FULL CYCLE ═══\n");

const realDOM = new RealDOM();
const vdom = new VirtualDOM(realDOM);

// State
let post;

// ── Initial render ──
console.log("── STATE ①: post = undefined (initial!) ──");
post = undefined;
vdom.update({ post });

// ── User click ──
console.log("\n── STATE ②: post = '' (user click!) ──");
post = "";
vdom.update({ post });

// ── User type "Y" ──
console.log("\n── STATE ③: post = 'Y' (user type!) ──");
post = "Y";
vdom.update({ post });

// ── Same data — NO CHANGES! ──
console.log("\n── STATE ③ AGAIN: post = 'Y' (no change!) ──");
vdom.update({ post });

// ── Stats ──
console.log("\n═══ STATISTICS ═══");
console.log(`  Diff cycles: ${vdom.diffCount}`);
console.log(`  Reconcile cycles: ${vdom.reconcileCount}`);
console.log(`  Real DOM updates: ${realDOM.updateCount}`);
console.log(`  Saved updates: ${vdom.diffCount * 2 - realDOM.updateCount} 🚀`);

// ═══ COMPARE: WITHOUT vs WITH VDOM ═══

console.log("\n═══ COMPARISON: Without vs With Virtual DOM ═══");

const withoutVDOM = 4 * 2; // 4 renders × 2 elements
console.log(`  Without VDOM: ${withoutVDOM} DOM updates (wipe+reload!)`);
console.log(`  With VDOM:    ${realDOM.updateCount} DOM updates (diff!)`);
console.log(
  `  Saved: ${withoutVDOM - realDOM.updateCount} updates (${Math.round(((withoutVDOM - realDOM.updateCount) / withoutVDOM) * 100)}%!) 🏆`,
);
```

---

## §8. 🔬 Deep Analysis Patterns — Declarative Architecture

### 8.1 Pattern ①: Declarative Spectrum

```
DECLARATIVE SPECTRUM:
═══════════════════════════════════════════════════════════════

  MOST DECLARATIVE                    MOST IMPERATIVE
  ←──────────────────────────────────────────────────→

  HTML    JSX/Vue     Virtual     dataToView    Raw DOM
          Template    DOM Map     (current)     API

  <div>   <div>       { div:     jsDiv.text    document
   hi      {post}      text:     Content =     .querySelector
  </div>  </div>       post }    post          ...

  → Will is BUILDING toward JSX!
  → Virtual DOM = intermediary step!
  → "Give ourselves declarative JS" — Will
```

### 8.2 Pattern ②: Compose = Move Pieces

```
"COMPOSE" — DI CHUYỂN UI PIECES:
═══════════════════════════════════════════════════════════════

  IMPERATIVE (khó compose!):
  ┌──────────────────────────────────────────────────────────┐
  │ // Move button from after input to before input?       │
  │ // Phải: remove, re-create, re-insert, re-bind! 😤    │
  │ parent.removeChild(btn);                                │
  │ parent.insertBefore(btn, input);                         │
  │ btn.onclick = handler; // re-bind!                      │
  └──────────────────────────────────────────────────────────┘

  VIRTUAL DOM (dễ compose!):
  ┌──────────────────────────────────────────────────────────┐
  │ // Before:                  // After:                   │
  │ { children: [               { children: [               │
  │    input,                      button,  ← moved up!    │
  │    button  ← here             input                    │
  │ ] }                         ] }                          │
  │                                                          │
  │ → Move 1 item trong JS array!                          │
  │ → VDOM diff auto-handles real DOM! ✅                  │
  └──────────────────────────────────────────────────────────┘

  "Move pieces around, move little UNITS of
   view around in JavaScript." — Will
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 23:
═══════════════════════════════════════════════════════════════

  VIRTUAL DOM — HIỂU ĐÚNG:
  [ ] KHÔNG PHẢI "DOM nhanh hơn"!
  [ ] = Declarative layer trong JavaScript!
  [ ] = Intermediary map (bản đồ trung gian!)
  [ ] = Diffing opportunity!
  [ ] "Most MISUNDERSTOOD concept!" — Will

  DECLARATIVE vs IMPERATIVE:
  [ ] HTML = declarative (code giống output!)
  [ ] JS = imperative (code KHÔNG giống output!)
  [ ] Virtual DOM = give JS declarative power!
  [ ] "Pixels are VISUAL → code should be visual!" — Will

  DIFFING & RECONCILIATION:
  [ ] Diff = compare old VDOM vs new VDOM!
  [ ] Reconcile = apply ONLY changes to real DOM!
  [ ] "Significant optimizations to be performative!"

  TWO BENEFITS:
  [ ] ① Visual/declarative coding (compose UI!)
  [ ] ② Performance (skip unnecessary updates!)

  TIẾP THEO → Phần 24: Building Virtual DOM!
```
