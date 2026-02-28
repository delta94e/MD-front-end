# Snowflake Interview — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> React Grid Robot (Arrow Key Movement, Boundary Check),
> Calculator with Function Definition & Undo/Rollback,
> Command Pattern, HashMap History Stack
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Snowflake Technical Screen (2 rounds × 1hr)

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | Tổng quan quy trình phỏng vấn              |
| 2   | Round 1: Grid Robot — Phân tích            |
| 3   | Grid Robot — React Implementation          |
| 4   | Grid Robot — Nâng cao                      |
| 5   | Round 2: Calculator — Phân tích            |
| 6   | Calculator — Cơ bản (ADD, MUL, SUB, DIV)   |
| 7   | Calculator — Function Definition (FUN/END) |
| 8   | Calculator — Undo/Rollback (INV)           |
| 9   | Calculator — Full Implementation           |
| 10  | Command Pattern & History Stack            |
| 11  | Tóm tắt phỏng vấn                          |

---

## §1. Tổng quan quy trình phỏng vấn

```
SNOWFLAKE — 2 VÒNG TECHNICAL (mỗi vòng 1 giờ!):
═══════════════════════════════════════════════════════════════

  ① ROUND 1 — REACT:
  → Build ROBOT di chuyển trong GRID!
  → Điều khiển bằng ARROW KEYS!
  → Robot PHẢI ở trong grid boundaries!
  → → React + keyboard events + state management!

  ② ROUND 2 — ALGORITHM:
  → Implement CALCULATOR!
  → Input: list of STRING commands!
  → Commands: ADD, MUL, SUB, DIV!
  → Advanced: FUN (define function!) + END!
  → Tricky: INV (UNDO/ROLLBACK function execution!)
  → → HashMap + History Stack + Command Pattern!

  💡 INSIGHT:
  → "Their interviews are NOT EASY!"
  → Round 1: tưởng đơn giản nhưng nhiều edge cases!
  → Round 2: tưởng calculator nhưng thực ra là
     COMMAND PATTERN + UNDO mechanism!
```

---

## §2. Round 1: Grid Robot — Phân tích

```
GRID ROBOT — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  ┌───┬───┬───┬───┬───┐
  │   │   │   │   │   │  5×5 Grid
  ├───┼───┼───┼───┼───┤
  │   │   │   │   │   │
  ├───┼───┼───┼───┼───┤
  │   │   │ 🤖│   │   │  Robot ở giữa!
  ├───┼───┼───┼───┼───┤
  │   │   │   │   │   │
  ├───┼───┼───┼───┼───┤
  │   │   │   │   │   │
  └───┴───┴───┴───┴───┘

  CONTROLS:
  → ↑ ArrowUp: row - 1!
  → ↓ ArrowDown: row + 1!
  → ← ArrowLeft: col - 1!
  → → ArrowRight: col + 1!

  CONSTRAINTS:
  → Robot KHÔNG ĐƯỢC ra ngoài grid!
  → Row: 0 đến rows-1!
  → Col: 0 đến cols-1!

  EDGE CASES:
  □ Robot ở góc trên-trái: ↑ và ← đều BLOCK!
  □ Robot ở góc dưới-phải: ↓ và → đều BLOCK!
  □ Grid sizes khác nhau: 3×3, 5×5, 10×10!
  □ Nhanh tay: nhiều keystrokes liên tục!
  □ Focus: tab away → arrow keys không nên move!
```

---

## §3. Grid Robot — React Implementation

```jsx
// ═══ GRID ROBOT — REACT ═══

import { useState, useEffect, useCallback } from "react";

const GRID_SIZE = 5;

function GridRobot() {
  const [position, setPosition] = useState({
    row: Math.floor(GRID_SIZE / 2),
    col: Math.floor(GRID_SIZE / 2),
  });

  // KEYBOARD HANDLER:
  const handleKeyDown = useCallback((e) => {
    // Prevent page scroll!
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }

    setPosition((prev) => {
      switch (e.key) {
        case "ArrowUp":
          return { ...prev, row: Math.max(0, prev.row - 1) };
        case "ArrowDown":
          return { ...prev, row: Math.min(GRID_SIZE - 1, prev.row + 1) };
        case "ArrowLeft":
          return { ...prev, col: Math.max(0, prev.col - 1) };
        case "ArrowRight":
          return { ...prev, col: Math.min(GRID_SIZE - 1, prev.col + 1) };
        default:
          return prev;
      }
    });
  }, []);

  // ATTACH keyboard listener:
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // RENDER GRID:
  return (
    <div
      className="grid-container"
      tabIndex={0}
      role="application"
      aria-label={`Robot at row ${position.row + 1}, column ${position.col + 1}`}
    >
      <p>Use arrow keys to move the robot</p>
      <div className="grid">
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div key={row} className="row">
            {Array.from({ length: GRID_SIZE }, (_, col) => (
              <div
                key={col}
                className={`cell ${
                  row === position.row && col === position.col ? "robot" : ""
                }`}
              >
                {row === position.row && col === position.col && "🤖"}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p>
        Position: ({position.row}, {position.col})
      </p>
    </div>
  );
}
```

```css
/* ═══ CSS ═══ */

.grid-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  outline: none;
}

.grid {
  display: grid;
  grid-template-rows: repeat(5, 60px);
  gap: 2px;
  background: #333;
  padding: 2px;
  border-radius: 8px;
}

.row {
  display: grid;
  grid-template-columns: repeat(5, 60px);
  gap: 2px;
}

.cell {
  width: 60px;
  height: 60px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: 4px;
  transition: background 0.15s;
}

.cell.robot {
  background: #bbdefb;
  box-shadow: inset 0 0 0 3px #1976d2;
}
```

---

## §4. Grid Robot — Nâng cao

```jsx
// ═══ NÂNG CAO — CÓ THỂ ĐƯỢC HỎI FOLLOW-UP ═══

// ① CONFIGURABLE GRID SIZE:
function GridRobot({ rows = 5, cols = 5 }) {
  const [position, setPosition] = useState({
    row: Math.floor(rows / 2),
    col: Math.floor(cols / 2),
  });

  const handleKeyDown = useCallback(
    (e) => {
      e.preventDefault();
      setPosition((prev) => {
        const moves = {
          ArrowUp: { row: Math.max(0, prev.row - 1), col: prev.col },
          ArrowDown: { row: Math.min(rows - 1, prev.row + 1), col: prev.col },
          ArrowLeft: { row: prev.row, col: Math.max(0, prev.col - 1) },
          ArrowRight: { row: prev.row, col: Math.min(cols - 1, prev.col + 1) },
        };
        return moves[e.key] || prev;
      });
    },
    [rows, cols],
  );

  // ...
}

// ② OBSTACLES:
function GridWithObstacles({ rows, cols, obstacles }) {
  // obstacles = Set of "row,col" strings!
  const obstacleSet = new Set(obstacles.map(([r, c]) => `${r},${c}`));

  const handleKeyDown = useCallback(
    (e) => {
      setPosition((prev) => {
        const nextPos = calculateNextPosition(prev, e.key, rows, cols);
        // Nếu ô tiếp theo là OBSTACLE → BLOCK!
        if (obstacleSet.has(`${nextPos.row},${nextPos.col}`)) {
          return prev; // Không move!
        }
        return nextPos;
      });
    },
    [rows, cols, obstacleSet],
  );
}

// ③ MOVEMENT HISTORY (Undo!):
function GridWithHistory() {
  const [history, setHistory] = useState([{ row: 2, col: 2 }]);
  const position = history[history.length - 1];

  const move = (newPos) => {
    setHistory((prev) => [...prev, newPos]);
  };

  const undo = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  // → Ctrl+Z → undo()!
}

// ④ TRAIL/PATH VISUALIZATION:
function GridWithTrail() {
  const [position, setPosition] = useState({ row: 2, col: 2 });
  const [visited, setVisited] = useState(new Set(["2,2"]));

  const handleMove = (newPos) => {
    setPosition(newPos);
    setVisited((prev) => new Set([...prev, `${newPos.row},${newPos.col}`]));
  };

  // Render: cell có class "visited" nếu đã đi qua!
}
```

```
FOLLOW-UP QUESTIONS CÓ THỂ GẶP:
═══════════════════════════════════════════════════════════════

  Q: "Tại sao dùng window.addEventListener thay vì onKeyDown trên div?"
  A: onKeyDown cần div FOCUSED! Dễ mất focus!
  → window listener: luôn hoạt động bất kể focus!
  → Nhưng NHỚ cleanup trong useEffect return!

  Q: "Optimize re-renders?"
  A: Chỉ cell THAY ĐỔI nên re-render!
  → React.memo cho Cell component!
  → Truyền isRobot prop (boolean, not object!)

  Q: "Handle giữ phím (key repeat)?"
  A: Browser tự fire keydown liên tục!
  → Muốn control tốc độ: throttle handleKeyDown!
  → Hoặc: track keyState, move trong requestAnimationFrame!
```

---

## §5. Round 2: Calculator — Phân tích

```
CALCULATOR — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  Input: DANH SÁCH STRING commands!
  Register: 1 giá trị (bắt đầu = 0!)
  Output: giá trị cuối cùng!

  COMMANDS:
  ┌────────────┬──────────────────────────────────────────┐
  │ Command    │ Mô tả                                    │
  ├────────────┼──────────────────────────────────────────┤
  │ ADD n      │ register += n                             │
  │ SUB n      │ register -= n                             │
  │ MUL n      │ register *= n                             │
  │ DIV n      │ register /= n (integer division!)         │
  ├────────────┼──────────────────────────────────────────┤
  │ FUN name   │ BẮT ĐẦU define function "name"!          │
  │ ...        │ Commands bên trong function!              │
  │ END        │ KẾT THÚC define function!                 │
  ├────────────┼──────────────────────────────────────────┤
  │ CALL name  │ Execute function "name"!                  │
  │ INV name   │ UNDO/ROLLBACK lần CALL cuối của "name"!  │
  └────────────┴──────────────────────────────────────────┘

  VÍ DỤ:
  const input = [
      "ADD 1",           // register = 0 + 1 = 1
      "FUN INCREMENT",   // Define function INCREMENT
      "ADD 1",           //   (body: ADD 1)
      "MUL 2",           //   (body: MUL 2)
      "END",             // End definition
      "CALL INCREMENT",  // Execute: 1 + 1 = 2, 2 * 2 = 4
      "INV INCREMENT",   // UNDO! Rollback to 1!
  ];
  // Kết quả: 1!

  ⚠️ TRICKY PART:
  → FUN/END: chỉ DEFINE, KHÔNG execute!
  → INV: phải ROLLBACK chính xác giá trị TRƯỚC khi CALL!
  → → Cần lưu HISTORY mỗi lần CALL!
  → → HashMap: functionName → [valueBeforeCall1, valueBeforeCall2, ...]!
```

---

## §6. Calculator — Cơ bản (ADD, MUL, SUB, DIV)

```javascript
// ═══ STEP 1: BASIC CALCULATOR ═══

function calculator(commands) {
  let register = 0;

  for (const cmd of commands) {
    const parts = cmd.split(" ");
    const op = parts[0];
    const val = parseInt(parts[1], 10);

    switch (op) {
      case "ADD":
        register += val;
        break;
      case "SUB":
        register -= val;
        break;
      case "MUL":
        register *= val;
        break;
      case "DIV":
        register = Math.trunc(register / val); // Integer division!
        break;
    }
  }

  return register;
}

// TEST:
calculator(["ADD 5", "MUL 3", "SUB 2"]);
// 0 + 5 = 5, 5 * 3 = 15, 15 - 2 = 13 → 13!
```

---

## §7. Calculator — Function Definition (FUN/END)

```javascript
// ═══ STEP 2: FUNCTION DEFINITION ═══

function calculator(commands) {
  let register = 0;
  const functions = new Map(); // name → [commands]!

  let currentFn = null; // Đang define function nào?
  let fnBody = []; // Commands trong function!

  for (const cmd of commands) {
    const parts = cmd.split(" ");
    const op = parts[0];

    // ① ĐANG DEFINE FUNCTION:
    if (currentFn !== null) {
      if (op === "END") {
        // Kết thúc definition!
        functions.set(currentFn, [...fnBody]);
        currentFn = null;
        fnBody = [];
      } else {
        // Thu thập commands vào body!
        fnBody.push(cmd);
      }
      continue;
    }

    // ② BẮT ĐẦU DEFINE FUNCTION:
    if (op === "FUN") {
      currentFn = parts[1];
      fnBody = [];
      continue;
    }

    // ③ CALL FUNCTION:
    if (op === "CALL") {
      const fnName = parts[1];
      const body = functions.get(fnName);
      if (body) {
        // Execute body commands trên register:
        for (const bodyCmd of body) {
          register = executeOp(register, bodyCmd);
        }
      }
      continue;
    }

    // ④ EXECUTE basic command:
    register = executeOp(register, cmd);
  }

  return register;
}

function executeOp(register, cmd) {
  const [op, valStr] = cmd.split(" ");
  const val = parseInt(valStr, 10);

  switch (op) {
    case "ADD":
      return register + val;
    case "SUB":
      return register - val;
    case "MUL":
      return register * val;
    case "DIV":
      return Math.trunc(register / val);
    default:
      return register;
  }
}

// TEST:
calculator([
  "ADD 1", // register = 1
  "FUN DOUBLE", // Define: DOUBLE
  "MUL 2", //   body: MUL 2
  "END", // End definition
  "CALL DOUBLE", // Execute: 1 * 2 = 2
  "CALL DOUBLE", // Execute: 2 * 2 = 4
]);
// → 4!
```

---

## §8. Calculator — Undo/Rollback (INV)

```
INV (UNDO) — BẪY CHÍNH CỦA BÀI:
═══════════════════════════════════════════════════════════════

  INV name = UNDO lần CALL CUỐI CÙNG của function "name"!
  → Phải ROLLBACK register về giá trị TRƯỚC khi CALL!

  CÁCH LÀM:
  → Mỗi lần CALL: LƯU register TRƯỚC KHI execute!
  → HashMap: functionName → STACK of saved values!
  → INV: POP giá trị cuối từ stack → restore!

  VÍ DỤ TRACE:
  "ADD 1"            → register = 1
  "FUN INCREMENT"    → define...
  "ADD 1"
  "MUL 2"
  "END"
  "CALL INCREMENT"   → save 1! execute: 1+1=2, 2*2=4 → register = 4
  "ADD 10"           → register = 14
  "CALL INCREMENT"   → save 14! execute: 14+1=15, 15*2=30 → register = 30
  "INV INCREMENT"    → POP! restore 14! → register = 14
  "INV INCREMENT"    → POP! restore 1! → register = 1
```

```javascript
// ═══ STEP 3: INV — UNDO/ROLLBACK ═══

function calculator(commands) {
  let register = 0;
  const functions = new Map(); // name → [commands]
  const callHistory = new Map(); // name → [savedValues] STACK!

  let currentFn = null;
  let fnBody = [];

  for (const cmd of commands) {
    const parts = cmd.split(" ");
    const op = parts[0];

    // ① ĐANG DEFINE FUNCTION:
    if (currentFn !== null) {
      if (op === "END") {
        functions.set(currentFn, [...fnBody]);
        currentFn = null;
        fnBody = [];
      } else {
        fnBody.push(cmd);
      }
      continue;
    }

    // ② BẮT ĐẦU DEFINE:
    if (op === "FUN") {
      currentFn = parts[1];
      fnBody = [];
      continue;
    }

    // ③ CALL — Execute + SAVE history!
    if (op === "CALL") {
      const fnName = parts[1];
      const body = functions.get(fnName);
      if (body) {
        // ⚠️ SAVE register TRƯỚC KHI execute!
        if (!callHistory.has(fnName)) {
          callHistory.set(fnName, []);
        }
        callHistory.get(fnName).push(register); // PUSH!

        // Execute:
        for (const bodyCmd of body) {
          register = executeOp(register, bodyCmd);
        }
      }
      continue;
    }

    // ④ INV — UNDO lần CALL cuối!
    if (op === "INV") {
      const fnName = parts[1];
      const history = callHistory.get(fnName);
      if (history && history.length > 0) {
        // POP giá trị đã lưu → RESTORE!
        register = history.pop();
      }
      continue;
    }

    // ⑤ Basic operation:
    register = executeOp(register, cmd);
  }

  return register;
}

function executeOp(register, cmd) {
  const [op, valStr] = cmd.split(" ");
  const val = parseInt(valStr, 10);
  switch (op) {
    case "ADD":
      return register + val;
    case "SUB":
      return register - val;
    case "MUL":
      return register * val;
    case "DIV":
      return Math.trunc(register / val);
    default:
      return register;
  }
}
```

---

## §9. Calculator — Full Implementation

```javascript
// ═══ FULL CALCULATOR — PRODUCTION READY ═══

function calculator(commands) {
  let register = 0;
  const functions = new Map(); // name → [bodyCommands]
  const callHistory = new Map(); // name → [savedRegisterValues]

  let definingFn = null; // Currently defining function name
  let fnBody = []; // Current function body being built
  let nestLevel = 0; // Nested FUN support!

  for (const cmd of commands) {
    const parts = cmd.trim().split(/\s+/);
    const op = parts[0].toUpperCase();

    // ═══ DEFINING MODE ═══
    if (definingFn !== null) {
      if (op === "FUN") {
        // Nested function definition!
        nestLevel++;
        fnBody.push(cmd);
      } else if (op === "END") {
        if (nestLevel > 0) {
          // Closing nested FUN!
          nestLevel--;
          fnBody.push(cmd);
        } else {
          // Closing TOP-LEVEL FUN!
          functions.set(definingFn, [...fnBody]);
          definingFn = null;
          fnBody = [];
        }
      } else {
        fnBody.push(cmd);
      }
      continue;
    }

    // ═══ NORMAL MODE ═══
    switch (op) {
      case "FUN": {
        definingFn = parts[1];
        fnBody = [];
        nestLevel = 0;
        break;
      }
      case "CALL": {
        const fnName = parts[1];
        const body = functions.get(fnName);
        if (!body) {
          throw new Error(`Undefined function: ${fnName}`);
        }
        // Save state BEFORE execution:
        if (!callHistory.has(fnName)) callHistory.set(fnName, []);
        callHistory.get(fnName).push(register);

        // Execute body (recursive! body có thể chứa CALL!):
        for (const bodyCmd of body) {
          register = executeCommand(register, bodyCmd, functions, callHistory);
        }
        break;
      }
      case "INV": {
        const fnName = parts[1];
        const history = callHistory.get(fnName);
        if (!history || history.length === 0) {
          throw new Error(`No call to undo for: ${fnName}`);
        }
        register = history.pop();
        break;
      }
      default: {
        register = executeOp(register, cmd);
      }
    }
  }

  return register;
}

// Helper cho recursive CALL:
function executeCommand(register, cmd, functions, callHistory) {
  const parts = cmd.trim().split(/\s+/);
  const op = parts[0].toUpperCase();

  if (op === "CALL") {
    const fnName = parts[1];
    const body = functions.get(fnName);
    if (!body) throw new Error(`Undefined function: ${fnName}`);

    if (!callHistory.has(fnName)) callHistory.set(fnName, []);
    callHistory.get(fnName).push(register);

    for (const bodyCmd of body) {
      register = executeCommand(register, bodyCmd, functions, callHistory);
    }
    return register;
  }

  return executeOp(register, cmd);
}

function executeOp(register, cmd) {
  const [op, valStr] = cmd.trim().split(/\s+/);
  const val = parseInt(valStr, 10);
  switch (op.toUpperCase()) {
    case "ADD":
      return register + val;
    case "SUB":
      return register - val;
    case "MUL":
      return register * val;
    case "DIV":
      if (val === 0) throw new Error("Division by zero");
      return Math.trunc(register / val);
    default:
      throw new Error(`Unknown operation: ${op}`);
  }
}
```

```
TEST CASES:
═══════════════════════════════════════════════════════════════

  ① BASIC:
  calculator(["ADD 5", "MUL 3", "SUB 2"])
  → 0+5=5, 5*3=15, 15-2=13 → 13!

  ② FUNCTION CALL:
  calculator(["ADD 10", "FUN HALF", "DIV 2", "END", "CALL HALF"])
  → 0+10=10, define HALF = [DIV 2], CALL HALF: 10/2=5 → 5!

  ③ MULTIPLE CALLS:
  calculator(["ADD 1", "FUN DBL", "MUL 2", "END", "CALL DBL", "CALL DBL"])
  → 0+1=1, CALL: 1*2=2, CALL: 2*2=4 → 4!

  ④ INV (UNDO!):
  calculator([
      "ADD 1",
      "FUN INC", "ADD 1", "MUL 2", "END",
      "CALL INC",       // save 1, exec: 1+1=2, 2*2=4
      "INV INC",        // restore 1!
  ])
  → 1!

  ⑤ MULTIPLE INV:
  calculator([
      "ADD 5",
      "FUN X", "ADD 10", "END",
      "CALL X",          // save 5, exec: 5+10=15
      "ADD 100",         // 15+100=115
      "CALL X",          // save 115, exec: 115+10=125
      "INV X",           // restore 115!
      "INV X",           // restore 5!
  ])
  → 5!

  ⑥ NESTED FUNCTION CALLS:
  calculator([
      "ADD 1",
      "FUN A", "ADD 1", "END",
      "FUN B", "CALL A", "MUL 10", "END",
      "CALL B",           // CALL A (save 1, 1+1=2), 2*10=20
  ])
  → 20!
```

---

## §10. Command Pattern & History Stack

```
COMMAND PATTERN — DESIGN PATTERN:
═══════════════════════════════════════════════════════════════

  Bài này sử dụng COMMAND PATTERN:
  → Mỗi command = 1 action có thể EXECUTE và UNDO!
  → History = STACK of executed commands!
  → Undo = POP từ stack + reverse!

  TRONG BÀI SNOWFLAKE:
  → Command = string "ADD 1", "MUL 2"...
  → Execute = thay đổi register!
  → Undo = KHÔNG reverse từng operation (phức tạp!)
      → SNAPSHOT: lưu register value TRƯỚC execute!
      → Undo = restore snapshot! (đơn giản hơn!)

  SNAPSHOT vs COMMAND REVERSAL:
  ┌────────────────────┬──────────────────────────────────┐
  │ Snapshot (bài này!)│ Command Reversal                 │
  ├────────────────────┼──────────────────────────────────┤
  │ Lưu VALUE trước    │ Lưu INVERSE operation            │
  │ Undo = restore!    │ Undo = execute inverse!          │
  │ ✅ Đơn giản!       │ ❌ Phức tạp (MUL→DIV có rounding)│
  │ ❌ Tốn memory!     │ ✅ Tiết kiệm hơn!               │
  │ ✅ Luôn chính xác! │ ❌ Rounding error (DIV/MUL!)    │
  └────────────────────┴──────────────────────────────────┘

  → SNAPSHOT tốt hơn cho calculator vì:
  → DIV (integer) → MUL KHÔNG thể reverse chính xác!
  → VD: 5 DIV 2 = 2, nhưng 2 MUL 2 = 4 ≠ 5! ❌
```

```
DATA STRUCTURES USED:
═══════════════════════════════════════════════════════════════

  functions: Map<string, string[]>
  → Lưu TÊN → BODY commands!
  → VD: "INCREMENT" → ["ADD 1", "MUL 2"]

  callHistory: Map<string, number[]>
  → Lưu TÊN → STACK of saved register values!
  → VD: "INCREMENT" → [1, 14]
  → INV: pop() → restore!

  TỔNG HỢP:
  → Map = O(1) lookup!
  → Stack (array) = O(1) push/pop!
  → Overall time: O(N × M) với N=commands, M=max function length!
  → Space: O(N) cho history!
```

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  □ INV function chưa CALL → error hoặc no-op?
  □ CALL function chưa DEFINE → error!
  □ Division by zero → error!
  □ Nested functions: FUN bên trong FUN?
  □ CALL recursive (A calls A?) → infinite loop!
  □ Empty function body: FUN X, END → no-op!
  □ Negative numbers: ADD -5?
  □ Multiple INV: đủ history? Stack empty!
  □ INV rồi CALL lại → history mới!
```

---

## §11. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Grid Robot?"
  A: React + useState(position) + useEffect(keydown listener).
  Math.max/min cho boundary check.
  Memoize Cell với React.memo.
  Prevent default arrow key scroll!

  Q: "Calculator basic?"
  A: Switch/case trên operation string.
  parseInt cho value. Math.trunc cho integer DIV!

  Q: "Function definition?"
  A: FUN → bật defining mode, thu thập commands vào array.
  END → lưu vào Map<name, body>.
  CALL → iterate body, executeOp mỗi command.
  Hỗ trợ nested: track nestLevel!

  Q: "INV/Undo?"
  A: SNAPSHOT approach! Mỗi CALL → push(register) vào stack.
  INV → pop() + restore register.
  Snapshot > reversal vì integer DIV không reversible!

  Q: "Data structures?"
  A: Map<name, commands[]> cho functions.
  Map<name, number[]> cho call history (stack!).
  O(1) lookup + O(1) push/pop!
```

---

### Checklist

- [ ] **Grid Robot**: useState(position), useEffect(keydown), Math.max/min boundary, prevent default scroll!
- [ ] **Grid rendering**: 2D array, className="robot" khi position match, CSS grid layout!
- [ ] **Grid follow-ups**: obstacles (Set), movement history (undo), trail visualization, configurable size!
- [ ] **Calculator basic**: switch/case, parseInt, Math.trunc cho DIV, register = 0 ban đầu!
- [ ] **FUN/END**: defining mode flag, thu thập body commands, lưu vào Map, nested level tracking!
- [ ] **CALL**: lookup function body từ Map, iterate + executeOp, hỗ trợ recursive CALL!
- [ ] **INV/Undo**: **SNAPSHOT approach**! Push register TRƯỚC CALL vào stack, INV = pop + restore!
- [ ] **Tại sao Snapshot**: DIV integer không reversible (5/2=2, 2×2=4≠5!); snapshot luôn chính xác!
- [ ] **Data structures**: Map<name, string[]> functions + Map<name, number[]> history stack; O(1)!
- [ ] **Edge cases**: undefined function, div by zero, empty body, nested FUN, INV khi stack empty!

---

_Nguồn: Reddit — Snowflake interview experience_
_Cập nhật lần cuối: Tháng 2, 2026_
