# The Last Algorithms Course You'll Need — Phần 38: Implement Breadth First Search — "While Queue, Shift/Push, No Recursion!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement BFS — "While q.length, shift front, check value, push children, no recursion needed, DFS feels cleaner!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — BFS search for a value, iterative approach, DFS vs BFS preference!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | No Recursion! — "While Loop + Queue!"          |
| 2   | The Algorithm — "Shift, Check, Push Children!" |
| 3   | Base Case — "Check at Push, Not at Visit!"     |
| 4   | DFS vs BFS — "Which Feels Easier?"             |
| 5   | "Can You Do Recursive BFS?" — "Stack ≠ Queue!" |
| 6   | Tự Implement: BFS Search                       |

---

## §1. No Recursion! — "While Loop + Queue!"

> Prime: _"The thing about BFS is we don't need to use recursion. This is NOT a Padmé meme — we actually don't need it."_ 😂

```
BFS PSEUDOCODE:
═══════════════════════════════════════════════════════════════

  while q.notEmpty:
    next = q.deque()
    // do something with next!
    q.enqueue(next.left)
    q.enqueue(next.right)
```

---

## §2. The Algorithm — "Shift, Check, Push Children!"

```typescript
export default function bfs(head: BinaryNode<number>, needle: number): boolean {
  const q: (BinaryNode<number> | null)[] = [head];

  while (q.length) {
    const curr = q.shift(); // dequeue front!

    if (!curr) continue; // null node, skip!

    // Search: found the value?
    if (curr.value === needle) {
      return true; // 🎯
    }

    // Enqueue children!
    q.push(curr.left);
    q.push(curr.right);
  }

  return false; // not found!
}
```

---

## §3. Base Case — "Check at Push or at Visit!"

### Option A: check at push (avoid nulls in queue)!

```typescript
if (curr.left) q.push(curr.left);
if (curr.right) q.push(curr.right);
```

### Option B: check at visit (simpler code)!

```typescript
const curr = q.shift();
if (!curr) continue; // skip null nodes!
q.push(curr.left); // might be null — that's ok!
q.push(curr.right);
```

> Prime: _"This is where the iterative approach often becomes not as good. We could test at the push step or at the visit step."_

---

## §4. DFS vs BFS — "Which Feels Easier?"

> Prime: _"Which one do you like more, BFS or DFS?"_
> Students: _"DFS!"_
> Prime: _"The recursive one feels a bit easier to code, simpler. Iterative always tends to be more messy than recursive."_

|                | DFS (Recursive)        | BFS (Iterative)   |
| -------------- | ---------------------- | ----------------- |
| Code           | Cleaner!               | More messy!       |
| Base case      | Natural (null)         | Manual checks!    |
| Data structure | Implicit stack         | Explicit queue!   |
| Cost           | Function call overhead | Queue operations! |

---

## §5. "Can You Do Recursive BFS?" — "Stack ≠ Queue!"

> Student: _"Can we see BFS recursive?"_
> Prime: _"Could you? I'm sure there's a way. But you just wouldn't do that. Depth first uses a STACK in recursion. Queue does NOT do that. Stack preserves SHAPE — queue does not."_

---

## §6. Tự Implement: BFS Search

```javascript
// ═══ BFS — Search Implementation ═══

function bfs(head, needle) {
  const q = [head];

  while (q.length) {
    const curr = q.shift();
    if (!curr) continue;

    if (curr.value === needle) return true;

    q.push(curr.left);
    q.push(curr.right);
  }

  return false;
}

// Build tree
const tree = {
  value: 7,
  left: {
    value: 23,
    left: { value: 5, left: null, right: null },
    right: { value: 4, left: null, right: null },
  },
  right: {
    value: 8,
    left: { value: 21, left: null, right: null },
    right: { value: 15, left: null, right: null },
  },
};

console.log("═══ BFS SEARCH ═══\n");
console.log("Search 21:", bfs(tree, 21)); // true
console.log("Search 7:", bfs(tree, 7)); // true
console.log("Search 99:", bfs(tree, 99)); // false
console.log("Search 15:", bfs(tree, 15)); // true

// BFS Traversal (print all)
function bfsTraversal(head) {
  const q = [head];
  const result = [];
  while (q.length) {
    const curr = q.shift();
    if (!curr) continue;
    result.push(curr.value);
    q.push(curr.left);
    q.push(curr.right);
  }
  return result;
}

console.log("\n═══ BFS TRAVERSAL ═══");
console.log("Level-order:", bfsTraversal(tree)); // [7,23,8,5,4,21,15]

console.log("\n✅ No recursion — just while + queue!");
console.log("⚠️  Use proper Queue for O(N), Array.shift = O(N²)!");
```

---

## Checklist

```
[ ] No recursion needed — while loop + queue!
[ ] Shift from front, push children to back!
[ ] Check null: either at push or at visit!
[ ] Search: return true when value found!
[ ] Return false after exhausting queue!
[ ] DFS feels cleaner than BFS in code!
[ ] Recursive BFS = impractical (stack ≠ queue)!
TIẾP THEO → Phần 39: Search Practice — Compare Two Trees!
```
