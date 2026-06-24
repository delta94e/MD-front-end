/**
 * legacy-order.js
 *
 * BEFORE modernization — this is the kind of code that gets refactored.
 * Kept as reference to compare against CodeModernizationDemo.tsx.
 *
 * Problems catalogued below:
 *  [1] No types — any shape accepted, silent failures
 *  [2] var hoisting — scoping bugs
 *  [3] Mutation — input object modified in-place
 *  [4] Mixed concerns — math + business rules + side effects together
 *  [5] No JSDoc — "discount" is ambiguous (rate? amount? format?)
 *  [6] Untestable — must test the whole function, can't test sub-rules
 *  [7] Implicit returns — null/undefined leaks
 *  [8] No error handling — silent failures on bad input
 */

// [1] No type safety — `order` can be ANY shape
// [1] Nobody knows what fields are required
function processOrder(order) {
  // [2] var inside if = still function-scoped (hoisting bug risk)
  if (order.items.length > 0) {
    var total = 0;                  // [2] var (not let/const)
    var discount = order.discount;  // [2] var

    // [4] Math + business logic mixed in the same loop
    for (var i = 0; i < order.items.length; i++) {
      // [1] price? priceInCents? unit price? total price?
      // [1] qty? quantity? count? — nobody documents this
      total += order.items[i].price * order.items[i].qty;
    }

    // [5] No docs: Is discount a rate (0.1=10%)? Or an amount ($10)?
    // [8] No validation: discount=2 means 200% off → negative total!
    if (discount) {
      total = total - (total * discount); // [5] ambiguous formula
    }

    // [3] MUTATION: modifying the input object!
    // Caller's object is permanently changed — hidden side effect!
    order.total = total;
    order.processed = true;
    order.processedAt = new Date();
  }
  // [7] Implicit return undefined if items.length === 0
  return order;
}

// [6] To test discount logic you MUST test processOrder() — cannot test
//     the discount rule independently:
//
//   BAD TEST (testing too much at once):
//   const result = processOrder({ items: [{price: 100, qty: 1}], discount: 0.1 });
//   assert(result.total === 90);
//   — If this fails, is it the math? The discount? The loop? The mutation?
//
//   You can't know without debugging the entire function.


// ─────────────────────────────────────────────────────────────────
// More legacy patterns — each illustrating a real anti-pattern
// ─────────────────────────────────────────────────────────────────

// [1] Global mutable state — any function can corrupt it
var cartItems = [];
var cartTotal = 0;
var isCheckedOut = false;

// [4] God function — does everything
function addToCartAndRecalculate(productId, qty) {
  // [1] Fetch from global — depends on external state
  var product = window.productCache[productId]; // undefined if not cached!
  if (product) {
    cartItems.push({ id: productId, qty: qty, price: product.price });
    // [3] Recalculate by mutating global
    cartTotal = 0;
    for (var j = 0; j < cartItems.length; j++) {
      cartTotal += cartItems[j].price * cartItems[j].qty;
    }
    // [4] UI update AND business logic AND state in one function
    document.getElementById('cart-total').innerText = '$' + cartTotal;
  }
}

// [8] No error handling — if productId doesn't exist in cache, silently fails
// [6] Cannot unit test without mocking window.productCache and DOM


// ─────────────────────────────────────────────────────────────────
// COMPARISON: What modernization fixed
// ─────────────────────────────────────────────────────────────────
/*
 Legacy                          → Modern TypeScript
 ──────────────────────────────────────────────────────────────────
 function processOrder(order)    → function processOrder(order: Order): ProcessedOrder
 [1] Any type accepted            → TypeScript enforces Order shape

 var total = 0                   → const subtotal = calculateSubtotal(items)
 [2] var hoisting risk            → const/let with block scope

 order.total = total             → return { ...order, totalInCents }
 [3] Mutates input                → Immutable: returns new object

 total += items[i].price * qty   → calculateLineTotal(item) + calculateSubtotal()
 [4] Mixed concerns               → Separated: 1 function, 1 responsibility

 if (discount) total = ...       → applyDiscount(subtotal, discount: Discount)
 [5] Undocumented discount type  → Typed: { type: "percentage", rate: number }
                                     OR { type: "flat", amountInCents: number }

 // no tests possible            → 45+ unit tests, each tests 1 rule
 [6] Untestable                   → Each pure function testable in isolation

 return order; // maybe undefined → return processed; // ProcessedOrder (typed)
 [7] Implicit returns              → Explicit return type, throws on invalid input

 // no validation                → throw new Error(`Rate must be 0.0–1.0`)
 [8] Silent failures              → Explicit errors with context

 window.productCache[id]         → useCart() hook with typed CartState
 global mutable state             → useReducer with typed CartAction
*/
