# The Hard Parts of UI Development — Phần 22: Predictable Data & View Flow — "Bound Together!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Predictable Data & View Flow — "Data & View Bound, setInterval Hack, Render Function!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — binding, setInterval hack, state hooks preview, exponential → predictable!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Data & View = Content — "Bound Together!"                  |
| 2   | setInterval Hack — "Every 15 Milliseconds!"                |
| 3   | Tại Sao Không Dùng setInterval Thật — "Blocking!"          |
| 4   | State Hooks Preview — "Impression of Auto-Update!"         |
| 5   | Exponential → Predictable — "An Order of Magnitude!"       |
| 6   | Render Function — "dataToView = Render!"                   |
| 7   | Tự Implement: setInterval Auto-Render + State Hook Preview |
| 8   | 🔬 Deep Analysis Patterns — Binding & Automation           |

---

## §1. Data & View = Content — "Bound Together!"

> Will: _"We've described that relationship ONE TIME and it's used again and again. They've kind of become BOUND to each other."_

### Bối cảnh — Data và View hợp nhất!

Will nhận ra điều sâu sắc: vì dataToView **mô tả** mối quan hệ data → view **MỘT LẦN**, và được dùng **lại lại lại** mỗi khi data thay đổi, data và view đã **gần như hợp nhất**:

_"The underlying data and what you see — they are NOT separated. Because we've described how what you see is dependent on data, and it's only ONE place that's happening."_

Will dùng từ **"content"** thay vì tách "data" và "view": _"I love the ambiguity of 'content' because it reminds us that content is what they see AND should be the underlying state of the world."_

Giống thế giới thực: khi bạn thay đổi thứ bạn thấy → bạn đang thay đổi **trạng thái thực** của thế giới! Trong app:

- Thay đổi view → thực ra đang thay đổi data
- Data thay đổi → view tự động phản ánh
- Data + View = **CONTENT** (một thứ duy nhất!)

```
DATA & VIEW = CONTENT:
═══════════════════════════════════════════════════════════════

  THẾ GIỚI THỰC:
  ┌──────────────────────────────────────────────────────────┐
  │ Bạn di chuyển cốc nước!                                │
  │ → Thấy cốc ở vị trí mới (view!)                      │
  │ → Cốc THỰC SỰ ở vị trí mới (data!)                   │
  │ → View = Data = CÙNG MỘT THỨ!                        │
  └──────────────────────────────────────────────────────────┘

  TRONG APP (one-way):
  ┌──────────────────────────────────────────────────────────┐
  │ User gõ "Y"!                                            │
  │ → post = "Y" (data!)                                   │
  │ → dataToView() → input="Y", div="Y" (view!)           │
  │ → Data + View = CONTENT!                               │
  │ → "BOUND to each other!" — Will                        │
  └──────────────────────────────────────────────────────────┘

  "They've kind of become TIED, become BOUND.
   That can allow us to even TRICK ourselves visually
   to think we've ACTUALLY bound them together." — Will
```

---

## §2. setInterval Hack — "Every 15 Milliseconds!"

> Will: _"What if we just had it running so often, every 15 milliseconds, that we didn't even need to rerun it in response to data change?"_

### "Slick move" — Auto-render hack!

Will giới thiệu ý tưởng **"kinda badass"**: thay vì gọi `dataToView()` thủ công trong mỗi handler, dùng `setInterval` để chạy nó **tự động** mỗi 15ms!

Hiện tại: mỗi handler phải tự gọi dataToView():

```javascript
handleClick() { post = ""; dataToView(); }
handleInput() { post = typed; dataToView(); }
```

Hack: `setInterval(dataToView, 15)` → dataToView chạy **60 lần/giây**!

```javascript
handleClick() { post = ""; }           // chỉ data!
handleInput() { post = typed; }         // chỉ data!
setInterval(dataToView, 15);           // auto-render!
```

_"handleClick, change some data. handleInput, change some data. Don't ask anything else. Just know that dataToView is running on repeat."_

Will gọi đây là _"a really slick move"_ — handlers **chỉ cần thay đổi data**! Không cần nhớ gọi dataToView!

```
setInterval HACK:
═══════════════════════════════════════════════════════════════

  TRƯỚC (manual):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   post = "";        ← data                              │
  │   dataToView();     ← PHẢI NHỚ GỌI!                  │
  │ }                                                        │
  │ handleInput() {                                          │
  │   post = jsInput.value;  ← data                        │
  │   dataToView();          ← PHẢI NHỚ GỌI!             │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  SAU (auto-render hack):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() { post = ""; }         ← CHỈ DATA!      │
  │ handleInput() { post = jsInput.value; }  ← CHỈ DATA!  │
  │                                                          │
  │ setInterval(dataToView, 15);  ← TỰ ĐỘNG! 60fps! 🔄   │
  │                                                          │
  │ Will: "Don't ask anything else. Just know that          │
  │        dataToView is RUNNING ON REPEAT." 🤙             │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Tại Sao Không Dùng setInterval Thật — "Blocking!"

> Will: _"In practice, I wanna make it really clear, we COULDN'T do this. It's gonna BLOCK."_

### Reality check — Performance!

Will **ngay lập tức** cảnh báo: đây chỉ là hack cho mục đích học tập (pedagogy)!

_"We couldn't do this — it's gonna block. Even some of those handlers running, CSS animations and smooth scrolling... all share a couple of processes in the web browser. We don't wanna have that BLOCKED by a function re-rendering our entire page every 15 milliseconds."_

Tại sao blocking?

1. dataToView update **TOÀN BỘ** DOM elements mỗi 15ms
2. Chiếm call stack → event handlers phải **chờ**!
3. CSS animations share processes → bị **giật**!
4. Smooth scrolling bị **khựng**!
5. 1000 elements × 60fps = **60,000 DOM operations/giây**! 💀

```
TẠI SAO BLOCKING:
═══════════════════════════════════════════════════════════════

  setInterval(dataToView, 15):

  Timeline:
  ┌──────────────────────────────────────────────────────────┐
  │ 0ms:   dataToView() chạy (update 1000 elements!) 🐢   │
  │ 5ms:   ...vẫn đang chạy...                            │
  │ 10ms:  User click! → handleClick chờ trong queue! ⏳   │
  │ 12ms:  CSS animation frame! → BLOCKED! 🚫              │
  │ 15ms:  dataToView() XONG!                               │
  │ 15ms:  dataToView() LẠI chạy! (setInterval!) 🐢       │
  │ 16ms:  handleClick VẪN CHƯA CHẠY! 😤                  │
  │ ...                                                      │
  │ 30ms:  dataToView() CÒN CHẠY NỮA! 🐢                 │
  │ → User thấy UI giật, chậm, không responsive! 💀       │
  └──────────────────────────────────────────────────────────┘

  "We don't wanna have that BLOCKED by a function
   re-rendering our ENTIRE PAGE every 15ms." — Will
```

---

## §4. State Hooks Preview — "Impression of Auto-Update!"

> Will: _"State hooks are gonna give us the IMPRESSION we're doing it automatically. Actually, it means we'll only run it when we change data."_

### State hooks = Smart auto-update!

Will preview giải pháp thực tế: **State hooks** (React: useState, Vue: ref, etc.)

_"State hooks give us the IMPRESSION we're doing it automatically, running that update function every 15 milliseconds. Actually, it means we'll only run it when we CHANGE DATA."_

Sự khác biệt:

- **setInterval hack**: chạy dataToView **MỌI LÚC** (kể cả khi data KHÔNG đổi!)
- **State hooks**: chạy dataToView **CHỈ KHI data thay đổi** (smart!)

Will: _"The problem is I don't have to remember to run dataToView. I'm gonna change data all over."_ → State hooks giải quyết: **tự động** gọi re-render khi state thay đổi, KHÔNG cần developer nhớ!

```
setInterval vs STATE HOOKS:
═══════════════════════════════════════════════════════════════

  setInterval (hack — brute force!):
  ┌──────────────────────────────────────────────────────────┐
  │ t=0ms:   dataToView() ← data chưa đổi → LÃG PHÍ!    │
  │ t=15ms:  dataToView() ← data chưa đổi → LÃG PHÍ!    │
  │ t=30ms:  dataToView() ← data chưa đổi → LÃG PHÍ!    │
  │ t=45ms:  post = "Y"   ← data ĐỔI!                    │
  │ t=45ms:  dataToView() ← CẦN! nhưng chờ 15ms...      │
  │ t=60ms:  dataToView() ← OK, cập nhật! ✅              │
  │                                                          │
  │ → 3 lần chạy LÃNG PHÍ + delay 15ms! 😤               │
  └──────────────────────────────────────────────────────────┘

  State Hooks (smart!):
  ┌──────────────────────────────────────────────────────────┐
  │ t=0ms:   (idle — không chạy!)                           │
  │ t=15ms:  (idle — không chạy!)                           │
  │ t=30ms:  (idle — không chạy!)                           │
  │ t=45ms:  setPost("Y") ← data ĐỔI → dataToView()! ✅  │
  │                                                          │
  │ → Chạy ĐÚNG 1 lần khi cần! Zero waste! 🚀            │
  └──────────────────────────────────────────────────────────┘

  React: useState() → setPost() → auto re-render!
  Vue: ref() → post.value = "Y" → auto re-render!
```

---

## §5. Exponential → Predictable — "An Order of Magnitude!"

> Will: _"A restrictive but powerful step to simplify our reasoning about user interface by an ORDER OF MAGNITUDE."_

### Core thesis — Tổng kết paradigm!

Will tổng kết toàn bộ one-way data binding paradigm:

_"Thousands of ways for users to interact in a modern app. Every piece of content on every element on the page can be clicked, typed, moused over — all of which need to change content, data, and what we see."_

_"I would say EXPONENTIAL COMPLEXITY, especially once you have to reason about 'what was it like when the user clicked?'"_

Giải pháp: _"I don't even CARE. I've written my code to depend only on our data in JavaScript."_

Will tóm gọn: **"Better to be RESTRICTED but PREDICTABLE than overly flexible and impossible to identify which bit of code caused our view and data to change."**

```
EXPONENTIAL → PREDICTABLE:
═══════════════════════════════════════════════════════════════

  AD-HOC (exponential!):
  ┌──────────────────────────────────────────────────────────┐
  │ 1000 elements × 40 handlers mỗi element                │
  │ → Reasoning: "User clicked button A, then typed in B,  │
  │    then scrolled C, then hovered D..."                  │
  │ → "What was it like when they clicked?" 🤯             │
  │ → EXPONENTIAL complexity!                                │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (predictable!):
  ┌──────────────────────────────────────────────────────────┐
  │ 1000 elements × 40 handlers mỗi element                │
  │ → Reasoning: "What's the current data?"                │
  │ → dataToView(data) → view!                             │
  │ → "I DON'T EVEN CARE about previous actions!" 😎      │
  │ → PREDICTABLE! O(1)!                                    │
  └──────────────────────────────────────────────────────────┘

  "Better to be RESTRICTED but PREDICTABLE
   than overly flexible and IMPOSSIBLE to identify
   which bit of code caused our view to change." — Will
```

---

## §6. Render Function — "dataToView = Render!"

> Will: _"A dataToView function. A RENDER function."_

### Will đặt tên chính thức!

Will cuối cùng dùng từ mà cả ngành dùng: **render function**!

_"One-way data binding: restricting all our users' changes of view to some corresponding associated underlying data. And all changes of view to flow through a single converter function called a RENDER FUNCTION, a dataToView function."_

Đây chính là:

- React: `render()` method / function component return
- Vue: `render()` function / template
- Angular: template + change detection
- Svelte: compiled reactivity

Tất cả = **dataToView** dưới tên khác nhau!

```
RENDER FUNCTION — MANY NAMES:
═══════════════════════════════════════════════════════════════

  dataToView() = RENDER FUNCTION!

  ┌──────────────────────────────────────────────────────────┐
  │ Will gọi:        "dataToView converter"                 │
  │                   "description function"                  │
  │                   "render function"                       │
  │                                                          │
  │ React:            render() / return JSX                  │
  │ Vue:              <template> / render()                  │
  │ Angular:          template + change detection            │
  │ Svelte:           compiled reactive blocks               │
  │                                                          │
  │ TẤT CẢ = data → conditionals → view!                  │
  │ TẤT CẢ = MỘT function/template quyết view!            │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: setInterval Auto-Render + State Hook Preview

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — setInterval Hack + State Hook Preview!
// Auto-render vs Smart-render!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(t) {
    this.type = t;
    this.value = "";
    this.text = "";
  }
}

let renderCount = 0;

function acc(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      el.value = v;
    },
    get textContent() {
      return el.text;
    },
    set textContent(v) {
      el.text = v === undefined ? "" : String(v);
    },
  };
}

// ═══ PART 1: setInterval HACK ═══

console.log("═══ PART 1: setInterval HACK ═══\n");

const input1 = new El("input");
const div1 = new El("div");
const js1 = acc(input1);
const jd1 = acc(div1);
let post1;

function dataToView1() {
  renderCount++;
  js1.value = post1 !== undefined ? post1 : "What's up?";
  jd1.textContent = post1;
}

// Handlers — CHỈ DATA! Không gọi dataToView!
function handleClick1() {
  post1 = "";
}
function handleInput1(v) {
  post1 = v;
}

// setInterval hack!
console.log("  Starting setInterval(dataToView, 15)...");
console.log("  Simulating 200ms of execution:\n");

renderCount = 0;

// Simulate: 200ms / 15ms = ~13 renders
for (let t = 0; t <= 200; t += 15) {
  if (t === 60) {
    console.log(`  t=${t}ms: 🩷 User CLICK!`);
    handleClick1();
  }
  if (t === 105) {
    console.log(`  t=${t}ms: 🩷 User TYPE "Y"!`);
    handleInput1("Y");
  }
  dataToView1(); // runs every 15ms!
}

console.log(`\n  Total renders: ${renderCount} (most WASTED!)`);
console.log(`  Useful renders: 3 (initial + click + type)`);
console.log(`  Wasted: ${renderCount - 3}! 😤\n`);

// ═══ PART 2: STATE HOOK (smart!) ═══

console.log("═══ PART 2: STATE HOOK (smart!) ═══\n");

const input2 = new El("input");
const div2 = new El("div");
const js2 = acc(input2);
const jd2 = acc(div2);
let _post2;
let hookRenders = 0;

function dataToView2() {
  hookRenders++;
  js2.value = _post2 !== undefined ? _post2 : "What's up?";
  jd2.textContent = _post2;
  console.log(
    `  🔄 Render #${hookRenders}: post=${JSON.stringify(_post2)}` +
      ` → input="${input2.value}", div="${div2.text}"`,
  );
}

// State hook — auto dataToView khi data thay đổi!
function createState(initial) {
  let value = initial;
  const getter = () => value;
  const setter = (newVal) => {
    if (newVal === value) {
      console.log(`  ⏭️ SKIP: value unchanged!`);
      return;
    }
    value = newVal;
    _post2 = value;
    dataToView2(); // auto re-render!
  };
  return [getter, setter];
}

const [getPost, setPost] = createState(undefined);

// Initial render
_post2 = getPost();
dataToView2();

// User click
console.log("\n  🩷 User CLICK:");
setPost("");

// User type
console.log("\n  🩷 User TYPE 'Y':");
setPost("Y");

// Same value — NO re-render!
console.log("\n  🩷 User TYPE 'Y' AGAIN (same!):");
setPost("Y");

console.log(`\n  Total renders: ${hookRenders}`);
console.log(`  Wasted: 0! Every render was NEEDED! 🚀`);

// ═══ COMPARISON ═══

console.log("\n═══ COMPARISON ═══");
console.log(
  `  setInterval: ${renderCount} renders (${renderCount - 3} wasted!)`,
);
console.log(`  State hook:  ${hookRenders} renders (0 wasted!)`);
console.log(
  `  Performance: ${Math.round(renderCount / hookRenders)}x better! 🏆`,
);
```

---

## §8. 🔬 Deep Analysis Patterns — Binding & Automation

### 8.1 Pattern ①: Content = Data + View United

```
"CONTENT" — UNIFIED CONCEPT:
═══════════════════════════════════════════════════════════════

  Will dùng "content" thay vì "data" hay "view":

  ┌──────────────────────────────────────────────────────────┐
  │ CONTENT = {                                              │
  │   data: post = "Y",        ← trạng thái bên trong     │
  │   view: input="Y" div="Y"  ← hiển thị bên ngoài      │
  │ }                                                        │
  │                                                          │
  │ Change CONTENT = change BOTH simultaneously!            │
  │ → User "changes content" = changes data + view!        │
  │ → Because dataToView BINDS them!                       │
  │ → "Display content to users, enable users              │
  │    to CHANGE that content." — Will                      │
  └──────────────────────────────────────────────────────────┘

  WEB COMPONENTS tiến thêm 1 bước:
  ┌──────────────────────────────────────────────────────────┐
  │ → Encapsulate data + view + behavior!                  │
  │ → Shadow DOM = isolated content!                        │
  │ → "Things like web components are all about             │
  │    trying to make them THE SAME THING." — Will         │
  └──────────────────────────────────────────────────────────┘
```

### 8.2 Pattern ②: 3 Triggers cho dataToView

```
3 TRIGGERS:
═══════════════════════════════════════════════════════════════

  Will liệt kê 3 lúc dataToView phải chạy:

  ① INITIAL (data creation):
  ┌──────────────────────────────────────────────────────────┐
  │ post = undefined → dataToView()                        │
  │ "App not being on to being on — that IS data changing!"│
  └──────────────────────────────────────────────────────────┘

  ② USER ACTION (click, type):
  ┌──────────────────────────────────────────────────────────┐
  │ User click → post = "" → dataToView()                  │
  │ User type → post = "Y" → dataToView()                 │
  └──────────────────────────────────────────────────────────┘

  ③ SERVER/OTHER (sẽ học!):
  ┌──────────────────────────────────────────────────────────┐
  │ fetch().then(data => { post = data; dataToView(); })   │
  │ → Server response cũng là data change!                │
  └──────────────────────────────────────────────────────────┘

  QUY TẮC: "Whenever data changes, dataToView MUST run,
            including on initial data creation." — Will
```

### 8.3 Pattern ③: Scale — Multiple dataToView Functions

```
SCALE — NHIỀU dataToView:
═══════════════════════════════════════════════════════════════

  Will preview thực tế ở scale lớn:

  "In practice at scale, we'd have MANY dataToView
   functions. And maybe we'd need to FLOW through
   those in some way — some sort of rules for
   flowing data." — Will

  ┌──────────────────────────────────────────────────────────┐
  │ Small app: 1 dataToView()                               │
  │                                                          │
  │ Large app:                                               │
  │ dataToView_Header()    ← header component              │
  │ dataToView_Sidebar()   ← sidebar component             │
  │ dataToView_Content()   ← main content                  │
  │ dataToView_Footer()    ← footer component              │
  │                                                          │
  │ → Flow rules: which runs first?                        │
  │ → Data flow: parent → child (unidirectional!)          │
  │ → React: component tree = dataToView tree!             │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 22:
═══════════════════════════════════════════════════════════════

  DATA & VIEW BOUND:
  [ ] "Content" = data + view (unified concept!)
  [ ] dataToView describes relationship ONE TIME!
  [ ] Relationship used AGAIN and AGAIN!
  [ ] "Bound to each other!" — tied together!

  setInterval HACK:
  [ ] setInterval(dataToView, 15) → auto-render 60fps!
  [ ] Handlers chỉ thay đổi DATA — không gọi dataToView!
  [ ] "Kinda badass" nhưng BLOCKING!
  [ ] 60,000 DOM operations/giây = 💀!

  STATE HOOKS:
  [ ] "IMPRESSION of auto-update" — nhưng smart!
  [ ] Chạy CHỈ KHI data thay đổi! Zero waste!
  [ ] Developer không cần NHỚ gọi dataToView!
  [ ] React useState, Vue ref = same concept!

  PREDICTABLE:
  [ ] "Better RESTRICTED but PREDICTABLE!"
  [ ] "I DON'T EVEN CARE about previous actions!"
  [ ] An ORDER OF MAGNITUDE simpler reasoning!
  [ ] dataToView = RENDER FUNCTION!

  TIẾP THEO → Phần 23: Virtual DOM + Semi-Visual Coding!
```
