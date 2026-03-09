# The Last Algorithms Course You'll Need — Phần 57: LRU Cache — "HashMap + Doubly Linked List, O(1) Everything, Superstructure!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: LRU Cache — "Least Recently Used, HashMap for O(1) lookup + Doubly Linked List for O(1) reorder, composing data structures, evict tail, move-to-front = 7 operations, Netflix implementation!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core — LRU cache, composing data structures, HashMap + LinkedList!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | What Is LRU? — "Least Recently Used, Evict the Oldest!"     |
| 2   | Why Doubly Linked List? — "Move to Front, Evict from Tail!" |
| 3   | Why HashMap? — "O(1) Jump to Any Node!"                     |
| 4   | The Superstructure — "HashMap + Doubly Linked List!"        |
| 5   | 7 Operations — "Break, Remove, Prepend!"                    |
| 6   | Eviction — "Over Capacity → Remove Tail!"                   |
| 7   | Running Time — "O(1) Everything!"                           |
| 8   | Netflix Story — "Rx Interview + LRU on TV Platform!"        |

---

## §1. What Is LRU? — "Least Recently Used, Evict the Oldest!"

> Prime: _"An LRU is a caching mechanism that says we will evict the LEAST RECENTLY USED item."_

```
LRU CACHE (capacity=4):
═══════════════════════════════════════════════════════════════

  head                                      tail
   ↓                                         ↓
  [V2] ↔ [V0] ↔ [V1] ↔ [V3]
  most recently              least recently
  used                       used (evict this!)

  Get V1 → move V1 to front:
  [V1] ↔ [V2] ↔ [V0] ↔ [V3]
   ↑ now most recently used!
```

---

## §2. Why Doubly Linked List? — "Move to Front, Evict from Tail!"

```
LINKED LIST OPERATIONS:
═══════════════════════════════════════════════════════════════

  Get value 2:
  Before: [V0] ↔ [V1] ↔ [V2] ↔ [V3]

  1. Break V2 out:
     [V0] ↔ [V1] ↔ [V3]    +  [V2]

  2. Prepend V2:
     [V2] ↔ [V0] ↔ [V1] ↔ [V3]

  Evict (over capacity):
     Remove tail [V3]!
     [V2] ↔ [V0] ↔ [V1]
```

---

## §3. Why HashMap? — "O(1) Jump to Any Node!"

> Prime: _"How did I ask for value 2? I need some way to look it up QUICKLY. HashMap! The value in the map IS the node in the linked list."_

```
HASHMAP VALUE = LINKED LIST NODE:
═══════════════════════════════════════════════════════════════

  HashMap:
  "key1" → Node{value, prev, next}   ← points INTO list!
  "key2" → Node{value, prev, next}
  "key3" → Node{value, prev, next}

  Linked List:
  [Node1] ↔ [Node2] ↔ [Node3]

  "The map lets us JUMP to any node in O(1).
   Then we break it out + prepend in O(1).
   COMPOSING data structures!" — Prime
```

---

## §4. The Superstructure — "HashMap + Doubly Linked List!"

```
LRU = MAP + LIST:
═══════════════════════════════════════════════════════════════

  ┌─────────── HashMap ───────────┐
  │  "a" → ┐                     │
  │  "b" → ┤   Points to nodes   │
  │  "c" → ┘   in linked list!   │
  └───────────────────────────────┘
              ↓   ↓   ↓
  HEAD ↔ [NodeA] ↔ [NodeB] ↔ [NodeC] ↔ TAIL
  most                              least
  recent                            recent
```

---

## §5. 7 Operations — "Break, Remove, Prepend!"

> Prime: _"7 O(1) operations total!"_

```
BREAK OUT (4 ops):
═══════════════════════════════════════════════════════════════

  1. prev.next = node.next       ← skip over us!
  2. next.prev = node.prev       ← skip back over us!
  3. node.next = undefined       ← clean up!
  4. node.prev = undefined       ← clean up!

PREPEND (3 ops):
═══════════════════════════════════════════════════════════════

  5. node.next = head            ← point to old head!
  6. head.prev = node            ← old head points back!
  7. head = node                 ← we're the new head!

  Total: 7 × O(1) = O(1)! ✅
```

---

## §6. Eviction — "Over Capacity → Remove Tail!"

```
EVICTION:
═══════════════════════════════════════════════════════════════

  Capacity: 3
  Current: [A] ↔ [B] ↔ [C]   (full!)

  Insert D:
  1. Remove tail (C): [A] ↔ [B]
  2. Delete "c" from HashMap!
  3. Prepend D: [D] ↔ [A] ↔ [B]
  4. Add "d" → NodeD to HashMap!

  "Tail is ALWAYS the least recently used!" — Prime
```

---

## §7. Running Time — "O(1) Everything!"

| Operation | Time                                              |
| --------- | ------------------------------------------------- |
| Get       | O(1) — map lookup + move to front!                |
| Update    | O(1) — map lookup + update value + move to front! |
| Insert    | O(1) — create node + prepend + map.set!           |
| Evict     | O(1) — remove tail + map.delete!                  |

---

## §8. Netflix Story — "Rx Interview + LRU on TV Platform!"

> Prime: _"I put Rx on my resume, didn't know it, convinced the interviewer to give me the answer through questions. He said I was the BEST Rx candidate."_ 😂
>
> _"At Netflix I implemented an LRU that ran for years on the TV platform, website, and briefly on mobile."_

---

## Checklist

```
[ ] LRU = Least Recently Used cache!
[ ] Evict the TAIL (oldest unused item!)
[ ] HashMap: O(1) lookup by key → node!
[ ] Doubly Linked List: O(1) move-to-front + remove!
[ ] Map value = linked list node (composing!)
[ ] Get: lookup → move to front → return value!
[ ] Update: lookup → update value → move to front!
[ ] Insert: check capacity → evict if full → prepend!
[ ] 7 O(1) operations for break+prepend!
[ ] "We are now COMPOSING data structures" — Prime
TIẾP THEO → Phần 58: LRU Cache Setup!
```
