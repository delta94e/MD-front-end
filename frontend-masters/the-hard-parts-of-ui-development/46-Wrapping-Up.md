# The Hard Parts of UI Development — Phần 46: Wrapping Up — "Single Source of Truth, Composition, Reconciliation! 🎓"

> 📅 2026-03-08 · ⏱ 10 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Wrapping Up — "Will's final summary: single source of truth, data propagation, UI composition, hooks, DOM reconciliation!"
> 🎓 **BÀI CUỐI CÙNG CỦA KHOÁ HỌC!**

---

## §1. Single Source of Truth — "Restrictive But Desperately Predictable!"

> Will: _"In a world in which there could be MULTIPLE sources of truth — HTML, DOM that tracked user input automatically, CSS Object Model — instead, ONE source of truth for our data."_

### Từ nhiều nguồn → một nguồn duy nhất!

Will: _"Everything the user sees stems from data in JavaScript. It's RESTRICTIVE but desperately PREDICTABLE, and enables data propagation to the view."_

_"We are able to make a change to data, and having described ONE TIME how the view will look based on that data — don't even have to do anything, it's just gonna PROPAGATE through to the view."_

```
SINGLE SOURCE OF TRUTH:
═══════════════════════════════════════════════════════════════

  ❌ BEFORE (multiple sources!):
  ┌──────────────────────────────────────────────────────────┐
  │ HTML → says "div on, input on"                         │
  │ DOM → tracks user input automatically                  │
  │ CSSOM → styling state                                  │
  │ JavaScript → data                                       │
  │ → WHO is the truth? 😤                                 │
  └──────────────────────────────────────────────────────────┘

  ✅ AFTER (one source!):
  ┌──────────────────────────────────────────────────────────┐
  │ JavaScript DATA = the ONLY truth! 🎯                   │
  │ → Everything user sees stems from JS data!             │
  │ → "Restrictive but desperately PREDICTABLE!" — Will    │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. UI Composition — "Semi-Visual Coding!"

> Will: _"A JavaScript DOM enables a SEMI-VISUAL form of coding our UIs — units of code that describe units of view can be positioned in the code to indicate where they're gonna appear on the web page."_

### Code looks like what it produces!

Will: _"We could move our div 'great job' ABOVE — and it would literally appear ABOVE on the web page. Makes reasoning about our state, our view, MUCH easier."_

_"React: functions producing units of code that describe units of view with associated data."_

---

## §3. The Downside — "Easy to Reason, Hard to Optimize!"

> Will: _"The downside: data generates view IN FULL. Are you ready to figure out the change? We don't have to — here's the description ONE TIME, do it again."_

### Full rebuild = easy but wasteful!

Will: _"However, requires SIGNIFICANT moves by us to improve efficiency."_

Two improvements:

1. **Hooks** — only run updateDOM when data actually changes!
2. **VDOM Diffing** — only update DOM elements that actually changed!

---

## §4. DOM Reconciliation — "That's It, People!"

> Will: _"If we rebuilt the DOM every time data changed — entirely unnecessary. If every 15 milliseconds — entirely unnecessary. Instead, we spot ACTUAL differences and only change those — known as DOM RECONCILIATION."_

### DOM Reconciliation = diffing!

Will: _"That's it, people."_ [APPLAUSE] 🎉

_"Thank you so much everybody — thank you for all your incredible, incredible, incredible hard work."_

```
COURSE SUMMARY:
═══════════════════════════════════════════════════════════════

  1. SINGLE SOURCE OF TRUTH
     → All data in JavaScript!
     → One-way data binding!

  2. DATA PROPAGATION
     → Change data → view auto-updates!
     → "Don't even have to do anything!" — Will

  3. UI COMPOSITION
     → Semi-visual coding in JavaScript!
     → Functional components (Post, Input)!
     → Move code = move view!

  4. EFFICIENCY
     → State Hooks: only update when data changes!
     → VDOM Diffing: only change what actually changed!
     → = DOM RECONCILIATION! 🎯

  "That's it, people." — Will 🎓 [APPLAUSE] 🎉
```

---

## 🎓 Khoá Học Hoàn Thành!

```
THE HARD PARTS OF UI DEVELOPMENT — COMPLETE!
═══════════════════════════════════════════════════════════════

  46 Parts | From HTML to DOM Reconciliation!

  Part 1-10:   HTML → C++ DOM → JavaScript → Display!
  Part 11-17:  User Interaction → Data Change!
  Part 18-22:  One-Way Data Binding → Predictability!
  Part 23-25:  setInterval → Auto-Updating Views!
  Part 26-29:  UI Components → Reusability!
  Part 30-35:  Virtual DOM → Composition → map + spread!
  Part 36-38:  Event API → Functional Components!
  Part 39-40:  State Hooks → Efficiency!
  Part 41-45:  Diffing → DOM Reconciliation!
  Part 46:     Wrapping Up! 🎓

  "Thank you for all your incredible,
   incredible, incredible hard work!" — Will Sentance 🎉
```
