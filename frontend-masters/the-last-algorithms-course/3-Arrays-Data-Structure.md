# The Last Algorithms Course You'll Need — Phần 3: Arrays Data Structure — "Contiguous Memory, Width × Offset, O(1) Everything!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Arrays Data Structure — "Contiguous memory, ArrayBuffer demo, width × offset, get/set/delete all O(1), no grow!"
> Độ khó: ⭐️⭐️⭐️ | Fundamental — real arrays vs JS "arrays", memory interpretation, constant time operations!

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | "const a = [] Is NOT an Array!" — Reveal!       |
| 2   | Array = Contiguous Memory — "Zeros and Ones!"   |
| 3   | Width × Offset — "How Indexing Actually Works!" |
| 4   | ArrayBuffer Demo — "Node.js Proof!"             |
| 5   | Endianness Teaser — "Where Did 45 Go?!"         |
| 6   | Operations — "Get, Set, Delete = O(1)!"         |
| 7   | No Grow! — "F's in the Chat for Fred!"          |
| 8   | Tự Implement: Array Operations                  |
| 9   | 🔬 Deep Analysis — Real Array vs JS Array       |

---

## §1. "const a = [] Is NOT an Array!" — Reveal!

> Prime: _"If const array isn't an array, well what IS it? Hopefully by the end, we will be able to DERIVE what it is — we will empirically look at it and say, it's actually THIS data structure."_

### JavaScript "arrays" ≠ real arrays!

Prime: _"JavaScript arrays are much more complicated — they do a lot of cool tricks underneath. I'm sure they morph algorithms depending on how you use them."_

_"If you set one element at index a billion, I'm very sure JavaScript's not creating 999,999,999 positions. They're very smart."_

→ JS arrays = **something else** (sẽ reveal data structure thật sau!)

---

## §2. Array = Contiguous Memory — "Zeros and Ones!"

> Prime: _"The most fundamental idea of an array is that it's a CONTIGUOUS memory space — contiguous meaning UNBREAKING — in which contains a certain amount of bytes."_

### Mọi thứ trong máy tính chỉ là 0 và 1!

Prime: _"Everything about a computer is just numbers — zeros and ones. How memory is INTERPRETED is based on what you tell the compiler."_

_"When it sees a chunk of memory and goes 'these four bytes I'm gonna treat as a singular number' — a 32-bit number — that's the program understanding this memory in a very specific way."_

```
CONTIGUOUS MEMORY:
═══════════════════════════════════════════════════════════════

  Memory (raw bytes):
  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
  │ 00 │ 00 │ 00 │ 2D │ 00 │ 00 │ 00 │ 02 │ 00 │ 00 │ 00 │ 00 │
  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘

  As int8 (1 byte each):
  [0, 0, 0, 45, 0, 0, 0, 2, 0, 0, 0, 0]  ← 12 elements!

  As int32 (4 bytes each):
  [45, 2, 0]  ← 3 elements! Same memory!

  "Just because it's contiguous doesn't mean it has
   any specific meaning until YOU give it meaning." — Prime
```

### Định nghĩa Array!

> Array = **zero or more pieces of memory**, understood as a **single type**, in a **row** (contiguous)!

```
int a[3];  // 3 integers, contiguous!

Memory:
┌──────────┬──────────┬──────────┐
│  a[0]    │  a[1]    │  a[2]    │
│ 4 bytes  │ 4 bytes  │ 4 bytes  │
└──────────┴──────────┴──────────┘
← 12 bytes total, unbreaking! →
```

---

## §3. Width × Offset — "How Indexing Actually Works!"

> Prime: _"If you did a[0], you're telling the computer: go to the memory address of a. Add in the offset of zero MULTIPLIED by how big my type is."_

### Công thức truy cập!

```
address = memory_address_of_a + (offset × width_of_type)
```

Prime: _"If your type is 32 bits or 4 bytes, index 1 has to be 4 bytes INTO the array."_

```
WIDTH × OFFSET:
═══════════════════════════════════════════════════════════════

  int a[3];  // int = 4 bytes (32 bits)
  Base address of a = 0x1000

  a[0]: 0x1000 + (0 × 4) = 0x1000  ← first int!
  a[1]: 0x1000 + (1 × 4) = 0x1004  ← second int!
  a[2]: 0x1000 + (2 × 4) = 0x1008  ← third int!

  Memory:
  0x1000  0x1004  0x1008
  ┌───────┬───────┬───────┐
  │ a[0]  │ a[1]  │ a[2]  │
  │ 4B    │ 4B    │ 4B    │
  └───────┴───────┴───────┘

  "This is what CREATES an actual array." — Prime
```

---

## §4. ArrayBuffer Demo — "Node.js Proof!"

> Prime: _"An array buffer is a contiguous piece of memory you can create in JavaScript. Then you can create VIEWS into this data."_

### ArrayBuffer = raw contiguous memory!

```javascript
// Create 6 bytes of contiguous memory!
const a = new ArrayBuffer(6);
// → <00 00 00 00 00 00>  All zeros!

// View as 8-bit (1 byte per element)
const a8 = new Uint8Array(a);
a8[0] = 45; // set byte 0 = 45 (0x2D)
a8[2] = 2; // set byte 2 = 2
// a → <2D 00 02 00 00 00>

// View as 16-bit (2 bytes per element)
const a16 = new Uint16Array(a);
a16[2] = 0x4545; // set element 2 (bytes 4-5)!
// a → <2D 00 02 00 45 45>
```

Prime: _"I took a contiguous memory space and interpreted it in TWO DIFFERENT WAYS. First as 8-bit units, then as 16-bit units. Very, very different."_

```
TWO VIEWS — SAME MEMORY:
═══════════════════════════════════════════════════════════════

  Raw memory (6 bytes):
  ┌────┬────┬────┬────┬────┬────┐
  │ 2D │ 00 │ 02 │ 00 │ 45 │ 45 │
  └────┴────┴────┴────┴────┴────┘

  As Uint8Array (1 byte each):
  [0]  [1]  [2]  [3]  [4]  [5]
   45   0    2    0    69   69    ← 6 elements!

  As Uint16Array (2 bytes each):
  [ 0 ]   [ 1 ]   [ 2 ]
    45      2     0x4545          ← 3 elements!

  "I INTERPRETED it in two different ways!" — Prime
```

---

## §5. Endianness Teaser — "Where Did 45 Go?!"

> Prime: _"Due to something called ENDIANNESS — when I store this value, it will be a bit confusing. It put 45 in the most significant position — probably NOT where you thought."_

### Endianness = byte order!

Prime: _"We won't talk about endianness."_ → Nhưng hint: **Little-endian** (Intel/AMD) lưu byte thấp trước!

---

## §6. Operations — "Get, Set, Delete = O(1)!"

> Prime: _"Does getting at a specific index GROW with respect to input? If I give 7 as my index, if I give 100 — does anything change? It's CONSTANT TIME."_

### Tất cả operations = O(1)!

**Get** (đọc): `a[i]` → address + (i × width) → O(1)!
**Set** (ghi): `a[i] = value` → same formula → O(1)!
**Delete**: Set to zero/null → same formula → O(1)!

Prime: _"Nothing goes over the entire array. We KNOW the width, we KNOW the offset, multiply, get the position, read/write. Same for insertion, same for deletion."_

_"Constant time doesn't mean we literally do ONE thing. It means we do a CONSTANT amount of things no matter what the input is."_

```
O(1) — ALL OPERATIONS:
═══════════════════════════════════════════════════════════════

  GET: a[i]
  → address + (i × width) → read value!
  → O(1)! Doesn't matter if i=0 or i=1,000,000!

  SET: a[i] = value
  → address + (i × width) → write value!
  → O(1)! Same formula!

  DELETE: a[i] = 0
  → Same as set! Just write sentinel value!
  → O(1)!

  "We don't have to WALK to that position.
   We KNOW the width, multiply by offset, done." — Prime
```

---

## §7. No Grow! — "F's in the Chat for Fred!"

> Prime: _"You do NOT get to grow your array into more memory. What happened if right after that you have the user's name? If you grow this, what's gonna happen to poor Fred? F's in the chat for Fred."_ 😂

### Arrays = fixed size!

Prime: _"You cannot grow it. There is no insert-at, there's no push or pop."_

_"That's WHY data structures exist — because it would be really annoying if you constantly had to reallocate everything."_

_"That's why you'll notice things like CAPACITY in other languages — they're trying to make an optimized way to use memory without reallocations."_

```
NO GROW:
═══════════════════════════════════════════════════════════════

  Memory:
  ┌──────────┬──────────┬──────────┬──────────────────┐
  │  a[0]    │  a[1]    │  a[2]    │  "Fred" (other  │
  │  int     │  int     │  int     │   program data!) │
  └──────────┴──────────┴──────────┴──────────────────┘

  If you try to grow a[3]...
  → You OVERWRITE Fred! 💀
  → "F's in the chat for Fred!" — Prime 😂

  SOLUTION:
  → Data structures (ArrayList, LinkedList, etc.)
  → They implement growing FOR you!
  → Using arrays underneath with reallocation!
```

### Deletion = sentinel value!

Prime: _"You don't DELETE something out of contiguous memory. You set it to zero — a sentinel value. NULL being the zeroth value — a named way for us to understand that there's NOTHING in this very-something spot."_

---

## §8. Tự Implement: Array Operations

```javascript
// ═══ Real Array Operations ═══

// Simulate a fixed-size array (like C)
class RealArray {
  constructor(size, bytesPerElement) {
    this.buffer = new ArrayBuffer(size * bytesPerElement);
    this.view = new Int32Array(this.buffer); // 32-bit ints
    this.size = size;
    this.bytesPerElement = bytesPerElement;
  }

  // GET — O(1)!
  get(index) {
    // address + (index × width) → read!
    if (index < 0 || index >= this.size) throw new Error("Out of bounds!");
    return this.view[index];
  }

  // SET — O(1)!
  set(index, value) {
    // address + (index × width) → write!
    if (index < 0 || index >= this.size) throw new Error("Out of bounds!");
    this.view[index] = value;
  }

  // DELETE — O(1)! (set to 0)
  delete(index) {
    this.set(index, 0); // sentinel value!
  }

  toString() {
    return Array.from(this.view).join(", ");
  }
}

// Demo
const arr = new RealArray(5, 4); // 5 ints, 4 bytes each
console.log("Initial:", arr.toString()); // 0, 0, 0, 0, 0

arr.set(0, 42);
arr.set(2, 100);
arr.set(4, 255);
console.log("After set:", arr.toString()); // 42, 0, 100, 0, 255

console.log("Get [2]:", arr.get(2)); // 100 — O(1)!

arr.delete(2);
console.log("After delete:", arr.toString()); // 42, 0, 0, 0, 255

// Can't grow!
try {
  arr.set(5, 999);
} catch (e) {
  console.log("Can't grow:", e.message);
}

console.log("\n✅ All operations O(1)!");
console.log("✅ Fixed size — no grow!");
console.log("✅ Contiguous memory — width × offset!");
```

---

## §9. 🔬 Deep Analysis — Real Array vs JS Array

```
REAL ARRAY vs JS "ARRAY":
═══════════════════════════════════════════════════════════════

  REAL ARRAY (C, Rust, Go):
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ Contiguous memory!                                  │
  │ ✅ Fixed size!                                          │
  │ ✅ Single type!                                         │
  │ ✅ O(1) get/set/delete!                                │
  │ ❌ No grow! No push! No pop!                           │
  │ ❌ No insert-at (shift elements)!                      │
  └──────────────────────────────────────────────────────────┘

  JS "ARRAY" (not really an array!):
  ┌──────────────────────────────────────────────────────────┐
  │ ❌ Not necessarily contiguous!                          │
  │ ❌ Dynamic size (grows automatically!)                  │
  │ ❌ Mixed types allowed!                                 │
  │ ✅ push, pop, shift, unshift!                          │
  │ ✅ Smart optimizations underneath!                     │
  │ → Actually a different data structure! (TBD!)          │
  └──────────────────────────────────────────────────────────┘

  SUMMARY:
  ┌──────────────────────────────────────────────────────────┐
  │ Array = fixed size, contiguous, single type, O(1) ops! │
  │ JS [] = "much more complicated" — Prime                │
  │ → Will reveal what JS [] actually is later! 🎯        │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] Array = contiguous memory space!
[ ] Everything is 0s and 1s — interpretation gives meaning!
[ ] Indexing: address + (offset × width) = O(1)!
[ ] ArrayBuffer demo: same memory, different views!
[ ] Endianness: byte order (little-endian on Intel)!
[ ] Get, Set, Delete = ALL O(1)!
[ ] No grow! "F's in the chat for Fred!" 😂
[ ] Delete = set to sentinel value (0 / null)!
[ ] JS [] is NOT a real array! (reveal later!)
[ ] Data structures exist to solve the "no grow" problem!
TIẾP THEO → Phần 4: Linear Search & Kata Setup!
```
