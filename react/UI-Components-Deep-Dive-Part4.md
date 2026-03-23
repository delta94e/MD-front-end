# UI Components Deep Dive — Phần 4: Calculator, Square Game, Typeahead, Heatmap, Progress Bar, Upload

> 📅 2026-03-09 · ⏱ 55 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Calculator, Square Game, Typeahead, Heatmap, Progress Bar, Upload
> Version: Vanilla JavaScript + React + Web Component
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component    | Vanilla JS | React | Advanced Patterns | Web Component |
| --- | ------------ | ---------- | ----- | ----------------- | ------------- |
| 11  | Calculator   | §11.1      | §11.2 | §11.3             | §11.4         |
| 12  | Square Game  | §12.1      | §12.2 | §12.3             | §12.4         |
| 13  | Typeahead    | §13.1      | §13.2 | §13.3             | §13.4         |
| 14  | Heatmap      | §14.1      | §14.2 | §14.3             | §14.4         |
| 15  | Progress Bar | §15.1      | §15.2 | §15.3             | §15.4         |
| 16  | Upload       | §16.1      | §16.2 | §16.3             | §16.4         |

---

# 🔢 Component 11: Calculator

## Kiến Trúc Calculator

```
CALCULATOR:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────┐
  │                    123.45        │  ← Display (kết quả)
  ├──────────────────────────────────┤
  │  AC  │  ±   │  %   │  ÷   │    │
  ├──────┼──────┼──────┼──────┤    │
  │  7   │  8   │  9   │  ×   │    │
  ├──────┼──────┼──────┼──────┤    │
  │  4   │  5   │  6   │  -   │    │
  ├──────┼──────┼──────┼──────┤    │
  │  1   │  2   │  3   │  +   │    │
  ├──────┴──────┼──────┼──────┤    │
  │     0       │  .   │  =   │    │
  └─────────────┴──────┴──────┘    │

  STATE MACHINE:
  ┌─────────┐  digit  ┌──────────┐  operator  ┌──────────┐
  │ INITIAL │───────→│ OPERAND1 │──────────→│ OPERATOR │
  └─────────┘        └──────────┘           └──────────┘
       ↑                                        │ digit
       │              ┌──────────┐              ↓
       └────────────│  RESULT  │←── = ───┌──────────┐
          AC        └──────────┘        │ OPERAND2 │
                                        └──────────┘

  Key Concepts:
  • State machine (trạng thái máy!)
  • Xử lý edge cases (chia 0, số thập phân, số âm)
  • Keyboard support (phím số, Enter = "=")
  • Chaining operations (1 + 2 + 3 = 6)
```

---

## §11.1 Calculator — Vanilla JavaScript

```css
.calculator {
  max-width: 320px;
  font-family: system-ui, sans-serif;
  background: #1a1a2e;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.calc-display {
  background: #16213e;
  color: #e2e8f0;
  text-align: right;
  padding: 20px;
  font-size: 36px;
  border-radius: 10px;
  margin-bottom: 16px;
  min-height: 60px;
  overflow: hidden;
  word-break: break-all;
}
.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.calc-btn {
  padding: 18px;
  font-size: 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
}
.calc-btn:active {
  transform: scale(0.95);
}
.calc-btn.number {
  background: #2d3748;
  color: #e2e8f0;
}
.calc-btn.number:hover {
  background: #4a5568;
}
.calc-btn.operator {
  background: #e67e22;
  color: #fff;
}
.calc-btn.operator:hover {
  background: #f39c12;
}
.calc-btn.function {
  background: #4a5568;
  color: #e2e8f0;
}
.calc-btn.function:hover {
  background: #718096;
}
.calc-btn.zero {
  grid-column: span 2;
}
.calc-btn.equals {
  background: #27ae60;
  color: #fff;
}
.calc-btn.equals:hover {
  background: #2ecc71;
}
.calc-btn.active-op {
  background: #fff;
  color: #e67e22;
}
```

```javascript
// ═══ Vanilla JS Calculator ═══

class Calculator {
  constructor(container) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    // STATE:
    this.currentOperand = "0"; // số đang nhập / hiển thị
    this.previousOperand = ""; // số trước (đã bấm operator)
    this.operation = null; // +, -, ×, ÷
    this.shouldResetScreen = false;
    // shouldResetScreen: sau khi bấm operator hoặc =,
    // digit tiếp theo THAY THẾ display thay vì nối thêm!

    this._render();
    this._setupKeyboard();
  }

  _render() {
    this.container.className = "calculator";
    this.container.innerHTML = `
      <div class="calc-display">0</div>
      <div class="calc-grid">
        <button class="calc-btn function" data-action="clear">AC</button>
        <button class="calc-btn function" data-action="toggle-sign">±</button>
        <button class="calc-btn function" data-action="percent">%</button>
        <button class="calc-btn operator" data-action="operator" data-op="÷">÷</button>
        <button class="calc-btn number" data-action="digit" data-digit="7">7</button>
        <button class="calc-btn number" data-action="digit" data-digit="8">8</button>
        <button class="calc-btn number" data-action="digit" data-digit="9">9</button>
        <button class="calc-btn operator" data-action="operator" data-op="×">×</button>
        <button class="calc-btn number" data-action="digit" data-digit="4">4</button>
        <button class="calc-btn number" data-action="digit" data-digit="5">5</button>
        <button class="calc-btn number" data-action="digit" data-digit="6">6</button>
        <button class="calc-btn operator" data-action="operator" data-op="-">-</button>
        <button class="calc-btn number" data-action="digit" data-digit="1">1</button>
        <button class="calc-btn number" data-action="digit" data-digit="2">2</button>
        <button class="calc-btn number" data-action="digit" data-digit="3">3</button>
        <button class="calc-btn operator" data-action="operator" data-op="+">+</button>
        <button class="calc-btn number zero" data-action="digit" data-digit="0">0</button>
        <button class="calc-btn number" data-action="decimal">.</button>
        <button class="calc-btn equals" data-action="equals">=</button>
      </div>
    `;

    this.display = this.container.querySelector(".calc-display");

    // Event Delegation — 1 listener cho TẤT CẢ buttons!
    this.container
      .querySelector(".calc-grid")
      .addEventListener("click", (e) => {
        const btn = e.target.closest(".calc-btn");
        if (!btn) return;

        const action = btn.dataset.action;
        if (action === "digit") this._inputDigit(btn.dataset.digit);
        else if (action === "decimal") this._inputDecimal();
        else if (action === "operator") this._handleOperator(btn.dataset.op);
        else if (action === "equals") this._calculate();
        else if (action === "clear") this._clear();
        else if (action === "toggle-sign") this._toggleSign();
        else if (action === "percent") this._percent();

        this._updateDisplay();
      });
  }

  _inputDigit(digit) {
    if (this.shouldResetScreen) {
      this.currentOperand = digit;
      this.shouldResetScreen = false;
    } else {
      // Tránh "007" — nếu display = "0", thay thế!
      this.currentOperand =
        this.currentOperand === "0" ? digit : this.currentOperand + digit;
    }
  }

  _inputDecimal() {
    if (this.shouldResetScreen) {
      this.currentOperand = "0.";
      this.shouldResetScreen = false;
      return;
    }
    // Chỉ cho 1 dấu chấm!
    if (this.currentOperand.includes(".")) return;
    this.currentOperand += ".";
  }

  _handleOperator(op) {
    // Nếu đã có operation trước → calculate trước rồi mới set op mới!
    // Đây là CHAINING: 1 + 2 + 3 → khi bấm "+" lần 2, tính 1+2=3 trước!
    if (this.operation && !this.shouldResetScreen) {
      this._calculate();
    }
    this.previousOperand = this.currentOperand;
    this.operation = op;
    this.shouldResetScreen = true;

    // Highlight operator đang active:
    this.container
      .querySelectorAll(".operator")
      .forEach((b) => b.classList.remove("active-op"));
    const activeBtn = this.container.querySelector(`[data-op="${op}"]`);
    if (activeBtn) activeBtn.classList.add("active-op");
  }

  _calculate() {
    if (!this.operation) return;
    const prev = parseFloat(this.previousOperand);
    const curr = parseFloat(this.currentOperand);

    let result;
    switch (this.operation) {
      case "+":
        result = prev + curr;
        break;
      case "-":
        result = prev - curr;
        break;
      case "×":
        result = prev * curr;
        break;
      case "÷":
        if (curr === 0) {
          this.currentOperand = "Error";
          this.operation = null;
          return;
        }
        result = prev / curr;
        break;
    }

    // Xử lý floating point: 0.1 + 0.2 = 0.30000000000000004!
    this.currentOperand = String(
      Math.round(result * 1e12) / 1e12, // làm tròn 12 chữ số!
    );
    this.operation = null;
    this.shouldResetScreen = true;
    // Clear highlight:
    this.container
      .querySelectorAll(".operator")
      .forEach((b) => b.classList.remove("active-op"));
  }

  _clear() {
    this.currentOperand = "0";
    this.previousOperand = "";
    this.operation = null;
    this.shouldResetScreen = false;
    this.container
      .querySelectorAll(".operator")
      .forEach((b) => b.classList.remove("active-op"));
  }

  _toggleSign() {
    if (this.currentOperand === "0") return;
    this.currentOperand = String(-parseFloat(this.currentOperand));
  }

  _percent() {
    this.currentOperand = String(parseFloat(this.currentOperand) / 100);
  }

  _updateDisplay() {
    this.display.textContent = this.currentOperand;
  }

  _setupKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key >= "0" && e.key <= "9") this._inputDigit(e.key);
      else if (e.key === ".") this._inputDecimal();
      else if (e.key === "+") this._handleOperator("+");
      else if (e.key === "-") this._handleOperator("-");
      else if (e.key === "*") this._handleOperator("×");
      else if (e.key === "/") {
        e.preventDefault();
        this._handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") this._calculate();
      else if (e.key === "Escape") this._clear();
      else if (e.key === "Backspace") {
        this.currentOperand = this.currentOperand.slice(0, -1) || "0";
      }
      this._updateDisplay();
    });
  }
}

// Usage:
const calc = new Calculator("#calculator");
```

### 📖 RADIO Walkthrough — Calculator

> **R — Requirements:** Máy tính cơ bản 4 phép tính, dấu chấm thập phân, đổi dấu, phần trăm, keyboard support, chaining (1+2+3=6).

> **A — Architecture:** State machine 4 trạng thái: INITIAL → OPERAND1 → OPERATOR → OPERAND2 (→ RESULT). Class `Calculator` quản lý state: `currentOperand`, `previousOperand`, `operation`.

> **I — Implementation:**

**`shouldResetScreen` — tại sao cần?**

Khi bấm `5 + `: display hiện "5". Bấm `3`: display phải hiện "3" (thay thế!), KHÔNG phải "53" (nối!). `shouldResetScreen = true` sau khi bấm operator → digit tiếp theo THAY THẾ thay vì nối.

**Chaining — `_handleOperator()` gọi `_calculate()` trước:**

```
User bấm: 1 + 2 + 3 =
Bước 1: "1" → bấm "+" → prev="1", op="+"
Bước 2: "2" → bấm "+" → operation đang có!
         → _calculate() → 1+2=3 → prev="3", op="+"
Bước 3: "3" → bấm "=" → 3+3=6!
```

**Floating point fix:** `0.1 + 0.2 = 0.30000000000000004` trong JS! Ta dùng `Math.round(result * 1e12) / 1e12` để làm tròn 12 chữ số — loại bỏ lỗi floating point nhưng vẫn giữ độ chính xác.

**Event Delegation:** 1 listener trên `.calc-grid` thay vì 19 listeners cho 19 buttons! `e.target.closest('.calc-btn')` tìm button gần nhất từ element được click. `dataset.action` cho biết hành động.

---

## §11.2 Calculator — React

```javascript
// ═══ React Calculator ═══
import { useState, useCallback, useEffect } from "react";

function useCalculator() {
  const [display, setDisplay] = useState("0");
  const [previousOperand, setPrevious] = useState("");
  const [operation, setOperation] = useState(null);
  const [shouldReset, setShouldReset] = useState(false);

  const inputDigit = useCallback(
    (digit) => {
      setDisplay((prev) => {
        if (shouldReset) {
          setShouldReset(false);
          return digit;
        }
        return prev === "0" ? digit : prev + digit;
      });
    },
    [shouldReset],
  );

  const inputDecimal = useCallback(() => {
    if (shouldReset) {
      setDisplay("0.");
      setShouldReset(false);
      return;
    }
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
  }, [shouldReset]);

  const calculate = useCallback((prev, curr, op) => {
    const a = parseFloat(prev),
      b = parseFloat(curr);
    let r;
    switch (op) {
      case "+":
        r = a + b;
        break;
      case "-":
        r = a - b;
        break;
      case "×":
        r = a * b;
        break;
      case "÷":
        r = b === 0 ? "Error" : a / b;
        break;
      default:
        return curr;
    }
    return r === "Error" ? r : String(Math.round(r * 1e12) / 1e12);
  }, []);

  const handleOperator = useCallback(
    (op) => {
      setDisplay((curr) => {
        if (operation && !shouldReset) {
          const result = calculate(previousOperand, curr, operation);
          setPrevious(result);
          setOperation(op);
          setShouldReset(true);
          return result;
        }
        setPrevious(curr);
        setOperation(op);
        setShouldReset(true);
        return curr;
      });
    },
    [operation, shouldReset, previousOperand, calculate],
  );

  const handleEquals = useCallback(() => {
    if (!operation) return;
    setDisplay((curr) => {
      const result = calculate(previousOperand, curr, operation);
      setOperation(null);
      setShouldReset(true);
      return result;
    });
  }, [operation, previousOperand, calculate]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPrevious("");
    setOperation(null);
    setShouldReset(false);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => (prev === "0" ? "0" : String(-parseFloat(prev))));
  }, []);

  const percent = useCallback(() => {
    setDisplay((prev) => String(parseFloat(prev) / 100));
  }, []);

  // Keyboard:
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDecimal();
      else if (e.key === "+") handleOperator("+");
      else if (e.key === "-") handleOperator("-");
      else if (e.key === "*") handleOperator("×");
      else if (e.key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (e.key === "Enter") handleEquals();
      else if (e.key === "Escape") clear();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [inputDigit, inputDecimal, handleOperator, handleEquals, clear]);

  return {
    display,
    operation,
    inputDigit,
    inputDecimal,
    handleOperator,
    handleEquals,
    clear,
    toggleSign,
    percent,
  };
}

function CalculatorApp() {
  const calc = useCalculator();
  const buttons = [
    { label: "AC", action: calc.clear, type: "function" },
    { label: "±", action: calc.toggleSign, type: "function" },
    { label: "%", action: calc.percent, type: "function" },
    { label: "÷", action: () => calc.handleOperator("÷"), type: "operator" },
    ...["7", "8", "9"].map((d) => ({
      label: d,
      action: () => calc.inputDigit(d),
      type: "number",
    })),
    { label: "×", action: () => calc.handleOperator("×"), type: "operator" },
    ...["4", "5", "6"].map((d) => ({
      label: d,
      action: () => calc.inputDigit(d),
      type: "number",
    })),
    { label: "-", action: () => calc.handleOperator("-"), type: "operator" },
    ...["1", "2", "3"].map((d) => ({
      label: d,
      action: () => calc.inputDigit(d),
      type: "number",
    })),
    { label: "+", action: () => calc.handleOperator("+"), type: "operator" },
    { label: "0", action: () => calc.inputDigit("0"), type: "number zero" },
    { label: ".", action: calc.inputDecimal, type: "number" },
    { label: "=", action: calc.handleEquals, type: "equals" },
  ];

  return (
    <div className="calculator">
      <div className="calc-display">{calc.display}</div>
      <div className="calc-grid">
        {buttons.map((b, i) => (
          <button
            key={i}
            className={`calc-btn ${b.type} ${calc.operation === b.label ? "active-op" : ""}`}
            onClick={b.action}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### §11.3 Advanced React Patterns — Calculator

```javascript
// ═══ PATTERN 1: useReducer cho state machine ═══
function calcReducer(state, action) {
  switch (action.type) {
    case "DIGIT":
      return {
        ...state,
        display: state.shouldReset
          ? action.digit
          : state.display === "0"
            ? action.digit
            : state.display + action.digit,
        shouldReset: false,
      };
    case "OPERATOR": {
      if (state.operation && !state.shouldReset) {
        const result = compute(state.previous, state.display, state.operation);
        return {
          display: result,
          previous: result,
          operation: action.op,
          shouldReset: true,
        };
      }
      return {
        ...state,
        previous: state.display,
        operation: action.op,
        shouldReset: true,
      };
    }
    case "EQUALS": {
      if (!state.operation) return state;
      const result = compute(state.previous, state.display, state.operation);
      return {
        display: result,
        previous: "",
        operation: null,
        shouldReset: true,
      };
    }
    case "CLEAR":
      return {
        display: "0",
        previous: "",
        operation: null,
        shouldReset: false,
      };
    default:
      return state;
  }
}

// ═══ PATTERN 2: History (undo!) ═══
function useCalcHistory() {
  const [history, setHistory] = useState([]);
  const addEntry = useCallback((expr, result) => {
    setHistory((prev) =>
      [{ expr, result, time: Date.now() }, ...prev].slice(0, 20),
    );
  }, []);
  return { history, addEntry };
}
```

---

## §11.4 Calculator — Web Component

```javascript
class MyCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._display = "0";
    this._previous = "";
    this._operation = null;
    this._shouldReset = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 320px; font-family: system-ui, sans-serif; }
        .calc { background: #1a1a2e; border-radius: 16px; padding: 20px; }
        .display { background: #16213e; color: #e2e8f0; text-align: right;
                   padding: 20px; font-size: 36px; border-radius: 10px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        button { padding: 18px; font-size: 20px; border: none; border-radius: 10px; cursor: pointer; }
        .num { background: #2d3748; color: #e2e8f0; }
        .op { background: #e67e22; color: #fff; }
        .fn { background: #4a5568; color: #e2e8f0; }
        .eq { background: #27ae60; color: #fff; }
        .zero { grid-column: span 2; }
        button:active { transform: scale(0.95); }
      </style>
      <div class="calc">
        <div class="display">0</div>
        <div class="grid">
          <button class="fn" data-a="clear">AC</button>
          <button class="fn" data-a="sign">±</button>
          <button class="fn" data-a="pct">%</button>
          <button class="op" data-a="op" data-o="÷">÷</button>
          <button class="num" data-a="d" data-d="7">7</button>
          <button class="num" data-a="d" data-d="8">8</button>
          <button class="num" data-a="d" data-d="9">9</button>
          <button class="op" data-a="op" data-o="×">×</button>
          <button class="num" data-a="d" data-d="4">4</button>
          <button class="num" data-a="d" data-d="5">5</button>
          <button class="num" data-a="d" data-d="6">6</button>
          <button class="op" data-a="op" data-o="-">-</button>
          <button class="num" data-a="d" data-d="1">1</button>
          <button class="num" data-a="d" data-d="2">2</button>
          <button class="num" data-a="d" data-d="3">3</button>
          <button class="op" data-a="op" data-o="+">+</button>
          <button class="num zero" data-a="d" data-d="0">0</button>
          <button class="num" data-a="dec">.</button>
          <button class="eq" data-a="eq">=</button>
        </div>
      </div>
    `;
    this._displayEl = this.shadowRoot.querySelector(".display");
    this.shadowRoot.querySelector(".grid").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const a = btn.dataset.a;
      if (a === "d") this._digit(btn.dataset.d);
      else if (a === "dec") this._decimal();
      else if (a === "op") this._op(btn.dataset.o);
      else if (a === "eq") this._equals();
      else if (a === "clear") this._clear();
      else if (a === "sign") this._display = String(-parseFloat(this._display));
      else if (a === "pct")
        this._display = String(parseFloat(this._display) / 100);
      this._update();
    });
  }

  _digit(d) {
    if (this._shouldReset) {
      this._display = d;
      this._shouldReset = false;
    } else this._display = this._display === "0" ? d : this._display + d;
  }
  _decimal() {
    if (this._shouldReset) {
      this._display = "0.";
      this._shouldReset = false;
      return;
    }
    if (!this._display.includes(".")) this._display += ".";
  }
  _op(op) {
    if (this._operation && !this._shouldReset) this._equals();
    this._previous = this._display;
    this._operation = op;
    this._shouldReset = true;
  }
  _equals() {
    if (!this._operation) return;
    const a = parseFloat(this._previous),
      b = parseFloat(this._display);
    let r;
    switch (this._operation) {
      case "+":
        r = a + b;
        break;
      case "-":
        r = a - b;
        break;
      case "×":
        r = a * b;
        break;
      case "÷":
        r = b === 0 ? "Error" : a / b;
        break;
    }
    this._display = r === "Error" ? r : String(Math.round(r * 1e12) / 1e12);
    this._operation = null;
    this._shouldReset = true;
  }
  _clear() {
    this._display = "0";
    this._previous = "";
    this._operation = null;
    this._shouldReset = false;
  }
  _update() {
    this._displayEl.textContent = this._display;
  }
}
customElements.define("my-calculator", MyCalculator);
```

```html
<my-calculator></my-calculator>
```

---

# 🟩 Component 12: Square Game (Memory/Grid Click)

## Kiến Trúc Square Game

```
SQUARE GAME:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────┐
  │ Score: 5     Timer: 00:23        │
  ├──────────────────────────────────┤
  │  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  │
  │  │  │  │██│  │  │  │  │  │  │  │  ← click ô xanh đúng +1
  │  └──┘  └──┘  └──┘  └──┘  └──┘  │  ← click ô trống sai -1
  │  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  │
  │  │  │  │  │  │██│  │  │  │  │  │
  │  └──┘  └──┘  └──┘  └──┘  └──┘  │
  │  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  │
  │  │  │  │  │  │  │  │██│  │  │  │
  │  └──┘  └──┘  └──┘  └──┘  └──┘  │
  └──────────────────────────────────┘
  │ 🟢 Start │ Settings: 5×5, 3 ô │

  Gameplay:
  1. Grid NxN ô trống
  2. Random highlight M ô màu (flash 1 giây!)
  3. Ô biến mất — user click đúng vị trí!
  4. Đúng +1, sai -1, level up tăng grid + ô!
```

---

## §12.1 Square Game — Vanilla JavaScript

```css
.square-game {
  font-family: system-ui, sans-serif;
  max-width: 500px;
}
.game-header {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #1a1a2e;
  color: #e2e8f0;
  border-radius: 10px 10px 0 0;
  font-size: 16px;
}
.game-grid {
  display: grid;
  gap: 4px;
  padding: 12px;
  background: #16213e;
  border-radius: 0 0 10px 10px;
}
.game-cell {
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  background: #2d3748;
  border: none;
  transition:
    background 0.2s,
    transform 0.1s;
}
.game-cell:hover {
  background: #4a5568;
}
.game-cell.highlighted {
  background: #3182ce;
}
.game-cell.correct {
  background: #38a169;
  transform: scale(0.9);
}
.game-cell.wrong {
  background: #e53e3e;
  transform: scale(0.9);
}
.game-controls {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}
.game-controls button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  background: #3182ce;
  color: #fff;
}
```

```javascript
// ═══ Vanilla JS Square Game ═══

class SquareGame {
  constructor(container) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.gridSize = 5; // NxN
    this.activeCount = 3; // M ô highlight
    this.score = 0;
    this.level = 1;
    this.activeSquares = new Set(); // vị trí các ô active
    this.gamePhase = "idle"; // idle | showing | guessing | ended
    this._render();
  }

  _render() {
    this.container.className = "square-game";
    this.container.innerHTML = `
      <div class="game-header">
        <span>Score: <strong class="score-display">0</strong></span>
        <span>Level: <strong class="level-display">1</strong></span>
      </div>
      <div class="game-grid"></div>
      <div class="game-controls">
        <button class="start-btn">🟢 Start Round</button>
      </div>
    `;
    this.grid = this.container.querySelector(".game-grid");
    this.grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    this.scoreDisplay = this.container.querySelector(".score-display");
    this.levelDisplay = this.container.querySelector(".level-display");

    // Tạo cells:
    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const cell = document.createElement("button");
      cell.className = "game-cell";
      cell.dataset.index = i;
      cell.addEventListener("click", () => this._handleClick(i));
      this.grid.appendChild(cell);
    }

    this.container
      .querySelector(".start-btn")
      .addEventListener("click", () => this._startRound());
  }

  _startRound() {
    if (this.gamePhase === "showing") return;
    this._resetCells();

    // Random chọn M ô:
    this.activeSquares.clear();
    while (this.activeSquares.size < this.activeCount) {
      this.activeSquares.add(
        Math.floor(Math.random() * this.gridSize * this.gridSize),
      );
    }

    // PHASE 1: Show (highlight 1.5 giây!):
    this.gamePhase = "showing";
    this.activeSquares.forEach((i) => {
      this.grid.children[i].classList.add("highlighted");
    });

    // PHASE 2: Hide → user guesses!
    setTimeout(() => {
      this.activeSquares.forEach((i) => {
        this.grid.children[i].classList.remove("highlighted");
      });
      this.gamePhase = "guessing";
      this._remainingGuesses = this.activeCount;
    }, 1500);
  }

  _handleClick(index) {
    if (this.gamePhase !== "guessing") return;
    const cell = this.grid.children[index];
    if (cell.classList.contains("correct") || cell.classList.contains("wrong"))
      return;

    if (this.activeSquares.has(index)) {
      // ĐÚNG!
      cell.classList.add("correct");
      this.score++;
      this._remainingGuesses--;
      if (this._remainingGuesses === 0) {
        this._levelUp();
      }
    } else {
      // SAI!
      cell.classList.add("wrong");
      this.score = Math.max(0, this.score - 1);
    }
    this.scoreDisplay.textContent = this.score;
  }

  _levelUp() {
    this.level++;
    this.activeCount = Math.min(
      this.activeCount + 1,
      Math.floor((this.gridSize * this.gridSize) / 2),
    );
    this.levelDisplay.textContent = this.level;
    this.gamePhase = "idle";
    // Auto start next round sau 1 giây:
    setTimeout(() => this._startRound(), 1000);
  }

  _resetCells() {
    Array.from(this.grid.children).forEach((cell) => {
      cell.classList.remove("highlighted", "correct", "wrong");
    });
  }
}

// Usage:
const game = new SquareGame("#game");
```

### 📖 RADIO Walkthrough — Square Game

> **R — Requirements:** Grid NxN, random highlight M ô → ẩn → user click đúng vị trí, scoring, level progression.

> **A — Architecture:** State machine 3 phase: `showing` (flash ô) → `guessing` (user click) → `idle` (chờ round mới). `Set` lưu vị trí active — O(1) lookup khi check đúng/sai.

> **I — Implementation:**

**Tại sao dùng `Set` cho `activeSquares`?**

`Set.has(index)` = O(1) — kiểm tra tức thì! Array: `array.includes(index)` = O(n). Với game có timing, O(1) quan trọng.

**Random không trùng — `while` loop + `Set`:**

```javascript
while (this.activeSquares.size < this.activeCount) {
  this.activeSquares.add(Math.floor(Math.random() * total));
}
```

`Set` tự loại trùng! Nếu `Math.random()` ra vị trí đã có → `add()` không thêm → `size` không tăng → loop tiếp!

**`setTimeout` cho phase transition:** Show ô 1.5 giây rồi ẩn. `setTimeout` đơn giản, dễ hiểu. Alternative: `requestAnimationFrame` cho timing chính xác hơn.

---

## §12.2 Square Game — React

```javascript
import { useState, useCallback, useRef } from "react";

function useSquareGame(gridSize = 5, initialActive = 3) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState("idle");
  const [activeSquares, setActiveSquares] = useState(new Set());
  const [cellStates, setCellStates] = useState({});
  const activeCountRef = useRef(initialActive);
  const remainingRef = useRef(0);

  const startRound = useCallback(() => {
    if (phase === "showing") return;
    setCellStates({});

    const actives = new Set();
    while (actives.size < activeCountRef.current) {
      actives.add(Math.floor(Math.random() * gridSize * gridSize));
    }
    setActiveSquares(actives);
    setPhase("showing");

    setTimeout(() => {
      setPhase("guessing");
      remainingRef.current = activeCountRef.current;
    }, 1500);
  }, [phase, gridSize]);

  const handleClick = useCallback(
    (index) => {
      if (phase !== "guessing") return;

      setCellStates((prev) => {
        if (prev[index]) return prev; // đã click rồi!
        const isCorrect = activeSquares.has(index);
        if (isCorrect) {
          setScore((s) => s + 1);
          remainingRef.current--;
          if (remainingRef.current === 0) {
            setLevel((l) => l + 1);
            activeCountRef.current++;
            setPhase("idle");
            setTimeout(() => startRound(), 1000);
          }
        } else {
          setScore((s) => Math.max(0, s - 1));
        }
        return { ...prev, [index]: isCorrect ? "correct" : "wrong" };
      });
    },
    [phase, activeSquares, startRound],
  );

  return {
    score,
    level,
    phase,
    activeSquares,
    cellStates,
    startRound,
    handleClick,
    gridSize,
  };
}

function SquareGame() {
  const game = useSquareGame(5, 3);
  const cells = Array.from({ length: game.gridSize ** 2 }, (_, i) => i);

  return (
    <div className="square-game">
      <div className="game-header">
        <span>
          Score: <strong>{game.score}</strong>
        </span>
        <span>
          Level: <strong>{game.level}</strong>
        </span>
      </div>
      <div
        className="game-grid"
        style={{ gridTemplateColumns: `repeat(${game.gridSize}, 1fr)` }}
      >
        {cells.map((i) => (
          <button
            key={i}
            className={`game-cell
              ${game.phase === "showing" && game.activeSquares.has(i) ? "highlighted" : ""}
              ${game.cellStates[i] || ""}`}
            onClick={() => game.handleClick(i)}
          />
        ))}
      </div>
      <div className="game-controls">
        <button onClick={game.startRound}>🟢 Start Round</button>
      </div>
    </div>
  );
}
```

### §12.3 Advanced Patterns — Square Game

```javascript
// ═══ PATTERN: Difficulty progression + High Score ═══
function useDifficulty() {
  const [config, setConfig] = useState({
    gridSize: 4,
    activeCount: 2,
    showTime: 2000,
  });

  const levelUp = useCallback(() => {
    setConfig((prev) => ({
      gridSize: Math.min(
        prev.gridSize + (prev.activeCount >= prev.gridSize ? 1 : 0),
        8,
      ),
      activeCount: prev.activeCount + 1,
      showTime: Math.max(prev.showTime - 100, 800), // giảm dần thời gian nhìn!
    }));
  }, []);

  return { config, levelUp };
}

function useHighScore(key = "square-game-high") {
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem(key) || "0"),
  );
  const updateHigh = useCallback(
    (score) => {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(key, String(score));
      }
    },
    [highScore, key],
  );
  return { highScore, updateHigh };
}
```

---

## §12.4 Square Game — Web Component

```javascript
class MySquareGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._gridSize = 5;
    this._activeCount = 3;
    this._score = 0;
    this._level = 1;
    this._activeSquares = new Set();
    this._phase = "idle";
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 500px; font-family: system-ui; }
        .header { display: flex; justify-content: space-between; padding: 12px;
                  background: #1a1a2e; color: #e2e8f0; border-radius: 10px 10px 0 0; }
        .grid { display: grid; gap: 4px; padding: 12px; background: #16213e;
                border-radius: 0 0 10px 10px; }
        .cell { aspect-ratio: 1; border-radius: 6px; border: none; cursor: pointer;
                background: #2d3748; transition: background 0.2s; }
        .cell.hi { background: #3182ce; }
        .cell.ok { background: #38a169; }
        .cell.no { background: #e53e3e; }
        button.start { margin-top: 12px; padding: 10px 24px; background: #3182ce;
                       color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
      </style>
      <div class="header">
        <span>Score: <strong class="sc">0</strong></span>
        <span>Level: <strong class="lv">1</strong></span>
      </div>
      <div class="grid" style="grid-template-columns: repeat(${this._gridSize}, 1fr)"></div>
      <button class="start">🟢 Start</button>
    `;
    const grid = this.shadowRoot.querySelector(".grid");
    for (let i = 0; i < this._gridSize ** 2; i++) {
      const c = document.createElement("button");
      c.className = "cell";
      c.dataset.i = i;
      c.addEventListener("click", () => this._click(i));
      grid.appendChild(c);
    }
    this.shadowRoot
      .querySelector(".start")
      .addEventListener("click", () => this._start());
    this._cells = grid.querySelectorAll(".cell");
  }

  _start() {
    if (this._phase === "showing") return;
    this._cells.forEach((c) => (c.className = "cell"));
    this._activeSquares.clear();
    while (this._activeSquares.size < this._activeCount)
      this._activeSquares.add(Math.floor(Math.random() * this._gridSize ** 2));
    this._phase = "showing";
    this._activeSquares.forEach((i) => this._cells[i].classList.add("hi"));
    setTimeout(() => {
      this._activeSquares.forEach((i) => this._cells[i].classList.remove("hi"));
      this._phase = "guessing";
      this._remaining = this._activeCount;
    }, 1500);
  }

  _click(i) {
    if (this._phase !== "guessing") return;
    const c = this._cells[i];
    if (c.classList.contains("ok") || c.classList.contains("no")) return;
    if (this._activeSquares.has(i)) {
      c.classList.add("ok");
      this._score++;
      if (--this._remaining === 0) {
        this._level++;
        this._activeCount++;
        this._phase = "idle";
        setTimeout(() => this._start(), 1000);
      }
    } else {
      c.classList.add("no");
      this._score = Math.max(0, this._score - 1);
    }
    this.shadowRoot.querySelector(".sc").textContent = this._score;
    this.shadowRoot.querySelector(".lv").textContent = this._level;
  }
}
customElements.define("my-square-game", MySquareGame);
```

---

# 🔍 Component 13: Typeahead (Autocomplete)

## Kiến Trúc Typeahead

```
TYPEAHEAD:
═══════════════════════════════════════════════════════════════
  ┌──────────────────────────────┐
  │ 🔍 Tìm kiếm...              │  ← input
  ├──────────────────────────────┤
  │ ▸ Hà Nội                    │  ← highlighted (arrow key)
  │   Hà Tĩnh                   │
  │   Hà Nam                    │
  │   Hà Giang                  │
  └──────────────────────────────┘

  Flow:
  User gõ → debounce 300ms → filter/fetch → render dropdown
  ↓ ArrowDown/Up = navigate    Enter = select    Escape = close

  Key Concepts:
  • Debounce (không gọi API mỗi keystroke!)
  • Highlight text match (bold phần trùng!)
  • Keyboard navigation (a11y!)
  • ARIA combobox pattern
```

---

## §13.1 Typeahead — Vanilla JavaScript

```css
.typeahead {
  position: relative;
  max-width: 400px;
  font-family: system-ui;
}
.typeahead-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  box-sizing: border-box;
}
.typeahead-input:focus {
  border-color: #3182ce;
}
.typeahead-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  display: none;
}
.typeahead-dropdown.open {
  display: block;
}
.typeahead-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 15px;
}
.typeahead-item:hover,
.typeahead-item.active {
  background: #ebf4ff;
  color: #2b6cb0;
}
.typeahead-item mark {
  background: #fefcbf;
  font-weight: bold;
}
```

```javascript
// ═══ Vanilla JS Typeahead ═══

class Typeahead {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.data = options.data || [];
    this.fetchFn = options.fetchFn || null;
    this.onSelect = options.onSelect || (() => {});
    this.debounceMs = options.debounce || 300;
    this.minChars = options.minChars || 1;
    this._highlightIndex = -1;
    this._results = [];
    this._debounceTimer = null;
    this._render();
  }

  _render() {
    this.container.className = "typeahead";
    this.container.innerHTML = `
      <input class="typeahead-input" type="text"
        placeholder="Tìm kiếm..." autocomplete="off"
        role="combobox" aria-expanded="false" aria-autocomplete="list">
      <div class="typeahead-dropdown" role="listbox"></div>
    `;
    this.input = this.container.querySelector(".typeahead-input");
    this.dropdown = this.container.querySelector(".typeahead-dropdown");

    // Debounced input:
    this.input.addEventListener("input", () => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(
        () => this._search(this.input.value),
        this.debounceMs,
      );
    });

    // Keyboard navigation:
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this._highlightIndex = Math.min(
          this._highlightIndex + 1,
          this._results.length - 1,
        );
        this._updateHighlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this._highlightIndex = Math.max(this._highlightIndex - 1, 0);
        this._updateHighlight();
      } else if (e.key === "Enter" && this._highlightIndex >= 0) {
        e.preventDefault();
        this._selectItem(this._results[this._highlightIndex]);
      } else if (e.key === "Escape") {
        this._close();
      }
    });

    // Close on click outside:
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) this._close();
    });
  }

  async _search(query) {
    if (query.length < this.minChars) {
      this._close();
      return;
    }

    if (this.fetchFn) {
      this._results = await this.fetchFn(query);
    } else {
      const q = query.toLowerCase();
      this._results = this.data.filter((item) =>
        (typeof item === "string" ? item : item.label)
          .toLowerCase()
          .includes(q),
      );
    }
    this._highlightIndex = -1;
    this._renderDropdown(query);
  }

  _renderDropdown(query) {
    if (!this._results.length) {
      this._close();
      return;
    }
    const q = query.toLowerCase();
    this.dropdown.innerHTML = this._results
      .map((item, i) => {
        const label = typeof item === "string" ? item : item.label;
        const highlighted = this._highlightMatch(label, q);
        return `<div class="typeahead-item" role="option" data-index="${i}">${highlighted}</div>`;
      })
      .join("");

    this.dropdown.querySelectorAll(".typeahead-item").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectItem(this._results[parseInt(el.dataset.index)]);
      });
    });

    this.dropdown.classList.add("open");
    this.input.setAttribute("aria-expanded", "true");
  }

  // Highlight phần text match bằng <mark>:
  _highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `<mark>${text.slice(idx, idx + query.length)}</mark>` +
      text.slice(idx + query.length)
    );
  }

  _updateHighlight() {
    this.dropdown.querySelectorAll(".typeahead-item").forEach((el, i) => {
      el.classList.toggle("active", i === this._highlightIndex);
      if (i === this._highlightIndex) el.scrollIntoView({ block: "nearest" });
    });
  }

  _selectItem(item) {
    const label = typeof item === "string" ? item : item.label;
    this.input.value = label;
    this._close();
    this.onSelect(item);
  }

  _close() {
    this.dropdown.classList.remove("open");
    this.dropdown.innerHTML = "";
    this.input.setAttribute("aria-expanded", "false");
    this._highlightIndex = -1;
  }
}

// Usage:
const search = new Typeahead("#search", {
  data: ["Hà Nội", "Hà Tĩnh", "Hà Nam", "Hồ Chí Minh", "Huế", "Hải Phòng"],
  onSelect: (item) => console.log("Selected:", item),
  debounce: 300,
});
```

### 📖 RADIO Walkthrough — Typeahead

> **R — Requirements:** Input + dropdown suggestions, debounce, highlight match, keyboard nav, close on outside click.

> **A — Architecture:** `Typeahead` class: input triggers debounced search → filter/fetch → render dropdown. Keyboard events navigate highlight index. Click/Enter selects.

> **I — Implementation:**

**Debounce — tại sao cần?**

```javascript
clearTimeout(this._debounceTimer);
this._debounceTimer = setTimeout(() => this._search(query), 300);
```

User gõ "hanoi" = 5 keystroke. Không debounce → 5 lần search! Debounce: mỗi keystroke **huỷ timer cũ**, đặt timer mới 300ms. Chỉ khi user **DỪNG gõ** 300ms → search 1 lần duy nhất!

**`<mark>` highlight — `_highlightMatch()`:**

```
Input: "Hà Nội"   query: "nội"
→ "Hà <mark>Nội</mark>"
```

Tìm vị trí match bằng `indexOf`, cắt string thành 3 phần: trước + `<mark>match</mark>` + sau.

**Keyboard nav — `scrollIntoView({ block: 'nearest' })`:** Khi ArrowDown/Up di chuyển highlight ra ngoài vùng nhìn thấy → tự scroll dropdown để item active luôn visible!

---

## §13.2 Typeahead — React

```javascript
import { useState, useCallback, useRef, useEffect } from "react";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Typeahead({ data = [], onSelect, fetchFn, debounce = 300 }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, debounce);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    if (fetchFn) {
      fetchFn(debouncedQuery).then((r) => {
        setResults(r);
        setIsOpen(r.length > 0);
      });
    } else {
      const q = debouncedQuery.toLowerCase();
      const filtered = data.filter((item) => item.toLowerCase().includes(q));
      setResults(filtered);
      setIsOpen(filtered.length > 0);
    }
    setActiveIndex(-1);
  }, [debouncedQuery, data, fetchFn]);

  // Close on outside click:
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        select(results[activeIndex]);
      } else if (e.key === "Escape") setIsOpen(false);
    },
    [results, activeIndex],
  );

  const select = (item) => {
    setQuery(item);
    setIsOpen(false);
    onSelect?.(item);
  };

  const highlight = (text) => {
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="typeahead" ref={containerRef}>
      <input
        className="typeahead-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm..."
      />
      {isOpen && (
        <div className="typeahead-dropdown open">
          {results.map((item, i) => (
            <div
              key={item}
              className={`typeahead-item ${i === activeIndex ? "active" : ""}`}
              onClick={() => select(item)}
            >
              {highlight(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### §13.3 Advanced Patterns — Typeahead

```javascript
// ═══ PATTERN 1: Cache results ═══
function useCachedSearch(fetchFn) {
  const cache = useRef(new Map());
  return useCallback(
    async (query) => {
      if (cache.current.has(query)) return cache.current.get(query);
      const results = await fetchFn(query);
      cache.current.set(query, results);
      if (cache.current.size > 50) {
        const first = cache.current.keys().next().value;
        cache.current.delete(first);
      }
      return results;
    },
    [fetchFn],
  );
}

// ═══ PATTERN 2: Recent searches ═══
function useRecentSearches(key = "recent-searches", max = 5) {
  const [recent, setRecent] = useState(() =>
    JSON.parse(localStorage.getItem(key) || "[]"),
  );
  const add = useCallback(
    (term) => {
      setRecent((prev) => {
        const next = [term, ...prev.filter((t) => t !== term)].slice(0, max);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key, max],
  );
  return { recent, add };
}
```

---

## §13.4 Typeahead — Web Component

```javascript
class MyTypeahead extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = [];
    this._results = [];
    this._idx = -1;
    this._timer = null;
  }
  set data(v) {
    this._data = v;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; max-width: 400px; font-family: system-ui; }
        input { width: 100%; padding: 12px 16px; font-size: 16px; border: 2px solid #e2e8f0;
                border-radius: 10px; outline: none; box-sizing: border-box; }
        input:focus { border-color: #3182ce; }
        .dd { position: absolute; top: 100%; left: 0; right: 0; background: #fff;
              border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-height: 240px;
              overflow-y: auto; display: none; }
        .dd.open { display: block; }
        .item { padding: 10px 16px; cursor: pointer; }
        .item:hover, .item.active { background: #ebf4ff; }
        mark { background: #fefcbf; font-weight: bold; }
      </style>
      <input placeholder="Tìm kiếm..." />
      <div class="dd"></div>
    `;
    const input = this.shadowRoot.querySelector("input");
    const dd = this.shadowRoot.querySelector(".dd");

    input.addEventListener("input", () => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        const q = input.value.toLowerCase();
        if (q.length < 1) {
          dd.classList.remove("open");
          return;
        }
        this._results = this._data.filter((d) => d.toLowerCase().includes(q));
        this._idx = -1;
        dd.innerHTML = this._results
          .map((r, i) => {
            const idx = r.toLowerCase().indexOf(q);
            const hl =
              r.slice(0, idx) +
              `<mark>${r.slice(idx, idx + q.length)}</mark>` +
              r.slice(idx + q.length);
            return `<div class="item" data-i="${i}">${hl}</div>`;
          })
          .join("");
        dd.classList.toggle("open", this._results.length > 0);
        dd.querySelectorAll(".item").forEach((el) => {
          el.addEventListener("click", () => {
            input.value = this._results[el.dataset.i];
            dd.classList.remove("open");
            this.dispatchEvent(
              new CustomEvent("select", {
                detail: this._results[el.dataset.i],
              }),
            );
          });
        });
      }, 300);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this._idx = Math.min(this._idx + 1, this._results.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this._idx = Math.max(this._idx - 1, 0);
      } else if (e.key === "Enter" && this._idx >= 0) {
        input.value = this._results[this._idx];
        dd.classList.remove("open");
      } else if (e.key === "Escape") dd.classList.remove("open");
      dd.querySelectorAll(".item").forEach((el, i) =>
        el.classList.toggle("active", i === this._idx),
      );
    });
  }
}
customElements.define("my-typeahead", MyTypeahead);
```

---

# 🟩 Component 14: Heatmap (GitHub Contribution Style)

## Kiến Trúc Heatmap

```
HEATMAP (GitHub Contribution Grid):
═══════════════════════════════════════════════════════════════
  Mon ░░▓▓░░██▓▓░░░░██▓▓░░▓▓██░░░░▓▓░░██▓▓
  Wed ▓▓░░██░░▓▓██░░▓▓██▓▓░░██░░▓▓██▓▓░░██
  Fri ██▓▓░░▓▓██░░▓▓░░██▓▓██░░▓▓░░██▓▓░░██

  Color scale: ░ (0) → ▒ (1-3) → ▓ (4-7) → █ (8+)

  Data: { date: "2024-03-01", count: 5 }
  Layout: 52 tuần × 7 ngày = 364 ô!
  Hover: tooltip hiện date + count!
```

---

## §14.1 Heatmap — Vanilla JavaScript

```css
.heatmap {
  font-family: system-ui;
  overflow-x: auto;
}
.heatmap-grid {
  display: flex;
  gap: 3px;
}
.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.heatmap-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}
.heatmap-cell:hover {
  outline: 2px solid #1a1a2e;
}
.heatmap-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}
.heatmap-legend {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
}
```

```javascript
class Heatmap {
  constructor(container, data = [], options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.data = new Map(data.map((d) => [d.date, d.count]));
    this.colors = options.colors || [
      "#ebedf0",
      "#9be9a8",
      "#40c463",
      "#30a14e",
      "#216e39",
    ];
    this.weeks = options.weeks || 52;
    this._render();
  }

  _getColor(count) {
    if (count === 0) return this.colors[0];
    if (count <= 3) return this.colors[1];
    if (count <= 6) return this.colors[2];
    if (count <= 9) return this.colors[3];
    return this.colors[4];
  }

  _render() {
    this.container.className = "heatmap";
    const grid = document.createElement("div");
    grid.className = "heatmap-grid";

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - this.weeks * 7);

    for (let w = 0; w < this.weeks; w++) {
      const weekEl = document.createElement("div");
      weekEl.className = "heatmap-week";
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split("T")[0];
        const count = this.data.get(dateStr) || 0;

        const cell = document.createElement("div");
        cell.className = "heatmap-cell";
        cell.style.background = this._getColor(count);
        cell.title = `${dateStr}: ${count} contributions`;

        cell.addEventListener("mouseenter", () => {
          const tip = document.createElement("div");
          tip.className = "heatmap-tooltip";
          tip.textContent = `${count} contributions on ${dateStr}`;
          cell.appendChild(tip);
        });
        cell.addEventListener("mouseleave", () => {
          const tip = cell.querySelector(".heatmap-tooltip");
          if (tip) tip.remove();
        });

        weekEl.appendChild(cell);
      }
      grid.appendChild(weekEl);
    }
    this.container.appendChild(grid);

    // Legend:
    const legend = document.createElement("div");
    legend.className = "heatmap-legend";
    legend.innerHTML = "Ít ";
    this.colors.forEach((c) => {
      legend.innerHTML += `<div class="heatmap-cell" style="background:${c}"></div>`;
    });
    legend.innerHTML += " Nhiều";
    this.container.appendChild(legend);
  }
}

// Usage:
const heatmap = new Heatmap("#heatmap", [
  { date: "2024-03-01", count: 5 },
  { date: "2024-03-02", count: 12 },
  { date: "2024-03-03", count: 0 },
]);
```

### 📖 RADIO Walkthrough — Heatmap

> **R — Requirements:** Grid 52 tuần × 7 ngày, color theo count, tooltip khi hover.

> **A — Architecture:** `Map<dateString, count>` cho O(1) lookup. Render loop: 52 weeks × 7 days. Color mapping: thresholds đơn giản.

> **I — Implementation:**

**`Map` cho data — tại sao không dùng Object?**

`Map` key là string date → O(1) lookup. Object cũng O(1) nhưng Map rõ ràng hơn về ý nghĩa (key-value pair) và không bị conflict với prototype properties.

**Date tính toán:** Bắt đầu từ `today - 52*7 ngày`, loop tăng dần. `toISOString().split('T')[0]` → format "2024-03-01" cho consistent key.

---

## §14.2 Heatmap — React

```javascript
import { useState, useMemo } from "react";

function Heatmap({
  data = [],
  weeks = 52,
  colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
}) {
  const [tooltip, setTooltip] = useState(null);
  const dataMap = useMemo(
    () => new Map(data.map((d) => [d.date, d.count])),
    [data],
  );

  const getColor = (count) => {
    if (count === 0) return colors[0];
    if (count <= 3) return colors[1];
    if (count <= 6) return colors[2];
    if (count <= 9) return colors[3];
    return colors[4];
  };

  const grid = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - weeks * 7);
    const result = [];
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split("T")[0];
        week.push({ date: dateStr, count: dataMap.get(dateStr) || 0 });
      }
      result.push(week);
    }
    return result;
  }, [dataMap, weeks]);

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {grid.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((day) => (
              <div
                key={day.date}
                className="heatmap-cell"
                style={{ background: getColor(day.count) }}
                onMouseEnter={() => setTooltip(day)}
                onMouseLeave={() => setTooltip(null)}
              >
                {tooltip?.date === day.date && (
                  <div className="heatmap-tooltip">
                    {day.count} contributions on {day.date}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### §14.3 Advanced Patterns — Heatmap

```javascript
// ═══ PATTERN: Canvas rendering cho performance ═══
function CanvasHeatmap({ data, weeks = 52, cellSize = 14, gap = 3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const dataMap = new Map(data.map((d) => [d.date, d.count]));
    const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - weeks * 7);

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const count = dataMap.get(date.toISOString().split("T")[0]) || 0;
        const ci = count === 0 ? 0 : Math.min(Math.ceil(count / 3), 4);
        ctx.fillStyle = colors[ci];
        ctx.fillRect(
          w * (cellSize + gap),
          d * (cellSize + gap),
          cellSize,
          cellSize,
        );
      }
    }
  }, [data, weeks, cellSize, gap]);

  return (
    <canvas
      ref={canvasRef}
      width={weeks * (cellSize + 3)}
      height={7 * (cellSize + 3)}
    />
  );
}
```

---

## §14.4 Heatmap — Web Component

```javascript
class MyHeatmap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = [];
  }
  set data(v) {
    this._data = v;
    this._render();
  }
  connectedCallback() {
    this._render();
  }

  _render() {
    const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
    const map = new Map(this._data.map((d) => [d.date, d.count]));
    const weeks = 52;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; overflow-x: auto; font-family: system-ui; }
        .grid { display: flex; gap: 3px; }
        .week { display: flex; flex-direction: column; gap: 3px; }
        .cell { width: 14px; height: 14px; border-radius: 3px; }
        .cell:hover { outline: 2px solid #333; }
      </style>
      <div class="grid"></div>
    `;
    const grid = this.shadowRoot.querySelector(".grid");
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - weeks * 7);
    for (let w = 0; w < weeks; w++) {
      const wk = document.createElement("div");
      wk.className = "week";
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const ds = date.toISOString().split("T")[0];
        const count = map.get(ds) || 0;
        const ci = count === 0 ? 0 : Math.min(Math.ceil(count / 3), 4);
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.background = colors[ci];
        cell.title = `${ds}: ${count}`;
        wk.appendChild(cell);
      }
      grid.appendChild(wk);
    }
  }
}
customElements.define("my-heatmap", MyHeatmap);
```

---

# 📊 Component 15: Progress Bar

## Kiến Trúc Progress Bar

```
PROGRESS BAR:
═══════════════════════════════════════════════════════════════

  Linear:
  ┌────────────────────────────────┐
  │████████████░░░░░░░░░░░░░░░░░░░│ 42%
  └────────────────────────────────┘

  Circular (SVG):
      ╭───────╮
     ╱  72%    ╲
    │           │   ← SVG circle + stroke-dasharray!
     ╲         ╱
      ╰───────╯

  Multi-step:
  ● Step 1 ── ● Step 2 ── ○ Step 3 ── ○ Step 4
  [══════════════════════░░░░░░░░░░░░░░░░░░░░]

  Features:
  • Linear + Circular variants!
  • Animated fill (CSS transition!)
  • Striped animation (barber pole!)
  • Color thresholds (red → yellow → green!)
```

---

## §15.1 Progress Bar — Vanilla JavaScript

```css
.progress-bar {
  width: 100%;
  font-family: system-ui;
}
.progress-track {
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  border-radius: 12px;
  transition:
    width 0.5s ease,
    background 0.3s;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}
.progress-fill.striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: stripe-move 1s linear infinite;
}
@keyframes stripe-move {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 40px 0;
  }
}
.progress-circular {
  position: relative;
  display: inline-block;
}
.progress-circular svg {
  transform: rotate(-90deg);
}
.progress-circular-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: bold;
}
```

```javascript
class ProgressBar {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.value = options.value || 0;
    this.type = options.type || "linear"; // linear | circular
    this.size = options.size || 120;
    this.striped = options.striped || false;
    this._render();
  }

  _getColor(pct) {
    if (pct < 30) return "#e53e3e";
    if (pct < 70) return "#dd6b20";
    return "#38a169";
  }

  _render() {
    this.container.className = "progress-bar";
    if (this.type === "circular") this._renderCircular();
    else this._renderLinear();
  }

  _renderLinear() {
    this.container.innerHTML = `
      <div class="progress-track">
        <div class="progress-fill ${this.striped ? "striped" : ""}"
          style="width: ${this.value}%; background: ${this._getColor(this.value)}">
          ${this.value}%
        </div>
      </div>
    `;
    this._fill = this.container.querySelector(".progress-fill");
  }

  _renderCircular() {
    const r = (this.size - 10) / 2; // radius
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (this.value / 100) * circumference;

    this.container.innerHTML = `
      <div class="progress-circular">
        <svg width="${this.size}" height="${this.size}">
          <circle cx="${this.size / 2}" cy="${this.size / 2}" r="${r}"
            fill="none" stroke="#e2e8f0" stroke-width="8" />
          <circle cx="${this.size / 2}" cy="${this.size / 2}" r="${r}"
            fill="none" stroke="${this._getColor(this.value)}" stroke-width="8"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            stroke-linecap="round"
            style="transition: stroke-dashoffset 0.5s ease" />
        </svg>
        <span class="progress-circular-text">${this.value}%</span>
      </div>
    `;
  }

  setValue(val) {
    this.value = Math.max(0, Math.min(100, val));
    if (this.type === "linear" && this._fill) {
      this._fill.style.width = `${this.value}%`;
      this._fill.style.background = this._getColor(this.value);
      this._fill.textContent = `${this.value}%`;
    } else {
      this._render(); // circular: re-render SVG
    }
  }
}

// Usage:
const bar = new ProgressBar("#progress", { value: 42, striped: true });
const circle = new ProgressBar("#circle", {
  type: "circular",
  value: 72,
  size: 120,
});
// bar.setValue(85);
```

### 📖 RADIO Walkthrough — Progress Bar

> **R — Requirements:** Linear bar + circular SVG, animated fill, color thresholds, striped animation.

> **I — Implementation:**

**Circular — SVG `stroke-dasharray` trick!**

```
circumference = 2 × π × r = chu vi hình tròn
dasharray = circumference = mỗi dash dài = chu vi (1 dash = tròn)
dashoffset = circumference - (value/100) × circumference
→ offset nhiều = ít được vẽ!  offset 0 = vẽ tròn hoàn toàn!
```

`transform: rotate(-90deg)` trên SVG để bắt đầu từ đỉnh (12h) thay vì 3h (mặc định SVG).

**Striped animation:** `background-image: linear-gradient(45deg, ...)` tạo sọc chéo. `@keyframes` di chuyển `background-position` → sọc chạy liên tục (barber pole effect)!

---

## §15.2 Progress Bar — React

```javascript
import { useState, useMemo } from "react";

function LinearProgress({ value = 0, striped = false }) {
  const color = value < 30 ? "#e53e3e" : value < 70 ? "#dd6b20" : "#38a169";
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${striped ? "striped" : ""}`}
        style={{ width: `${value}%`, background: color }}
      >
        {value}%
      </div>
    </div>
  );
}

function CircularProgress({ value = 0, size = 120 }) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value < 30 ? "#e53e3e" : value < 70 ? "#dd6b20" : "#38a169";
  return (
    <div className="progress-circular" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
      </svg>
      <span className="progress-circular-text">{value}%</span>
    </div>
  );
}
```

### §15.3 Advanced Patterns — Progress Bar

```javascript
// ═══ PATTERN: Multi-step wizard progress ═══
function StepProgress({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              background: i <= current ? "#3182ce" : "#e2e8f0",
              color: i <= current ? "#fff" : "#a0aec0",
            }}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 3,
                background: i < current ? "#3182ce" : "#e2e8f0",
                transition: "background 0.3s",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

## §15.4 Progress Bar — Web Component

```javascript
class MyProgressBar extends HTMLElement {
  static get observedAttributes() {
    return ["value", "type"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const val = parseInt(this.getAttribute("value") || "0");
    const type = this.getAttribute("type") || "linear";
    const color = val < 30 ? "#e53e3e" : val < 70 ? "#dd6b20" : "#38a169";

    if (type === "circular") {
      const size = 120,
        r = 55,
        c = 2 * Math.PI * r;
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: inline-block; position: relative; }
          svg { transform: rotate(-90deg); }
          span { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
                 font: bold 18px system-ui; }
        </style>
        <svg width="${size}" height="${size}">
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="8"/>
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="8"
            stroke-dasharray="${c}" stroke-dashoffset="${c - (val / 100) * c}"
            stroke-linecap="round" style="transition: stroke-dashoffset .5s"/>
        </svg>
        <span>${val}%</span>
      `;
    } else {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .track { height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; }
          .fill { height: 100%; border-radius: 12px; transition: width .5s;
                  display: flex; align-items: center; justify-content: flex-end;
                  padding-right: 8px; color: #fff; font: bold 12px system-ui; }
        </style>
        <div class="track">
          <div class="fill" style="width:${val}%;background:${color}">${val}%</div>
        </div>
      `;
    }
  }
}
customElements.define("my-progress-bar", MyProgressBar);
```

```html
<my-progress-bar value="42"></my-progress-bar>
<my-progress-bar type="circular" value="72"></my-progress-bar>
```

---

# 📤 Component 16: Upload

## Kiến Trúc Upload

```
UPLOAD COMPONENT:
═══════════════════════════════════════════════════════════════
  ┌──────────────────────────────────────┐
  │                                      │
  │     📁 Kéo thả file vào đây         │  ← Drag & Drop zone
  │     hoặc click để chọn file          │
  │                                      │
  └──────────────────────────────────────┘

  Files:
  ┌─────────────────────────────────────┐
  │ 🖼 photo.jpg   2.4 MB  [████░░] 65% │  ← progress!
  │ 📄 doc.pdf     1.1 MB  [██████] ✅   │  ← done!
  │ 🎵 song.mp3    5.2 MB  [░░░░░░] ❌   │  ← error!
  └─────────────────────────────────────┘

  Key Concepts:
  • Drag & Drop API (dragenter, dragover, drop!)
  • File API (File, FileReader, FileList!)
  • XMLHttpRequest upload progress event!
  • File validation (type, size!)
  • Preview thumbnails (images!)
```

---

## §16.1 Upload — Vanilla JavaScript

```css
.upload {
  max-width: 500px;
  font-family: system-ui;
}
.upload-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  color: #718096;
}
.upload-zone:hover,
.upload-zone.dragover {
  border-color: #3182ce;
  background: #ebf8ff;
  color: #2b6cb0;
}
.upload-zone .icon {
  font-size: 40px;
  margin-bottom: 8px;
}
.file-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 8px;
  font-size: 14px;
}
.file-item .name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-item .size {
  color: #a0aec0;
  font-size: 12px;
}
.file-item .progress-sm {
  flex: 0 0 100px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
.file-item .progress-sm-fill {
  height: 100%;
  background: #3182ce;
  border-radius: 3px;
  transition: width 0.2s;
}
.file-item .status {
  font-size: 16px;
}
.file-item .remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #e53e3e;
}
.file-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}
```

```javascript
class FileUploader {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.uploadUrl = options.url || "/api/upload";
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.acceptTypes = options.accept || ["image/*", "application/pdf"];
    this.multiple = options.multiple !== false;
    this.onComplete = options.onComplete || (() => {});
    this._files = [];
    this._render();
  }

  _render() {
    this.container.className = "upload";
    this.container.innerHTML = `
      <div class="upload-zone">
        <div class="icon">📁</div>
        <p>Kéo thả file vào đây<br>hoặc <strong>click để chọn</strong></p>
      </div>
      <input type="file" style="display:none" ${this.multiple ? "multiple" : ""}
        accept="${this.acceptTypes.join(",")}">
      <div class="file-list"></div>
    `;
    this.zone = this.container.querySelector(".upload-zone");
    this.input = this.container.querySelector('input[type="file"]');
    this.fileList = this.container.querySelector(".file-list");

    // Click to select:
    this.zone.addEventListener("click", () => this.input.click());
    this.input.addEventListener("change", (e) =>
      this._handleFiles(e.target.files),
    );

    // Drag & Drop:
    this.zone.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.zone.classList.add("dragover");
    });
    this.zone.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    this.zone.addEventListener("dragleave", () =>
      this.zone.classList.remove("dragover"),
    );
    this.zone.addEventListener("drop", (e) => {
      e.preventDefault();
      this.zone.classList.remove("dragover");
      this._handleFiles(e.dataTransfer.files);
    });
  }

  _handleFiles(fileList) {
    Array.from(fileList).forEach((file) => {
      // Validate:
      if (file.size > this.maxSize) {
        alert(`${file.name} quá lớn! Max: ${this._formatSize(this.maxSize)}`);
        return;
      }
      const entry = {
        file,
        progress: 0,
        status: "uploading",
        id: Date.now() + Math.random(),
      };
      this._files.push(entry);
      this._renderFileItem(entry);
      this._uploadFile(entry);
    });
  }

  _renderFileItem(entry) {
    const el = document.createElement("div");
    el.className = "file-item";
    el.dataset.id = entry.id;

    const isImage = entry.file.type.startsWith("image/");
    let thumbHtml = isImage
      ? '<img class="file-thumb" />'
      : '<span class="icon">📄</span>';

    el.innerHTML = `
      ${thumbHtml}
      <span class="name">${entry.file.name}</span>
      <span class="size">${this._formatSize(entry.file.size)}</span>
      <div class="progress-sm"><div class="progress-sm-fill" style="width:0%"></div></div>
      <span class="status">⏳</span>
      <button class="remove">×</button>
    `;

    // Image preview:
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        el.querySelector(".file-thumb").src = e.target.result;
      };
      reader.readAsDataURL(entry.file);
    }

    el.querySelector(".remove").addEventListener("click", () => {
      el.remove();
      this._files = this._files.filter((f) => f.id !== entry.id);
    });

    this.fileList.appendChild(el);
  }

  _uploadFile(entry) {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", entry.file);

    // Progress event:
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        entry.progress = pct;
        const el = this.container.querySelector(`[data-id="${entry.id}"]`);
        if (el) {
          el.querySelector(".progress-sm-fill").style.width = `${pct}%`;
        }
      }
    });

    xhr.addEventListener("load", () => {
      entry.status = xhr.status < 400 ? "done" : "error";
      const el = this.container.querySelector(`[data-id="${entry.id}"]`);
      if (el)
        el.querySelector(".status").textContent =
          entry.status === "done" ? "✅" : "❌";
      this.onComplete(entry);
    });

    xhr.addEventListener("error", () => {
      entry.status = "error";
      const el = this.container.querySelector(`[data-id="${entry.id}"]`);
      if (el) el.querySelector(".status").textContent = "❌";
    });

    xhr.open("POST", this.uploadUrl);
    xhr.send(formData);
  }

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Usage:
const uploader = new FileUploader("#upload", {
  url: "/api/upload",
  maxSize: 10 * 1024 * 1024,
  accept: ["image/*", "application/pdf"],
});
```

### 📖 RADIO Walkthrough — Upload

> **R — Requirements:** Drag & drop + click, file validation (type/size), progress bar, preview thumbnails, cancel/remove.

> **A — Architecture:** `FileUploader` class: drop zone + hidden input. Mỗi file = 1 `XMLHttpRequest` với `upload.progress` event. FileReader cho image preview.

> **I — Implementation:**

**Drag & Drop — 4 events quan trọng:**

```
dragenter  → file VÀO zone (add visual feedback)
dragover   → file ĐANG TRÊN zone (phải preventDefault!)
dragleave  → file RỜI zone (remove feedback)
drop       → file THẢ (lấy e.dataTransfer.files!)
```

`e.preventDefault()` trên `dragover` là **BẮT BUỘC**! Nếu không → browser mở file thay vì drop!

**`XMLHttpRequest.upload.progress` — tại sao không dùng `fetch`?**

`fetch()` không có upload progress event! `xhr.upload.addEventListener('progress', ...)` cho `e.loaded` và `e.total` → tính phần trăm. Đây là lý do xhr vẫn được dùng cho upload dù fetch hiện đại hơn.

**`FileReader.readAsDataURL()` — preview ảnh:** Đọc file thành base64 data URL (`data:image/jpeg;base64,...`). Set làm `img.src` → hiện preview ngay lập tức, KHÔNG cần upload!

---

## §16.2 Upload — React

```javascript
import { useState, useCallback, useRef } from "react";

function useFileUpload(url = "/api/upload", maxSize = 10 * 1024 * 1024) {
  const [files, setFiles] = useState([]);

  const addFiles = useCallback(
    (fileList) => {
      const newEntries = Array.from(fileList)
        .filter((f) => f.size <= maxSize)
        .map((file) => ({
          file,
          id: Date.now() + Math.random(),
          progress: 0,
          status: "uploading",
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        }));
      setFiles((prev) => [...prev, ...newEntries]);
      newEntries.forEach((entry) => uploadFile(entry));
    },
    [maxSize],
  );

  const uploadFile = (entry) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", entry.file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, progress: pct } : f)),
        );
      }
    });
    xhr.addEventListener("load", () => {
      const status = xhr.status < 400 ? "done" : "error";
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status } : f)),
      );
    });
    xhr.addEventListener("error", () => {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "error" } : f)),
      );
    });
    xhr.open("POST", url);
    xhr.send(formData);
  };

  const removeFile = useCallback((id) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  return { files, addFiles, removeFile };
}

function FileUpload({ url }) {
  const { files, addFiles, removeFile } = useFileUpload(url);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return (
    <div className="upload">
      <div
        className="upload-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="icon">📁</div>
        <p>
          Kéo thả hoặc <strong>click</strong>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => addFiles(e.target.files)}
      />
      <div className="file-list">
        {files.map((f) => (
          <div key={f.id} className="file-item">
            {f.preview && <img src={f.preview} className="file-thumb" alt="" />}
            <span className="name">{f.file.name}</span>
            <div className="progress-sm">
              <div
                className="progress-sm-fill"
                style={{ width: `${f.progress}%` }}
              />
            </div>
            <span>
              {f.status === "done" ? "✅" : f.status === "error" ? "❌" : "⏳"}
            </span>
            <button className="remove" onClick={() => removeFile(f.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### §16.3 Advanced Patterns — Upload

```javascript
// ═══ PATTERN: Chunked upload cho file lớn ═══
async function uploadChunked(file, url, chunkSize = 1024 * 1024) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const chunk = file.slice(start, start + chunkSize);
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", i);
    formData.append("totalChunks", totalChunks);
    formData.append("fileName", file.name);
    await fetch(url, { method: "POST", body: formData });
  }
}
```

---

## §16.4 Upload — Web Component

```javascript
class MyUpload extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._files = [];
  }
  connectedCallback() {
    const url = this.getAttribute("url") || "/api/upload";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 500px; font-family: system-ui; }
        .zone { border: 2px dashed #cbd5e0; border-radius: 12px; padding: 40px;
                text-align: center; cursor: pointer; transition: border-color .2s; }
        .zone:hover, .zone.drag { border-color: #3182ce; background: #ebf8ff; }
        .list { margin-top: 16px; }
        .item { display: flex; align-items: center; gap: 10px; padding: 8px;
                background: #f7fafc; border-radius: 8px; margin-bottom: 6px; font-size: 14px; }
        .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bar { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
        .fill { height: 100%; background: #3182ce; transition: width .2s; }
        .rm { background: none; border: none; cursor: pointer; color: #e53e3e; }
        input { display: none; }
      </style>
      <div class="zone">📁 Kéo thả hoặc click</div>
      <input type="file" multiple>
      <div class="list"></div>
    `;
    const zone = this.shadowRoot.querySelector(".zone");
    const input = this.shadowRoot.querySelector("input");
    const list = this.shadowRoot.querySelector(".list");

    zone.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) =>
      this._add(e.target.files, url, list),
    );
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag");
      this._add(e.dataTransfer.files, url, list);
    });
  }

  _add(fileList, url, listEl) {
    Array.from(fileList).forEach((file) => {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `<span class="name">${file.name}</span>
        <div class="bar"><div class="fill" style="width:0%"></div></div>
        <span class="st">⏳</span><button class="rm">×</button>`;
      el.querySelector(".rm").addEventListener("click", () => el.remove());
      listEl.appendChild(el);

      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("file", file);
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          el.querySelector(".fill").style.width =
            `${Math.round((e.loaded / e.total) * 100)}%`;
      });
      xhr.addEventListener("load", () => {
        el.querySelector(".st").textContent = xhr.status < 400 ? "✅" : "❌";
      });
      xhr.open("POST", url);
      xhr.send(fd);
    });
  }
}
customElements.define("my-upload", MyUpload);
```

```html
<my-upload url="/api/upload"></my-upload>
```
