# The Hard Parts of UI Development — Phần 38: Generating VDOM Elements from Array — "Functional Components, Post(), Uppercase Convention!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Generating VDOM Elements from Array — "Post function, map over posts, spread into VDOM, Paul's capitalize question!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — functional components, Post(), map + spread composition, recursive convert teaser, JSX connection!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Vấn Đề — "50 Twitter Posts, Really List Them All?" |
| 2   | Post Function — "Functional Component!"            |
| 3   | map + spread — "Ginger, Gez, Ursy, Fen!"           |
| 4   | Dynamic Posts — "User Types → Push to Array!"      |
| 5   | Recursive Convert Teaser — "Sub-Elements!"         |
| 6   | Paul's Question — "Why Uppercase?"                 |
| 7   | JSX Connection — "React Under the Hood!"           |
| 8   | Tự Implement: Functional Components                |
| 9   | 🔬 Deep Analysis — Component Evolution             |

---

## §1. Vấn Đề — "50 Twitter Posts, Really List Them All?"

> Will: _"If I have 50 Twitter posts, I do NOT want to really list them down in a giant array of arrays."_

### Manual listing doesn't scale!

Will: _"Even more UI composition — creating multiple similar VDOM elements each with DIFFERENT actual data."_

Imagine 50 posts:

```javascript
// ❌ THIS IS TERRIBLE!
createVDOM() {
  return [
    ["input", name, handle],
    ["div", "Post 1"],
    ["div", "Post 2"],
    // ... 48 more? NO!
  ]
}
```

→ Cần **function** tạo elements từ data!

---

## §2. Post Function — "Functional Component!"

> Will: _"Create a function like Post that when run with an individual piece of data will return out another array element with 'div' and the message as its content."_

### Post(message) → ["div", message]

Will: _"This is what a FUNCTIONAL COMPONENT is doing — it is creating when run a piece of our visual representation of the page."_

```javascript
function Post(message) {
  return ["div", message];
}

Post("Ginger"); // → ["div", "Ginger"]
Post("Gez"); // → ["div", "Gez"]
```

→ Function produces VDOM element! = **Functional Component**!

```
FUNCTIONAL COMPONENT:
═══════════════════════════════════════════════════════════════

  Post(message) → ["div", message]

  Post("Ginger") → ["div", "Ginger"]  ← VDOM element!
  Post("Gez")    → ["div", "Gez"]     ← VDOM element!
  Post("Ursy")   → ["div", "Ursy"]    ← VDOM element!
  Post("Fen")    → ["div", "Fen"]     ← VDOM element!

  "This is what a FUNCTIONAL COMPONENT is doing!" — Will
```

---

## §3. map + spread — "Ginger, Gez, Ursy, Fen!"

> Will: _"I am going to map over those individual names and insert each string as the input to respectively the call to Post."_

### posts.map(Post) → then spread!

Will's sisters' nicknames: Ginger, Gez, Ursy, Fen! 😂

```javascript
const posts = ["Ginger", "Gez", "Ursy", "Fen"];

// map over posts → call Post on each!
posts.map(Post);
// → [["div","Ginger"], ["div","Gez"], ["div","Ursy"], ["div","Fen"]]

// But this is array of arrays INSIDE createVDOM!
// Need to SPREAD into the outer array!
```

Will: _"That's an array of arrays and I actually just want a list of arrays — so I'll spread them."_

```javascript
function createVDOM() {
  return [
    ["input", name, handle],
    ...posts.map(Post), // SPREAD! ← flatten!
  ];
}
// → [["input",name,handle], ["div","Ginger"], ["div","Gez"], ...]
```

```
map + spread — COMPOSITION:
═══════════════════════════════════════════════════════════════

  posts = ["Ginger", "Gez", "Ursy", "Fen"]

  posts.map(Post) = [
    ["div", "Ginger"],
    ["div", "Gez"],
    ["div", "Ursy"],
    ["div", "Fen"],
  ]

  createVDOM():
  [
    ["input", name, handle],     ← static element!
    ...posts.map(Post),          ← SPREAD 4 elements!
  ]
  = [
    ["input", name, handle],
    ["div", "Ginger"],
    ["div", "Gez"],
    ["div", "Ursy"],
    ["div", "Fen"],
  ]
  → 5 elements total! 🎉
```

---

## §4. Dynamic Posts — "User Types → Push to Array!"

> Will: _"Each letter the user writes, it will add to our list of posts. Because our data directly manifests in our VDOM — we will get automatically all those messages."_

### handle pushes to posts!

```javascript
function handle(e) {
  posts.push(e.target.value); // push to array!
}
```

Will: _"If I were to write 'will', my posts would now be Ginger, Gez, Ursy, Fen, 'will'. Then createVDOM would take our now LONGER list and map over it."_

_"That's what happens when you type a tweet and press Enter — it appears. We've added to an underlying list, and upon mapping over that list, producing all the corresponding elements."_

```
DYNAMIC POSTS:
═══════════════════════════════════════════════════════════════

  BEFORE typing:
  posts = ["Ginger", "Gez", "Ursy", "Fen"]
  → 4 Post elements!

  User types "will":
  handle(e) → posts.push("will")
  posts = ["Ginger", "Gez", "Ursy", "Fen", "will"]

  AFTER re-render:
  → 5 Post elements! ← auto! No code change! ✅

  "That's what happens when you type a tweet!" — Will
```

---

## §5. Recursive Convert Teaser — "Sub-Elements!"

> Will: _"If we find that node position 1 is an ARRAY rather than text — don't try and display the array, JUMP IN and run through and produce all its elements."_

### Nested elements = recursive convert!

Will teases challenges: _"We can build these to handle sub-elements, clusters of elements, child elements — all using a RECURSIVE call to our convert function."_

_"If you find that node[1] is an array rather than text — jump in and run through!"_

→ Đây chính là cách **React reconciler** hoạt động!

---

## §6. Paul's Question — "Why Uppercase?"

> Paul: _"On your function Post, you have it capitalized — is there a reason?"_
> Will: _"Because it becomes a standard in UI frameworks that when a function is acting as a description of a relationship between underlying data and how it should be displayed — that is known as a UI component."_

### Uppercase = UI Component convention!

Will: _"Use an uppercase for the first letter — that's a CONVENTION. That's why I did it to show, hey, we've reached a full component here."_

_"If I had also created 'Input' as a function producing the input VDOM element, I'd have done uppercase too."_

```
NAMING CONVENTION:
═══════════════════════════════════════════════════════════════

  lowercase: regular functions
  ┌──────────────────────────────────────────────────────────┐
  │ function handle(e) { ... }     ← handler, not component│
  │ function convert(node) { ... } ← utility, not component│
  └──────────────────────────────────────────────────────────┘

  Uppercase: UI Components!
  ┌──────────────────────────────────────────────────────────┐
  │ function Post(message) { ... }  ← COMPONENT! ✅       │
  │ function Input(name) { ... }    ← COMPONENT! ✅       │
  │                                                          │
  │ "Convention within UI framework design.                 │
  │  Whenever it describes data → view relationship        │
  │  = uppercase first letter!" — Will                     │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. JSX Connection — "React Under the Hood!"

> Will: _"React wraps that array creation in a createElement function call, then wraps that in JSX — syntactic sugar that looks like the thing they create."_

### Post → createElement → JSX!

Will connects to React:

_"If you look at React — they wrap up that array/object creation in a createElement function call, that they wrap up in JSX."_

_"JSX looks actually like the thing they end up creating. Once you get into framework implementation, you can see why it's so satisfying to model these up from the ground up."_

```
EVOLUTION — Post → JSX:
═══════════════════════════════════════════════════════════════

  OUR CODE:
  function Post(msg) { return ["div", msg]; }

  REACT (createElement):
  function Post(msg) { return React.createElement("div", null, msg); }

  REACT (JSX):
  function Post({ msg }) { return <div>{msg}</div>; }

  "JSX is syntactic sugar that LOOKS like
   the thing it ends up creating!" — Will
```

---

## §8. Tự Implement: Functional Components

```javascript
// ═══ Functional Components ═══

let posts = ["Ginger", "Gez", "Ursy", "Fen"];
let name = "";

// UI Component! (uppercase!)
function Post(message) {
  return ["div", message];
}

function createVDOM() {
  return [
    ["input", name, handle],
    ...posts.map(Post), // spread!
  ];
}

function handle(e) {
  posts.push(e.target.value);
  console.log(
    `  handle: pushed "${e.target.value}" → posts.length = ${posts.length}`,
  );
}

function convert(node) {
  return { type: node[0], content: node[1] };
}

function updateDOM() {
  const VDOM = createVDOM();
  const elems = VDOM.map(convert);
  console.log(`  VDOM: ${VDOM.length} elements`);
  elems.forEach((el, i) => {
    console.log(`    <${el.type}>${el.content}</${el.type}>`);
  });
}

// Demo
console.log("Render 1 (4 posts):");
updateDOM();

console.log("\nUser types 'will':");
handle({ target: { value: "will" } });

console.log("\nRender 2 (5 posts!):");
updateDOM();

handle({ target: { value: "hello" } });
console.log("\nRender 3 (6 posts!):");
updateDOM();

console.log("\n✅ Post() = functional component!");
console.log("✅ posts.map(Post) + spread = dynamic list!");
console.log("✅ Uppercase = convention for components!");
```

---

## §9. 🔬 Deep Analysis — Component Evolution

```
COMPONENT EVOLUTION:
═══════════════════════════════════════════════════════════════

  v1: Entire dataToView in one function
  → Everything mixed together! 😤

  v2: createVDOM + convert separated
  → Description vs execution!

  v3: Functional Components (NOW!):
  → Post(msg) → ["div", msg]
  → Reusable! Composable! Dynamic!
  → "This IS what a functional component does!" — Will

  v4: React/Vue/Svelte:
  → createElement + JSX + hooks + reconciler
  → Same idea, production-ready!

  KEY INSIGHT:
  "A function that describes the relationship
   between data and what's displayed
   = UI COMPONENT." — Will 🎯
```

---

## Checklist

```
[ ] 50 posts → can't list manually!
[ ] Post(message) → ["div", message] = functional component!
[ ] posts.map(Post) → array of VDOM elements!
[ ] Spread (...) → flatten into createVDOM!
[ ] Dynamic: posts.push() → auto re-render!
[ ] Paul: "Why uppercase?" → convention for components!
[ ] JSX = syntactic sugar over createElement!
[ ] Recursive convert = handle nested elements!
TIẾP THEO → Phần 39: Performance & Diffing!
```
