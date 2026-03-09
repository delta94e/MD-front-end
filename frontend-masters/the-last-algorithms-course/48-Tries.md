# The Last Algorithms Course You'll Need — Phần 48: Tries — "Retrieval Tree, Autocomplete, O(1) Lookup, Prefix Tree!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Tries — "Trie = retrieval tree, autocomplete/caching, 26 children (English), isWord flag, DFS for results, O(1) bounded lookup, insertion/deletion, Falkor at Netflix!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — trie data structure, autocomplete, prefix searching, interview favorite!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | "Just Say Priority Queue... or Trie!" — Interview Gold!   |
| 2   | What Is a Trie? — "Retrieval Tree, Prefix Tree!"          |
| 3   | Building a Trie — "cat, cats, cattle, card!"              |
| 4   | Node Structure — "isWord + 26 Children!"                  |
| 5   | Autocomplete — "DFS from Prefix, Alphabetical Order!"     |
| 6   | Insertion — "Simple Iterative Loop!"                      |
| 7   | Deletion — "Post-Order Recursion, Delete Back Up!"        |
| 8   | charCodeAt Trick — "ASCII Index Math!"                    |
| 9   | Running Time — "O(1)? O(Height)? Bounded by Word Length!" |
| 10  | Falkor at Netflix — "Trie for Caching!"                   |
| 11  | Tự Implement: Trie with Autocomplete                      |

---

## §1. "Just Say Priority Queue... or Trie!" — Interview Gold!

> Prime: _"I have been in at least ONE interview where a trie tree is the answer. This comes up as autocomplete or caching."_

---

## §2. What Is a Trie? — "Retrieval Tree, Prefix Tree!"

> Prime: _"It should be pronounced TREE because it's named after a retrieval tree. But a tree tree doesn't sound good, so we call it a trie."_ 😂

| Name         | Why                 |
| ------------ | ------------------- |
| Trie         | From re**TRIE**val! |
| Prefix tree  | Search by prefix!   |
| Digital tree | ...sounds weird!    |

---

## §3. Building a Trie — "cat, cats, cattle, card!"

```
BUILDING A TRIE:
═══════════════════════════════════════════════════════════════

  Insert "cat":
        (root)
         |
        [c]
         |
        [a]
         |
        [t] ★ (isWord = true!)

  Insert "cats":
        (root)
         |
        [c]
         |
        [a]
         |
        [t] ★
         |
        [s] ★

  Insert "cattle":
        (root)
         |
        [c]
         |
        [a]
         |
        [t] ★
        / \
      [s]★ [t]
            |
           [l]
            |
           [e] ★

  Insert "card":
           (root)
            |
           [c]
            |
           [a]
          /   \
        [t] ★  [r]
        / \      \
      [s]★ [t]   [d] ★
            |
           [l]
            |
           [e] ★

  Words: cat ★, cats ★, cattle ★, card ★
```

---

## §4. Node Structure — "isWord + 26 Children!"

> Prime: _"Two methods for marking a word: asterisk child or isWord boolean. I prefer isWord — stronger signal than implicit."_

```
TRIE NODE:
═══════════════════════════════════════════════════════════════

  {
    isWord: boolean,        // is this the end of a word?
    children: Node[26]      // 26 slots for a-z!
  }

  children[0] = 'a'
  children[1] = 'b'
  children[2] = 'c'   ← index 2!
  ...
  children[25] = 'z'
```

---

## §5. Autocomplete — "DFS from Prefix, Alphabetical Order!"

> Prime: _"If someone types C, we go to the C branch and do a DEPTH FIRST SEARCH. Pre-order traversal gives us alphabetical ordering!"_

```
AUTOCOMPLETE "c":
═══════════════════════════════════════════════════════════════

  1. Go to 'c' branch!
  2. DFS (pre-order) from there!
  3. When we hit isWord → add to results!

  Traversal order:
  c → a → r → d ★ (card!)
       → t ★ (cat!)
         → s ★ (cats!)
         → t → l → e ★ (cattle!)

  Results: ["card", "cat", "cats", "cattle"]
  → Alphabetical! ✅
```

---

## §6. Insertion — "Simple Iterative Loop!"

```
INSERTION PSEUDOCODE:
═══════════════════════════════════════════════════════════════

  insert(str):
    curr = head
    for c in str:
      if curr has child[c]:
        curr = child[c]     // follow existing path!
      else:
        node = createNode() // create new node!
        curr.child[c] = node
        curr = node
    curr.isWord = true      // mark end of word!
```

---

## §7. Deletion — "Post-Order Recursion, Delete Back Up!"

> Prime: _"Easier to use recursion for deletion — POST operation. Get to the node, then delete your way BACK UP."_

```
DELETION — POST-ORDER:
═══════════════════════════════════════════════════════════════

  ❌ WRONG: Delete before you go → whole subtree gone!
  ✅ RIGHT: Go all the way down, delete on the way BACK UP!

  delete "cat":
  Go: root → c → a → t (found!)
  Unmark: t.isWord = false!
  Back up: does t have children? YES (s, t) → KEEP t!
  → Only unmark, don't delete the node!

  delete "cattle":
  Go: root → c → a → t → t → l → e (found!)
  Unmark: e.isWord = false!
  Back up: e has no children → DELETE e!
  Back up: l has no children → DELETE l!
  Back up: t (second) has no children → DELETE t!
  Back up: t (first) has children (s) → STOP!

  "Only delete if you're the only link left!" — Prime
```

---

## §8. charCodeAt Trick — "ASCII Index Math!"

> Prime: _"Here's a fun little thing for those who haven't done a lot of C programming."_

```javascript
const ZERO = "a".charCodeAt(0); // 97!

function idx(char) {
  return char.charCodeAt(0) - ZERO;
}

idx("a"); // 0
idx("c"); // 2
idx("z"); // 25
```

---

## §9. Running Time — "O(1)? O(Height)? Bounded by Word Length!"

> Student: _"You said O(1) — the longest English word bounds the height?"_
> Prime: _"Yes! N is NOT the string — it's the number of nodes. As we add more words, does lookup time change? No! It's bounded by max word length."_

| Operation    | Time                                   |
| ------------ | -------------------------------------- |
| Lookup       | O(H) where H ≤ max word length → O(1)! |
| Insert       | O(H) → O(1) bounded!                   |
| Delete       | O(H) → O(1) bounded!                   |
| Autocomplete | O(H + results) — find prefix + DFS!    |

---

## §10. Falkor at Netflix — "Trie for Caching!"

> Prime: _"Falkor is effectively just a trie. The path: videos → id → title. Each branch varies. Does this id exist? Does title exist? That's your cache."_

```
FALKOR CACHE (trie-like):
═══════════════════════════════════════════════════════════════

  root
   └── videos
        ├── 123
        │    ├── title → "Stranger Things"
        │    └── rating → 4.5
        ├── 456
        │    └── title → "The Crown"
        └── 789
             └── title → "Black Mirror"
```

---

## §11. Tự Implement: Trie with Autocomplete

```javascript
// ═══ TRIE — Retrieval Tree ═══

const ZERO = "a".charCodeAt(0);

class TrieNode {
  constructor() {
    this.isWord = false;
    this.children = new Array(26).fill(null);
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a word!
  insert(word) {
    let curr = this.root;
    for (const ch of word.toLowerCase()) {
      const idx = ch.charCodeAt(0) - ZERO;
      if (!curr.children[idx]) {
        curr.children[idx] = new TrieNode();
      }
      curr = curr.children[idx];
    }
    curr.isWord = true;
  }

  // Search for exact word!
  search(word) {
    let curr = this.root;
    for (const ch of word.toLowerCase()) {
      const idx = ch.charCodeAt(0) - ZERO;
      if (!curr.children[idx]) return false;
      curr = curr.children[idx];
    }
    return curr.isWord;
  }

  // Starts with prefix?
  startsWith(prefix) {
    let curr = this.root;
    for (const ch of prefix.toLowerCase()) {
      const idx = ch.charCodeAt(0) - ZERO;
      if (!curr.children[idx]) return false;
      curr = curr.children[idx];
    }
    return true;
  }

  // Autocomplete: DFS from prefix!
  autocomplete(prefix) {
    let curr = this.root;
    for (const ch of prefix.toLowerCase()) {
      const idx = ch.charCodeAt(0) - ZERO;
      if (!curr.children[idx]) return [];
      curr = curr.children[idx];
    }

    const results = [];
    this.#dfs(curr, prefix, results);
    return results;
  }

  // DFS: pre-order → alphabetical!
  #dfs(node, path, results) {
    if (node.isWord) results.push(path);

    for (let i = 0; i < 26; i++) {
      if (node.children[i]) {
        const ch = String.fromCharCode(ZERO + i);
        this.#dfs(node.children[i], path + ch, results);
      }
    }
  }

  // Delete a word!
  delete(word) {
    this.#deleteHelper(this.root, word.toLowerCase(), 0);
  }

  #deleteHelper(node, word, depth) {
    if (!node) return false;

    if (depth === word.length) {
      if (!node.isWord) return false;
      node.isWord = false;
      return this.#isEmpty(node);
    }

    const idx = word.charCodeAt(depth) - ZERO;
    const shouldDelete = this.#deleteHelper(
      node.children[idx],
      word,
      depth + 1,
    );

    if (shouldDelete) {
      node.children[idx] = null; // post-order delete!
      return !node.isWord && this.#isEmpty(node);
    }

    return false;
  }

  #isEmpty(node) {
    return node.children.every((c) => c === null);
  }
}

// Demo!
console.log("═══ TRIE — AUTOCOMPLETE ═══\n");

const trie = new Trie();
["cat", "cats", "cattle", "card", "car", "marc"].forEach((w) => trie.insert(w));

console.log("search('cat'):", trie.search("cat")); // true
console.log("search('ca'):", trie.search("ca")); // false
console.log("startsWith('ca'):", trie.startsWith("ca")); // true

console.log("\nautocomplete('ca'):", trie.autocomplete("ca"));
// ["car", "card", "cat", "cats", "cattle"] — alphabetical!

console.log("autocomplete('cat'):", trie.autocomplete("cat"));
// ["cat", "cats", "cattle"]

console.log("autocomplete('m'):", trie.autocomplete("m"));
// ["marc"]

trie.delete("cat");
console.log("\nAfter delete 'cat':");
console.log("search('cat'):", trie.search("cat")); // false
console.log("search('cats'):", trie.search("cats")); // true (preserved!)

console.log("\n✅ DFS pre-order → alphabetical results!");
console.log("✅ O(1) bounded by max word length!");
console.log("✅ 'Just say trie in an interview' — Prime");
```

---

## Checklist

```
[ ] Trie = retrieval tree = prefix tree!
[ ] Node: isWord boolean + children[26] array!
[ ] Insert: walk path, create nodes, mark isWord!
[ ] Search: walk path, check isWord at end!
[ ] Autocomplete: find prefix node, DFS pre-order!
[ ] DFS pre-order → alphabetical results!
[ ] Delete: post-order recursion, delete back up!
[ ] charCodeAt trick: ch.charCodeAt(0) - 97 = index!
[ ] O(Height) but H bounded by max word length → O(1)!
[ ] Interview: autocomplete or caching problem = TRIE!
TIẾP THEO → Phần 49: Graphs (coming soon!)
```
