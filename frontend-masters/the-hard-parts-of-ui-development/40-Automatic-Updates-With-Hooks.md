# The Hard Parts of UI Development — Phần 40: Automatic Updates with Hooks — "updateData, State Hook, Closure, requestAnimationFrame!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Automatic Updates with Hooks — "updateData generic function, Alexa walkthrough, Justice's question, John's closure question, requestAnimationFrame!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — state hook implementation, data object, bracket notation, hook = reusable code, rAF!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Thay Đổi — "No More setInterval!"                 |
| 2   | data Object + updateData — "Generic Function!"    |
| 3   | Alexa Walkthrough — "label: 'name', value: 'Li'!" |
| 4   | "Hook Into" — "That's All Hook Means!"            |
| 5   | Justice's Question — "Why Separate Function?"     |
| 6   | John's Question — "Why Not Closure?"              |
| 7   | requestAnimationFrame — "Alternative!"            |
| 8   | Tự Implement: Generic State Hook                  |
| 9   | 🔬 Deep Analysis — Hook Architecture              |

---

## §1. Thay Đổi — "No More setInterval!"

> Will: _"We're NOT running updateDOM on a loop anymore with setInterval. Now we're ONLY running updateDOM when data changes."_

### Từ setInterval → on-demand!

Will: _"When our data changes and we want to update name to 'Li' — look inside our handle. We run a function called updateData."_

Thay đổi key: `handle` không gọi `name = value` trực tiếp nữa → gọi `updateData("name", value)`!

---

## §2. data Object + updateData — "Generic Function!"

> Will: _"This is a more GENERIC function — we pass 'name' as the key that goes and updates the key 'name' in our data object."_

### data object thay vì standalone variable!

Trước: `let name = ""` → Bây giờ: `const data = { name: "" }`

Tại sao? Vì `updateData` cần truy cập **bất kỳ property nào** bằng bracket notation!

```javascript
const data = { name: "" };

function updateData(label, value) {
  data[label] = value; // bracket notation! Generic!
  updateDOM(); // low-key re-render!
}

// Gọi:
updateData("name", "Li");
// = data["name"] = "Li"  → data.name = "Li"
// + updateDOM() tự động!
```

Will: _"Use square bracket notation to access the label passed in as string 'name' and set name's value to e.target.value — then run updateDOM."_

```
data OBJECT + BRACKET NOTATION:
═══════════════════════════════════════════════════════════════

  data = { name: "" }

  updateData("name", "Li"):
  ┌──────────────────────────────────────────────────────────┐
  │ label = "name"                                           │
  │ value = "Li"                                             │
  │                                                          │
  │ data[label] = value                                      │
  │ = data["name"] = "Li"                                   │
  │ = data.name = "Li" ✅                                   │
  │                                                          │
  │ updateDOM(); ← low-key! ✅                             │
  └──────────────────────────────────────────────────────────┘

  "Generic! Works for ANY data property!" — Will
```

---

## §3. Alexa Walkthrough — "label: 'name', value: 'Li'!"

> Alexa: _"We're gonna invoke updateData. Pass in the string 'name' as first argument. And the value on the event target — which is 'Li'."_

### Alexa walks through handle → updateData!

Alexa verbalize:

1. _"We invoke updateData."_
2. _"Pass string 'name' as first argument."_
3. _"And e.target.value — which is Li."_

Inside updateData:

Alexa: _"Look at our data global variable — it's an object. Using bracket notation, we pass in string 'name' to access the name property."_

Will: _"Assign it to?"_ → Alexa: _"The string Li."_ ✅

Then: Alexa: _"updateDOM."_ → Will: _"It's running INSIDE of updateData, right there."_

Result: createVDOM sử dụng `data.name` = "Li" → VDOM mới → convert → display!

Will: _"We end up where we were before, but now WITHOUT running updateDOM 60 times a second — with no cost, no loss."_

---

## §4. "Hook Into" — "That's All Hook Means!"

> Will: _"This code updateData is code that we HOOK INTO. It handles state — data persisting in our application — that ensures when data changes, we rerun updateDOM behind the scenes."_

### Hook = reusable functionality you plug into!

Will defines hook:

_"We can HOOK INTO this functionality that enables us to save and persist state, and when that state changes, will AUTOMATICALLY run updateDOM."_

_"That is known as a STATE HOOK. It's very profound, people."_

_"We just hook into it. So they call it a HOOK."_ 😂 [LAUGH]

```
HOOK — DEFINITION:
═══════════════════════════════════════════════════════════════

  HOOK = Code you plug into that provides:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Persistent STATE (data in memory!)                   │
  │ 2. AUTOMATIC re-render when state changes!             │
  │ 3. REUSABLE for any piece of data!                     │
  └──────────────────────────────────────────────────────────┘

  "We can hook into that functionality.
   That's all HOOK means!" — Will 😂

  React equivalent:
  const [name, setName] = useState("");
  // useState = the HOOK!
  // setName = the updater (like updateData!)
  // auto re-render when setName called!
```

---

## §5. Justice's Question — "Why Separate Function?"

> Justice: _"Are we separating that, creating updateData, just because it's doing its own little job?"_
> Will: _"Yeah — but notice we could then use updateData for a WHOLE SLEW of data in our app."_

### Generic > specific!

Justice asks: tại sao tách `updateData` ra?

Will: _"We could use it more generally. That's where the notion of it being a HOOK — some code written that we can hook into that performs a task that changes the behavior of our UI component."_

Will tiếp: _"In practice, when you CREATE the data, the creation process could store that data through a function call whose output could be the UPDATER FUNCTION."_

_"Such that later on, when we want to update, we use the associated updater function. And that is EXACTLY how it's done in React."_

→ `useState` returns `[value, setter]`!

---

## §6. John's Question — "Why Not Closure?"

> John: _"Is there a specific reason you're using data rather than closure?"_
> Will: _"Closure is my FAVORITE concept in JavaScript. However, we're not here for that today — minimizing complexity."_

### Will giữ global để giảm complexity!

Will: _"I've done everything in GLOBAL to remove having to do anything that would work, but via one of the most profound but also tricky-to-add concepts — closure."_

_"We wouldn't do this in practice."_ → Production: closure locks data!

Will's love for closure: _"If you've got functions running at a later time, being called back — all the data you could imagine would be there, right in its BACKPACK, its closed-over variable environment. I think that's really amazing."_ 😂

---

## §7. requestAnimationFrame — "Alternative!"

> Will: _"We can switch to running requestAnimationFrame rather than updateDOM directly — so it never prioritizes our animations."_

### rAF = defer to back of queue!

Will: _"Wrap the call to updateDOM inside requestAnimationFrame, which will delay it to run at the BACK of the callback queue."_

_"Anything else that needs to run in between — rendering, scroll events — could. But that's still creating our VDOM x times per second. Still inefficient, but at least not BLOCKING other things."_

```
requestAnimationFrame — ALTERNATIVE:
═══════════════════════════════════════════════════════════════

  DIRECT (current):
  ┌──────────────────────────────────────────────────────────┐
  │ function updateData(label, value) {                     │
  │   data[label] = value;                                   │
  │   updateDOM();  ← runs IMMEDIATELY!                    │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  WITH rAF (deferred):
  ┌──────────────────────────────────────────────────────────┐
  │ function updateData(label, value) {                     │
  │   data[label] = value;                                   │
  │   requestAnimationFrame(updateDOM);                      │
  │   ← deferred! Won't block scroll/render/CSS!          │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  "At least not BLOCKING other things!" — Will
```

---

## §8. Tự Implement: Generic State Hook

```javascript
// ═══ Generic State Hook ═══

const data = { name: "" };

function updateData(label, value) {
  data[label] = value;
  console.log(`  updateData("${label}", "${value}")`);
  console.log(`  data = ${JSON.stringify(data)}`);
  updateDOM(); // low-key!
}

function createVDOM() {
  return [
    ["input", data.name, handle],
    ["div", `Hello, ${data.name}!`],
    ["div", "great job"],
  ];
}

function handle(e) {
  updateData("name", e.target.value); // HOOK!
}

function convert(node) {
  return { type: node[0], content: node[1] };
}

function updateDOM() {
  const VDOM = createVDOM();
  const elems = VDOM.map(convert);
  console.log("  → updateDOM ran!");
  elems.forEach((el) =>
    console.log(`    <${el.type}>${el.content}</${el.type}>`),
  );
}

// Demo
console.log("═══ STATE HOOK ═══\n");

console.log("Initial render:");
updateDOM();

console.log("\nUser types 'Li':");
handle({ target: { value: "Li" } });
// updateData called → data.name = "Li" → updateDOM auto!

console.log("\nUser types 'Will':");
handle({ target: { value: "Will" } });

// GENERIC: works for any data!
console.log("\nAdd more data:");
data.age = 0;
updateData("age", 25); // works for 'age' too!

console.log("\n✅ updateData = generic state hook!");
console.log("✅ Works for ANY data property!");
console.log("✅ 'They call it a HOOK!' — Will 😂");
```

---

## §9. 🔬 Deep Analysis — Hook Architecture

```
HOOK ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  OUR CODE (global, simple):
  ┌──────────────────────────────────────────────────────────┐
  │ const data = { name: "" };                              │
  │ function updateData(label, value) {                     │
  │   data[label] = value;                                   │
  │   updateDOM();                                           │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  REACT (closure, production!):
  ┌──────────────────────────────────────────────────────────┐
  │ function useState(initial) {                             │
  │   let state = initial;  // closed over! 🔒            │
  │   function setState(newVal) {                            │
  │     state = newVal;                                      │
  │     reRender();  // schedules re-render!               │
  │   }                                                      │
  │   return [state, setState];                              │
  │ }                                                        │
  │                                                          │
  │ const [name, setName] = useState("");                    │
  │ // setName("Li") → state = "Li" + re-render!          │
  └──────────────────────────────────────────────────────────┘

  EVOLUTION:
  setInterval → state hook → useState → automatic!
  "That is EXACTLY how it's done in React." — Will 🎯
```

---

## Checklist

```
[ ] data object: { name: "" } thay vì let name = ""!
[ ] updateData(label, value): bracket notation + updateDOM!
[ ] Generic: works for ANY data property!
[ ] Alexa: label="name", value="Li", data["name"]="Li"!
[ ] "Hook into" = plug into reusable functionality!
[ ] "State hook" = persistent data + auto re-render!
[ ] Justice: "why separate?" → generic, reusable!
[ ] John: "why not closure?" → simplicity for diagramming!
[ ] rAF: defer updateDOM to back of queue!
[ ] React useState = same pattern with closure!
TIẾP THEO → Phần 41: Diffing Algorithm!
```
