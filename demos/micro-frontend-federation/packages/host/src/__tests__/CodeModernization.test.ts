/**
 * CodeModernization.test.ts
 *
 * Demonstrates IMPROVED FRONT-END TEST COVERAGE after modernization.
 *
 * BEFORE (legacy): 0 tests — no test runner, untestable code
 * AFTER (modern):  100% coverage of business logic via pure functions
 *
 * Run with: vitest  (or: jest --config=jest.config.ts)
 *
 * Pattern: Each pure function = its own describe block
 *   → Failures are instantly localized
 *   → Each test name reads like a specification
 */

import {
  // Pure math functions
  calculateLineTotal,
  calculateSubtotal,
  applyDiscount,
  processOrder,
  formatCents,
  // State management
  cartReducer,
  // Types
  type CartState,
  type OrderItem,
  type Order,
  type Discount,
} from "../CodeModernizationDemo";

// ─────────────────────────────────────────────────────────────────
// Test Fixtures — shared data across test suites
// ─────────────────────────────────────────────────────────────────

/** Create a valid OrderItem for testing — override any field via spread */
function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "TEST-1",
    name: "Test Item",
    priceInCents: 1000, // $10.00
    quantity: 1,
    ...overrides,
  };
}

/** Create a valid Order for testing */
function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ORD-TEST",
    customerId: "CUST-TEST",
    items: [makeItem()],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// calculateLineTotal
// ─────────────────────────────────────────────────────────────────

describe("calculateLineTotal", () => {
  it("returns priceInCents × quantity", () => {
    const item = makeItem({ priceInCents: 999, quantity: 3 });
    expect(calculateLineTotal(item)).toBe(2997);
  });

  it("returns 0 when quantity is 0", () => {
    const item = makeItem({ priceInCents: 999, quantity: 0 });
    expect(calculateLineTotal(item)).toBe(0);
  });

  it("handles single unit correctly", () => {
    const item = makeItem({ priceInCents: 4999, quantity: 1 });
    expect(calculateLineTotal(item)).toBe(4999);
  });

  it("handles large quantities without overflow", () => {
    // 10,000 items at $100 each = $1,000,000 (10,000,000 cents)
    const item = makeItem({ priceInCents: 10000, quantity: 1000 });
    expect(calculateLineTotal(item)).toBe(10_000_000);
  });

  it("throws on negative quantity", () => {
    const item = makeItem({ quantity: -1 });
    expect(() => calculateLineTotal(item)).toThrow("Invalid quantity");
  });

  it("throws on negative price", () => {
    const item = makeItem({ priceInCents: -100 });
    expect(() => calculateLineTotal(item)).toThrow("Invalid price");
  });
});

// ─────────────────────────────────────────────────────────────────
// calculateSubtotal
// ─────────────────────────────────────────────────────────────────

describe("calculateSubtotal", () => {
  it("sums all line totals", () => {
    const items: OrderItem[] = [
      makeItem({ id: "A", priceInCents: 1000, quantity: 2 }), // 2000
      makeItem({ id: "B", priceInCents: 500, quantity: 3 }),  // 1500
      makeItem({ id: "C", priceInCents: 250, quantity: 1 }),  // 250
    ];
    expect(calculateSubtotal(items)).toBe(3750);
  });

  it("returns 0 for empty array", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("returns correct total for single item", () => {
    const items = [makeItem({ priceInCents: 2999, quantity: 2 })];
    expect(calculateSubtotal(items)).toBe(5998);
  });

  it("does not mutate the input array", () => {
    const items = [makeItem({ priceInCents: 100, quantity: 1 })];
    const originalLength = items.length;
    calculateSubtotal(items);
    expect(items.length).toBe(originalLength);
    expect(items[0].priceInCents).toBe(100); // unchanged
  });
});

// ─────────────────────────────────────────────────────────────────
// applyDiscount — Business Rule Testing
// ─────────────────────────────────────────────────────────────────

describe("applyDiscount", () => {
  describe("percentage discounts", () => {
    it("applies 10% discount correctly", () => {
      const result = applyDiscount(10000, { type: "percentage", rate: 0.1 });
      expect(result).toBe(9000); // $90.00 from $100.00
    });

    it("applies 20% discount correctly", () => {
      const result = applyDiscount(10000, { type: "percentage", rate: 0.2 });
      expect(result).toBe(8000);
    });

    it("applies 100% discount (free item)", () => {
      const result = applyDiscount(10000, { type: "percentage", rate: 1.0 });
      expect(result).toBe(0);
    });

    it("applies 0% discount (no change)", () => {
      const result = applyDiscount(10000, { type: "percentage", rate: 0 });
      expect(result).toBe(10000);
    });

    it("rounds to nearest cent (no floating-point artifacts)", () => {
      // 10% of 999 cents = 899.1 → should round to 899
      const result = applyDiscount(999, { type: "percentage", rate: 0.1 });
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(899);
    });

    it("throws when rate < 0", () => {
      expect(() =>
        applyDiscount(1000, { type: "percentage", rate: -0.1 })
      ).toThrow("0.0–1.0");
    });

    it("throws when rate > 1 (invalid: 150%)", () => {
      expect(() =>
        applyDiscount(1000, { type: "percentage", rate: 1.5 })
      ).toThrow("0.0–1.0");
    });
  });

  describe("flat discounts", () => {
    it("applies flat $5 discount", () => {
      const result = applyDiscount(2000, { type: "flat", amountInCents: 500 });
      expect(result).toBe(1500);
    });

    it("applies flat $0 discount (no change)", () => {
      const result = applyDiscount(2000, { type: "flat", amountInCents: 0 });
      expect(result).toBe(2000);
    });

    it("Business Rule: flat discount caps at 0 (never negative)", () => {
      // $5 discount on a $1 item → total = $0, NOT -$4
      const result = applyDiscount(100, { type: "flat", amountInCents: 500 });
      expect(result).toBe(0);
    });

    it("Business Rule: exactly equal flat discount = $0 total", () => {
      const result = applyDiscount(500, { type: "flat", amountInCents: 500 });
      expect(result).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// processOrder — Integration of all pure functions
// ─────────────────────────────────────────────────────────────────

describe("processOrder", () => {
  it("returns a new object (does NOT mutate input)", () => {
    const order = makeOrder();
    const before = { ...order };
    const processed = processOrder(order);

    // Original unchanged — immutability guarantee
    expect(order.totalInCents).toBeUndefined();
    expect(order.isProcessed).toBeUndefined();
    expect(order.id).toBe(before.id);

    // Processed has computed fields
    expect(processed.totalInCents).toBeDefined();
    expect(processed.isProcessed).toBe(true);
    expect(processed.processedAt).toBeInstanceOf(Date);
  });

  it("calculates totalInCents correctly (no discount)", () => {
    const order = makeOrder({
      items: [
        makeItem({ id: "A", priceInCents: 2000, quantity: 2 }), // 4000
        makeItem({ id: "B", priceInCents: 1000, quantity: 1 }), // 1000
      ],
    });
    const processed = processOrder(order);
    expect(processed.totalInCents).toBe(5000);
  });

  it("applies percentage discount to total", () => {
    const order = makeOrder({
      items: [makeItem({ priceInCents: 10000, quantity: 1 })],
      discount: { type: "percentage", rate: 0.1 },
    });
    const processed = processOrder(order);
    expect(processed.totalInCents).toBe(9000);
  });

  it("applies flat discount to total", () => {
    const order = makeOrder({
      items: [makeItem({ priceInCents: 5000, quantity: 1 })],
      discount: { type: "flat", amountInCents: 500 },
    });
    const processed = processOrder(order);
    expect(processed.totalInCents).toBe(4500);
  });

  it("throws on empty items array", () => {
    const order = makeOrder({ items: [] });
    expect(() => processOrder(order)).toThrow("Cannot process empty order");
    expect(() => processOrder(order)).toThrow(order.id);
  });

  it("preserves all original order fields", () => {
    const order = makeOrder({ id: "ORD-ABC", customerId: "CUST-XYZ" });
    const processed = processOrder(order);
    expect(processed.id).toBe("ORD-ABC");
    expect(processed.customerId).toBe("CUST-XYZ");
    expect(processed.items).toEqual(order.items);
  });

  it("isProcessed is boolean true (literal type)", () => {
    const processed = processOrder(makeOrder());
    expect(processed.isProcessed).toBe(true);
    expect(typeof processed.isProcessed).toBe("boolean");
  });

  it("processedAt is approximately now", () => {
    const before = new Date();
    const processed = processOrder(makeOrder());
    const after = new Date();
    expect(processed.processedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(processed.processedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────
// formatCents — Display utility
// ─────────────────────────────────────────────────────────────────

describe("formatCents", () => {
  it("formats 999 as $9.99", () => {
    expect(formatCents(999)).toBe("$9.99");
  });

  it("formats 100 as $1.00", () => {
    expect(formatCents(100)).toBe("$1.00");
  });

  it("formats 0 as $0.00", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats 10000 as $100.00", () => {
    expect(formatCents(10000)).toBe("$100.00");
  });
});

// ─────────────────────────────────────────────────────────────────
// cartReducer — State Machine Testing
// Testing all state transitions individually
// ─────────────────────────────────────────────────────────────────

const emptyState: CartState = {
  items: [],
  status: "idle",
};

describe("cartReducer", () => {
  describe("ADD_ITEM", () => {
    it("adds a new item to empty cart", () => {
      const item = makeItem();
      const next = cartReducer(emptyState, { type: "ADD_ITEM", payload: item });
      expect(next.items).toHaveLength(1);
      expect(next.items[0].id).toBe(item.id);
    });

    it("increments quantity when same item added again (no duplicates)", () => {
      const item = makeItem({ id: "P1", quantity: 1 });
      const s1 = cartReducer(emptyState, { type: "ADD_ITEM", payload: item });
      const s2 = cartReducer(s1, {
        type: "ADD_ITEM",
        payload: { ...item, quantity: 2 }, // add 2 more
      });
      expect(s2.items).toHaveLength(1); // still 1 item, not 2!
      expect(s2.items[0].quantity).toBe(3); // 1 + 2
    });

    it("adds different items separately", () => {
      const s1 = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "A" }),
      });
      const s2 = cartReducer(s1, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "B" }),
      });
      expect(s2.items).toHaveLength(2);
    });

    it("records addedAt timestamp on item", () => {
      const next = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem(),
      });
      expect(next.items[0].addedAt).toBeInstanceOf(Date);
    });
  });

  describe("REMOVE_ITEM", () => {
    it("removes the specified item by id", () => {
      const s1 = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "P1" }),
      });
      const s2 = cartReducer(s1, {
        type: "REMOVE_ITEM",
        payload: { id: "P1" },
      });
      expect(s2.items).toHaveLength(0);
    });

    it("only removes the targeted item (leaves others intact)", () => {
      let state = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "A" }),
      });
      state = cartReducer(state, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "B" }),
      });
      state = cartReducer(state, {
        type: "REMOVE_ITEM",
        payload: { id: "A" },
      });
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe("B");
    });

    it("is a no-op for non-existent id", () => {
      const s1 = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "P1" }),
      });
      const s2 = cartReducer(s1, {
        type: "REMOVE_ITEM",
        payload: { id: "DOES-NOT-EXIST" },
      });
      expect(s2.items).toHaveLength(1); // unchanged
    });
  });

  describe("UPDATE_QUANTITY", () => {
    it("updates quantity to specified value", () => {
      let state = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "P1", quantity: 1 }),
      });
      state = cartReducer(state, {
        type: "UPDATE_QUANTITY",
        payload: { id: "P1", quantity: 5 },
      });
      expect(state.items[0].quantity).toBe(5);
    });

    it("Business Rule: quantity 0 removes item from cart", () => {
      let state = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "P1" }),
      });
      state = cartReducer(state, {
        type: "UPDATE_QUANTITY",
        payload: { id: "P1", quantity: 0 },
      });
      expect(state.items).toHaveLength(0);
    });

    it("Business Rule: negative quantity removes item", () => {
      let state = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem({ id: "P1" }),
      });
      state = cartReducer(state, {
        type: "UPDATE_QUANTITY",
        payload: { id: "P1", quantity: -1 },
      });
      expect(state.items).toHaveLength(0);
    });
  });

  describe("APPLY_DISCOUNT / REMOVE_DISCOUNT", () => {
    it("applies percentage discount", () => {
      const discount: Discount = { type: "percentage", rate: 0.15 };
      const next = cartReducer(emptyState, {
        type: "APPLY_DISCOUNT",
        payload: discount,
      });
      expect(next.discount).toEqual(discount);
    });

    it("applies flat discount", () => {
      const discount: Discount = { type: "flat", amountInCents: 300 };
      const next = cartReducer(emptyState, {
        type: "APPLY_DISCOUNT",
        payload: discount,
      });
      expect(next.discount).toEqual(discount);
    });

    it("overwrites existing discount when new one applied", () => {
      let state = cartReducer(emptyState, {
        type: "APPLY_DISCOUNT",
        payload: { type: "percentage", rate: 0.1 },
      });
      state = cartReducer(state, {
        type: "APPLY_DISCOUNT",
        payload: { type: "flat", amountInCents: 200 },
      });
      expect(state.discount?.type).toBe("flat");
    });

    it("REMOVE_DISCOUNT clears discount", () => {
      let state = cartReducer(emptyState, {
        type: "APPLY_DISCOUNT",
        payload: { type: "percentage", rate: 0.1 },
      });
      state = cartReducer(state, { type: "REMOVE_DISCOUNT" });
      expect(state.discount).toBeUndefined();
    });
  });

  describe("PROCESS_ORDER → PROCESS_SUCCESS flow", () => {
    it("status transitions: idle → processing → processed", () => {
      let state = cartReducer(emptyState, {
        type: "PROCESS_ORDER",
        payload: { orderId: "O1", customerId: "C1" },
      });
      expect(state.status).toBe("processing");

      const fakeProcessed = {
        id: "O1",
        customerId: "C1",
        items: [],
        totalInCents: 0,
        isProcessed: true as const,
        processedAt: new Date(),
      };

      state = cartReducer(state, {
        type: "PROCESS_SUCCESS",
        payload: fakeProcessed,
      });
      expect(state.status).toBe("processed");
      expect(state.processedOrder).toEqual(fakeProcessed);
    });

    it("PROCESS_ERROR sets error state with message", () => {
      let state = cartReducer(emptyState, {
        type: "PROCESS_ORDER",
        payload: { orderId: "O1", customerId: "C1" },
      });
      state = cartReducer(state, {
        type: "PROCESS_ERROR",
        payload: { message: "Payment failed" },
      });
      expect(state.status).toBe("error");
      expect(state.errorMessage).toBe("Payment failed");
    });

    it("PROCESS_ORDER clears previous error", () => {
      let state = cartReducer(emptyState, {
        type: "PROCESS_ERROR",
        payload: { message: "Old error" },
      });
      state = cartReducer(state, {
        type: "PROCESS_ORDER",
        payload: { orderId: "O2", customerId: "C1" },
      });
      expect(state.errorMessage).toBeUndefined();
    });
  });

  describe("RESET", () => {
    it("resets to initial empty state", () => {
      // Build up complex state
      let state = cartReducer(emptyState, {
        type: "ADD_ITEM",
        payload: makeItem(),
      });
      state = cartReducer(state, {
        type: "APPLY_DISCOUNT",
        payload: { type: "percentage", rate: 0.1 },
      });
      state = cartReducer(state, {
        type: "PROCESS_ORDER",
        payload: { orderId: "O1", customerId: "C1" },
      });

      // Reset
      const reset = cartReducer(state, { type: "RESET" });
      expect(reset.items).toHaveLength(0);
      expect(reset.discount).toBeUndefined();
      expect(reset.status).toBe("idle");
      expect(reset.errorMessage).toBeUndefined();
      expect(reset.processedOrder).toBeUndefined();
    });
  });

  describe("State Immutability", () => {
    it("ADD_ITEM returns a new state object (no mutation)", () => {
      const state = emptyState;
      const next = cartReducer(state, {
        type: "ADD_ITEM",
        payload: makeItem(),
      });
      expect(next).not.toBe(state); // new reference
      expect(state.items).toHaveLength(0); // original unchanged
    });

    it("APPLY_DISCOUNT does not mutate previous state", () => {
      const state = emptyState;
      const next = cartReducer(state, {
        type: "APPLY_DISCOUNT",
        payload: { type: "percentage", rate: 0.1 },
      });
      expect(next).not.toBe(state);
      expect(state.discount).toBeUndefined(); // original unchanged
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Integration: Full Order Flow
// ─────────────────────────────────────────────────────────────────

describe("Integration: Full order flow", () => {
  it("add items → apply discount → process → correct total", () => {
    // 1. Build cart state
    let state = cartReducer(emptyState, {
      type: "ADD_ITEM",
      payload: makeItem({ id: "A", priceInCents: 5000, quantity: 2 }), // $100
    });
    state = cartReducer(state, {
      type: "ADD_ITEM",
      payload: makeItem({ id: "B", priceInCents: 2000, quantity: 1 }), // $20
    });
    // subtotal = $120

    state = cartReducer(state, {
      type: "APPLY_DISCOUNT",
      payload: { type: "percentage", rate: 0.1 }, // 10% off
    });

    // 2. Process using business logic
    const order: Order = {
      id: "ORD-INT-1",
      customerId: "CUST-1",
      items: state.items,
      discount: state.discount,
    };
    const processed = processOrder(order);

    // $120 - 10% = $108
    expect(processed.totalInCents).toBe(10800);
    expect(processed.isProcessed).toBe(true);

    // 3. Display correctly
    expect(formatCents(processed.totalInCents)).toBe("$108.00");
  });

  it("flat discount that exactly matches total = free order", () => {
    let state = cartReducer(emptyState, {
      type: "ADD_ITEM",
      payload: makeItem({ priceInCents: 1000, quantity: 1 }), // $10
    });
    state = cartReducer(state, {
      type: "APPLY_DISCOUNT",
      payload: { type: "flat", amountInCents: 1000 }, // $10 off
    });

    const processed = processOrder({
      id: "O1",
      customerId: "C1",
      items: state.items,
      discount: state.discount,
    });

    expect(processed.totalInCents).toBe(0);
    expect(formatCents(0)).toBe("$0.00");
  });
});
