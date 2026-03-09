# The Last Algorithms Course You'll Need — Phần 33: Debugging Linked List — "prev.next Not .next, Classic Blunder, Undo = Git!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Debugging Linked List — "Debug print statements, getAt bug, removeNode prev.next/next.prev fix, undo = linked list history = git!"
> Độ khó: ⭐️⭐️⭐️ | Debug session — finding and fixing pointer bugs, the classic .next vs .prev mistake!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Bug Hunt — "Something Has Gone Wrong!"                 |
| 2   | Bug #1: getAt — "Forgot to Use the Helper!"            |
| 3   | Bug #2: removeNode — "prev.next and next.prev!"        |
| 4   | "First Try!" — "Classic Blunder, Land War in Asia!" 😂 |
| 5   | Q: "Undo History?" — "You'd Invent Git!" 😂            |
| 6   | Lessons Learned — "Minutia, Not Concepts!"             |

---

## §1. Bug Hunt — "Something Has Gone Wrong!"

> Prime: _"Obviously something has gone wrong. We could debug this — do we want to do a debugging session? YES."_

### Debug technique: print statements!

```typescript
// Add debug print to see what's happening!
debug() {
  let out = "";
  let curr = this.head;
  for (let i = 0; curr && i < this.length; i++) {
    out += `${i} → ${curr.value}  `;
    curr = curr.next;
  }
  console.log(out);
}
```

---

## §2. Bug #1: getAt — "Forgot to Use the Helper!"

> Prime: _"My get was totally wrong — I didn't simply use the getAt helper!"_

```typescript
// WRONG — forgot to use getAt!
get(idx) {
  // manually walking but with bugs...
}

// CORRECT — use the helper!
get(idx) {
  return this.getAt(idx)?.value;
}
```

---

## §3. Bug #2: removeNode — "prev.next and next.prev!"

> Prime: _"Classic blunder — I practically started a land war in Asia at this point!"_

```
THE BUG:
═══════════════════════════════════════════════════════════════

  ❌ WRONG:
  if (node.prev) node.prev = node.next;    // overwrites the POINTER!
  if (node.next) node.next = node.prev;    // overwrites the POINTER!

  ✅ CORRECT:
  if (node.prev) node.prev.NEXT = node.next;  // hop over!
  if (node.next) node.next.PREV = node.prev;  // hop over!

  "Nodes previous NEXT needs to jump across to node next.
   Nodes next PREVIOUS needs to jump across to node previous." — Prime
```

### Visual!

```
  Before removal (removing C):
  (B) ⇄ (C) ⇄ (D)

  ❌ node.prev = node.next:
  B is LOST! We overwrote the reference!

  ✅ node.prev.next = node.next:
  B.next → D (hop over C!)
  D.prev → B (hop back over C!)

  After:
  (B) ⇄ (D)  ← C disconnected! ✅
```

---

## §4. "First Try!" — "Classic Blunder!" 😂

> Prime after fixing: _"First try. I knew it. The claps are outstanding — you can hear them because we're NOT supposed to clap."_

_"Linked lists are very hard to write. It's not difficult because the CONCEPTS are hard — it's an exercise in MINUTIA."_

---

## §5. Q: "Undo History?" — "You'd Invent Git!" 😂

> Student: _"Have you ever had to keep track of the history of removed nodes?"_

### Prime's answer!

_"A history would be some sort of wrapping class — linked list with history. For creating an undo."_

_"But the moment you change but you've undone twice, you create a BRANCH. It's no longer a linked list — it's a general tree. You've pretty much invented git at that point. And if you've invented git, that's just a bad time."_ 😂

```
UNDO = LINKED LIST HISTORY:
═══════════════════════════════════════════════════════════════

  state1 → state2 → state3 → state4
                        ↑
                     undo twice!
                        ↓
                     state3b → state4b   ← BRANCH!

  No longer a linked list → it's a TREE!
  Congratulations, you've invented git! 😂
```

### HTML bubbling = linked list!

_"When you bubble up from an HTML event, it's effectively a linked list — you're walking parent pointers."_

---

## §6. Lessons Learned — "Minutia, Not Concepts!"

> Prime: _"You shouldn't be surprised if you run into a million of these problems. In university we had to do a bunch of these and every time it's just a headache."_

| Lesson                   | Detail                                       |
| ------------------------ | -------------------------------------------- |
| `.prev.next` not `.prev` | Don't overwrite the pointer itself!          |
| Use helper functions     | `getAt()`, `removeNode()` prevent bugs!      |
| Debug with print         | Add a `debug()` method for quick inspection! |
| Edge cases               | Empty list, single item, head, tail!         |
| Bookkeeping              | Always update `length`, `head`, `tail`!      |

---

## Checklist

```
[ ] Debug: add print statements to see state!
[ ] Bug: node.prev.NEXT (not node.prev)!
[ ] Bug: node.next.PREV (not node.next)!
[ ] Use helpers: getAt() + removeNode() prevent duplication!
[ ] "Minutia, not concepts" — the hard part of linked lists!
[ ] Undo history → branches → tree → git! 😂
TIẾP THEO → Phần 34: Trees Overview!
```
