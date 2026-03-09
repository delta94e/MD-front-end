# Front-End System Design — Phần 13: MutationObserver — "Track DOM Subtree Changes on Native Level!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: MutationObserver — "Track changes within DOM subtree. Native level = very fast vs proxy polyfill on JS level. Configure wisely: childList, attributes, characterData, subtree. Don't overuse = don't invoke callback too many times!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — DOM change detection, text editors, drawing tools!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | What Is MutationObserver? — "Track DOM Changes!"           |
| 2   | Before MutationObserver — "Proxy Polyfill = Slow!"         |
| 3   | API — "Constructor + Callback + Observe!"                  |
| 4   | Observer Options — "childList, attributes, characterData!" |
| 5   | subtree Option — "Deep vs Shallow!"                        |
| 6   | MutationRecord — "type, target, addedNodes, removedNodes!" |
| 7   | Best Practices — "Configure Right, Don't Overuse!"         |
| 8   | Infinite Recursion Warning!                                |
| 9   | Real-World Uses                                            |
| 10  | Tự Code: MutationObserver Patterns                         |

---

## §1. What Is MutationObserver? — "Track DOM Changes!"

> Evgenii: _"MutationObserver allows us to track changes within the DOM subtree. Very useful for rich text editors — select data, apply bold text, MutationObserver detects that."_

```
MUTATION OBSERVER:
═══════════════════════════════════════════════════════════════

  Tracks THREE types of DOM changes:

  1. childList:     Nodes added/removed from parent
  2. attributes:    Element attributes changed
  3. characterData: Text content typed/modified

  ┌─── Observed Subtree ─────────────────────┐
  │                                           │
  │  <div contenteditable="true">            │
  │    <p>User types here</p> ← characterData│
  │    <strong>Bold!</strong> ← childList     │
  │    class="active"         ← attributes    │
  │  </div>                                   │
  │                                           │
  │  MutationObserver detects ALL changes!    │
  └───────────────────────────────────────────┘
```

---

## §2. Before MutationObserver — "Proxy Polyfill = Slow!"

> Evgenii: _"Previously, how MutationObserver was polyfilled — creating a proxy object that tracks every mutation of any possible subtree. Implemented on JavaScript level. Large subtree = memory issues. On native level, it's very fast."_

```
POLYFILL vs NATIVE:
═══════════════════════════════════════════════════════════════

  ❌ Before (JavaScript proxy polyfill):
  • Create proxy wrapper for every DOM node
  • Track every property change manually
  • Large subtree (1000 nodes) = 1000 proxies = MEMORY!
  • All runs on main thread = SLOW!

  ✅ Now (Native MutationObserver):
  • Browser engine tracks changes internally
  • No JavaScript-level proxies needed
  • Implemented in C++/Rust (browser engine!)
  • Batched async callbacks = FAST!

  "Implemented on native level, very fast!" — Evgenii
```

---

## §3. API — "Constructor + Callback + Observe!"

```javascript
// ═══ MUTATION OBSERVER API ═══

// 1. Create observer (only callback, no config in constructor!)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // Handle each mutation
    console.log(mutation.type, mutation.target);
  }
});

// 2. Start observing (target + config!)
observer.observe(targetNode, {
  childList: true, // Track child add/remove
  attributes: true, // Track attribute changes
  characterData: true, // Track text typing
  subtree: true, // Track ALL descendants
});

// 3. Stop observing
observer.disconnect();

// 4. Get pending mutations (before disconnect)
const pending = observer.takeRecords();
```

```
API STRUCTURE:
═══════════════════════════════════════════════════════════════

  Constructor:
  new MutationObserver(callback)
  → NO config in constructor! (different from IntersectionObserver!)
  → Only callback!

  observe(target, config):
  → target: DOM node to watch
  → config: what to track (childList, attributes, etc.)

  disconnect():
  → Stop ALL observations

  takeRecords():
  → Get pending mutations (before async callback fires)
```

---

## §4. Observer Options — "childList, attributes, characterData!"

> Evgenii: _"childList:true → track direct children. attributes:true → track attribute changes. characterData:true → if text content entered via keyboard, detect changes."_

```javascript
observer.observe(target, {
  // Track child nodes added/removed
  childList: true,

  // Track attribute changes
  attributes: true,

  // Track text content typing
  characterData: true,

  // Track ALL descendants (not just direct children!)
  subtree: true,

  // Filter specific attributes (reduce callback invocations!)
  attributeFilter: ["class", "style"],

  // Store old attribute values
  attributeOldValue: true,

  // Store old text content
  characterDataOldValue: true,
});
```

```
OPTIONS EXPLAINED:
═══════════════════════════════════════════════════════════════

  childList: true
  ┌── <div> (observed) ──────────────┐
  │  <p>Existing</p>                  │
  │  <p>NEW CHILD</p> ← DETECTED!    │ ← direct child only!
  │  └── <span>Nested</span>         │ ← NOT detected (not direct!)
  └───────────────────────────────────┘

  attributes: true
  ┌── <div class="old"> ─────────────┐
  │   class changed to "new"          │ ← DETECTED!
  └───────────────────────────────────┘

  characterData: true
  ┌── <p contenteditable> ───────────┐
  │   User types: "Hello_"           │ ← DETECTED!
  └───────────────────────────────────┘

  attributeFilter: ['class']
  → Only track 'class' changes, ignore 'style', 'id' etc.
  → Reduces callback invocations! ✅
```

---

## §5. subtree Option — "Deep vs Shallow!"

> Student: _"childList applies to direct descendants, subtree would be anything?"_
> Evgenii: _"Yeah. If childList:true AND subtree:true, childList has higher priority — subtree will not work."_

```
subtree: true vs false:
═══════════════════════════════════════════════════════════════

  subtree: false (default):
  ┌── div (observed) ───────────────┐
  │  ├── p ← tracked (direct child)  │
  │  │   └── span ← NOT tracked!     │
  │  └── section ← tracked           │
  │      └── article ← NOT tracked!  │
  └───────────────────────────────────┘

  subtree: true:
  ┌── div (observed) ───────────────┐
  │  ├── p ← tracked! ✅              │
  │  │   └── span ← tracked! ✅       │
  │  └── section ← tracked! ✅        │
  │      └── article ← tracked! ✅    │
  └───────────────────────────────────┘

  ⚠️ CONFLICT: childList:true + subtree:true
  → childList has HIGHER PRIORITY!
  → subtree will NOT work!
  "There is a conflict." — Evgenii
```

---

## §6. MutationRecord — "type, target, addedNodes, removedNodes!"

> Evgenii: _"MutationRecord has type (attribute/characterData/childList), target node, addedNodes array, removedNodes array, old character data value."_

```javascript
// MutationRecord properties:
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.type; // 'attributes' | 'characterData' | 'childList'
    mutation.target; // Node that triggered mutation
    mutation.addedNodes; // NodeList of added nodes
    mutation.removedNodes; // NodeList of removed nodes
    mutation.attributeName; // Changed attribute name
    mutation.oldValue; // Old value (if configured)
  }
});
```

```
MUTATION RECORD:
═══════════════════════════════════════════════════════════════

  type: 'childList'
  ├── addedNodes: [<p>New paragraph</p>]
  ├── removedNodes: []
  └── target: <div> (parent)

  type: 'attributes'
  ├── attributeName: 'class'
  ├── oldValue: 'inactive'  (if attributeOldValue: true)
  └── target: <button> (element with changed attr)

  type: 'characterData'
  ├── oldValue: 'Hello'     (if characterDataOldValue: true)
  └── target: TextNode      (the text node that changed)
```

---

## §7. Best Practices — "Configure Right, Don't Overuse!"

> Evgenii: _"Best practice: configure observer in the right way. Don't set everything to true — this involves invoking callback too many times."_

```
BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  ❌ OVER-CONFIGURED:
  observer.observe(target, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
  });
  → Callback fires for EVERY possible change!
  → Too many invocations! 💀

  ✅ PRECISELY CONFIGURED:
  // Only track text typing:
  observer.observe(target, {
    characterData: true,
    subtree: true
  });
  → Callback fires only for text changes!
  → Minimal invocations! ✅

  ✅ FILTER ATTRIBUTES:
  observer.observe(target, {
    attributes: true,
    attributeFilter: ['class']  // Only 'class' changes!
  });
  → Ignores style, id, data-* changes!

  "TLDR: configure these options right to reduce
   possible invocations." — Evgenii
```

---

## §8. Infinite Recursion Warning!

> Student: _"Is there possibility of infinite recursion? Changing target causes mutation to fire again?"_
> Evgenii: _"Yes, you need to be careful. If you insert element and update before insertion, recursion is not happening."_

```
AVOID INFINITE RECURSION:
═══════════════════════════════════════════════════════════════

  ❌ DANGEROUS:
  observer callback fires →
    modify observed element →
      observer callback fires again! →
        modify again → INFINITE LOOP! 💀

  ✅ SAFE PATTERN 1: Disconnect before modifying
  const observer = new MutationObserver((mutations) => {
    observer.disconnect();   // Stop watching!
    modifyDOM();             // Safe to modify!
    observer.observe(target, config);  // Resume!
  });

  ✅ SAFE PATTERN 2: Check mutation type
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        // Only react to text changes, not our own insertions!
        replaceWithHeading(mutation.target);
      }
    }
  });
```

---

## §9. Real-World Uses

```
REAL-WORLD MUTATION OBSERVER:
═══════════════════════════════════════════════════════════════

  Grammarly Extension:
  → Tracks what you type (characterData)
  → Analyzes text for grammar errors
  → "Such extensions may reduce website performance
     on the callbacks" — Evgenii

  Chrome Extensions:
  → Stay in sync with page DOM changes
  → "Used in chrome extension to make sure extension
     stays in sync with rest of web page" — Student

  Google reCAPTCHA Detection:
  → Third-party API sandboxed in iframe
  → "Only way to detect that certain things were loaded
     was with mutation observer" — Student

  Notion-like Editors:
  → contenteditable + MutationObserver
  → Track every keystroke and formatting change
```

---

## §10. Tự Code: MutationObserver Patterns

```javascript
// ═══ MUTATION OBSERVER PATTERNS ═══

// Pattern 1: Text typing tracker
function trackTextChanges(element, onType) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        onType(mutation.target.textContent, mutation.oldValue);
      }
    }
  });

  observer.observe(element, {
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
  });

  return observer;
}

// Pattern 2: Attribute change tracker
function trackAttributes(element, attrs, onChange) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      onChange(
        mutation.attributeName,
        mutation.target.getAttribute(mutation.attributeName),
        mutation.oldValue,
      );
    }
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: attrs,
    attributeOldValue: true,
  });

  return observer;
}

// Pattern 3: Child list tracker (with cleanup)
function trackChildren(parent, onAdd, onRemove) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) onAdd(node);
        });
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) onRemove(node);
        });
      }
    }
  });

  observer.observe(parent, { childList: true });
  return observer;
}

// Pattern 4: Markdown line tracker (optimized!)
function trackMarkdownLine(editor) {
  let lineObserver = null;

  editor.addEventListener("click", (e) => {
    const line = e.target.closest(".line");
    if (!line) return;

    // Disconnect previous line observer
    if (lineObserver) lineObserver.disconnect();

    // Observe ONLY the selected line!
    lineObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") {
          processMarkdown(m.target.textContent);
        }
      }
    });

    lineObserver.observe(line, {
      characterData: true,
      subtree: true,
    });
  });

  // "Instead of tracking full document subtree,
  //  set up observer dynamically on specific line
  //  selected by user." — Evgenii
}

console.log("═══ MUTATION OBSERVER ═══");
console.log("Native level = fast, no JS proxy needed!");
console.log("Configure precisely = fewer callback invocations!");
console.log("Watch for infinite recursion!");
console.log("Optimize: observe only what you need!");
```

---

## Checklist

```
[ ] MutationObserver tracks DOM subtree changes!
[ ] Native level = massively faster than JS proxy polyfill!
[ ] Constructor takes ONLY callback (no config!)
[ ] observe(target, config) → config specifies WHAT to track!
[ ] childList: direct children add/remove!
[ ] attributes: attribute changes (filter with attributeFilter!)
[ ] characterData: text typing/editing!
[ ] subtree: ALL descendants (deep tracking!)
[ ] childList + subtree conflict: childList has priority!
[ ] Configure precisely → reduce callback invocations!
[ ] Watch for infinite recursion when modifying observed tree!
[ ] Optimize: observe specific line, not full document!
TIẾP THEO → Phần 14: MutationObserver Exercise!
```
