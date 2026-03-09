# The Last Algorithms Course You'll Need — Phần 56: Maps — "HashMap, Hashing, Collision, Load Factor, O(1) Lookup!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Maps — "HashMap = key→hash→index→bucket, consistent hash, load factor 0.7, collision (linear probing vs chaining), resize/rehash, O(1) amortized, V8 probably did it right!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — hash maps, hashing, collisions, load factor, resize!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | "Just Use a HashMap!" — Interview Meme!              |
| 2   | Terms — Load Factor, Key, Value, Collision!          |
| 3   | How It Works — "Key → Hash → Modulo → Bucket!"       |
| 4   | Consistent Hash — "Same Key = Same Output, Always!"  |
| 5   | Collision — "Two Keys, Same Bucket!"                 |
| 6   | Collision Resolution — "Linear Probing vs Chaining!" |
| 7   | Load Factor — "0.7 = Resize Time!"                   |
| 8   | JavaScript Limitation — "Can't Hash Objects!"        |
| 9   | Why O(1)? — "Bounded Key + Good Hash!"               |

---

## §1. "Just Use a HashMap!" — Interview Meme!

> Prime: _"Joma Tech even did a short — prepares for interview for a month, the answer is always HashMap."_ 😂

---

## §2. Terms — Load Factor, Key, Value, Collision!

| Term            | Meaning                                       |
| --------------- | --------------------------------------------- |
| **Load factor** | data points ÷ storage size (e.g., 7/10 = 0.7) |
| **Key**         | The hashable thing used to access value!      |
| **Value**       | The thing associated with the key!            |
| **Collision**   | Two keys map to the same cell!                |

---

## §3. How It Works — "Key → Hash → Modulo → Bucket!"

```
HASH MAP FLOW:
═══════════════════════════════════════════════════════════════

  key("hello") → hash(key) → 98274 → 98274 % 10 → 4
                                                    ↓
  Storage: [_, _, _, _, {k,v}, _, _, _, _, _]
                        ↑ index 4!

  key("world") → hash(key) → 77391 → 77391 % 10 → 1
                                                    ↓
  Storage: [_, {k,v}, _, _, {k,v}, _, _, _, _, _]
               ↑ index 1!
```

---

## §4. Consistent Hash — "Same Key = Same Output, Always!"

> Prime: _"A consistent hash means: when I give key 'foo', it ALWAYS gives me the same answer. If it doesn't, that's an inconsistent hash — what is it good for? Absolutely nothing."_ 🎵

---

## §5. Collision — "Two Keys, Same Bucket!"

```
COLLISION:
═══════════════════════════════════════════════════════════════

  hash("foo") % 10 = 4
  hash("bar") % 10 = 4  ← same bucket! COLLISION!

  With 10 slots and uniform distribution:
  → 1/10 = 10% chance of collision per insert!

  "More items → more collisions → worse performance!" — Prime
```

---

## §6. Collision Resolution — "Linear Probing vs Chaining!"

### Old: Linear/Exponential Probing

```
LINEAR PROBING:
═══════════════════════════════════════════════════════════════

  Bucket 4 full → try bucket 5 → try bucket 6...
  Store key WITH value (for retrieval!)
  Problem: fills up fast, clustering!
```

### Modern: Chaining (LinkedList/ArrayList)

```
CHAINING:
═══════════════════════════════════════════════════════════════

  Each bucket is a list!

  Bucket 4: [{key:"foo",val:1}, {key:"bar",val:2}]

  Retrieval: go to bucket, walk list, match key!
  "We store the KEY with the value so we can compare!" — Prime
```

---

## §7. Load Factor — "0.7 = Resize Time!"

> Prime: _"Ideal load factor is 0.7. Once exceeded, we rehash — iterate all keys, hash into larger storage, cutting load factor by half."_

```
RESIZE:
═══════════════════════════════════════════════════════════════

  Before: 10 slots, 7 items, LF = 0.7 → RESIZE!
  After:  20 slots, 7 items, LF = 0.35 ← much better!

  Must rehash ALL keys (hash % newSize ≠ hash % oldSize!)
```

---

## §8. JavaScript Limitation — "Can't Hash Objects!"

> Prime: _"In Java you can call getHashID(). In JavaScript, you can't uniquely identify objects. Two objects with identical properties = same hash. You're stuck."_

---

## §9. Why O(1)? — "Bounded Key + Good Hash!"

```
WHY O(1):
═══════════════════════════════════════════════════════════════

  1. Hashing = O(1) (key has bounded length!)
  2. Modulo = O(1)
  3. Bucket access = O(1) (array index!)
  4. List walk = O(1) (good hash → ~1 item per bucket!)

  Bad hash → all keys in ONE bucket → O(N)! 💀

  "Someone found all keys mapped to one bucket.
   A simple change improved speed enormously." — Prime
```

---

## Checklist

```
[ ] HashMap: key → hash → modulo → bucket → value!
[ ] Consistent hash: same input = same output, always!
[ ] Collision: two keys, same bucket!
[ ] Linear probing (old) vs chaining (modern)!
[ ] Store key WITH value (for matching on retrieval!)
[ ] Load factor: ideal = 0.7, exceed → resize + rehash!
[ ] O(1) assumes good hash + bounded key length!
[ ] Bad hash can degrade to O(N)!
[ ] JS can't uniquely hash objects (no getHashID)!
TIẾP THEO → Phần 57: LRU Cache!
```
