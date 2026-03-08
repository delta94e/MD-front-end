# JavaScript: The Hard Parts v2 — Phần 6.1: Object-Oriented JavaScript — Paradigm Introduction!

> 📅 2026-03-07 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: JavaScript: The Hard Parts, v2
> Bài: Object-Oriented JavaScript — Why OOP? Data + Functionality Together!
> Độ khó: ⭐️⭐️⭐️ | "Easy to Reason About, Efficient, Easy to Extend!"

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | OOP Overview — "Enormously Popular Paradigm!"      |
| 2   | Core of Development — Save Data + Do Stuff To It   |
| 3   | Why Is Development So Hard? — 100,000 Lines!       |
| 4   | 3 Goals In Tension — Reason, Extend, Perform!      |
| 5   | Objects = Data + Functionality Together!           |
| 6   | OOP vs FP — "Rival Competing Paradigms!"           |
| 7   | Quiz Game Setup — User1 + User2                    |
| 8   | Tự Implement: Object-Based User System             |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu |

---

## §1. OOP Overview — "Enormously Popular Paradigm!"

### 1.1 Bài Viết: Why OOP Matters In 2024

> Will: _"Classes, prototypes, object-oriented JavaScript — ENORMOUSLY popular paradigm for structuring our complex code. React USED to center around the OOP paradigm. Increasingly the functional style has become more typical in React, but this remains a powerful and significant paradigm."_

```
OOP IN JAVASCRIPT — BIG PICTURE:
═══════════════════════════════════════════════════════════════

  Will's ROADMAP for Part 6:

  ① PROTOTYPE CHAIN
  → Behind the scenes mechanism!
  → "Actually a pretty LEGIT tool in its own right!"
  → Enables OOP emulation!

  ② __proto__ vs .prototype
  → HIDDEN prototype property (on every object!)
  → Prototype OBJECT (on every function!)
  → "Undo a LOT of confusion!"

  ③ new KEYWORD
  → Automate object creation!
  → Automate prototype linking!

  ④ class KEYWORD
  → Syntactic sugar over prototype chain!
  → Emulate traditional OOP!

  ⑤ static, private, public FIELDS (NEW!)
  → "Added in the last couple of years!"
  → "Really exciting way of extending!"
  → Full OOP emulation possible now!

  IMPORTANT CONTEXT:
  ┌──────────────────────────────────────────────────┐
  │ Unlike other languages where OOP is NATIVELY     │
  │ implemented, in JavaScript it all sits ON TOP    │
  │ of the PROTOTYPE CHAIN — a quite different way   │
  │ of thinking about objects!                       │
  │                                                  │
  │ Will: "Behind the scenes, it's going to enable   │
  │ us to EMULATE OOP but actually is a pretty       │
  │ legit tool in its own right."                    │
  └──────────────────────────────────────────────────┘
```

---

## §2. Core of Development — Save Data + Do Stuff To It

> Will: _"It all starts with the core of what it is to write code and develop. That is doing just TWO things: save data and do stuff to it. That is ALL we do within programming."_

```
2 THINGS TRONG PROGRAMMING:
═══════════════════════════════════════════════════════════════

  ① SAVE DATA:
  ┌──────────────────────────────────────────────────┐
  │ const userName = "Ari";                          │
  │ const score = 3;                                 │
  │ const quizQuestions = [...];                      │
  │ const leagueTable = [...];                       │
  │                                                  │
  │ → We even SEE this in execution contexts!       │
  │ → Memory = "variable environment"               │
  │ → Save stuff!                                   │
  └──────────────────────────────────────────────────┘

  ② DO STUFF TO IT:
  ┌──────────────────────────────────────────────────┐
  │ incrementScore(user);     // add 1 to score!     │
  │ displayUser(user);        // show on UI!         │
  │ sendToServer(user);       // send over network!  │
  │ loginUser(user);          // authenticate!       │
  │                                                  │
  │ Will: "The 'doing stuff' might be sending data   │
  │ to another computer, displaying on the UI,       │
  │ or adding one to it. But it's ALL just doing     │
  │ stuff to saved data."                            │
  └──────────────────────────────────────────────────┘

  EXECUTION CONTEXT = THESE 2 THINGS:
  ┌──────────────────────────────────────────────────┐
  │ ┌──────────────────┐  ┌──────────────────┐      │
  │ │ MEMORY           │  │ THREAD           │      │
  │ │ (save data!)     │  │ (do stuff!)      │      │
  │ │                  │  │                  │      │
  │ │ user = {...}     │  │ increment()      │      │
  │ │ score = 3        │  │ display()        │      │
  │ └──────────────────┘  └──────────────────┘      │
  │                                                  │
  │ → That's it! That's ALL programming is!         │
  └──────────────────────────────────────────────────┘
```

---

## §3. Why Is Development So Hard? — 100,000 Lines!

> Will: _"Why is development so hard? Why are we all paid the big bucks for something that is just saving data and changing it? It's a conspiracy! No, in practice, it's because even in our quiz game..."_

```
TẠI SAO LẬP TRÌNH KHÓ?
═══════════════════════════════════════════════════════════════

  QUIZ GAME — "SIMPLE" APP:
  ┌──────────────────────────────────────────────────┐
  │ Things I need to save:                           │
  │ → Users (lots of them!)                         │
  │ → Admins                                        │
  │ → Quiz questions                                │
  │ → Quiz outcomes                                 │
  │ → League tables                                 │
  │ → Game board                                    │
  │ → View/UI components                            │
  │                                                  │
  │ + ALL associated data and functionality          │
  │   for EACH of those things!                     │
  │ + In 100,000+ lines of code! 😱                 │
  └──────────────────────────────────────────────────┘

  2 BIG PROBLEMS:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ PROBLEM ①: WHERE IS THE FUNCTIONALITY?           │
  │                                                  │
  │ "In 100,000 lines of code, WHERE is the function │
  │ when I need it to change the user's data?        │
  │ It could be ANYWHERE!" 😰                       │
  │                                                  │
  │ ───────────────────────────────────────────────   │
  │                                                  │
  │ PROBLEM ②: HOW DO I KEEP IT SAFE?               │
  │                                                  │
  │ "How do I make sure the functionality is ONLY    │
  │ used on the RIGHT data?"                         │
  │                                                  │
  │ incrementScore(user1) ← ✅ correct!              │
  │ incrementScore(quizQuestion) ← ❌ wrong data!   │
  │                                                  │
  └──────────────────────────────────────────────────┘

  SOLUTION?
  → Data structure that stores BOTH data AND
    functionality in ONE NEAT PACKAGE!
  → Austin: "Objects!"
```

---

## §4. 3 Goals In Tension — Reason, Extend, Perform!

```
3 MỤC TIÊU — CẢ 3 ĐỀU CẦN, NHƯNG XUNG ĐỘT!:
═══════════════════════════════════════════════════════════════

  GOAL ①: EASY TO REASON ABOUT
  ┌──────────────────────────────────────────────────┐
  │ → WHERE is my increment function?               │
  │ → WHERE is my user's data?                      │
  │ → Keep data and functionality CLOSE TOGETHER!   │
  │ → Not searching through 100,000 lines!          │
  └──────────────────────────────────────────────────┘

  GOAL ②: EASY TO ADD NEW FEATURES
  ┌──────────────────────────────────────────────────┐
  │ → Enable user to LOSE a point? Easy!            │
  │ → Add new user types? Easy!                     │
  │ → Without breaking existing code!               │
  └──────────────────────────────────────────────────┘

  GOAL ③: EFFICIENT AND PERFORMANT
  ┌──────────────────────────────────────────────────┐
  │ → Not taking up too much MEMORY!                │
  │ → Not creating unnecessary copies!              │
  │ → Fast execution!                               │
  └──────────────────────────────────────────────────┘

  THE TENSION:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  Easy to reason     ←──TENSION──→  Performant   │
  │  (bundle data +                    (don't waste  │
  │   functionality                     memory!)     │
  │   together!)                                     │
  │       │                                │         │
  │       │          ←──TENSION──→         │         │
  │       │                                │         │
  │       └────── Easy to extend ──────────┘         │
  │              (add features                       │
  │               without breaking                   │
  │               existing code!)                    │
  │                                                  │
  │  Will: "These things are going to be IN TENSION. │
  │  The OOP paradigm aims to let us achieve ALL     │
  │  THREE of these goals at once."                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §5. Objects = Data + Functionality Together!

> Will: _"What data structure do I have available to me in JavaScript that allows me to store both data and functionality in one neat package?"_
> Austin: _"Objects!"_

```
OBJECTS — THE ANSWER:
═══════════════════════════════════════════════════════════════

  const user1 = {
    name: "Ari",
    score: 3,
    increment: function() { this.score++; }
  };

  const user2 = {
    name: "J",
    score: 5,
    increment: function() { this.score++; }
  };

  → Data (name, score) + functionality (increment)
  → ALL IN ONE PLACE!
  → user1.increment() → changes user1's score!
  → user1.name → find user1's data!
  → No searching through 100,000 lines!

  VISUALIZATION:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  user1: OBJECT                                   │
  │  ┌──────────────────────────────────────────┐    │
  │  │ DATA:                                    │    │
  │  │   name: "Ari"                            │    │
  │  │   score: 3                               │    │
  │  │                                          │    │
  │  │ FUNCTIONALITY:                           │    │
  │  │   increment: ƒ() { this.score++ }        │    │
  │  │   login: ƒ() { ... }                    │    │
  │  │   display: ƒ() { ... }                  │    │
  │  └──────────────────────────────────────────┘    │
  │                                                  │
  │  user2: OBJECT                                   │
  │  ┌──────────────────────────────────────────┐    │
  │  │ DATA:                                    │    │
  │  │   name: "J"                              │    │
  │  │   score: 5                               │    │
  │  │                                          │    │
  │  │ FUNCTIONALITY:                           │    │
  │  │   increment: ƒ() { this.score++ }        │    │
  │  │   login: ƒ() { ... }                    │    │
  │  │   display: ƒ() { ... }                  │    │
  │  └──────────────────────────────────────────┘    │
  │                                                  │
  │  ⚠️ PROBLEM: increment is COPIED in both!       │
  │  → SAME function, DUPLICATED in memory!         │
  │  → Goal ①③ conflict: easy to find but wasteful! │
  │  → This is the TENSION Will mentions!           │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §6. OOP vs FP — "Rival Competing Paradigms!"

> Will: _"What's another way we can store functionality with associated persistent data? Closures! Functions with associated persistent data. These are two ALMOST RIVAL COMPETING paradigms — the functional and the object-oriented."_

```
OOP vs FP — 2 APPROACHES, SAME GOAL:
═══════════════════════════════════════════════════════════════

  GOAL: Keep data + functionality close together!

  APPROACH ① — OOP (Object-Oriented):
  ┌──────────────────────────────────────────────────┐
  │ Bundle data + functionality IN AN OBJECT!         │
  │                                                  │
  │ const user = {                                   │
  │   name: "Ari",                                   │
  │   score: 3,                                      │
  │   increment() { this.score++; }                  │
  │ };                                               │
  │                                                  │
  │ user.increment(); // data + function together!   │
  └──────────────────────────────────────────────────┘

  APPROACH ② — FP (Functional):
  ┌──────────────────────────────────────────────────┐
  │ Bundle data + functionality VIA CLOSURE!          │
  │                                                  │
  │ function createUser(name, score) {               │
  │   return {                                       │
  │     increment() { score++; },                    │
  │     getScore() { return score; }                 │
  │   };                                             │
  │ }                                                │
  │                                                  │
  │ const user = createUser("Ari", 3);               │
  │ user.increment(); // closure keeps data!        │
  └──────────────────────────────────────────────────┘

  COMPARISON:
  ┌──────────────────┬──────────────────┬──────────────┐
  │                  │ OOP              │ FP            │
  ├──────────────────┼──────────────────┼──────────────┤
  │ Data storage     │ Object property  │ Closure scope │
  │ Functionality    │ Method on object │ Returned fn   │
  │ Access control   │ private/public   │ Closure = auto│
  │ Inheritance      │ Prototype chain  │ Composition   │
  │ This keyword     │ ✅ Needed!       │ ❌ Not needed │
  │ React style      │ Class components │ Hooks!        │
  │ Mental model     │ "Things"         │ "Transforms"  │
  └──────────────────┴──────────────────┴──────────────┘

  Will: "These are two almost RIVAL COMPETING
  paradigms. We are now focusing on the
  OBJECT-ORIENTED paradigm."
```

---

## §7. Quiz Game Setup — User1 + User2

```
QUIZ GAME — INITIAL SETUP:
═══════════════════════════════════════════════════════════════

  const user1 = {
    name: "Ari",
    score: 3,
    increment: function() { this.score++; }
  };

  const user2 = {
    name: "J",
    score: 5,
    increment: function() { this.score++; }
  };

  USAGE:
  user1.increment();  // Ari's score: 3 → 4!
  user2.increment();  // J's score: 5 → 6!

  BUT WAIT — PROBLEMS! (next lessons!):
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ ❌ PROBLEM 1: REPETITION!                        │
  │ → increment is IDENTICAL in both objects!       │
  │ → Copy-pasted! Wastes memory!                  │
  │ → What if we have 1000 users?                  │
  │ → 1000 copies of increment! 😱                 │
  │                                                  │
  │ ❌ PROBLEM 2: NO TEMPLATE!                       │
  │ → Have to manually write each user!             │
  │ → No "blueprint" for creating users!            │
  │ → Tedious + error-prone!                        │
  │                                                  │
  │ ❌ PROBLEM 3: NO INHERITANCE!                    │
  │ → Can't share common functionality!             │
  │ → Admin extends User? Can't do it!             │
  │                                                  │
  │ → SOLUTIONS COMING:                             │
  │   → Object.create (prototype chain!)            │
  │   → new keyword!                                │
  │   → class keyword!                              │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Object-Based User System

```javascript
// CHỨNG MINH 1: Naive approach — objects for data + functionality

const user1 = {
  name: "Ari",
  score: 3,
  increment: function () {
    this.score++;
  },
  login: function () {
    console.log(`${this.name} logged in!`);
  },
  display: function () {
    console.log(`${this.name}: ${this.score} points`);
  },
};

const user2 = {
  name: "J",
  score: 5,
  increment: function () {
    // SAME function, COPIED! ❌
    this.score++;
  },
  login: function () {
    // SAME! COPIED! ❌
    console.log(`${this.name} logged in!`);
  },
  display: function () {
    // SAME! COPIED! ❌
    console.log(`${this.name}: ${this.score} points`);
  },
};

user1.increment();
user1.display(); // "Ari: 4 points"

user2.increment();
user2.display(); // "J: 6 points"

// PROBLEM: 3 functions × 2 users = 6 function objects in memory!
// With 1000 users: 3000 function objects! 😱
// With 10 methods per user: 10,000 copies!
// → Goal ① (reason about) ✅ but Goal ③ (performant) ❌
```

```javascript
// CHỨNG MINH 2: OOP vs FP — same goal, different approach

// OOP approach:
const userOOP = {
  name: "Ari",
  score: 3,
  increment() {
    this.score++;
  },
};

// FP approach (closure):
function createUserFP(name, initialScore) {
  let score = initialScore; // CLOSURE! Private!
  return {
    increment() {
      score++;
    },
    getScore() {
      return score;
    },
    getName() {
      return name;
    },
    display() {
      console.log(`${name}: ${score} points`);
    },
  };
}

const userFP = createUserFP("Ari", 3);

// Compare:
userOOP.increment();
console.log(userOOP.score); // 4 — directly accessible!

userFP.increment();
console.log(userFP.getScore()); // 4 — via getter (private!)
// userFP.score → undefined! (closed over, not on object!)

// FP = data is PRIVATE by default (closure!)
// OOP = data is PUBLIC by default (need `private` keyword!)
```

```javascript
// CHỨNG MINH 3: The 3 goals in practice

// GOAL 1: Easy to reason about
// → user.increment() — clear! Data + function together!
// → user.name — easy to find!
// ✅ ACHIEVED by bundling in object!

// GOAL 2: Easy to add features
// → Want "decrease score"? Just add a method!
// user1.decrement = function() { this.score--; };
// ❌ BUT... have to add to EVERY user manually!

// GOAL 3: Efficient and performant
// → Same increment function copied to every user!
// ❌ WASTEFUL! 3 copies of identical function!

// THE TENSION IS REAL:
// ✅ Goal 1 achieved!
// ❌ Goal 2 not great (manual per user!)
// ❌ Goal 3 not great (copies in memory!)

// SOLUTION → Prototype chain! (next lessons!)
```

```javascript
// CHỨNG MINH 4: SCALE — why this matters

function createNaiveUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: `User${i}`,
      score: 0,
      increment() {
        this.score++;
      },
      decrement() {
        this.score--;
      },
      login() {
        console.log(`${this.name} logged in`);
      },
      logout() {
        console.log(`${this.name} logged out`);
      },
      display() {
        console.log(`${this.name}: ${this.score}`);
      },
    });
  }
  return users;
}

const users = createNaiveUsers(1000);

// Memory analysis:
// → 1000 objects × 5 methods = 5000 function objects!
// → Each function object ≈ 100-200 bytes
// → 5000 × 150 bytes ≈ 750KB of DUPLICATED functions!
// → And they're ALL IDENTICAL! 😱
//
// With prototype chain:
// → 5 function objects total (shared!)
// → 5 × 150 bytes ≈ 750 bytes!
// → 1000x less memory! 🚀
//
// → THIS is why we need the prototype chain!
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Why OOP?

```
5 WHYS: TẠI SAO CẦN OOP?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao bundle data + functionality?
  └→ Vì 100,000 lines code → tìm function ở đâu?
     Bundle = luôn biết WHERE to find!

  WHY ②: Tại sao dùng Object cho bundle?
  └→ Vì object = native data structure cho key-value pairs!
     Can hold ANY data type including functions!
     user.increment() = dot notation access!

  WHY ③: Tại sao không chỉ dùng Closure (FP)?
  └→ Vì OOP mirrors other languages (Java, C#, Python)!
     Team familiarity! Lots of existing patterns!
     Both approaches valid — different trade-offs!

  WHY ④: Tại sao cần 3 goals simultaneously?
  └→ Vì real apps are LARGE and COMPLEX!
     Easy to reason about = developer productivity!
     Easy to extend = business requirements change!
     Performant = user experience!

  WHY ⑤: Tại sao JS OOP khác other languages?
  └→ Vì JS dùng PROTOTYPE CHAIN, not classes!
     Classes in JS = syntactic sugar!
     Underneath = object linking via __proto__!
     "Unlike other languages where it's NATIVELY
     implemented"!
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — OOP CORE CONCEPTS:
═══════════════════════════════════════════════════════════════

  ① ENCAPSULATION:
  → Bundle data + methods together!
  → Object = capsule containing everything!
  → user.name + user.increment = same capsule!

  ② ABSTRACTION:
  → Hide complex implementation!
  → user.increment() — don't care HOW!
  → Just know WHAT it does!

  ③ INHERITANCE:
  → Share common functionality!
  → Admin extends User!
  → Don't repeat shared methods!

  ④ POLYMORPHISM:
  → Same interface, different behavior!
  → admin.display() ≠ user.display()!
  → But both called the same way!

  JavaScript's UNIQUE APPROACH:
  → Other languages: class-based (Java, C#)
  → JavaScript: PROTOTYPE-based!
  → class keyword = sugar over prototypes!
  → Will: "It all sits ON TOP of the prototype chain"
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS — THE 3 GOALS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────┬────────┬──────────┐
  │ Approach         │ Easy   │ Easy   │ Perform- │
  │                  │ reason │ extend │ ance     │
  ├──────────────────┼────────┼────────┼──────────┤
  │ Separate vars    │ ❌     │ ❌     │ ✅       │
  │ (no structure)   │ lost!  │ messy! │ minimal! │
  ├──────────────────┼────────┼────────┼──────────┤
  │ Objects (naive)  │ ✅     │ ⚠️     │ ❌       │
  │ (copy methods)   │ found! │ manual │ wasteful!│
  ├──────────────────┼────────┼────────┼──────────┤
  │ Prototype chain  │ ✅     │ ✅     │ ✅       │
  │ (shared methods) │ found! │ inherit│ shared!  │
  ├──────────────────┼────────┼────────┼──────────┤
  │ class syntax     │ ✅     │ ✅     │ ✅       │
  │ (sugar)          │ clear! │ extends│ proto!   │
  └──────────────────┴────────┴────────┴──────────┘

  → Prototype chain achieves ALL 3!
  → class makes it LOOK like other languages!
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP — OOP LEARNING PATH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  LEVEL 1: Objects (this lesson!)                       │
  │  ┌──────────────────────────────────────────────┐      │
  │  │ user = { name, score, increment }            │      │
  │  │ ✅ Easy to reason │ ❌ Copies methods         │      │
  │  └──────────────────────────────────────────────┘      │
  │                      │                                  │
  │                      ▼                                  │
  │  LEVEL 2: Object.create + Prototype chain              │
  │  ┌──────────────────────────────────────────────┐      │
  │  │ Shared methods via __proto__ link!           │      │
  │  │ ✅ Performant │ ⚠️ Manual setup              │      │
  │  └──────────────────────────────────────────────┘      │
  │                      │                                  │
  │                      ▼                                  │
  │  LEVEL 3: new keyword                                  │
  │  ┌──────────────────────────────────────────────┐      │
  │  │ Automates object creation + linking!         │      │
  │  │ ✅ Less code │ ⚠️ "Auto-magic"               │      │
  │  └──────────────────────────────────────────────┘      │
  │                      │                                  │
  │                      ▼                                  │
  │  LEVEL 4: class keyword                                │
  │  ┌──────────────────────────────────────────────┐      │
  │  │ Sugar over new + prototype!                  │      │
  │  │ ✅ Familiar syntax │ ⚠️ Can mislead!         │      │
  │  └──────────────────────────────────────────────┘      │
  │                      │                                  │
  │                      ▼                                  │
  │  LEVEL 5: static, private, public fields               │
  │  ┌──────────────────────────────────────────────┐      │
  │  │ Full OOP emulation!                          │      │
  │  │ ✅ Complete │ "Really exciting!" (Will)       │      │
  │  └──────────────────────────────────────────────┘      │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### 9.5 Pattern ⑤: Reverse Engineering

```javascript
// MEASURING THE TENSION: memory vs. readability

// Approach A: Separate functions (performant but messy)
function increment(user) {
  user.score++;
}
function display(user) {
  console.log(`${user.name}: ${user.score}`);
}

const userA = { name: "Ari", score: 3 };
increment(userA); // ❌ Which increment? Where is it?
display(userA); // ❌ Could be anywhere in 100k lines!

// Approach B: Methods on object (readable but wasteful)
const userB1 = {
  name: "Ari",
  score: 3,
  increment() {
    this.score++;
  },
  display() {
    console.log(`${this.name}: ${this.score}`);
  },
};
const userB2 = {
  name: "J",
  score: 5,
  increment() {
    this.score++;
  }, // COPY! ❌
  display() {
    console.log(`${this.name}: ${this.score}`);
  }, // COPY!
};

userB1.increment(); // ✅ Clear! Right on the object!
userB1.display(); // ✅ Easy to find!
// But 2 extra copies of each function! ❌

// Memory comparison:
console.log(userB1.increment === userB2.increment); // false!
// → They're DIFFERENT objects in memory!
// → Same code, different memory addresses!
// → WASTEFUL!
```

### 9.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ: OOP IN JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  1995: JavaScript created by Brendan Eich
  │     → Prototype-based OOP (not class-based!)
  │     → Influenced by Self language
  │     → "Make it look like Java" (marketing)
  │     → But fundamentally DIFFERENT from Java!
  │
  ↓
  1999-2008: Prototype manipulation era
  │     → Direct __proto__ manipulation
  │     → Constructor functions + new keyword
  │     → Libraries: MooTools, Prototype.js
  │
  ↓
  2009: ES5 — Object.create()
  │     → Clean prototype chain creation!
  │     → No need for constructor functions!
  │
  ↓
  2015: ES2015 — class keyword!
  │     → Syntactic sugar over prototypes!
  │     → extends for inheritance!
  │     → React class components!
  │     → Will: "It all sits ON TOP of prototypes"
  │
  ↓
  2020-2022: Modern OOP features!
  │     → Private fields (#privateField)
  │     → Static fields (static count = 0)
  │     → Public class fields
  │     → Will: "Added in the last couple of years!"
  │
  ↓
  2024: Full OOP emulation possible
        → class + extends + static + #private
        → "Really exciting way of extending!"
        → But still PROTOTYPES underneath!

  PARADIGM SHIFT IN REACT:
  ┌──────────────────────────────────────────────────┐
  │ 2013-2018: Class components (OOP!)               │
  │ → class App extends React.Component              │
  │                                                  │
  │ 2019+: Hooks (Functional!)                       │
  │ → function App() { useState()... }               │
  │                                                  │
  │ Will: "React USED TO center around OOP.          │
  │ Increasingly the functional style has become     │
  │ more typical."                                   │
  └──────────────────────────────────────────────────┘
```

```
TÓM TẮT 6 PATTERNS:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → OOP vì 100k lines → need structure!
                      JS OOP = prototype-based, not class-based!

  ② FIRST PRINCIPLES→ 4 pillars: encapsulation, abstraction,
                      inheritance, polymorphism!

  ③ TRADE-OFFS     → 3 goals in tension: reason about,
                      extend, perform — prototype solves all!

  ④ MENTAL MAPPING → 5 levels: objects → prototype → new
                      → class → static/private fields!

  ⑤ PROOF          → Same function on 2 objects = 2 copies!
                      user1.increment !== user2.increment!

  ⑥ HISTORY        → 1995 prototype-based → 2015 class sugar
                      → 2022 private/static → full OOP!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 6.1:
═══════════════════════════════════════════════════════════════

  CORE CONCEPTS:
  [ ] Programming = save data + do stuff to it!
  [ ] Dev is hard because of SCALE (100k lines!)
  [ ] Objects bundle data + functionality together!

  3 GOALS:
  [ ] Easy to reason about (find data + functions!)
  [ ] Easy to add features (extend without breaking!)
  [ ] Efficient + performant (don't waste memory!)
  [ ] These 3 goals are IN TENSION!

  OOP vs FP:
  [ ] OOP: data + functions in OBJECTS!
  [ ] FP: data + functions via CLOSURES!
  [ ] "Rival competing paradigms!"
  [ ] React: class components (OOP) → hooks (FP)!

  JS OOP UNIQUE:
  [ ] Not class-based like Java/C# — prototype-based!
  [ ] class keyword = syntactic sugar over prototypes!
  [ ] New features: static, private fields (2020-2022)!

  PROBLEM IDENTIFIED:
  [ ] Naive objects COPY methods — wasteful!
  [ ] user1.increment !== user2.increment (different objects!)
  [ ] Need prototype chain to SHARE methods!

  TIẾP THEO → Phần 6.2: Object.create + Prototype Chain!
```
