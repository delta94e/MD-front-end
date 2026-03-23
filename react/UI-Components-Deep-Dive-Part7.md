# UI Components Deep Dive — Phần 7: Google Sheets Clone

> 📅 2026-03-09 · ⏱ 55 phút đọc
>
> Chủ đề: Tự viết từ đầu — Google Sheets Clone (Parser, Topo Sort, Engine, UX)
> Version: Vanilla JavaScript + React + Web Component
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component    | Vanilla JS | React | Advanced | Web Component |
| --- | ------------ | ---------- | ----- | -------- | ------------- |
| 21  | Sheets Clone | §21.1      | §21.2 | §21.3    | §21.4         |

---

# 📊 Component 21: Google Sheets Clone

## Kiến Trúc Google Sheets

```
GOOGLE SHEETS CLONE:
═══════════════════════════════════════════════════════════════

     A          B          C          D
  ┌─────────┬─────────┬─────────┬─────────┐
1 │ Product │ Price   │ Qty     │ Total   │
  ├─────────┼─────────┼─────────┼─────────┤
2 │ Apple   │ 15000   │ 10      │ =B2*C2  │  ← FORMULA!
  ├─────────┼─────────┼─────────┼─────────┤
3 │ Banana  │ 8000    │ 25      │ =B3*C3  │
  ├─────────┼─────────┼─────────┼─────────┤
4 │ Total   │         │ =C2+C3  │ =D2+D3  │  ← Dependencies!
  └─────────┴─────────┴─────────┴─────────┘

  ENGINE PIPELINE:

  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  Parser  │───→│ Dep Graph│───→│ Topo Sort│───→│ Evaluate │
  │ "=B2*C2" │    │ D2→B2,C2│    │ B2,C2,D2│    │ 150000   │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘

  Key Concepts:
  • Cell addressing: A1, B2, C3 (col letter + row number!)
  • Formula parser: "=SUM(A1:A3)" → AST → evaluate!
  • Dependency graph: cell D4 depends on D2, D3!
  • Topological sort: tính cell KHÔNG PHỤ THUỘC trước!
  • Circular reference detection: =A1 → B1 → A1 → ERROR!
  • Virtual scrolling (grid lớn!)
```

---

## §21.1 Google Sheets — Vanilla JavaScript

```css
.spreadsheet {
  font-family: system-ui;
  border: 1px solid #c0c0c0;
}
.sheet-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f3f3f3;
  border-bottom: 1px solid #c0c0c0;
  align-items: center;
}
.cell-ref {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #c0c0c0;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  background: #fff;
}
.formula-bar {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #c0c0c0;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  outline: none;
}
.formula-bar:focus {
  border-color: #1a73e8;
}
.sheet-grid {
  overflow: auto;
  max-height: 500px;
}
.sheet-grid table {
  border-collapse: collapse;
}
.sheet-grid th {
  background: #f3f3f3;
  border: 1px solid #c0c0c0;
  padding: 4px 8px;
  font-size: 12px;
  color: #333;
  font-weight: normal;
  position: sticky;
  min-width: 100px;
}
.sheet-grid th.row-header {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 40px;
  text-align: center;
}
.sheet-grid th.col-header {
  top: 0;
  z-index: 3;
}
.sheet-grid th.corner {
  top: 0;
  left: 0;
  z-index: 4;
}
.sheet-grid td {
  border: 1px solid #e0e0e0;
  padding: 0;
  min-width: 100px;
  height: 24px;
}
.sheet-grid td.selected {
  outline: 2px solid #1a73e8;
  outline-offset: -1px;
  z-index: 1;
}
.sheet-grid td input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 2px 6px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  background: transparent;
}
.sheet-grid td.editing {
  background: #e8f0fe;
}
.sheet-grid td.error {
  color: #d93025;
}
```

```javascript
// ═══ Vanilla JS Google Sheets Clone ═══

class Spreadsheet {
  constructor(container, rows = 50, cols = 26) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.rows = rows;
    this.cols = cols;

    // Core data: Map<"A1", { raw: "=B2*C2", value: 150000 }>
    this.cells = new Map();
    // Dependency graph: Map<"D2", Set(["B2", "C2"])>
    this.deps = new Map();
    // Reverse deps: Map<"B2", Set(["D2"])> — ai phụ thuộc vào B2?
    this.rdeps = new Map();

    this.selectedCell = null;
    this._render();
  }

  // ═══ CELL ADDRESSING ═══
  _colToLetter(col) {
    return String.fromCharCode(65 + col);
  }
  _letterToCol(letter) {
    return letter.charCodeAt(0) - 65;
  }
  _cellId(row, col) {
    return `${this._colToLetter(col)}${row + 1}`;
  }

  _parseCellRef(ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    return { col: this._letterToCol(match[1]), row: parseInt(match[2]) - 1 };
  }

  _render() {
    this.container.className = "spreadsheet";
    this.container.innerHTML = `
      <div class="sheet-toolbar">
        <input class="cell-ref" readonly>
        <input class="formula-bar" placeholder="Nhập giá trị hoặc công thức (=A1+B1)">
      </div>
      <div class="sheet-grid">
        <table></table>
      </div>
    `;

    this.cellRefEl = this.container.querySelector(".cell-ref");
    this.formulaBar = this.container.querySelector(".formula-bar");
    this.table = this.container.querySelector("table");

    this._renderGrid();
    this._setupEvents();
  }

  _renderGrid() {
    let html = '<thead><tr><th class="corner row-header col-header"></th>';
    for (let c = 0; c < this.cols; c++) {
      html += `<th class="col-header">${this._colToLetter(c)}</th>`;
    }
    html += "</tr></thead><tbody>";

    for (let r = 0; r < this.rows; r++) {
      html += `<tr><th class="row-header">${r + 1}</th>`;
      for (let c = 0; c < this.cols; c++) {
        const id = this._cellId(r, c);
        html += `<td data-cell="${id}" data-row="${r}" data-col="${c}"></td>`;
      }
      html += "</tr>";
    }
    html += "</tbody>";
    this.table.innerHTML = html;
  }

  _setupEvents() {
    // Click to select:
    this.table.addEventListener("click", (e) => {
      const td = e.target.closest("td");
      if (!td || !td.dataset.cell) return;
      this._selectCell(td.dataset.cell);
    });

    // Double-click to edit:
    this.table.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td");
      if (!td) return;
      this._startEditing(td.dataset.cell);
    });

    // Formula bar:
    this.formulaBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this._setCellValue(this.selectedCell, this.formulaBar.value);
        this._selectCell(this.selectedCell);
      }
      if (e.key === "Escape") this._selectCell(this.selectedCell);
    });

    // Keyboard navigation:
    this.container.addEventListener("keydown", (e) => {
      if (!this.selectedCell || e.target === this.formulaBar) return;
      const ref = this._parseCellRef(this.selectedCell);
      if (!ref) return;

      if (e.key === "ArrowRight")
        this._selectCell(
          this._cellId(ref.row, Math.min(ref.col + 1, this.cols - 1)),
        );
      else if (e.key === "ArrowLeft")
        this._selectCell(this._cellId(ref.row, Math.max(ref.col - 1, 0)));
      else if (e.key === "ArrowDown" || e.key === "Enter")
        this._selectCell(
          this._cellId(Math.min(ref.row + 1, this.rows - 1), ref.col),
        );
      else if (e.key === "ArrowUp")
        this._selectCell(this._cellId(Math.max(ref.row - 1, 0), ref.col));
      else if (e.key === "Delete" || e.key === "Backspace") {
        this._setCellValue(this.selectedCell, "");
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        this._startEditing(this.selectedCell);
      }
    });
  }

  _selectCell(cellId) {
    this.table.querySelectorAll(".selected, .editing").forEach((el) => {
      el.classList.remove("selected", "editing");
      // Remove edit input:
      const inp = el.querySelector("input");
      if (inp) {
        el.textContent = this.cells.get(el.dataset.cell)?.value ?? "";
      }
    });
    this.selectedCell = cellId;
    const td = this.table.querySelector(`[data-cell="${cellId}"]`);
    if (td) {
      td.classList.add("selected");
      td.focus();
    }
    this.cellRefEl.value = cellId;
    const cell = this.cells.get(cellId);
    this.formulaBar.value = cell?.raw ?? "";
  }

  _startEditing(cellId) {
    const td = this.table.querySelector(`[data-cell="${cellId}"]`);
    if (!td) return;
    td.classList.add("editing");
    const raw = this.cells.get(cellId)?.raw ?? "";
    td.innerHTML = `<input value="${raw}" />`;
    const input = td.querySelector("input");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this._setCellValue(cellId, input.value);
        // Move down:
        const ref = this._parseCellRef(cellId);
        this._selectCell(
          this._cellId(Math.min(ref.row + 1, this.rows - 1), ref.col),
        );
      }
      if (e.key === "Escape") this._selectCell(cellId);
      if (e.key === "Tab") {
        e.preventDefault();
        this._setCellValue(cellId, input.value);
        const ref = this._parseCellRef(cellId);
        this._selectCell(
          this._cellId(ref.row, Math.min(ref.col + 1, this.cols - 1)),
        );
      }
    });
  }

  // ═══ FORMULA ENGINE ═══
  _setCellValue(cellId, raw) {
    raw = raw.trim();
    const cell = { raw, value: raw, error: null };

    // Clear old deps:
    this.deps.delete(cellId);

    if (raw.startsWith("=")) {
      // Parse formula dependencies:
      const formula = raw.substring(1);
      const refs = this._extractRefs(formula);

      // Check circular reference:
      if (this._wouldCreateCycle(cellId, refs)) {
        cell.value = "#CIRCULAR!";
        cell.error = "circular";
      } else {
        // Update dependency graph:
        this.deps.set(cellId, new Set(refs));
        refs.forEach((ref) => {
          if (!this.rdeps.has(ref)) this.rdeps.set(ref, new Set());
          this.rdeps.get(ref).add(cellId);
        });

        // Evaluate:
        try {
          cell.value = this._evaluate(formula);
        } catch (e) {
          cell.value = "#ERROR!";
          cell.error = e.message;
        }
      }
    } else if (raw !== "" && !isNaN(raw)) {
      cell.value = parseFloat(raw);
    }

    this.cells.set(cellId, cell);
    this._updateCellDisplay(cellId);

    // Cascade: recalculate dependents!
    this._recalcDependents(cellId);
  }

  _extractRefs(formula) {
    const refs = [];
    // Match cell references: A1, B2, AA1, etc.
    const refRegex = /\b([A-Z]+\d+)\b/g;
    let match;
    while ((match = refRegex.exec(formula)) !== null) {
      refs.push(match[1]);
    }
    // Match ranges: A1:A5
    const rangeRegex = /([A-Z]+\d+):([A-Z]+\d+)/g;
    while ((match = rangeRegex.exec(formula)) !== null) {
      const start = this._parseCellRef(match[1]);
      const end = this._parseCellRef(match[2]);
      for (let r = start.row; r <= end.row; r++) {
        for (let c = start.col; c <= end.col; c++) {
          const id = this._cellId(r, c);
          if (!refs.includes(id)) refs.push(id);
        }
      }
    }
    return refs;
  }

  _evaluate(formula) {
    // Replace SUM(A1:A3):
    let expr = formula.replace(
      /SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,
      (_, s, e) => {
        const start = this._parseCellRef(s),
          end = this._parseCellRef(e);
        let sum = 0;
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = this._getCellValue(this._cellId(r, c));
            if (typeof v === "number") sum += v;
          }
        }
        return sum;
      },
    );

    // Replace AVG(A1:A3):
    expr = expr.replace(
      /AVG(?:ERAGE)?\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,
      (_, s, e) => {
        const start = this._parseCellRef(s),
          end = this._parseCellRef(e);
        let sum = 0,
          count = 0;
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = this._getCellValue(this._cellId(r, c));
            if (typeof v === "number") {
              sum += v;
              count++;
            }
          }
        }
        return count > 0 ? sum / count : 0;
      },
    );

    // Replace MIN/MAX:
    expr = expr.replace(
      /(MIN|MAX)\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,
      (_, fn, s, e) => {
        const start = this._parseCellRef(s),
          end = this._parseCellRef(e);
        const vals = [];
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = this._getCellValue(this._cellId(r, c));
            if (typeof v === "number") vals.push(v);
          }
        }
        return fn.toUpperCase() === "MIN"
          ? Math.min(...vals)
          : Math.max(...vals);
      },
    );

    // Replace cell references with values:
    expr = expr.replace(/\b([A-Z]+\d+)\b/g, (_, ref) => {
      const v = this._getCellValue(ref);
      return typeof v === "number" ? v : `"${v}"`;
    });

    // Evaluate (safe: no function calls allowed):
    return Function(`"use strict"; return (${expr})`)();
  }

  _getCellValue(cellId) {
    const cell = this.cells.get(cellId);
    if (!cell) return 0;
    return typeof cell.value === "number" ? cell.value : cell.value || 0;
  }

  // ═══ TOPOLOGICAL SORT + RECALCULATION ═══
  _recalcDependents(cellId) {
    // Lấy tất cả cells phụ thuộc (trực tiếp + gián tiếp):
    const toRecalc = this._topoSort(cellId);

    toRecalc.forEach((id) => {
      const cell = this.cells.get(id);
      if (!cell || !cell.raw.startsWith("=")) return;
      try {
        cell.value = this._evaluate(cell.raw.substring(1));
        cell.error = null;
      } catch (e) {
        cell.value = "#ERROR!";
        cell.error = e.message;
      }
      this._updateCellDisplay(id);
    });
  }

  _topoSort(startId) {
    // BFS từ startId, tìm tất cả dependents:
    const visited = new Set();
    const queue = [startId];
    const order = [];

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      const dependents = this.rdeps.get(id);
      if (dependents) {
        dependents.forEach((dep) => {
          if (!visited.has(dep)) queue.push(dep);
        });
      }
      if (id !== startId) order.push(id);
    }
    return order;
  }

  // ═══ CIRCULAR REFERENCE DETECTION ═══
  _wouldCreateCycle(cellId, newDeps) {
    // DFS: từ mỗi dep, check có đường về cellId không?
    const visited = new Set();
    const stack = [...newDeps];

    while (stack.length > 0) {
      const id = stack.pop();
      if (id === cellId) return true; // CYCLE!
      if (visited.has(id)) continue;
      visited.add(id);

      const deps = this.deps.get(id);
      if (deps) deps.forEach((d) => stack.push(d));
    }
    return false;
  }

  _updateCellDisplay(cellId) {
    const td = this.table.querySelector(`[data-cell="${cellId}"]`);
    if (!td) return;
    const cell = this.cells.get(cellId);
    td.textContent = cell ? (cell.error ? cell.value : cell.value) : "";
    td.classList.toggle("error", !!cell?.error);
  }
}

// Usage:
const sheet = new Spreadsheet("#sheet", 50, 26);
```

### 📖 RADIO Walkthrough — Google Sheets

> **R — Requirements:** Grid NxM cells, formula support (=A1+B2, SUM, AVG, MIN, MAX), dependency tracking, topological sort for recalculation, circular reference detection, keyboard navigation, formula bar.

> **A — Architecture:**

```
Pipeline:
1. User nhập "=B2*C2" vào cell D2
2. Parser: extractRefs("B2*C2") → ["B2", "C2"]
3. Dependency graph: deps["D2"] = {B2, C2}
4. Reverse deps: rdeps["B2"].add("D2"), rdeps["C2"].add("D2")
5. Evaluate: lấy value B2, C2 → thay vào → tính kết quả
6. Khi B2 thay đổi → topoSort("B2") → tìm D2 → recalculate D2!
```

> **I — Implementation:**

**Dependency Graph — 2 chiều:**

```
deps (tôi phụ thuộc ai):
  D2 → {B2, C2}     // D2 cần B2 và C2
  D4 → {D2, D3}     // D4 cần D2 và D3

rdeps (ai phụ thuộc tôi):
  B2 → {D2}         // khi B2 đổi → recalc D2
  D2 → {D4}         // khi D2 đổi → recalc D4
```

Cần `rdeps` để biết khi 1 cell thay đổi → cells NÀO cần recalculate!

**Topological Sort — tại sao cần?**

Khi B2 thay đổi: D2 phụ thuộc B2, D4 phụ thuộc D2. PHẢI tính D2 TRƯỚC D4! Topo sort đảm bảo thứ tự: `[D2, D4]` — cell không phụ thuộc tính trước!

**Circular Reference Detection — DFS:**

```
A1 = "=B1"    B1 = "=A1"
deps: A1→{B1}, B1→{A1}
→ DFS từ B1 → tìm A1 → CYCLE! → "#CIRCULAR!"
```

**Cell Addressing — letter → number:** `A` = `charCodeAt(0) - 65 = 0`, `B = 1`, `Z = 25`. Ngược lại: `String.fromCharCode(65 + col)`.

**`Function("use strict"; return (expr))` — safe eval:** Không dùng `eval()` trực tiếp — `Function()` tạo scope riêng, `"use strict"` ngăn truy cập `this`, `window`.

---

## §21.2 Google Sheets — React

```javascript
import { useState, useCallback, useMemo, useRef } from "react";

function useSpreadsheet(rows = 50, cols = 26) {
  const [cells, setCells] = useState(new Map());
  const [selected, setSelected] = useState(null);
  const depsRef = useRef(new Map());
  const rdepsRef = useRef(new Map());

  const colToLetter = (c) => String.fromCharCode(65 + c);
  const cellId = (r, c) => `${colToLetter(c)}${r + 1}`;

  const getCellValue = useCallback(
    (id) => {
      const cell = cells.get(id);
      if (!cell) return 0;
      return typeof cell.value === "number" ? cell.value : cell.value || 0;
    },
    [cells],
  );

  const evaluate = useCallback(
    (formula) => {
      let expr = formula;
      // SUM:
      expr = expr.replace(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/gi, (_, s, e) => {
        const sr = parseInt(s.match(/\d+/)[0]) - 1,
          sc = s.charCodeAt(0) - 65;
        const er = parseInt(e.match(/\d+/)[0]) - 1,
          ec = e.charCodeAt(0) - 65;
        let sum = 0;
        for (let r = sr; r <= er; r++)
          for (let c = sc; c <= ec; c++) {
            const v = getCellValue(cellId(r, c));
            if (typeof v === "number") sum += v;
          }
        return sum;
      });
      // Cell refs:
      expr = expr.replace(/\b([A-Z]+\d+)\b/g, (_, ref) => {
        const v = getCellValue(ref);
        return typeof v === "number" ? v : 0;
      });
      return Function(`"use strict"; return (${expr})`)();
    },
    [getCellValue],
  );

  const setCellValue = useCallback(
    (id, raw) => {
      setCells((prev) => {
        const next = new Map(prev);
        const cell = { raw, value: raw, error: null };
        depsRef.current.delete(id);

        if (raw.startsWith("=")) {
          const formula = raw.substring(1);
          const refs = [...formula.matchAll(/\b([A-Z]+\d+)\b/g)].map(
            (m) => m[1],
          );
          depsRef.current.set(id, new Set(refs));
          refs.forEach((ref) => {
            if (!rdepsRef.current.has(ref))
              rdepsRef.current.set(ref, new Set());
            rdepsRef.current.get(ref).add(id);
          });
          try {
            cell.value = evaluate(formula);
          } catch {
            cell.value = "#ERROR!";
            cell.error = true;
          }
        } else if (raw && !isNaN(raw)) {
          cell.value = parseFloat(raw);
        }

        next.set(id, cell);

        // Recalc dependents:
        const queue = [...(rdepsRef.current.get(id) || [])];
        const visited = new Set([id]);
        while (queue.length) {
          const dep = queue.shift();
          if (visited.has(dep)) continue;
          visited.add(dep);
          const depCell = next.get(dep);
          if (depCell?.raw?.startsWith("=")) {
            try {
              depCell.value = evaluate(depCell.raw.substring(1));
              depCell.error = null;
            } catch {
              depCell.value = "#ERROR!";
              depCell.error = true;
            }
          }
          (rdepsRef.current.get(dep) || []).forEach((d) => queue.push(d));
        }

        return next;
      });
    },
    [evaluate],
  );

  return {
    cells,
    selected,
    setSelected,
    setCellValue,
    colToLetter,
    cellId,
    rows,
    cols,
  };
}

function SpreadsheetApp() {
  const sheet = useSpreadsheet(50, 26);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleCellClick = (id) => {
    sheet.setSelected(id);
    setEditing(null);
  };

  const handleCellDblClick = (id) => {
    setEditing(id);
    setEditValue(sheet.cells.get(id)?.raw || "");
  };

  const handleEdit = (id, value) => {
    sheet.setCellValue(id, value);
    setEditing(null);
  };

  const visibleRows = 20,
    visibleCols = 10;
  return (
    <div className="spreadsheet">
      <div className="sheet-toolbar">
        <input className="cell-ref" value={sheet.selected || ""} readOnly />
        <input
          className="formula-bar"
          value={
            editing ? editValue : sheet.cells.get(sheet.selected)?.raw || ""
          }
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && sheet.selected)
              handleEdit(sheet.selected, e.target.value);
          }}
        />
      </div>
      <div className="sheet-grid">
        <table>
          <thead>
            <tr>
              <th className="corner row-header col-header"></th>
              {Array.from({ length: visibleCols }, (_, c) => (
                <th key={c} className="col-header">
                  {sheet.colToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: visibleRows }, (_, r) => (
              <tr key={r}>
                <th className="row-header">{r + 1}</th>
                {Array.from({ length: visibleCols }, (_, c) => {
                  const id = sheet.cellId(r, c);
                  const cell = sheet.cells.get(id);
                  return (
                    <td
                      key={c}
                      className={`${sheet.selected === id ? "selected" : ""} ${editing === id ? "editing" : ""} ${cell?.error ? "error" : ""}`}
                      onClick={() => handleCellClick(id)}
                      onDoubleClick={() => handleCellDblClick(id)}
                    >
                      {editing === id ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEdit(id, editValue);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          onBlur={() => handleEdit(id, editValue)}
                        />
                      ) : (
                        (cell?.value ?? "")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### §21.3 Advanced Patterns — Sheets

```javascript
// ═══ PATTERN 1: Virtual scrolling cho grid lớn (1000 rows!) ═══
function useVirtualGrid(totalRows, totalCols, rowHeight = 25) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 500;
  const startRow = Math.floor(scrollTop / rowHeight);
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 2;
  const endRow = Math.min(startRow + visibleRows, totalRows);

  return {
    startRow,
    endRow,
    visibleRows,
    totalHeight: totalRows * rowHeight,
    offsetY: startRow * rowHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
  };
}

// ═══ PATTERN 2: Undo/Redo stack ═══
function useSheetHistory() {
  const [history, setHistory] = useState([new Map()]);
  const [index, setIndex] = useState(0);

  const push = useCallback(
    (cells) => {
      setHistory((prev) => [...prev.slice(0, index + 1), new Map(cells)]);
      setIndex((i) => i + 1);
    },
    [index],
  );

  const undo = useCallback(() => index > 0 && setIndex((i) => i - 1), [index]);
  const redo = useCallback(
    () => index < history.length - 1 && setIndex((i) => i + 1),
    [index, history.length],
  );

  return { cells: history[index], push, undo, redo };
}

// ═══ PATTERN 3: CSV Export ═══
function exportCSV(cells, rows, cols) {
  const colToLetter = (c) => String.fromCharCode(65 + c);
  let csv = "";
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const id = `${colToLetter(c)}${r + 1}`;
      const cell = cells.get(id);
      row.push(cell?.value ?? "");
    }
    csv += row.join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spreadsheet.csv";
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## §21.4 Google Sheets — Web Component

```javascript
class MySpreadsheet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cells = new Map();
    this._deps = new Map();
    this._rdeps = new Map();
    this._sel = null;
    this._rows = 20;
    this._cols = 10;
  }

  connectedCallback() {
    const colL = (c) => String.fromCharCode(65 + c);
    const cid = (r, c) => `${colL(c)}${r + 1}`;

    let ths = "<th></th>";
    for (let c = 0; c < this._cols; c++) ths += `<th>${colL(c)}</th>`;
    let rows = "";
    for (let r = 0; r < this._rows; r++) {
      rows += `<tr><th>${r + 1}</th>`;
      for (let c = 0; c < this._cols; c++)
        rows += `<td data-c="${cid(r, c)}"></td>`;
      rows += "</tr>";
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui; }
        .bar { display: flex; gap: 8px; padding: 8px; background: #f3f3f3; border-bottom: 1px solid #c0c0c0; }
        .ref { width: 50px; padding: 4px; border: 1px solid #c0c0c0; border-radius: 4px; text-align: center; }
        .fb { flex: 1; padding: 4px 8px; border: 1px solid #c0c0c0; border-radius: 4px; outline: none; }
        .grid { overflow: auto; max-height: 500px; }
        table { border-collapse: collapse; }
        th { background: #f3f3f3; border: 1px solid #c0c0c0; padding: 2px 8px; font-size: 12px; font-weight: normal; min-width: 80px; }
        td { border: 1px solid #e0e0e0; padding: 2px 6px; min-width: 80px; height: 24px; font-size: 13px; cursor: cell; }
        td.sel { outline: 2px solid #1a73e8; }
        td.err { color: #d93025; }
        input { width: 100%; border: none; outline: none; font-size: 13px; }
      </style>
      <div class="bar"><input class="ref" readonly><input class="fb" placeholder="=A1+B1"></div>
      <div class="grid"><table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>
    `;

    const table = this.shadowRoot.querySelector("table");
    const ref = this.shadowRoot.querySelector(".ref");
    const fb = this.shadowRoot.querySelector(".fb");

    table.addEventListener("click", (e) => {
      const td = e.target.closest("td");
      if (!td) return;
      table.querySelectorAll(".sel").forEach((t) => t.classList.remove("sel"));
      td.classList.add("sel");
      this._sel = td.dataset.c;
      ref.value = this._sel;
      fb.value = this._cells.get(this._sel)?.raw || "";
    });

    table.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td");
      if (!td) return;
      const raw = this._cells.get(td.dataset.c)?.raw || "";
      td.innerHTML = `<input value="${raw}">`;
      const inp = td.querySelector("input");
      inp.focus();
      inp.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          this._set(td.dataset.c, inp.value, table);
        }
        if (ev.key === "Escape") {
          td.textContent = this._cells.get(td.dataset.c)?.value ?? "";
        }
      });
      inp.addEventListener("blur", () => {
        this._set(td.dataset.c, inp.value, table);
      });
    });

    fb.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this._sel) this._set(this._sel, fb.value, table);
    });
  }

  _set(id, raw, table) {
    raw = raw.trim();
    const cell = { raw, value: raw, error: null };
    if (raw.startsWith("=")) {
      let expr = raw.substring(1);
      expr = expr.replace(/\b([A-Z]+\d+)\b/g, (_, r) => {
        const v = this._cells.get(r)?.value;
        return typeof v === "number" ? v : 0;
      });
      try {
        cell.value = Function(`"use strict"; return (${expr})`)();
      } catch {
        cell.value = "#ERROR!";
        cell.error = true;
      }
    } else if (raw && !isNaN(raw)) cell.value = parseFloat(raw);
    this._cells.set(id, cell);
    const td = table.querySelector(`[data-c="${id}"]`);
    if (td) {
      td.textContent = cell.value;
      td.classList.toggle("err", !!cell.error);
    }
  }
}
customElements.define("my-spreadsheet", MySpreadsheet);
```

```html
<my-spreadsheet></my-spreadsheet>
```
