# The Last Algorithms Course You'll Need — Phần 32: Linked List Q&A — "Vim, Remove Undefined, Java vs TypeScript!"

> 📅 2026-03-09 · ⏱ 10 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linked List Q&A — "Vim usage, remove(undefined) safety, comparing container value not node, why Java interface in TypeScript!"
> Độ khó: ⭐️⭐️ | Q&A — edge cases, implementation choices, language selection!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | "Are You Using Vim?" — "It's My Entire Online Shtick!" |
| 2   | Q: "Remove Undefined?" — "Comparing Container VALUE!"  |
| 3   | Q: "Why Java Interface in TypeScript?"                 |
| 4   | InsertAt Bug Fix — "node.prev.next = node!"            |

---

## §1. "Are You Using Vim?" — "It's My Entire Online Shtick!"

> Student: _"Are you using Vim?"_
> Prime: _"I ALWAYS use Vim. It's literally my entire online shtick. There's word that George Hotz is faster than me. One day we'll have a competition."_

---

## §2. Q: "Remove Undefined?" — "Comparing Container VALUE!"

> Student: _"If you do remove(undefined) and current is undefined, will everything blow up?"_

### Prime's answer!

_"One — you'd be breaking the contract which you did. The response is to ignore, which we all know when you do that you have to go work at Facebook for a year."_ 😂

_"Second — it's the CONTAINER NODE's value that we're comparing. curr.value would have to equal undefined. Which means current DOES exist, which means it could be removed."_

```
SAFETY:
═══════════════════════════════════════════════════════════════

  list.remove(undefined):

  Walk: curr.value === undefined?
  If a node was inserted with undefined value → YES!
  That node EXISTS → can be removed safely!

  We compare the VALUE, not the NODE itself!
  The container always exists if we're comparing!
```

---

## §3. Q: "Why Java Interface in TypeScript?"

> Student: _"Is there a specific reason you chose Java or JavaScript?"_

### Prime's answer!

- **Java interface**: fairly complete language, easy to show CS topics, safer!
- **TypeScript**: most accessible language right now!
- **C**: _"Obviously the best because raw memory is raw memory and you tell it what it is and that's what it is."_

---

## §4. InsertAt Bug Fix — "node.prev.next = node!"

> Student spots a bug on line 17!

Prime: _"You're right! It should be node.prev.next = node, not curr.prev.next = node. Node's previous — which IS current's previous — that previous's next needs to point to the node. Good eye, I can't believe you spotted that!"_

```typescript
// WRONG:
curr.prev.next = curr; // ❌ points back to curr!

// CORRECT:
node.prev.next = node; // ✅ points to new node!
// (node.prev IS curr.prev — same reference!)
```

---

## Checklist

```
[ ] Comparing container VALUE, not the node itself!
[ ] remove(undefined) safe if value was inserted as undefined!
[ ] InsertAt: node.prev.next = node (not curr)!
[ ] Java interface for CS completeness, TypeScript for accessibility!
[ ] "I can't believe you spotted that one" — Prime
TIẾP THEO → Phần 33: Trees (coming soon!)
```
