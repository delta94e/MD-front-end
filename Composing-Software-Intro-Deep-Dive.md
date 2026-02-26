# Composing Software: An Introduction — Deep Dive!

> **Nguồn**: "Composing Software" — Eric Elliott
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Không sử dụng thư viện** — tự viết lại bằng tay!

---

## §1. Composition Là Gì? — Bản Chất Của Software!

```
  COMPOSITION — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → "The act of combining parts to form a whole" ★★★        │
  │  → Bản chất của software development! ★★★                 │
  │  → Chia bài toán lớn → bài toán nhỏ! ★                   │
  │  → Ghép solutions nhỏ → solution hoàn chỉnh! ★★★         │
  │                                                              │
  │  2 CÂU HỎI QUAN TRỌNG NHẤT:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ❓ What is FUNCTION composition?                      │    │
  │  │  ❓ What is OBJECT composition?                        │    │
  │  │  → 100% developers struggle trả lời! ★★★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO QUAN TRỌNG?                                          │
  │  → Không hiểu composition → viết code tệ! ★★★            │
  │  → Nhiều bugs hơn! ★                                      │
  │  → Khó maintain! ★★★                                      │
  │  → Toyota: 10,000 global vars → tai nạn chết người! ★★★ │
  │  → Hackers exploit bugs → spy, steal, DDoS! ★            │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Complex Problem                                       │    │
  │  │       ↓ decompose                                      │    │
  │  │  ┌────────┐ ┌────────┐ ┌────────┐                     │    │
  │  │  │ Small  │ │ Small  │ │ Small  │                      │    │
  │  │  │ Prob A │ │ Prob B │ │ Prob C │                      │    │
  │  │  └───┬────┘ └───┬────┘ └───┬────┘                     │    │
  │  │      ↓ solve     ↓ solve    ↓ solve                    │    │
  │  │  ┌────────┐ ┌────────┐ ┌────────┐                     │    │
  │  │  │ Sol A  │ │ Sol B  │ │ Sol C  │                      │    │
  │  │  └───┬────┘ └───┬────┘ └───┬────┘                     │    │
  │  │      └──────┬───┴──────┬───┘                           │    │
  │  │             ↓ COMPOSE! ★★★                             │    │
  │  │      Complete Application! ★★★                        │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Function Composition!

```
  FUNCTION COMPOSITION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TOÁN HỌC:                                                    │
  │  → f ∘ g = f(g(x)) ★★★                                    │
  │  → "f composed with g" = "f after g" ★                    │
  │  → g chạy TRƯỚC → output → input cho f! ★★★              │
  │                                                              │
  │  BEFORE (manual composition):                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const g = n => n + 1;                                │    │
  │  │  const f = n => n * 2;                                │    │
  │  │                                                       │    │
  │  │  const doStuff = x => {                                │    │
  │  │    const afterG = g(x);    // biến trung gian! ★     │    │
  │  │    const afterF = f(afterG); // biến trung gian! ★   │    │
  │  │    return afterF;                                      │    │
  │  │  };                                                    │    │
  │  │  doStuff(20); // 42                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  AFTER (intentional composition):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const doStuffBetter = x => f(g(x)); ★★★              │    │
  │  │  doStuffBetter(20); // 42                              │    │
  │  │  → 1 line! Không biến trung gian! ★★★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BẠN COMPOSE MỖI NGÀY MÀ KHÔNG BIẾT:                          │
  │  → Promise chains: .then(g).then(f) ★★★                   │
  │  → Array methods: .map().filter().reduce() ★★★            │
  │  → Lodash chains! RxJS observables! ★                     │
  │  → "If you're chaining, you're composing" ★★★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. pipe() & trace() — Debug Composition!

```
  PIPE + TRACE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  trace() — debug helper:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const trace = label => value => {                     │    │
  │  │    console.log(`${label}: ${value}`);                  │    │
  │  │    return value;  // pass-through! ★★★                │    │
  │  │  };                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  pipe() — compose left-to-right:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const pipe = (...fns) =>                              │    │
  │  │    x => fns.reduce((y, f) => f(y), x); ★★★           │    │
  │  │                                                       │    │
  │  │  const doStuff = pipe(                                 │    │
  │  │    g,                    // n + 1                      │    │
  │  │    trace('after g'),     // log: "after g: 21"        │    │
  │  │    f,                    // n * 2                      │    │
  │  │    trace('after f')      // log: "after f: 42"        │    │
  │  │  );                                                    │    │
  │  │  doStuff(20); // 42 ★★★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  POINT-FREE STYLE:                                            │
  │  → Không mention arguments! ★                              │
  │  → pipe() returns new function! ★★★                        │
  │  → Không cần function keyword hay => ★                    │
  │                                                              │
  │  BENEFITS:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① Working Memory (4-7 quanta)                         │    │
  │  │  → pipe eliminates 3 variables! ★★★                   │    │
  │  │  → Giải phóng ~50% bộ nhớ làm việc! ★               │    │
  │  │                                                       │    │
  │  │  ② Signal-to-Noise Ratio                               │    │
  │  │  → Concise = ít noise! ★                              │    │
  │  │  → Dễ đọc, dễ hiểu! ★★★                             │    │
  │  │                                                       │    │
  │  │  ③ Surface Area for Bugs                               │    │
  │  │  → Less code = less bugs! ★★★                        │    │
  │  │  → Extra code = chỗ bugs ẩn! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Object Composition — "Favor Over Class Inheritance"!

```
  OBJECT COMPOSITION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  "Favor object composition over class inheritance"           │
  │  — Gang of Four (GoF) ★★★                                  │
  │                                                              │
  │  COMPOSITE TYPE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Primitives:                                           │    │
  │  │  const firstName = 'Claude';                           │    │
  │  │  const lastName = 'Debussy';                           │    │
  │  │                                                       │    │
  │  │  Composite:                                            │    │
  │  │  const fullName = { firstName, lastName }; ★★★        │    │
  │  │  → Arrays, Sets, Maps... đều là composite! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 LOẠI OBJECT COMPOSITION (GoF):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① Delegation (delegate property access)               │    │
  │  │  → State, Strategy, Visitor patterns! ★               │    │
  │  │                                                       │    │
  │  │  ② Acquaintance (uses-a relationship)                  │    │
  │  │  → Object biết object khác qua reference! ★           │    │
  │  │  → VD: request handler uses logger! ★                 │    │
  │  │                                                       │    │
  │  │  ③ Aggregation (has-a relationship)                    │    │
  │  │  → Child thuộc parent! ★★★                           │    │
  │  │  → VD: DOM node has children! ★                       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CLASS INHERITANCE — 5 VẤN ĐỀ LỚN:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ❌ 1. Tight Coupling Problem                           │    │
  │  │  → Child phụ thuộc parent implementation! ★★★        │    │
  │  │  → Coupling chặt nhất trong OOP! ★★★                │    │
  │  │                                                       │    │
  │  │  ❌ 2. Fragile Base Class Problem                       │    │
  │  │  → Thay đổi base → break descendants! ★★★           │    │
  │  │  → Có thể break code 3rd parties! ★★★                │    │
  │  │                                                       │    │
  │  │  ❌ 3. Inflexible Hierarchy Problem                     │    │
  │  │  → Single ancestor → eventually wrong! ★★★           │    │
  │  │  → Không phù hợp new use-cases! ★                   │    │
  │  │                                                       │    │
  │  │  ❌ 4. Duplication by Necessity Problem                 │    │
  │  │  → Hierarchy cứng → duplicate thay extend! ★★★      │    │
  │  │  → Divergent classes! ★                               │    │
  │  │                                                       │    │
  │  │  ❌ 5. Gorilla/Banana Problem                           │    │
  │  │  → "Muốn banana → được gorilla +                     │    │
  │  │     toàn bộ jungle!" ★★★ (Joe Armstrong)             │    │
  │  │  → Implicit environment đi kèm! ★                    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — MIXIN COMPOSITION:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Class inheritance (rigid):                         │    │
  │  │  class Foo { constructor() { this.a = 'a' } }         │    │
  │  │  class Bar extends Foo {                               │    │
  │  │    constructor(opts) { super(opts); this.b = 'b' }    │    │
  │  │  }                                                     │    │
  │  │  // → Tightly coupled! ★★★                            │    │
  │  │                                                       │    │
  │  │  // Mixin composition (flexible):                      │    │
  │  │  const a = { a: 'a' };                                 │    │
  │  │  const b = { b: 'b' };                                 │    │
  │  │  const c = { ...a, ...b }; // {a: 'a', b: 'b'} ★★★  │    │
  │  │  // → Like ice cream: mix features! ★★★              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — CompositionEngine!

```javascript
var CompositionEngine = (function () {
  // ═══════════════════════════════════
  // 1. FUNCTION COMPOSITION PRIMITIVES
  // ═══════════════════════════════════

  // pipe: left-to-right composition
  function pipe() {
    var fns = Array.prototype.slice.call(arguments);
    return function (x) {
      return fns.reduce(function (y, f) {
        return f(y);
      }, x);
    };
  }

  // compose: right-to-left composition (mathematical)
  function compose() {
    var fns = Array.prototype.slice.call(arguments);
    return function (x) {
      return fns.reduceRight(function (y, f) {
        return f(y);
      }, x);
    };
  }

  // trace: debug helper (pass-through logging)
  function trace(label) {
    return function (value) {
      console.log(label + ": " + value);
      return value;
    };
  }

  // ═══════════════════════════════════
  // 2. OBJECT COMPOSITION PRIMITIVES
  // ═══════════════════════════════════

  // mixin: concatenative composition (spread alternative)
  function mixin() {
    var result = {};
    for (var i = 0; i < arguments.length; i++) {
      var obj = arguments[i];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  // factory: create objects without classes
  function createFactory(template) {
    return function (overrides) {
      return mixin(template, overrides || {});
    };
  }

  // ═══════════════════════════════════
  // 3. DELEGATION (GoF pattern)
  // ═══════════════════════════════════
  function delegate(target, delegateTo, methods) {
    var result = mixin(target);
    for (var i = 0; i < methods.length; i++) {
      (function (method) {
        result[method] = function () {
          return delegateTo[method].apply(delegateTo, arguments);
        };
      })(methods[i]);
    }
    return result;
  }

  // ═══════════════════════════════════
  // 4. COMPOSITION vs INHERITANCE DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Composition Engine ═══");

    // Function Composition
    console.log("\n── 1. pipe() ──");
    var add1 = function (n) {
      return n + 1;
    };
    var double = function (n) {
      return n * 2;
    };
    var add1ThenDouble = pipe(
      add1,
      trace("after +1"),
      double,
      trace("after x2"),
    );
    console.log("Result:", add1ThenDouble(20)); // 42

    console.log("\n── 2. compose() ──");
    var doubleThenAdd1 = compose(add1, double);
    console.log("compose(add1, double)(20):", doubleThenAdd1(20)); // 41

    // Object Composition
    console.log("\n── 3. Mixin ──");
    var canWalk = {
      walk: function () {
        return "walking";
      },
    };
    var canSwim = {
      swim: function () {
        return "swimming";
      },
    };
    var canFly = {
      fly: function () {
        return "flying";
      },
    };

    var duck = mixin(canWalk, canSwim, canFly, { name: "Donald" });
    console.log("Duck:", duck.name, duck.walk(), duck.swim(), duck.fly());

    var fish = mixin(canSwim, { name: "Nemo" });
    console.log("Fish:", fish.name, fish.swim());
    // fish.fly → undefined! No gorilla problem! ★★★

    // Factory
    console.log("\n── 4. Factory ──");
    var createUser = createFactory({
      role: "viewer",
      active: true,
    });
    console.log(createUser({ name: "Alice" }));
    console.log(createUser({ name: "Bob", role: "admin" }));

    // Delegation
    console.log("\n── 5. Delegation ──");
    var logger = {
      log: function (msg) {
        return "[LOG] " + msg;
      },
      warn: function (msg) {
        return "[WARN] " + msg;
      },
    };
    var handler = delegate(
      {
        handle: function (req) {
          return "handled " + req;
        },
      },
      logger,
      ["log", "warn"],
    );
    console.log(handler.handle("request"));
    console.log(handler.log("something"));
  }

  return {
    pipe: pipe,
    compose: compose,
    trace: trace,
    mixin: mixin,
    createFactory: createFactory,
    demo: demo,
  };
})();
// Chạy: CompositionEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Function composition là gì?                             │
  │  → Apply function lên output của function khác! ★★★       │
  │  → f(g(x)) = f ∘ g! ★                                     │
  │  → pipe() = left-to-right, compose() = right-to-left! ★  │
  │                                                              │
  │  ❓ 2: Object composition là gì?                               │
  │  → Ghép objects nhỏ → object lớn! ★★★                    │
  │  → 3 loại: delegation, acquaintance, aggregation! ★       │
  │  → Mixin: {...a, ...b} = concatenative inheritance! ★★★  │
  │                                                              │
  │  ❓ 3: Tại sao "favor composition over inheritance"?           │
  │  → Class inheritance = tightly coupled! ★★★               │
  │  → 5 problems: tight coupling, fragile base class,        │
  │    inflexible hierarchy, duplication, gorilla/banana! ★★★ │
  │  → Composition = flexible, loosely coupled! ★★★           │
  │                                                              │
  │  ❓ 4: pipe() hoạt động thế nào?                              │
  │  → fns.reduce((y, f) => f(y), x)! ★★★                    │
  │  → Output function trước → input function sau! ★          │
  │  → Point-free style: không mention arguments! ★           │
  │                                                              │
  │  ❓ 5: 3 benefits của composition?                             │
  │  → Working Memory: giảm biến → giảm cognitive load! ★★★ │
  │  → Signal-to-Noise: concise = dễ đọc! ★                  │
  │  → Surface Area: less code = fewer bugs! ★★★              │
  │                                                              │
  │  ❓ 6: FP vs OOP?                                              │
  │  → FALSE dichotomy! ★★★                                    │
  │  → Real apps mix cả FP + OOP! ★                           │
  │  → Bản chất: COMPOSITION, không phải paradigm! ★★★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
