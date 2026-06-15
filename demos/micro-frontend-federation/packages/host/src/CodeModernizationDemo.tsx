/**
 * CodeModernizationDemo.tsx
 *
 * Demonstrates the key patterns used in code modernization projects:
 *  1. Legacy → TypeScript migration with strict typing
 *  2. Business logic segmentation (pure functions, services, hooks)
 *  3. Test-friendly architecture (dependency injection, pure functions)
 *  4. Self-documenting code + inline behavior docs
 *
 * This file is BOTH a runnable demo AND a living document.
 */

import React, {
  useState,
  useCallback,
  useReducer,
  useMemo,
  useEffect,
} from "react";

// ============================================================
// SECTION 1: LEGACY CODE → TYPESCRIPT (Before / After)
// ============================================================

/**
 * BEFORE (legacy JS — real anti-patterns):
 *
 * function processOrder(order) {
 *   if (order.items.length > 0) {
 *     var total = 0;
 *     for (var i = 0; i < order.items.length; i++) {
 *       total += order.items[i].price * order.items[i].qty;
 *     }
 *     if (order.discount) total = total - (total * order.discount);
 *     order.total = total;
 *     order.processed = true;
 *   }
 *   return order;
 * }
 *
 * Issues:
 *   - No type safety: order could be anything
 *   - Mutates input (side effect) — hard to test
 *   - var hoisting bugs
 *   - No docs — what is "discount"? A rate? A flat amount?
 *   - Business rule buried in loop — cannot unit test separately
 */

// ── AFTER: Strict TypeScript + Pure Functions ─────────────────

/** Represents a single line item in an order */
export interface OrderItem {
  id: string;
  name: string;
  /** Unit price in cents (avoid floating-point rounding issues) */
  priceInCents: number;
  quantity: number;
}

/** Discount type: percentage (0.0–1.0) or flat amount in cents */
export type Discount =
  | { type: "percentage"; rate: number } // e.g. 0.1 = 10%
  | { type: "flat"; amountInCents: number }; // e.g. 500 = $5.00

/** Fully typed Order — all fields explicit, no hidden mutations */
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  discount?: Discount;
  /** Computed field — set by processOrder, never passed in */
  readonly totalInCents?: number;
  readonly isProcessed?: boolean;
  readonly processedAt?: Date;
}

export interface ProcessedOrder extends Order {
  totalInCents: number;
  isProcessed: true;
  processedAt: Date;
}

// ── Segmented Business Logic — Pure Functions ─────────────────

/**
 * Calculates the subtotal for a single line item.
 * Pure function — no side effects, fully testable.
 *
 * @param item - The order item to calculate
 * @returns Total price in cents for this line item
 */
export function calculateLineTotal(item: OrderItem): number {
  if (item.quantity < 0) throw new Error(`Invalid quantity for item ${item.id}`);
  if (item.priceInCents < 0) throw new Error(`Invalid price for item ${item.id}`);
  return item.priceInCents * item.quantity;
}

/**
 * Calculates the subtotal of all items before discount.
 * Separated from discount logic for independent testability.
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

/**
 * Applies a discount to a subtotal.
 * All business rules documented inline.
 *
 * @param subtotalInCents - Pre-discount amount
 * @param discount - Discount to apply (percentage or flat)
 * @returns Discounted amount in cents (never negative)
 */
export function applyDiscount(
  subtotalInCents: number,
  discount: Discount
): number {
  let discounted: number;

  if (discount.type === "percentage") {
    // Rule: percentage rate must be between 0 and 1 (0% – 100%)
    if (discount.rate < 0 || discount.rate > 1) {
      throw new Error(`Discount rate must be 0.0–1.0, got ${discount.rate}`);
    }
    discounted = subtotalInCents * (1 - discount.rate);
  } else {
    // Rule: flat discount cannot exceed subtotal (order total cannot go negative)
    discounted = Math.max(0, subtotalInCents - discount.amountInCents);
  }

  return Math.round(discounted); // Avoid floating point cents
}

/**
 * Processes an order: calculates total and marks as processed.
 * IMMUTABLE — returns a new ProcessedOrder, never mutates input.
 *
 * @param order - Raw order with items and optional discount
 * @returns A new ProcessedOrder with computed fields
 * @throws Error if order has no items
 */
export function processOrder(order: Order): ProcessedOrder {
  if (order.items.length === 0) {
    throw new Error(`Cannot process empty order ${order.id}`);
  }

  const subtotal = calculateSubtotal(order.items);
  const totalInCents = order.discount
    ? applyDiscount(subtotal, order.discount)
    : subtotal;

  // Spread original + add computed fields (immutable pattern)
  return {
    ...order,
    totalInCents,
    isProcessed: true,
    processedAt: new Date(),
  };
}

/** Format cents to display string: 1050 → "$10.50" */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ============================================================
// SECTION 2: STATE MANAGEMENT — Reducer Pattern
// (Replacing scattered useState calls with typed reducer)
// ============================================================

interface CartItem extends OrderItem {
  addedAt: Date;
}

export interface CartState {
  items: CartItem[];
  discount?: Discount;
  status: "idle" | "processing" | "processed" | "error";
  errorMessage?: string;
  processedOrder?: ProcessedOrder;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: OrderItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "APPLY_DISCOUNT"; payload: Discount }
  | { type: "REMOVE_DISCOUNT" }
  | { type: "PROCESS_ORDER"; payload: { orderId: string; customerId: string } }
  | { type: "PROCESS_SUCCESS"; payload: ProcessedOrder }
  | { type: "PROCESS_ERROR"; payload: { message: string } }
  | { type: "RESET" };

const initialCartState: CartState = {
  items: [],
  status: "idle",
};

/**
 * Cart reducer — all business state in one place.
 * Pure function: easy to test every action independently.
 * Documented: each case explains the business rule applied.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      // Business rule: if item already in cart, increment quantity
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.payload, addedAt: new Date() },
        ],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case "UPDATE_QUANTITY": {
      // Business rule: quantity 0 removes item from cart
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }

    case "APPLY_DISCOUNT":
      return { ...state, discount: action.payload };

    case "REMOVE_DISCOUNT":
      return { ...state, discount: undefined };

    case "PROCESS_ORDER":
      return { ...state, status: "processing", errorMessage: undefined };

    case "PROCESS_SUCCESS":
      return {
        ...state,
        status: "processed",
        processedOrder: action.payload,
      };

    case "PROCESS_ERROR":
      return {
        ...state,
        status: "error",
        errorMessage: action.payload.message,
      };

    case "RESET":
      return initialCartState;

    default:
      return state;
  }
}

// ============================================================
// SECTION 3: CUSTOM HOOKS — Separating Logic from UI
// (Business logic hook — testable without rendering)
// ============================================================

interface UseCartReturn {
  items: CartItem[];
  discount?: Discount;
  status: CartState["status"];
  errorMessage?: string;
  processedOrder?: ProcessedOrder;
  subtotal: number;
  total: number;
  itemCount: number;
  addItem: (item: OrderItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPercentageDiscount: (rate: number) => void;
  applyFlatDiscount: (amountInCents: number) => void;
  removeDiscount: () => void;
  checkout: () => Promise<void>;
  reset: () => void;
}

/**
 * useCart — encapsulates all cart business logic.
 * UI components consume this hook; they don't know HOW cart works.
 * This hook can be tested independently using renderHook().
 */
export function useCart(): UseCartReturn {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  /** Memoized subtotal — only recalculates when items change */
  const subtotal = useMemo(
    () => calculateSubtotal(state.items),
    [state.items]
  );

  /** Memoized total with discount applied */
  const total = useMemo(
    () => (state.discount ? applyDiscount(subtotal, state.discount) : subtotal),
    [subtotal, state.discount]
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const addItem = useCallback(
    (item: OrderItem) => dispatch({ type: "ADD_ITEM", payload: item }),
    []
  );

  const removeItem = useCallback(
    (id: string) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    []
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } }),
    []
  );

  const applyPercentageDiscount = useCallback(
    (rate: number) =>
      dispatch({ type: "APPLY_DISCOUNT", payload: { type: "percentage", rate } }),
    []
  );

  const applyFlatDiscount = useCallback(
    (amountInCents: number) =>
      dispatch({
        type: "APPLY_DISCOUNT",
        payload: { type: "flat", amountInCents },
      }),
    []
  );

  const removeDiscount = useCallback(
    () => dispatch({ type: "REMOVE_DISCOUNT" }),
    []
  );

  /**
   * Checkout: orchestrates the order processing flow.
   * Business logic (processOrder) is separated from this async coordinator.
   */
  const checkout = useCallback(async () => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      customerId: "USER-DEMO",
      items: state.items,
      discount: state.discount,
    };

    dispatch({ type: "PROCESS_ORDER", payload: { orderId: order.id, customerId: order.customerId } });

    try {
      // Simulate async API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const processed = processOrder(order);
      dispatch({ type: "PROCESS_SUCCESS", payload: processed });
    } catch (err) {
      dispatch({
        type: "PROCESS_ERROR",
        payload: { message: err instanceof Error ? err.message : "Unknown error" },
      });
    }
  }, [state.items, state.discount]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    items: state.items,
    discount: state.discount,
    status: state.status,
    errorMessage: state.errorMessage,
    processedOrder: state.processedOrder,
    subtotal,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    applyPercentageDiscount,
    applyFlatDiscount,
    removeDiscount,
    checkout,
    reset,
  };
}

// ============================================================
// SECTION 4: UI LAYER — Pure presentational components
// (Thin UI — no business logic here)
// ============================================================

const SAMPLE_PRODUCTS: OrderItem[] = [
  { id: "P1", name: "TypeScript Handbook", priceInCents: 2999, quantity: 1 },
  { id: "P2", name: "React Testing Library", priceInCents: 1999, quantity: 1 },
  { id: "P3", name: "Clean Code Principles", priceInCents: 3499, quantity: 1 },
  { id: "P4", name: "Refactoring Guide", priceInCents: 2499, quantity: 1 },
];

// ── Sub-components ─────────────────────────────────────────────

function CodeBadge({ label, code }: { label: string; code: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
        {label}:
      </span>
      <code
        style={{
          fontSize: 11,
          background: "#1e293b",
          color: "#7dd3fc",
          padding: "2px 6px",
          borderRadius: 4,
          fontFamily: "monospace",
        }}
      >
        {code}
      </code>
    </span>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: OrderItem;
  onAdd: (p: OrderItem) => void;
}) {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div>
        <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>
          {product.name}
        </div>
        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
          <CodeBadge label="id" code={product.id} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{ color: "#34d399", fontWeight: 700, fontFamily: "monospace" }}
        >
          {formatCents(product.priceInCents)}
        </span>
        <button
          onClick={() => onAdd(product)}
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onQuantity: (id: string, qty: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #1e293b",
        gap: 8,
      }}
    >
      <span style={{ color: "#e2e8f0", fontSize: 13, flex: 1 }}>
        {item.name}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => onQuantity(item.id, item.quantity - 1)}
          style={qtyBtnStyle}
        >
          −
        </button>
        <span
          style={{
            color: "#f1f5f9",
            minWidth: 20,
            textAlign: "center",
            fontFamily: "monospace",
          }}
        >
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantity(item.id, item.quantity + 1)}
          style={qtyBtnStyle}
        >
          +
        </button>
      </div>
      <span
        style={{
          color: "#34d399",
          fontFamily: "monospace",
          fontWeight: 600,
          minWidth: 60,
          textAlign: "right",
        }}
      >
        {formatCents(item.priceInCents * item.quantity)}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: "0 4px",
        }}
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  background: "#334155",
  border: "none",
  color: "#94a3b8",
  borderRadius: 4,
  width: 24,
  height: 24,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            background: "#3b82f6",
            color: "#fff",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {number}
        </span>
        <h3
          style={{
            margin: 0,
            color: "#f1f5f9",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {title}
        </h3>
      </div>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{subtitle}</p>
    </div>
  );
}

// ── Inline Code Diff Viewer ────────────────────────────────────

function DiffViewer({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [view, setView] = useState<"before" | "after" | "split">("split");

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#3b82f6" : "#1e293b",
    color: active ? "#fff" : "#64748b",
    border: `1px solid ${active ? "#3b82f6" : "#334155"}`,
    borderRadius: 6,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  });

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        border: "1px solid #1e293b",
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 12px",
          borderBottom: "1px solid #1e293b",
          background: "#1e293b",
        }}
      >
        {(["before", "after", "split"] as const).map((v) => (
          <button key={v} style={btnStyle(view === v)} onClick={() => setView(v)}>
            {v === "before" ? "Legacy JS" : v === "after" ? "TypeScript" : "Split View"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", overflow: "auto" }}>
        {(view === "before" || view === "split") && (
          <pre
            style={{
              flex: 1,
              margin: 0,
              padding: "12px 16px",
              fontSize: 11,
              fontFamily: "monospace",
              color: "#fca5a5",
              lineHeight: 1.6,
              borderRight: view === "split" ? "1px solid #334155" : "none",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {view === "split" && (
              <div style={{ color: "#64748b", marginBottom: 8, fontSize: 10 }}>
                ❌ BEFORE (Legacy JS)
              </div>
            )}
            {before}
          </pre>
        )}
        {(view === "after" || view === "split") && (
          <pre
            style={{
              flex: 1,
              margin: 0,
              padding: "12px 16px",
              fontSize: 11,
              fontFamily: "monospace",
              color: "#86efac",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {view === "split" && (
              <div style={{ color: "#64748b", marginBottom: 8, fontSize: 10 }}>
                ✅ AFTER (TypeScript)
              </div>
            )}
            {after}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Test Coverage Panel ────────────────────────────────────────

interface TestCase {
  name: string;
  fn: () => boolean;
  category: "unit" | "integration";
}

const TEST_SUITE: TestCase[] = [
  {
    name: "calculateLineTotal: 3 × $9.99 = $29.97",
    category: "unit",
    fn: () =>
      calculateLineTotal({ id: "1", name: "X", priceInCents: 999, quantity: 3 }) === 2997,
  },
  {
    name: "calculateSubtotal: sum of 2 items",
    category: "unit",
    fn: () =>
      calculateSubtotal([
        { id: "1", name: "A", priceInCents: 1000, quantity: 2 },
        { id: "2", name: "B", priceInCents: 500, quantity: 1 },
      ]) === 2500,
  },
  {
    name: "applyDiscount: 10% off $100 = $90",
    category: "unit",
    fn: () =>
      applyDiscount(10000, { type: "percentage", rate: 0.1 }) === 9000,
  },
  {
    name: "applyDiscount: flat $5 off $20 = $15",
    category: "unit",
    fn: () =>
      applyDiscount(2000, { type: "flat", amountInCents: 500 }) === 1500,
  },
  {
    name: "applyDiscount: flat > subtotal = $0 (never negative)",
    category: "unit",
    fn: () =>
      applyDiscount(100, { type: "flat", amountInCents: 500 }) === 0,
  },
  {
    name: "processOrder: returns immutable processed order",
    category: "unit",
    fn: () => {
      const order: Order = {
        id: "O1",
        customerId: "C1",
        items: [{ id: "P1", name: "Book", priceInCents: 1000, quantity: 2 }],
      };
      const processed = processOrder(order);
      return (
        processed.totalInCents === 2000 &&
        processed.isProcessed === true &&
        processed.processedAt instanceof Date &&
        order.totalInCents === undefined // ← original NOT mutated!
      );
    },
  },
  {
    name: "processOrder: throws on empty items",
    category: "unit",
    fn: () => {
      try {
        processOrder({ id: "O1", customerId: "C1", items: [] });
        return false;
      } catch {
        return true;
      }
    },
  },
  {
    name: "cartReducer ADD_ITEM: adds new item",
    category: "unit",
    fn: () => {
      const next = cartReducer(initialCartState, {
        type: "ADD_ITEM",
        payload: { id: "1", name: "A", priceInCents: 100, quantity: 1 },
      });
      return next.items.length === 1;
    },
  },
  {
    name: "cartReducer ADD_ITEM: increments if duplicate",
    category: "unit",
    fn: () => {
      const state1 = cartReducer(initialCartState, {
        type: "ADD_ITEM",
        payload: { id: "1", name: "A", priceInCents: 100, quantity: 1 },
      });
      const state2 = cartReducer(state1, {
        type: "ADD_ITEM",
        payload: { id: "1", name: "A", priceInCents: 100, quantity: 2 },
      });
      return state2.items.length === 1 && state2.items[0].quantity === 3;
    },
  },
  {
    name: "cartReducer UPDATE_QUANTITY 0: removes item",
    category: "integration",
    fn: () => {
      const state1 = cartReducer(initialCartState, {
        type: "ADD_ITEM",
        payload: { id: "1", name: "A", priceInCents: 100, quantity: 1 },
      });
      const state2 = cartReducer(state1, {
        type: "UPDATE_QUANTITY",
        payload: { id: "1", quantity: 0 },
      });
      return state2.items.length === 0;
    },
  },
];

function TestRunner() {
  const [results, setResults] = useState<
    Array<{ test: TestCase; passed: boolean; error?: string }>
  >([]);
  const [ran, setRan] = useState(false);

  const runTests = () => {
    const r = TEST_SUITE.map((test) => {
      try {
        return { test, passed: test.fn() };
      } catch (err) {
        return {
          test,
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });
    setResults(r);
    setRan(true);
  };

  const passed = results.filter((r) => r.passed).length;
  const coverage = ran ? Math.round((passed / TEST_SUITE.length) * 100) : 0;

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        border: "1px solid #1e293b",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          background: "#1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
            🧪 Test Suite — {TEST_SUITE.length} test cases
          </span>
          {ran && (
            <span
              style={{
                background: coverage === 100 ? "#052e16" : "#7f1d1d",
                color: coverage === 100 ? "#4ade80" : "#fca5a5",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {coverage}% PASS
            </span>
          )}
        </div>
        <button
          onClick={runTests}
          style={{
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ▶ Run Tests
        </button>
      </div>

      {ran && (
        <div style={{ padding: "12px 16px", maxHeight: 280, overflow: "auto" }}>
          {results.map(({ test, passed: p, error }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "5px 0",
                borderBottom: "1px solid #1e293b",
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>
                {p ? "✅" : "❌"}
              </span>
              <span
                style={{
                  color: p ? "#86efac" : "#fca5a5",
                  fontFamily: "monospace",
                  flex: 1,
                }}
              >
                [{test.category}] {test.name}
                {error && (
                  <span style={{ color: "#f87171", display: "block", fontSize: 10 }}>
                    Error: {error}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {!ran && (
        <div
          style={{
            padding: "20px 16px",
            color: "#475569",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Click "Run Tests" to execute the test suite in-browser
        </div>
      )}
    </div>
  );
}

// ── Main Demo Component ────────────────────────────────────────

export function CodeModernizationDemo() {
  const cart = useCart();
  const [activeTab, setActiveTab] = useState<"demo" | "before-after" | "tests">(
    "demo"
  );

  // Auto-add a starter item for demo
  useEffect(() => {
    cart.addItem(SAMPLE_PRODUCTS[0]);
    cart.addItem(SAMPLE_PRODUCTS[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: "demo" as const, label: "🛒 Live Demo" },
    { id: "before-after" as const, label: "📝 Before/After" },
    { id: "tests" as const, label: "🧪 Test Coverage" },
  ];

  return (
    <div
      style={{
        background: "#0f172a",
        color: "#f1f5f9",
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🔧</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
            Code Modernization Demo
          </h1>
        </div>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14, maxWidth: 620 }}>
          Showcasing TypeScript migration, business logic segmentation,
          test-friendly architecture, and self-documenting code patterns.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {[
            "TypeScript strict mode",
            "Pure functions",
            "useReducer pattern",
            "Custom hooks",
            "Immutable state",
            "Inline docs",
          ].map((tag) => (
            <span
              key={tag}
              style={{
                background: "#1e293b",
                color: "#94a3b8",
                border: "1px solid #334155",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid #1e293b",
          paddingBottom: 4,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#1e293b" : "transparent",
              color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
              border:
                activeTab === tab.id
                  ? "1px solid #334155"
                  : "1px solid transparent",
              borderRadius: "8px 8px 0 0",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Live Demo */}
      {activeTab === "demo" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            maxWidth: 900,
          }}
        >
          {/* Products */}
          <div>
            <SectionHeader
              number="01"
              title="Products"
              subtitle="Typed OrderItem — add to cart via useCart() hook"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SAMPLE_PRODUCTS.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={cart.addItem} />
              ))}
            </div>
          </div>

          {/* Cart */}
          <div>
            <SectionHeader
              number="02"
              title={`Cart (${cart.itemCount} items)`}
              subtitle="cartReducer + useCart hook — fully typed state"
            />
            <div
              style={{
                background: "#1e293b",
                borderRadius: 10,
                border: "1px solid #334155",
                padding: 16,
              }}
            >
              {cart.items.length === 0 ? (
                <div
                  style={{
                    color: "#475569",
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: 13,
                  }}
                >
                  Cart is empty
                </div>
              ) : (
                cart.items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={cart.removeItem}
                    onQuantity={cart.updateQuantity}
                  />
                ))
              )}

              {/* Discount controls */}
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 0",
                  borderTop: "1px solid #334155",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <button
                    onClick={() => cart.applyPercentageDiscount(0.1)}
                    style={discountBtnStyle}
                  >
                    10% Off
                  </button>
                  <button
                    onClick={() => cart.applyPercentageDiscount(0.2)}
                    style={discountBtnStyle}
                  >
                    20% Off
                  </button>
                  <button
                    onClick={() => cart.applyFlatDiscount(500)}
                    style={discountBtnStyle}
                  >
                    −$5 Flat
                  </button>
                  {cart.discount && (
                    <button
                      onClick={cart.removeDiscount}
                      style={{ ...discountBtnStyle, color: "#ef4444" }}
                    >
                      Remove Discount
                    </button>
                  )}
                </div>

                {/* Price summary */}
                <div style={{ fontSize: 13 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "monospace" }}>
                      {formatCents(cart.subtotal)}
                    </span>
                  </div>
                  {cart.discount && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#fbbf24",
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span>
                        Discount (
                        {cart.discount.type === "percentage"
                          ? `${cart.discount.rate * 100}%`
                          : `−${formatCents(cart.discount.amountInCents)}`}
                        )
                      </span>
                      <span style={{ fontFamily: "monospace" }}>
                        −{formatCents(cart.subtotal - cart.total)}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#34d399",
                      fontWeight: 700,
                      fontSize: 15,
                      paddingTop: 6,
                      borderTop: "1px solid #334155",
                    }}
                  >
                    <span>Total</span>
                    <span style={{ fontFamily: "monospace" }}>
                      {formatCents(cart.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout */}
              {cart.status === "processed" && cart.processedOrder ? (
                <div
                  style={{
                    background: "#052e16",
                    border: "1px solid #166534",
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
                    ✅ Order Processed!
                  </div>
                  <div
                    style={{
                      color: "#86efac",
                      fontFamily: "monospace",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {cart.processedOrder.id} →{" "}
                    {formatCents(cart.processedOrder.totalInCents)}
                  </div>
                  <button
                    onClick={cart.reset}
                    style={{
                      marginTop: 8,
                      background: "#1e293b",
                      color: "#94a3b8",
                      border: "1px solid #334155",
                      borderRadius: 6,
                      padding: "4px 12px",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Reset Cart
                  </button>
                </div>
              ) : cart.status === "error" ? (
                <div
                  style={{
                    background: "#450a0a",
                    border: "1px solid #7f1d1d",
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 12,
                    color: "#fca5a5",
                    fontSize: 12,
                  }}
                >
                  ❌ {cart.errorMessage}
                </div>
              ) : (
                <button
                  onClick={cart.checkout}
                  disabled={cart.items.length === 0 || cart.status === "processing"}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    background:
                      cart.status === "processing" ? "#1e293b" : "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 0",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    opacity: cart.items.length === 0 ? 0.4 : 1,
                    transition: "background 0.2s",
                  }}
                >
                  {cart.status === "processing"
                    ? "Processing..."
                    : "Checkout →"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Before/After */}
      {activeTab === "before-after" && (
        <div style={{ maxWidth: 900 }}>
          <SectionHeader
            number="03"
            title="Before → After: TypeScript Migration"
            subtitle="Toggle between legacy JavaScript and modernized TypeScript"
          />
          <DiffViewer
            before={`// Legacy JavaScript (no types, mutable, untestable)
function processOrder(order) {
  if (order.items.length > 0) {
    var total = 0;
    for (var i = 0; i < order.items.length; i++) {
      total += order.items[i].price * order.items[i].qty;
    }
    if (order.discount)
      total = total - (total * order.discount);
    order.total = total; // ← MUTATION (bad!)
    order.processed = true;
  }
  return order;
}`}
            after={`// TypeScript — Pure function, immutable, documented
export function processOrder(order: Order): ProcessedOrder {
  if (order.items.length === 0)
    throw new Error(\`Cannot process empty order \${order.id}\`);

  const subtotal = calculateSubtotal(order.items);
  const totalInCents = order.discount
    ? applyDiscount(subtotal, order.discount)
    : subtotal;

  // Spread pattern — never mutates original!
  return {
    ...order,
    totalInCents,
    isProcessed: true,
    processedAt: new Date(),
  };
}`}
          />

          <SectionHeader
            number="04"
            title="Business Logic Segmentation"
            subtitle="Each function does ONE thing — independently testable"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                fn: "calculateLineTotal()",
                what: "price × qty for 1 item",
                layer: "Pure Math",
              },
              {
                fn: "calculateSubtotal()",
                what: "sum of all line totals",
                layer: "Aggregation",
              },
              {
                fn: "applyDiscount()",
                what: "apply % or flat discount",
                layer: "Business Rule",
              },
              {
                fn: "processOrder()",
                what: "orchestrate all above",
                layer: "Service",
              },
              {
                fn: "cartReducer()",
                what: "state transitions",
                layer: "State",
              },
              {
                fn: "useCart()",
                what: "hook exposing API to UI",
                layer: "Hook (UI Bridge)",
              },
            ].map((item) => (
              <div
                key={item.fn}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <code
                  style={{
                    fontSize: 11,
                    color: "#7dd3fc",
                    fontFamily: "monospace",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {item.fn}
                </code>
                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>
                  {item.what}
                </div>
                <span
                  style={{
                    background: "#0f172a",
                    color: "#64748b",
                    fontSize: 10,
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontFamily: "monospace",
                  }}
                >
                  {item.layer}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Test Coverage */}
      {activeTab === "tests" && (
        <div style={{ maxWidth: 700 }}>
          <SectionHeader
            number="05"
            title="Test Coverage — Run In-Browser"
            subtitle="Pure functions make every business rule independently testable. Click Run Tests."
          />
          <TestRunner />
          <div
            style={{
              marginTop: 16,
              background: "#1e293b",
              borderRadius: 10,
              border: "1px solid #334155",
              padding: 16,
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>
              📋 What makes this code testable?
            </div>
            {[
              "Pure functions (calculateLineTotal, applyDiscount) → no mocks needed",
              "Immutable processOrder → original object unchanged (easy to verify)",
              "cartReducer is a pure function → test state transitions directly",
              "Business logic in separate functions → not buried inside React components",
              "TypeScript types → catch integration errors at compile time",
              "useCart hook → testable with renderHook() without UI rendering",
            ].map((point, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}
              >
                <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const discountBtnStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "#fbbf24",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

export default CodeModernizationDemo;
