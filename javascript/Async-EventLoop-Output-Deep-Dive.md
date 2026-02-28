# Async & Event Loop — Code Output Deep Dive (Part 1)

> 📅 2026-02-11 · ⏱ 30 phút đọc
>
> 31 bài output questions về Promise, async/await, Event Loop.
> Phân tích chi tiết execution flow: macro/micro task queue,
> Promise state changes, và async/await behavior.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript Async Patterns

---

## Mục Lục

0. [Event Loop — Kiến thức nền](#0-event-loop--kiến-thức-nền)
1. [Promise Basics (Q1–Q6)](#1-promise-basics-q1q6)
2. [Promise + setTimeout (Q7–Q9)](#2-promise--settimeout-q7q9)
3. [Promise Chaining & Error (Q10–Q15)](#3-promise-chaining--error-q10q15)
4. [Promise.all / race (Q16–Q19)](#4-promiseall--race-q16q19)
5. [async/await (Q20–Q25)](#5-asyncawait-q20q25)
6. [Tổng hợp Complex (Q26–Q31)](#6-tổng-hợp-complex-q26q31)

---

## 0. Event Loop — Kiến thức nền

```
EVENT LOOP — FLOW:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                   CALL STACK                        │
  │  (synchronous code chạy ở đây)                     │
  └────────────────────────┬────────────────────────────┘
                           │ hết sync code
                           ▼
  ┌─────────────────────────────────────────────────────┐
  │              MICROTASK QUEUE (ưu tiên!)             │
  │  Promise.then, process.nextTick, queueMicrotask    │
  │  → Chạy HẾT trước khi sang macrotask              │
  └────────────────────────┬────────────────────────────┘
                           │ hết microtasks
                           ▼
  ┌─────────────────────────────────────────────────────┐
  │              MACROTASK QUEUE                        │
  │  setTimeout, setInterval, I/O, UI rendering        │
  │  → Chạy 1 task → quay lại check microtask         │
  └─────────────────────────────────────────────────────┘

  QUY TẮC:
  ① Chạy hết SYNC code (call stack)
  ② Chạy hết MICROTASK queue
  ③ Chạy 1 MACROTASK
  ④ Quay lại ② → lặp lại
```

---

## 1. Promise Basics (Q1–Q6)

### Q1: Promise constructor chạy ĐỒNG BỘ

```javascript
const promise = new Promise((resolve, reject) => {
  console.log(1);
  console.log(2);
});
promise.then(() => {
  console.log(3);
});
console.log(4);
```

> **Output: `1 2 4`** (KHÔNG có 3!)
>
> → Promise constructor chạy **đồng bộ** → in 1, 2.
> → `.then` là microtask, nhưng **không có resolve/reject** → Promise vẫn **pending** → callback `.then` **KHÔNG BAO GIỜ chạy**.

### Q2: Promise state + .then timing

```javascript
const promise1 = new Promise((resolve, reject) => {
  console.log("promise1");
  resolve("resolve1");
});
const promise2 = promise1.then((res) => {
  console.log(res);
});
console.log("1", promise1);
console.log("2", promise2);
```

> **Output:**
>
> ```
> promise1
> 1 Promise{<resolved>: resolve1}
> 2 Promise{<pending>}
> resolve1
> ```
>
> → Constructor sync → in `promise1`, resolve → state = resolved.
> → `.then` vào microtask queue, promise2 = new pending Promise.
> → Sync: in `1 Promise{resolved}`, `2 Promise{pending}`.
> → Microtask: in `resolve1`. Lúc này promise2 mới resolved.

### Q3: resolve trong setTimeout

```javascript
const promise = new Promise((resolve, reject) => {
  console.log(1);
  setTimeout(() => {
    console.log("timerStart");
    resolve("success");
    console.log("timerEnd");
  }, 0);
  console.log(2);
});
promise.then((res) => {
  console.log(res);
});
console.log(4);
```

> **Output: `1 2 4 timerStart timerEnd success`**
>
> → Sync: 1, 2, 4. Promise vẫn **pending** → `.then` chưa vào queue.
> → Macrotask (setTimeout): in `timerStart`, resolve → `.then` vào **microtask**, in `timerEnd`.
> → Microtask: in `success`.

### Q4: Microtask tạo macrotask & ngược lại

```javascript
Promise.resolve().then(() => {
  console.log("promise1");
  const timer2 = setTimeout(() => {
    console.log("timer2");
  }, 0);
});
const timer1 = setTimeout(() => {
  console.log("timer1");
  Promise.resolve().then(() => {
    console.log("promise2");
  });
}, 0);
console.log("start");
```

> **Output: `start promise1 timer1 promise2 timer2`**
>
> → Sync: `start`. Microtask queue: [promise.then]. Macrotask: [timer1].
> → Microtask: `promise1`, thêm timer2 vào macrotask → [timer1, timer2].
> → Macrotask timer1: `timer1`, thêm promise2 vào microtask.
> → Microtask: `promise2`.
> → Macrotask timer2: `timer2`.

### Q5: Promise state chỉ đổi MỘT LẦN

```javascript
const promise = new Promise((resolve, reject) => {
  resolve("success1");
  reject("error");
  resolve("success2");
});
promise
  .then((res) => {
    console.log("then:", res);
  })
  .catch((err) => {
    console.log("catch:", err);
  });
```

> **Output: `then: success1`**
>
> → Promise state **đổi 1 lần duy nhất**: pending → resolved.
> → reject và resolve thứ 2 **bị bỏ qua**.

### Q6: .then PHẢI là function — value pass-through

```javascript
Promise.resolve(1)
  .then(2) // không phải function → pass-through
  .then(Promise.resolve(3)) // không phải function → pass-through
  .then(console.log); // function ✅
```

> **Output: `1`**
>
> → `.then(2)` và `.then(Promise.resolve(3))` **không phải function** → value pass-through.
> → Giá trị `1` truyền thẳng tới `.then(console.log)` → in `1`.
> → **Rule: `.then` nhận function, non-function → pass-through!**

---

## 2. Promise + setTimeout (Q7–Q9)

### Q7: Promise state thay đổi SAU timeout

```javascript
const promise1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("success");
  }, 1000);
});
const promise2 = promise1.then(() => {
  throw new Error("error!!!");
});
console.log("promise1", promise1);
console.log("promise2", promise2);
setTimeout(() => {
  console.log("promise1", promise1);
  console.log("promise2", promise2);
}, 2000);
```

> **Output:**
>
> ```
> promise1 Promise {<pending>}
> promise2 Promise {<pending>}
> // 1s: Uncaught (in promise) Error: error!!!
> // 2s:
> promise1 Promise {<fulfilled>: "success"}
> promise2 Promise {<rejected>: Error: error!!}
> ```

### Q8: .then chaining — return value

```javascript
Promise.resolve(1)
  .then((res) => {
    console.log(res);
    return 2;
  })
  .catch((err) => {
    return 3;
  })
  .then((res) => {
    console.log(res);
  });
```

> **Output: `1 2`**
>
> → resolve(1) → then nhận 1 → in 1, return 2.
> → Không lỗi → **skip catch** → then nhận 2 → in 2.
> → **return value được wrap thành Promise.resolve(value)**.

### Q9: return new Error ≠ throw

```javascript
Promise.resolve()
  .then(() => {
    return new Error("error!!!");
  })
  .then((res) => {
    console.log("then: ", res);
  })
  .catch((err) => {
    console.log("catch: ", err);
  });
```

> **Output: `"then: " "Error: error!!!"`**
>
> → `return new Error()` → wrap thành `Promise.resolve(new Error())`.
> → **Vào then, KHÔNG vào catch!** Muốn catch → dùng `throw`.

---

## 3. Promise Chaining & Error (Q10–Q15)

### Q10: Chaining cycle — self-reference

```javascript
const promise = Promise.resolve().then(() => {
  return promise;
});
promise.catch(console.err);
```

> **Output: `TypeError: Chaining cycle detected for promise`**
>
> → `.then` **KHÔNG ĐƯỢC return chính promise** → infinite loop.

### Q11: reject + then 2nd param vs catch

```javascript
Promise.reject("err!!!")
  .then(
    (res) => {
      console.log("success", res);
    },
    (err) => {
      console.log("error", err);
    },
  )
  .catch((err) => {
    console.log("catch", err);
  });
```

> **Output: `error err!!!`**
>
> → reject → vào **then 2nd param** (error handler) → catch **không chạy**.
> → Nhưng nếu **lỗi xảy ra TRONG then 1st param** → then 2nd param **KHÔNG bắt được** → catch mới bắt.

### Q12: .finally behavior

```javascript
Promise.resolve("1")
  .then((res) => {
    console.log(res);
  })
  .finally(() => {
    console.log("finally");
  });
Promise.resolve("2")
  .finally(() => {
    console.log("finally2");
    return "我是finally2返回的值";
  })
  .then((res) => {
    console.log("finally2后面的then函数", res);
  });
```

> **Output: `1 finally2 finally finally2后面的then函数 2`**
>
> → `.finally()`: luôn chạy, **không nhận parameter**, **pass-through value** (return bị ignore trừ throw).
> → finally2 return value bị ignore → then nhận `2` từ resolve.

### Q13: .finally throw error

```javascript
Promise.resolve("1")
  .finally(() => {
    console.log("finally1");
    throw new Error("我是finally中抛出的异常");
  })
  .then((res) => {
    console.log("finally后面的then函数", res);
  })
  .catch((err) => {
    console.log("捕获错误", err);
  });
```

> **Output: `'finally1'` → `'捕获错误' Error: ...`**
>
> → finally **throw error** → pass-through **bị gián đoạn** → vào catch.

---

## 4. Promise.all / race (Q14–Q17)

### Q14: Promise.all — tất cả resolve

```javascript
function runAsync(x) {
  const p = new Promise((r) => setTimeout(() => r(x, console.log(x)), 1000));
  return p;
}
Promise.all([runAsync(1), runAsync(2), runAsync(3)]).then((res) =>
  console.log(res),
);
```

> **Output: `1 2 3 [1, 2, 3]`** (sau 1s)
>
> → 3 promises chạy **đồng thời**, resolve sau 1s.
> → `.then` nhận **array** kết quả, **đúng thứ tự** truyền vào.

### Q15: Promise.all — có reject

```javascript
function runAsync(x) {
  /* resolve x after 1s */
}
function runReject(x) {
  /* reject after x*1000ms */
}
Promise.all([runAsync(1), runReject(4), runAsync(3), runReject(2)])
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
```

> **Output: `1 3` (1s) → `2 Error: 2` (2s) → `4` (4s)**
>
> → Tất cả promises **vẫn chạy**, nhưng catch chỉ bắt **reject ĐẦU TIÊN** (runReject(2)).

### Q16: Promise.race — resolve đầu tiên

```javascript
Promise.race([runAsync(1), runAsync(2), runAsync(3)]).then((res) =>
  console.log("result: ", res),
);
```

> **Output: `1 'result: ' 1 2 3`**
>
> → `.then` chỉ bắt **kết quả ĐẦU TIÊN** (resolve/reject).
> → Các promises khác **vẫn chạy** nhưng kết quả bị ignore.

### Q17: Promise.race — reject đầu tiên

```javascript
Promise.race([runReject(0), runAsync(1), runAsync(2), runAsync(3)])
  .then((res) => console.log("result: ", res))
  .catch((err) => console.log(err));
```

> **Output: `0 Error: 0 1 2 3`**
>
> → runReject(0) reject **ngay lập tức** → catch bắt.
> → Các async khác **vẫn chạy** nhưng bị ignore.

---

## 5. async/await (Q18–Q23)

### Q18: await = Promise.then

```javascript
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}
async function async2() {
  console.log("async2");
}
async1();
console.log("start");
```

> **Output: `async1 start async2 start async1 end`**
>
> → `await` = đặt code SAU await vào **microtask** (như Promise.then).
> → Sync: `async1 start`, `async2`, thoát async1, `start`.
> → Microtask: `async1 end`.

### Q19: await + setTimeout ordering

```javascript
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
  setTimeout(() => {
    console.log("timer1");
  }, 0);
}
async function async2() {
  setTimeout(() => {
    console.log("timer2");
  }, 0);
  console.log("async2");
}
async1();
setTimeout(() => {
  console.log("timer3");
}, 0);
console.log("start");
```

> **Output: `async1 start async2 start async1 end timer2 timer3 timer1`**
>
> → Sync: `async1 start`, `async2` (timer2→macro), `start` (timer3→macro).
> → Microtask: `async1 end` (timer1→macro).
> → Macrotasks FIFO: timer2, timer3, timer1.

### Q20: await Promise KHÔNG resolve → block

```javascript
async function async1() {
  console.log("async1 start");
  await new Promise((resolve) => {
    console.log("promise1");
  });
  console.log("async1 success"); // KHÔNG BAO GIỜ chạy!
  return "async1 end";
}
console.log("script start");
async1().then((res) => console.log(res));
console.log("script end");
```

> **Output: `script start async1 start promise1 script end`**
>
> → Promise **không resolve** → state pending → await **block vĩnh viễn**.
> → Code sau await và `.then` **KHÔNG BAO GIỜ** chạy.

### Q21: await Promise CÓ resolve + .then

```javascript
async function async1() {
  console.log("async1 start");
  await new Promise((resolve) => {
    console.log("promise1");
    resolve("promise1 resolve");
  }).then((res) => console.log(res));
  console.log("async1 success");
  return "async1 end";
}
console.log("script start");
async1().then((res) => console.log(res));
console.log("script end");
```

> **Output: `script start async1 start promise1 script end promise1 resolve async1 success async1 end`**

### Q22: Classic Event Loop — async + Promise + setTimeout

```javascript
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}
async function async2() {
  console.log("async2");
}
console.log("script start");
setTimeout(function () {
  console.log("setTimeout");
}, 0);
async1();
new Promise((resolve) => {
  console.log("promise1");
  resolve();
}).then(function () {
  console.log("promise2");
});
console.log("script end");
```

> **Output: `script start async1 start async2 promise1 script end async1 end promise2 setTimeout`**
>
> **Flow:**
> | Phase | Output | Queue changes |
> |-------|--------|--------------|
> | Sync | script start | |
> | Sync | async1 start, async2 | microtask: [async1 end] |
> | Sync | promise1 | microtask: [async1 end, promise2] |
> | Sync | script end | macro: [setTimeout] |
> | Micro | async1 end, promise2 | |
> | Macro | setTimeout | |

### Q23: async + reject → stop execution

```javascript
async function async1() {
  await async2();
  console.log("async1"); // KHÔNG chạy!
  return "async1 success";
}
async function async2() {
  return new Promise((resolve, reject) => {
    console.log("async2");
    reject("error");
  });
}
async1().then((res) => console.log(res));
```

> **Output: `async2` → `Uncaught (in promise) error`**
>
> → reject → await **throw error** → code sau await **KHÔNG chạy**.
> → Fix: dùng `try/catch` hoặc `.catch()` trước await.

---

## 6. Tổng hợp Complex (Q24–Q31)

### Q24: Nested Promise + setTimeout

```javascript
const first = () =>
  new Promise((resolve, reject) => {
    console.log(3);
    let p = new Promise((resolve, reject) => {
      console.log(7);
      setTimeout(() => {
        console.log(5);
        resolve(6);
        console.log(p);
      }, 0);
      resolve(1);
    });
    resolve(2);
    p.then((arg) => {
      console.log(arg);
    });
  });
first().then((arg) => {
  console.log(arg);
});
console.log(4);
```

> **Output: `3 7 4 1 2 5 Promise{<resolved>: 1}`**
>
> → Sync: 3, 7 (resolve(1) cho p), resolve(2) cho first.
> → Sync: 4. Microtask: [p.then(→1), first.then(→2)].
> → Microtask: 1, 2.
> → Macrotask: 5. resolve(6) **bỏ qua** (p đã resolved=1).

### Q25: await pending + value pass-through

```javascript
const async1 = async () => {
  console.log("async1");
  setTimeout(() => {
    console.log("timer1");
  }, 2000);
  await new Promise((resolve) => {
    console.log("promise1");
  });
  console.log("async1 end"); // KHÔNG chạy (pending)
};
console.log("script start");
async1().then((res) => console.log(res));
console.log("script end");
Promise.resolve(1)
  .then(2)
  .then(Promise.resolve(3))
  .catch(4)
  .then((res) => console.log(res));
setTimeout(() => {
  console.log("timer2");
}, 1000);
```

> **Output: `script start async1 promise1 script end 1 timer2 timer1`**

### Q26: finally + timer + Promise chain

```javascript
const p1 = new Promise((resolve) => {
  setTimeout(() => {
    resolve("resolve3");
    console.log("timer1");
  }, 0);
  resolve("resolve1");
  resolve("resolve2");
})
  .then((res) => {
    console.log(res);
    setTimeout(() => {
      console.log(p1);
    }, 1000);
  })
  .finally((res) => {
    console.log("finally", res);
  });
```

> **Output: `resolve1` → `finally undefined` → `timer1` → `Promise{<resolved>: undefined}`**
>
> → resolve chỉ lần đầu (resolve1). finally **không nhận param** (undefined).
> → p1 = `.finally()` return value = `.then()` return (undefined).

### Q27: process.nextTick + Promise — Node.js Event Loop

```javascript
console.log("1");
setTimeout(function () {
  console.log("2");
  process.nextTick(function () {
    console.log("3");
  });
  new Promise(function (resolve) {
    console.log("4");
    resolve();
  }).then(function () {
    console.log("5");
  });
});
process.nextTick(function () {
  console.log("6");
});
new Promise(function (resolve) {
  console.log("7");
  resolve();
}).then(function () {
  console.log("8");
});
setTimeout(function () {
  console.log("9");
  process.nextTick(function () {
    console.log("10");
  });
  new Promise(function (resolve) {
    console.log("11");
    resolve();
  }).then(function () {
    console.log("12");
  });
});
```

> **Output: `1 7 6 8 2 4 3 5 9 11 10 12`**
>
> | Round | Macro              | Micro                  |
> | ----- | ------------------ | ---------------------- |
> | 1     | script: 1, 7       | nextTick: 6, then: 8   |
> | 2     | setTimeout1: 2, 4  | nextTick: 3, then: 5   |
> | 3     | setTimeout2: 9, 11 | nextTick: 10, then: 12 |

### Q28: 3 setTimeout + Promise ordering

```javascript
console.log(1);
setTimeout(() => {
  console.log(2);
});
new Promise((resolve) => {
  console.log(3);
  resolve(4);
}).then((d) => console.log(d));
setTimeout(() => {
  console.log(5);
  new Promise((resolve) => {
    resolve(6);
  }).then((d) => console.log(d));
});
setTimeout(() => {
  console.log(7);
});
console.log(8);
```

> **Output: `1 3 8 4 2 5 6 7`**

### Q29: setTimeout + Promise interleaving

```javascript
console.log(1);
setTimeout(() => {
  console.log(2);
  Promise.resolve().then(() => {
    console.log(3);
  });
});
new Promise((resolve, reject) => {
  console.log(4);
  resolve(5);
}).then((data) => {
  console.log(data);
});
setTimeout(() => {
  console.log(6);
});
console.log(7);
```

> **Output: `1 4 7 5 2 3 6`**

### Q30: throw + catch chain

```javascript
Promise.resolve()
  .then(() => {
    console.log("1");
    throw "Error";
  })
  .then(() => {
    console.log("2");
  })
  .catch(() => {
    console.log("3");
    throw "Error";
  })
  .then(() => {
    console.log("4");
  })
  .catch(() => {
    console.log("5");
  })
  .then(() => {
    console.log("6");
  });
```

> **Output: `1 3 5 6`**
>
> → throw → skip then → catch(3) → throw → skip then → catch(5) → then(6).
> → **Rule: throw/reject → skip .then → tới .catch. Không throw → tiếp .then.**

### Q31: Timer duration matters!

```javascript
setTimeout(function () {
  console.log(1);
}, 100);
new Promise(function (resolve) {
  console.log(2);
  resolve();
  console.log(3);
}).then(function () {
  console.log(4);
  new Promise((resolve, reject) => {
    console.log(5);
    setTimeout(() => {
      console.log(6);
    }, 10);
  });
});
console.log(7);
console.log(8);
```

> **Output: `2 3 7 8 4 5 6 1`**
>
> → Timer 10ms < 100ms → `6` trước `1`.
> → **Chú ý duration timer — không phải lúc nào cũng 0!**

---

## Quick Reference — Async Rules

```
ASYNC RULES — GHI NHỚ:
═══════════════════════════════════════════════════════════════

  ① Promise constructor chạy ĐỒNG BỘ
  ② .then/.catch/.finally là MICROTASK
  ③ setTimeout/setInterval là MACROTASK
  ④ Microtask LUÔN chạy TRƯỚC macrotask
  ⑤ Promise state đổi 1 LẦN DUY NHẤT
  ⑥ .then(non-function) → VALUE PASS-THROUGH
  ⑦ return value → wrap Promise.resolve(value)
  ⑧ return Error ≠ throw Error
  ⑨ await = đặt code sau vào microtask
  ⑩ await pending Promise → BLOCK vĩnh viễn
  ⑪ .finally: luôn chạy, no param, pass-through value
  ⑫ Promise.all: chờ TẤT CẢ, catch FIRST reject
  ⑬ Promise.race: bắt FIRST resolve/reject
  ⑭ process.nextTick > Promise.then (Node.js)
```

---

_Cập nhật lần cuối: Tháng 2, 2026_
