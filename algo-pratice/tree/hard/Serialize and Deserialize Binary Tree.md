# 💾 Serialize and Deserialize Binary Tree — LeetCode #297 (Hard)

> 📖 Code: [Serialize and Deserialize Binary Tree.js](./Serialize%20and%20Deserialize%20Binary%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"Preorder + null markers. Serialize: DFS ghi val/null. Deserialize: global index consume từng phần tử."*

> 🎙️ *"Design algorithms to serialize a binary tree to a string and deserialize it back. The output must be a VALID representation that can reconstruct the EXACT same tree."*

---

## E — Examples

```
     1
    / \           Serialize: "1,2,null,null,3,4,null,null,5,null,null"
   2   3
      / \
     4   5

  Preorder: visit 1, visit 2, null(left of 2), null(right of 2),
            visit 3, visit 4, null, null, visit 5, null, null
```

---

## A — Approach

> 🎙️ *"I use PREORDER traversal with NULL MARKERS.*
>
> ***Serialize**: DFS preorder. For each node, record its value. For null, record 'null'. Join with commas.*
>
> ***Deserialize**: Split string by commas. Use a global index `i` to consume values one by one. Each call reads the current value, makes a node, then recursively builds left and right subtrees. 'null' signals subtree end.*
>
> *Why preorder? Because root is FIRST — I know immediately what the root is, making deserialization trivial."*

```
WHY PREORDER + NULL MARKERS?

  Preorder alone (no nulls): [1, 2, 3, 4, 5]
  → Can't tell where left subtree ends and right begins!
  
  Preorder WITH nulls: [1, 2, null, null, 3, 4, null, null, 5, null, null]
  → null tells me: "this subtree is empty, go back up!"
  → I know EXACTLY when to stop going left and start going right!
```

---

## C — Code

### Serialize

```javascript
function serialize(root) {
  const result = [];
  function dfs(node) {
    if (!node) {
      result.push("null");
      return;
    }
    result.push(String(node.val));  // visit ROOT first (preorder!)
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result.join(",");
}
```

### Deserialize

```javascript
function deserialize(data) {
  const vals = data.split(",");
  let i = 0;                    // GLOBAL INDEX!
  
  function build() {
    if (vals[i] === "null") {
      i++;                       // consume the null
      return null;
    }
    const node = new TreeNode(Number(vals[i]));
    i++;                         // consume the value
    node.left = build();         // next values = left subtree!
    node.right = build();        // then right subtree!
    return node;
  }
  
  return build();
}
```

> 🎙️ *"The global index `i` is CRITICAL. Each call to build() consumes the current value and advances i. The recursive structure automatically handles the nesting — left subtree consumes all its values before right subtree starts."*

🧠 *"⚠️ Common mistake: using local index or passing index as parameter (need to return updated index!). Global index is simplest."*

### Trace Deserialize:

```
"1,2,null,null,3,4,null,null,5,null,null"

i=0:  val="1"    → node(1), left=build(), right=build()
i=1:  val="2"    → node(2), left=build(), right=build()
i=2:  val="null" → return null (left of 2)
i=3:  val="null" → return null (right of 2)
      → node(2) complete! Return to node(1).right
i=4:  val="3"    → node(3), left=build(), right=build()
i=5:  val="4"    → node(4), left=build(), right=build()
i=6:  val="null" → return null
i=7:  val="null" → return null
      → node(4) complete!
i=8:  val="5"    → node(5), left=build(), right=build()
i=9:  val="null" → return null
i=10: val="null" → return null
      → node(5) complete!
      → node(3) complete!
      → node(1) complete!

Result:  1(2, 3(4, 5)) ✅
```

---

## O — Optimize

```
Time:  O(n) both serialize and deserialize
Space: O(n) for the string representation
```

---

## 🗣️ Interview Script

> 🎙️ *"Preorder with null markers. Serialize: DFS, record values and 'null' for empty. Deserialize: global index, each build() consumes current value and recurses. Null markers indicate subtree boundaries. O(n) time."*

### Follow-up

**Q: "Why not BFS/level-order?"**

> 🎙️ *"BFS also works — LeetCode's own tree format uses level-order. But DFS is simpler to code: no queue management, no index calculations for children (2i+1, 2i+2). Both are O(n)."*

**Q: "What about BST? Can you do without null markers?"**

> 🎙️ *"For BSTs, yes! I can use preorder WITHOUT null markers + upper/lower bounds. Each value tells me which subtree it belongs to. That's LeetCode #449 — more space-efficient."*
